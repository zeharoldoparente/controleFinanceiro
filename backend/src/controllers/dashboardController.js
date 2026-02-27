const db = require("../config/database");
const Mesa = require("../models/Mesa");

// ─── Helper: mês atual ────────────────────────────────────────────────────────
function mesAtual() {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function hojeStr() {
   return new Date().toISOString().split("T")[0];
}

class DashboardController {
   static async getDados(req, res) {
      try {
         const { mesa_id, mes } = req.query;
         const userId = req.userId;
         const mesFiltro = mes || mesAtual();
         const hoje = hojeStr();
         const primeiroDia = `${mesFiltro}-01`;

         // ── 1. Mesas do usuário ──────────────────────────────────────────────
         let mesas;
         if (mesa_id) {
            const mesa = await Mesa.findById(mesa_id, userId);
            if (!mesa)
               return res.status(403).json({ error: "Sem acesso a esta mesa" });
            mesas = [mesa];
         } else {
            mesas = await Mesa.findByUserId(userId);
         }

         if (mesas.length === 0) {
            return res.json({ vazio: true, mesas: [] });
         }

         const mesaIds = mesas.map((m) => m.id);
         const ph = mesaIds.map(() => "?").join(",");

         // ── 2. Resumo receitas do mês ────────────────────────────────────────
         // Confirmadas: status='recebida' com data no mês
         const [[receitasConfirmadas]] = await db.query(
            `SELECT
               COALESCE(SUM(COALESCE(valor_real, valor)), 0) AS confirmado,
               COUNT(*) AS qtd_confirmadas
             FROM receitas
             WHERE mesa_id IN (${ph})
               AND status = 'recebida'
               AND ativa = TRUE
               AND DATE_FORMAT(data_recebimento, '%Y-%m') = ?`,
            [...mesaIds, mesFiltro],
         );

         // A receber: normais do mês ainda pendentes
         const [[receitasPendentes]] = await db.query(
            `SELECT COALESCE(SUM(valor), 0) AS pendente, COUNT(*) AS qtd_pendentes
             FROM receitas
             WHERE mesa_id IN (${ph})
               AND status = 'a_receber'
               AND ativa = TRUE
               AND origem_recorrente_id IS NULL
               AND DATE_FORMAT(data_recebimento, '%Y-%m') = ?`,
            [...mesaIds, mesFiltro],
         );

         // Recorrentes a receber (sem confirmação no mês)
         const [[receitasRecorrentes]] = await db.query(
            `SELECT COALESCE(SUM(r.valor), 0) AS pendente_recorrente
             FROM receitas r
             WHERE r.mesa_id IN (${ph})
               AND r.recorrente = TRUE
               AND r.ativa = TRUE
               AND r.data_recebimento <= LAST_DAY(?)
               AND NOT EXISTS (
                  SELECT 1 FROM receitas cf
                  WHERE cf.origem_recorrente_id = r.id
                    AND cf.mes_referencia = ?
                    AND cf.ativa = TRUE
               )`,
            [...mesaIds, primeiroDia, mesFiltro],
         );

         const receitasProvisionado =
            parseFloat(receitasConfirmadas.confirmado) +
            parseFloat(receitasPendentes.pendente) +
            parseFloat(receitasRecorrentes.pendente_recorrente);

         // ── 3. Resumo despesas do mês ────────────────────────────────────────
         const [[despesasPagas]] = await db.query(
            `SELECT
               COALESCE(SUM(COALESCE(valor_pago, valor)), 0) AS pago,
               COUNT(*) AS qtd_pagas
             FROM despesas
             WHERE mesa_id IN (${ph})
               AND status = 'paga'
               AND ativa = TRUE
               AND data_cancelamento IS NULL
               AND DATE_FORMAT(data_vencimento, '%Y-%m') = ?`,
            [...mesaIds, mesFiltro],
         );

         const [[despesasPendentes]] = await db.query(
            `SELECT
               COALESCE(SUM(valor), 0) AS pendente,
               COUNT(*) AS qtd_pendentes
             FROM despesas
             WHERE mesa_id IN (${ph})
               AND status IN ('pendente', 'vencida')
               AND ativa = TRUE
               AND data_cancelamento IS NULL
               AND DATE_FORMAT(data_vencimento, '%Y-%m') = ?`,
            [...mesaIds, mesFiltro],
         );

         const despesasProvisionado =
            parseFloat(despesasPagas.pago) +
            parseFloat(despesasPendentes.pendente);

         // ── 4. Alertas: despesas vencidas e em atraso ────────────────────────
         const [despesasVencidas] = await db.query(
            `SELECT d.id, d.descricao, d.valor, d.data_vencimento,
                    m.nome AS mesa_nome, c.nome AS categoria_nome
             FROM despesas d
             LEFT JOIN mesas m ON d.mesa_id = m.id
             LEFT JOIN categorias c ON d.categoria_id = c.id
             WHERE d.mesa_id IN (${ph})
               AND d.status = 'vencida'
               AND d.ativa = TRUE
               AND d.data_cancelamento IS NULL
             ORDER BY d.data_vencimento ASC
             LIMIT 5`,
            [...mesaIds],
         );

         const [despesasHoje] = await db.query(
            `SELECT d.id, d.descricao, d.valor, d.data_vencimento,
                    m.nome AS mesa_nome
             FROM despesas d
             LEFT JOIN mesas m ON d.mesa_id = m.id
             WHERE d.mesa_id IN (${ph})
               AND d.status = 'pendente'
               AND d.data_vencimento = ?
               AND d.ativa = TRUE
               AND d.data_cancelamento IS NULL
             ORDER BY d.valor DESC
             LIMIT 5`,
            [...mesaIds, hoje],
         );

         // ── 5. Cartões: limite vs gasto ──────────────────────────────────────
         const [cartoes] = await db.query(
            `SELECT
               ca.id, ca.nome, ca.tipo, ca.limite, ca.cor,
               b.nome AS bandeira_nome,
               m.nome AS mesa_nome,
               COALESCE((
                  SELECT SUM(COALESCE(d.valor_pago, d.valor))
                  FROM despesas d
                  WHERE d.cartao_id = ca.id
                    AND d.status = 'paga'
                    AND d.ativa = TRUE
                    AND d.data_cancelamento IS NULL
                    AND DATE_FORMAT(d.data_vencimento, '%Y-%m') = ?
               ), 0) AS gasto_mes,
               COALESCE((
                  SELECT SUM(d.valor)
                  FROM despesas d
                  WHERE d.cartao_id = ca.id
                    AND d.status IN ('pendente','vencida')
                    AND d.ativa = TRUE
                    AND d.data_cancelamento IS NULL
                    AND DATE_FORMAT(d.data_vencimento, '%Y-%m') = ?
               ), 0) AS pendente_mes
             FROM cartoes ca
             LEFT JOIN bandeiras b ON ca.bandeira_id = b.id
             LEFT JOIN mesas m ON ca.mesa_id = m.id
             WHERE ca.mesa_id IN (${ph})
               AND ca.ativo = TRUE
             ORDER BY ca.limite DESC`,
            [mesFiltro, mesFiltro, ...mesaIds],
         );

         // Alerta de cartão próximo do limite
         const cartoesCriticos = cartoes.filter((c) => {
            if (!c.limite || c.tipo !== "credito") return false;
            const usado = parseFloat(c.gasto_mes) + parseFloat(c.pendente_mes);
            return usado / parseFloat(c.limite) >= 0.8;
         });

         // ── 6. Maiores gastos por categoria (top 6) ──────────────────────────
         const [gastosPorCategoria] = await db.query(
            `SELECT
               COALESCE(c.nome, 'Sem categoria') AS categoria,
               c.cor,
               SUM(COALESCE(d.valor_pago, d.valor)) AS total
             FROM despesas d
             LEFT JOIN categorias c ON d.categoria_id = c.id
             WHERE d.mesa_id IN (${ph})
               AND d.status = 'paga'
               AND d.ativa = TRUE
               AND d.data_cancelamento IS NULL
               AND DATE_FORMAT(d.data_vencimento, '%Y-%m') = ?
             GROUP BY d.categoria_id, c.nome, c.cor
             ORDER BY total DESC
             LIMIT 6`,
            [...mesaIds, mesFiltro],
         );

         // ── 7. Evolução mensal (últimos 6 meses) ─────────────────────────────
         const meses6 = [];
         const d = new Date();
         for (let i = 5; i >= 0; i--) {
            const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
            meses6.push(
               `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`,
            );
         }

         const evolucao = await Promise.all(
            meses6.map(async (m) => {
               const [[rec]] = await db.query(
                  `SELECT COALESCE(SUM(COALESCE(valor_real, valor)), 0) AS total
                   FROM receitas
                   WHERE mesa_id IN (${ph}) AND status = 'recebida' AND ativa = TRUE
                     AND DATE_FORMAT(data_recebimento, '%Y-%m') = ?`,
                  [...mesaIds, m],
               );
               const [[desp]] = await db.query(
                  `SELECT COALESCE(SUM(COALESCE(valor_pago, valor)), 0) AS total
                   FROM despesas
                   WHERE mesa_id IN (${ph}) AND status = 'paga' AND ativa = TRUE
                     AND data_cancelamento IS NULL
                     AND DATE_FORMAT(data_vencimento, '%Y-%m') = ?`,
                  [...mesaIds, m],
               );
               const nomes = [
                  "Jan",
                  "Fev",
                  "Mar",
                  "Abr",
                  "Mai",
                  "Jun",
                  "Jul",
                  "Ago",
                  "Set",
                  "Out",
                  "Nov",
                  "Dez",
               ];
               const [ano, mesNum] = m.split("-");
               return {
                  mes: m,
                  label: `${nomes[parseInt(mesNum) - 1]}/${ano.slice(2)}`,
                  receitas: parseFloat(rec.total),
                  despesas: parseFloat(desp.total),
                  saldo: parseFloat(rec.total) - parseFloat(desp.total),
               };
            }),
         );

         // ── 8. Fluxo de caixa do mês (acumulado por semana) ──────────────────
         // Agrupa por semana para simplificar e evitar muitos pontos no gráfico
         const [fluxoReceitas] = await db.query(
            `SELECT
               WEEK(data_recebimento) AS semana,
               DAYOFWEEK(data_recebimento) AS dia_semana,
               DAY(data_recebimento) AS dia,
               SUM(COALESCE(valor_real, valor)) AS total
             FROM receitas
             WHERE mesa_id IN (${ph})
               AND status = 'recebida'
               AND ativa = TRUE
               AND DATE_FORMAT(data_recebimento, '%Y-%m') = ?
             GROUP BY DAY(data_recebimento)
             ORDER BY data_recebimento`,
            [...mesaIds, mesFiltro],
         );

         const [fluxoDespesas] = await db.query(
            `SELECT
               DAY(data_vencimento) AS dia,
               SUM(COALESCE(valor_pago, valor)) AS total
             FROM despesas
             WHERE mesa_id IN (${ph})
               AND status = 'paga'
               AND ativa = TRUE
               AND data_cancelamento IS NULL
               AND DATE_FORMAT(data_vencimento, '%Y-%m') = ?
             GROUP BY DAY(data_vencimento)
             ORDER BY data_vencimento`,
            [...mesaIds, mesFiltro],
         );

         // Monta fluxo acumulado por dia
         const diasNoMes = new Date(
            parseInt(mesFiltro.split("-")[0]),
            parseInt(mesFiltro.split("-")[1]),
            0,
         ).getDate();

         const recMap = Object.fromEntries(
            fluxoReceitas.map((r) => [r.dia, parseFloat(r.total)]),
         );
         const despMap = Object.fromEntries(
            fluxoDespesas.map((d) => [d.dia, parseFloat(d.total)]),
         );

         let acumulado = 0;
         const fluxo = [];
         for (let dia = 1; dia <= diasNoMes; dia++) {
            acumulado += (recMap[dia] || 0) - (despMap[dia] || 0);
            fluxo.push({
               dia,
               label: `${String(dia).padStart(2, "0")}`,
               receitas: recMap[dia] || 0,
               despesas: despMap[dia] || 0,
               saldo_acumulado: acumulado,
            });
         }

         // ── 9. Últimas movimentações ──────────────────────────────────────────
         const [ultimasReceitas] = await db.query(
            `SELECT
               r.id, 'receita' AS tipo, r.descricao, r.data_recebimento AS data,
               COALESCE(r.valor_real, r.valor) AS valor, r.status,
               c.nome AS categoria_nome, m.nome AS mesa_nome
             FROM receitas r
             LEFT JOIN categorias c ON r.categoria_id = c.id
             LEFT JOIN mesas m ON r.mesa_id = m.id
             WHERE r.mesa_id IN (${ph})
               AND r.status = 'recebida'
               AND r.ativa = TRUE
             ORDER BY r.data_confirmacao DESC, r.data_recebimento DESC
             LIMIT 10`,
            [...mesaIds],
         );

         const [ultimasDespesas] = await db.query(
            `SELECT
               d.id, 'despesa' AS tipo, d.descricao, d.data_pagamento AS data,
               COALESCE(d.valor_pago, d.valor) AS valor, d.status,
               c.nome AS categoria_nome, m.nome AS mesa_nome
             FROM despesas d
             LEFT JOIN categorias c ON d.categoria_id = c.id
             LEFT JOIN mesas m ON d.mesa_id = m.id
             WHERE d.mesa_id IN (${ph})
               AND d.status = 'paga'
               AND d.ativa = TRUE
               AND d.data_cancelamento IS NULL
             ORDER BY d.data_pagamento DESC
             LIMIT 10`,
            [...mesaIds],
         );

         const ultimasMovimentacoes = [...ultimasReceitas, ...ultimasDespesas]
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 10);

         // ── 10. Monta resposta ────────────────────────────────────────────────
         const saldoReal =
            parseFloat(receitasConfirmadas.confirmado) -
            parseFloat(despesasPagas.pago);
         const saldoPrevisto = receitasProvisionado - despesasProvisionado;

         res.json({
            mes: mesFiltro,
            mesas: mesas.map((m) => ({ id: m.id, nome: m.nome })),
            resumo: {
               receitas: {
                  confirmado: parseFloat(receitasConfirmadas.confirmado),
                  provisionado: receitasProvisionado,
                  qtd_confirmadas: receitasConfirmadas.qtd_confirmadas,
               },
               despesas: {
                  pago: parseFloat(despesasPagas.pago),
                  provisionado: despesasProvisionado,
                  pendente: parseFloat(despesasPendentes.pendente),
                  qtd_pagas: despesasPagas.qtd_pagas,
                  qtd_pendentes: despesasPendentes.qtd_pendentes,
               },
               saldo: {
                  real: saldoReal,
                  previsto: saldoPrevisto,
               },
            },
            alertas: {
               despesas_vencidas: despesasVencidas,
               despesas_hoje: despesasHoje,
               cartoes_criticos: cartoesCriticos.map((c) => ({
                  id: c.id,
                  nome: c.nome,
                  limite: parseFloat(c.limite),
                  gasto: parseFloat(c.gasto_mes) + parseFloat(c.pendente_mes),
                  percentual: Math.round(
                     ((parseFloat(c.gasto_mes) + parseFloat(c.pendente_mes)) /
                        parseFloat(c.limite)) *
                        100,
                  ),
               })),
            },
            cartoes: cartoes.map((c) => ({
               id: c.id,
               nome: c.nome,
               tipo: c.tipo,
               cor: c.cor,
               bandeira: c.bandeira_nome,
               mesa: c.mesa_nome,
               limite: c.limite ? parseFloat(c.limite) : null,
               gasto_mes: parseFloat(c.gasto_mes),
               pendente_mes: parseFloat(c.pendente_mes),
               percentual_usado: c.limite
                  ? Math.round(
                       ((parseFloat(c.gasto_mes) + parseFloat(c.pendente_mes)) /
                          parseFloat(c.limite)) *
                          100,
                    )
                  : null,
            })),
            gastos_por_categoria: gastosPorCategoria.map((g) => ({
               categoria: g.categoria,
               cor: g.cor,
               total: parseFloat(g.total),
            })),
            evolucao_mensal: evolucao,
            fluxo_caixa: fluxo,
            ultimas_movimentacoes: ultimasMovimentacoes,
         });
      } catch (error) {
         console.error("Erro no dashboard:", error);
         res.status(500).json({ error: "Erro ao carregar dados do dashboard" });
      }
   }
}

module.exports = DashboardController;
