/**
 * alertasService.js
 * Serviço de alertas financeiros automáticos.
 * Usa Notificacao.createComReferencia para evitar duplicatas.
 *
 * Alertas:
 *  1. Despesa vencida
 *  2. Despesa vencendo em até 3 dias
 *  3. Fatura de cartão vencendo em até 5 dias
 *  4. Fatura acima do limite pessoal
 *  5. Receita pendente de confirmação há mais de 7 dias
 *  6. Gasto alto em categoria (≥150% da média dos últimos 3 meses)
 */

const db = require("../config/database");
const Notificacao = require("../models/Notificacao");

function formatarValor(v) {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(parseFloat(v ?? 0));
}
function formatarData(dataStr) {
   return new Date(dataStr + "T00:00:00").toLocaleDateString("pt-BR");
}
function amanha() {
   return new Date(Date.now() + 86400000).toISOString().slice(0, 10);
}
function inicioProximoMes() {
   const d = new Date();
   return new Date(d.getFullYear(), d.getMonth() + 1, 1)
      .toISOString()
      .slice(0, 10);
}

async function verificarDespesasVencidas(userId) {
   const [despesas] = await db.query(
      `SELECT d.id, d.descricao, d.valor_provisionado, d.data_vencimento, m.nome AS mesa_nome
       FROM despesas d
       INNER JOIN mesa_usuarios mu ON d.mesa_id = mu.mesa_id AND mu.user_id = ?
       INNER JOIN mesas m ON m.id = d.mesa_id
       WHERE d.paga = 0 AND d.ativa = 1 AND d.fatura_id IS NULL AND d.data_vencimento < CURDATE()
       ORDER BY d.data_vencimento ASC LIMIT 20`,
      [userId],
   );
   for (const d of despesas) {
      const dias = Math.floor(
         (Date.now() - new Date(d.data_vencimento).getTime()) / 86400000,
      );
      const texto = dias === 1 ? "Venceu ontem" : `Venceu há ${dias} dias`;
      await Notificacao.createComReferencia(
         userId,
         `despesa_vencida_${d.id}`,
         "alerta_financeiro",
         `⚠️ Despesa vencida: ${d.descricao}`,
         `${texto} — ${formatarValor(d.valor_provisionado)} (Mesa: ${d.mesa_nome})`,
         "/dashboard/despesas",
         { despesa_id: d.id },
         amanha(),
      );
   }
}

async function verificarDespesasVencendoBreve(userId) {
   const [despesas] = await db.query(
      `SELECT d.id, d.descricao, d.valor_provisionado, d.data_vencimento, m.nome AS mesa_nome
       FROM despesas d
       INNER JOIN mesa_usuarios mu ON d.mesa_id = mu.mesa_id AND mu.user_id = ?
       INNER JOIN mesas m ON m.id = d.mesa_id
       WHERE d.paga = 0 AND d.ativa = 1 AND d.fatura_id IS NULL
         AND d.data_vencimento >= CURDATE() AND d.data_vencimento <= DATE_ADD(CURDATE(), INTERVAL 3 DAY)
       ORDER BY d.data_vencimento ASC LIMIT 20`,
      [userId],
   );
   for (const d of despesas) {
      const dias = Math.ceil(
         (new Date(d.data_vencimento).getTime() - Date.now()) / 86400000,
      );
      const texto =
         dias === 0
            ? "Vence hoje"
            : dias === 1
              ? "Vence amanhã"
              : `Vence em ${dias} dias`;
      await Notificacao.createComReferencia(
         userId,
         `despesa_vencendo_${d.id}_${d.data_vencimento}`,
         "alerta_financeiro",
         `🔔 ${texto}: ${d.descricao}`,
         `${formatarValor(d.valor_provisionado)} — Vencimento: ${formatarData(d.data_vencimento)} (Mesa: ${d.mesa_nome})`,
         "/dashboard/despesas",
         { despesa_id: d.id },
         d.data_vencimento,
      );
   }
}

async function verificarFaturasVencendo(userId) {
   const [faturas] = await db.query(
      `SELECT f.id, f.data_vencimento, f.valor_total, c.nome AS cartao_nome
       FROM faturas f
       INNER JOIN cartoes c ON c.id = f.cartao_id AND c.user_id = ?
       WHERE f.status != 'paga'
         AND f.data_vencimento >= CURDATE() AND f.data_vencimento <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)
       ORDER BY f.data_vencimento ASC LIMIT 10`,
      [userId],
   );
   for (const f of faturas) {
      const dias = Math.ceil(
         (new Date(f.data_vencimento).getTime() - Date.now()) / 86400000,
      );
      const texto =
         dias === 0
            ? "Vence hoje"
            : dias === 1
              ? "Vence amanhã"
              : `Vence em ${dias} dias`;
      await Notificacao.createComReferencia(
         userId,
         `fatura_vencendo_${f.id}_${f.data_vencimento}`,
         "alerta_financeiro",
         `💳 Fatura ${f.cartao_nome}: ${texto}`,
         `Total: ${formatarValor(f.valor_total)} — Vencimento: ${formatarData(f.data_vencimento)}`,
         "/dashboard/despesas",
         { fatura_id: f.id },
         f.data_vencimento,
      );
   }
}

async function verificarFaturasAcimaLimite(userId) {
   const [faturas] = await db.query(
      `SELECT f.id, f.valor_total, c.id AS cartao_id, c.nome AS cartao_nome,
              c.limite_pessoal, DATE_FORMAT(f.mes_referencia, '%Y-%m') AS mes
       FROM faturas f
       INNER JOIN cartoes c ON c.id = f.cartao_id AND c.user_id = ?
       WHERE f.status != 'paga' AND c.limite_pessoal IS NOT NULL AND c.limite_pessoal > 0
         AND f.valor_total > c.limite_pessoal`,
      [userId],
   );
   for (const f of faturas) {
      const mes = f.mes || new Date().toISOString().slice(0, 7);
      const excesso = parseFloat(f.valor_total) - parseFloat(f.limite_pessoal);
      const pct = Math.round(
         (parseFloat(f.valor_total) / parseFloat(f.limite_pessoal)) * 100,
      );
      await Notificacao.createComReferencia(
         userId,
         `fatura_limite_${f.cartao_id}_${mes}`,
         "alerta_financeiro",
         `🚨 Limite pessoal ultrapassado: ${f.cartao_nome}`,
         `Fatura em ${formatarValor(f.valor_total)} (${pct}% do seu limite de ${formatarValor(f.limite_pessoal)}). Excesso de ${formatarValor(excesso)}.`,
         "/dashboard/despesas",
         { cartao_id: f.cartao_id, pct },
         inicioProximoMes(),
      );
   }
}

async function verificarReceitasPendentes(userId) {
   const [receitas] = await db.query(
      `SELECT r.id, r.descricao, r.valor, r.data_recebimento, m.nome AS mesa_nome
       FROM receitas r
       INNER JOIN mesa_usuarios mu ON r.mesa_id = mu.mesa_id AND mu.user_id = ?
       INNER JOIN mesas m ON m.id = r.mesa_id
       WHERE r.status = 'a_receber' AND r.ativa = 1
         AND r.data_recebimento <= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       ORDER BY r.data_recebimento ASC LIMIT 10`,
      [userId],
   );
   for (const r of receitas) {
      const dias = Math.floor(
         (Date.now() - new Date(r.data_recebimento).getTime()) / 86400000,
      );
      await Notificacao.createComReferencia(
         userId,
         `receita_pendente_${r.id}`,
         "alerta_financeiro",
         `💰 Receita não confirmada: ${r.descricao}`,
         `Prevista para ${formatarData(r.data_recebimento)} (há ${dias} dias) — ${formatarValor(r.valor)}. Já recebeu? Marque como recebida.`,
         "/dashboard/receitas",
         { receita_id: r.id },
         amanha(),
      );
   }
}

async function verificarGastosAltosPorCategoria(userId) {
   const mesAtual = new Date().toISOString().slice(0, 7);

   const [gastosAtual] = await db.query(
      `SELECT d.categoria_id, cat.nome AS categoria_nome, SUM(d.valor_provisionado) AS total_mes
       FROM despesas d
       INNER JOIN mesa_usuarios mu ON d.mesa_id = mu.mesa_id AND mu.user_id = ?
       INNER JOIN categorias cat ON cat.id = d.categoria_id
       WHERE d.ativa = 1 AND DATE_FORMAT(d.data_vencimento, '%Y-%m') = ? AND d.categoria_id IS NOT NULL
       GROUP BY d.categoria_id, cat.nome HAVING total_mes > 0`,
      [userId, mesAtual],
   );
   if (gastosAtual.length === 0) return;

   const [mediaHistorica] = await db.query(
      `SELECT d.categoria_id, AVG(total_mensal) AS media_3m
       FROM (
         SELECT d.categoria_id, DATE_FORMAT(d.data_vencimento, '%Y-%m') AS mes,
                SUM(d.valor_provisionado) AS total_mensal
         FROM despesas d
         INNER JOIN mesa_usuarios mu ON d.mesa_id = mu.mesa_id AND mu.user_id = ?
         WHERE d.ativa = 1 AND d.categoria_id IS NOT NULL
           AND d.data_vencimento >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
           AND DATE_FORMAT(d.data_vencimento, '%Y-%m') < ?
         GROUP BY d.categoria_id, mes
       ) sub GROUP BY categoria_id`,
      [userId, mesAtual],
   );

   const mediaMap = {};
   for (const m of mediaHistorica)
      mediaMap[m.categoria_id] = parseFloat(m.media_3m);

   for (const g of gastosAtual) {
      const media = mediaMap[g.categoria_id];
      const total = parseFloat(g.total_mes);
      if (!media || total < media * 1.5 || total < 50) continue;
      const pct = Math.round((total / media) * 100);
      await Notificacao.createComReferencia(
         userId,
         `gasto_alto_cat_${g.categoria_id}_${mesAtual}`,
         "alerta_financeiro",
         `📊 Gasto elevado em "${g.categoria_nome}"`,
         `Este mês você gastou ${formatarValor(total)} nessa categoria — ${pct}% acima da sua média de ${formatarValor(media)} dos últimos 3 meses.`,
         "/dashboard/despesas",
         {
            categoria_id: g.categoria_id,
            categoria_nome: g.categoria_nome,
            pct,
         },
         inicioProximoMes(),
      );
   }
}

async function verificarTodosAlertas(userId) {
   const checks = [
      verificarDespesasVencidas,
      verificarDespesasVencendoBreve,
      verificarFaturasVencendo,
      verificarFaturasAcimaLimite,
      verificarReceitasPendentes,
      verificarGastosAltosPorCategoria,
   ];
   const nomes = [
      "DespesasVencidas",
      "DespesasVencendoBreve",
      "FaturasVencendo",
      "FaturasAcimaLimite",
      "ReceitasPendentes",
      "GastosAltosPorCategoria",
   ];
   const resultados = await Promise.allSettled(checks.map((fn) => fn(userId)));
   resultados.forEach((r, i) => {
      if (r.status === "rejected")
         console.error(`[alertasService] Erro em ${nomes[i]}:`, r.reason);
   });
   return parseInt(await Notificacao.countNaoLidas(userId));
}

module.exports = { verificarTodosAlertas };
