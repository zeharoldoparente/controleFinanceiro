const db = require("../config/database");
const Mesa = require("../models/Mesa");
const IAnPlano = require("../models/IAnPlano");
const IAnRegistroMensal = require("../models/IAnRegistroMensal");
const {
   getPlanoAtivoComAcompanhamento,
} = require("../services/ianAcompanhamentoService");
const {
   getSugestoesInvestimento,
} = require("../services/ianInvestimentosService");

function safeNumber(value) {
   const parsed = Number.parseFloat(value ?? 0);
   return Number.isFinite(parsed) ? parsed : 0;
}

function clamp(value, min, max) {
   return Math.min(Math.max(value, min), max);
}

function getMesAtual() {
   const agora = new Date();
   return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, "0")}`;
}

function getFirstDayMonthsAgo(monthsAgo) {
   const base = new Date();
   return new Date(base.getFullYear(), base.getMonth() - monthsAgo, 1);
}

function formatDateOnly(date) {
   return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseGoalDate(dateInput) {
   if (!dateInput || typeof dateInput !== "string") return null;

   const date = new Date(`${dateInput}T12:00:00`);
   if (Number.isNaN(date.getTime())) return null;
   return date;
}

function diffMonthsInclusive(targetDate) {
   if (!targetDate) return 6;

   const now = new Date();
   const nowMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
   const targetMonthStart = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      1,
   );

   const diff =
      (targetMonthStart.getFullYear() - nowMonthStart.getFullYear()) * 12 +
      (targetMonthStart.getMonth() - nowMonthStart.getMonth()) +
      1;

   return clamp(diff, 1, 24);
}

function normalizeText(value) {
   return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
}

function detectGoalType(objetivo) {
   const texto = normalizeText(objetivo);

   if (
      texto.includes("vermelho") ||
      texto.includes("divida") ||
      texto.includes("quitar") ||
      texto.includes("renegociar")
   ) {
      return "recuperacao";
   }

   if (
      texto.includes("viagem") ||
      texto.includes("viajar") ||
      texto.includes("nordeste")
   ) {
      return "viagem";
   }

   if (
      texto.includes("reserva") ||
      texto.includes("emergencia") ||
      texto.includes("colchao")
   ) {
      return "reserva";
   }

   if (
      texto.includes("comprar") ||
      texto.includes("celular") ||
      texto.includes("carro") ||
      texto.includes("moto")
   ) {
      return "compra";
   }

   return "controle";
}

function classifyCategory(nomeCategoria) {
   const nome = normalizeText(nomeCategoria);

   const keywordsEssenciais = [
      "moradia",
      "aluguel",
      "condominio",
      "agua",
      "luz",
      "energia",
      "gas",
      "internet",
      "saude",
      "farmacia",
      "educacao",
      "transporte",
      "combustivel",
      "mercado",
      "supermercado",
   ];

   const keywordsFlexiveis = [
      "lazer",
      "delivery",
      "restaurante",
      "ifood",
      "bar",
      "viagem",
      "streaming",
      "assinatura",
      "vestuario",
      "shopping",
      "games",
      "hobby",
      "outros",
   ];

   if (keywordsEssenciais.some((keyword) => nome.includes(keyword))) {
      return "essencial";
   }

   if (keywordsFlexiveis.some((keyword) => nome.includes(keyword))) {
      return "flexivel";
   }

   return "misto";
}

function summarizeWindowLabel(bucket) {
   const labels = {
      madrugada: "23h-5h",
      manha: "6h-11h",
      tarde: "12h-17h",
      noite: "18h-22h",
   };

   return labels[bucket] || "Horario variado";
}

function getWindowTone(bucket) {
   if (bucket === "noite") {
      return "Seus lancamentos se concentram no fim do dia, quando a fadiga costuma aumentar compras por impulso.";
   }

   if (bucket === "madrugada") {
      return "Ha movimento relevante em horarios tardios, um sinal de compras menos planejadas.";
   }

   if (bucket === "tarde") {
      return "A maior parte dos lancamentos aparece na tarde, bom horario para checkpoints de meio de dia.";
   }

   return "O ritmo de gastos aparece cedo no dia, o que ajuda a bloquear excessos logo na origem.";
}

function calculateCompoundProjection(targetValue, months, monthlyRate) {
   const target = Math.max(0, safeNumber(targetValue));
   const totalMonths = Math.max(1, Math.trunc(months || 1));
   const rate = Math.max(0, safeNumber(monthlyRate));

   const aporteMensal =
      rate > 0
         ? target / (((1 + rate) ** totalMonths - 1) / rate)
         : target / totalMonths;

   const totalAportado = aporteMensal * totalMonths;
   const patrimonioFinal =
      rate > 0
         ? aporteMensal * (((1 + rate) ** totalMonths - 1) / rate)
         : totalAportado;
   const jurosEstimados = Math.max(0, patrimonioFinal - totalAportado);
   const taxaAnual = (1 + rate) ** 12 - 1;

   return {
      taxa_mensal: Math.round(rate * 10000) / 100,
      taxa_anual: Math.round(taxaAnual * 10000) / 100,
      aporte_mensal: Math.round(aporteMensal * 100) / 100,
      total_aportado: Math.round(totalAportado * 100) / 100,
      juros_estimados: Math.round(jurosEstimados * 100) / 100,
      patrimonio_final: Math.round(patrimonioFinal * 100) / 100,
      aporte_sem_juros: Math.round((target / totalMonths) * 100) / 100,
      economia_aporte: Math.round(((target / totalMonths) - aporteMensal) * 100) / 100,
   };
}

function createStrategy({
   id,
   nome,
   intensidade,
   cor,
   economiaMensal,
   metaMensalNecessaria,
   valorObjetivo,
   categorias,
   topWindow,
   rendaMedia,
   despesaMedia,
   saldoMedio,
   cartoesCriticos,
   prazoMeses,
   compoundProjection,
}) {
   const intensidadeConfig = {
      suave: { flexivel: 0.1, misto: 0.05, essencial: 0.02 },
      equilibrada: { flexivel: 0.18, misto: 0.1, essencial: 0.04 },
      agressiva: { flexivel: 0.26, misto: 0.14, essencial: 0.06 },
   }[intensidade];

   const ajustes = categorias.slice(0, 3).map((categoria) => {
      const perfil = classifyCategory(categoria.categoria);
      const percentual = intensidadeConfig[perfil] || 0.05;
      const economiaSugerida = categoria.total * percentual;

      return {
         categoria: categoria.categoria,
         perfil,
         percentual_corte: Math.round(percentual * 100),
         economia_sugerida: Math.round(economiaSugerida * 100) / 100,
         motivo:
            perfil === "essencial"
               ? "ajuste fino sem cortar o essencial"
               : perfil === "flexivel"
                 ? "onde ha mais espaco para economizar sem travar a rotina"
                 : "reduzir excessos mantendo consistencia",
      };
   });

   const prazoEstimadoMeses =
      economiaMensal > 0 && valorObjetivo > 0
         ? Math.ceil(valorObjetivo / economiaMensal)
         : prazoMeses;

   const adequacao =
      metaMensalNecessaria <= 0
         ? "forte"
         : economiaMensal >= metaMensalNecessaria * 1.1
           ? "forte"
           : economiaMensal >= metaMensalNecessaria * 0.9
             ? "boa"
             : "apertada";

   const economiaSemanal = economiaMensal / 4.33;
   const economiaDiaria = economiaMensal / 30;
   const pesoNaDespesa =
      despesaMedia > 0 ? Math.round((economiaMensal / despesaMedia) * 100) : 0;

   const resumo =
      intensidade === "suave"
         ? "Corta excessos sem mexer pesado no estilo de vida."
         : intensidade === "equilibrada"
           ? "Equilibra disciplina e conforto para bater a meta com consistencia."
           : "Acelera o objetivo com reducao forte de vazamentos e revisao de rotina.";

   const resumoInvestimento =
      compoundProjection.taxa_mensal > 0
         ? `Com ${compoundProjection.taxa_mensal.toFixed(2)}% ao mes, o aporte necessario cai para R$ ${compoundProjection.aporte_mensal.toFixed(2)}.`
         : "Aqui o foco e caixa direto, sem contar rendimento na projecao.";
   const reducaoImpulso = Math.max(
      5,
      Math.min(30, Math.round((pesoNaDespesa || 0) / 2)),
   );

   return {
      id,
      nome,
      intensidade,
      cor,
      economia_mensal: Math.round(economiaMensal * 100) / 100,
      economia_semanal: Math.round(economiaSemanal * 100) / 100,
      economia_diaria: Math.round(economiaDiaria * 100) / 100,
      impacto_na_despesa: pesoNaDespesa,
      prazo_estimado_meses: prazoEstimadoMeses,
      adequacao_meta: adequacao,
      resumo,
      resumo_investimento: resumoInvestimento,
      ajustes,
      projecao_composta: compoundProjection,
      rotinas: {
         diaria: [
            `Reduzir em torno de ${reducaoImpulso}% as compras por impulso na janela ${summarizeWindowLabel(topWindow)}.`,
            "Registrar gastos no mesmo dia para o IAn detectar desvios antes do fechamento do mes.",
            saldoMedio < 0
               ? "Evitar novas compras parceladas enquanto o fluxo mensal estiver negativo."
               : "Separar primeiro a meta do mes e gastar o restante com teto claro.",
         ],
         semanal: [
            `Revisar as 3 categorias mais pesadas e confirmar se a economia semanal de R$ ${economiaSemanal.toFixed(2)} foi batida.`,
            cartoesCriticos > 0
               ? "Checar limite dos cartoes e bloquear compras nao planejadas antes do fechamento."
               : "Comparar semana atual com a anterior para manter o ritmo sem apertar alem do necessario.",
         ],
         mensal: [
            compoundProjection.taxa_mensal > 0
               ? `Reservar R$ ${compoundProjection.aporte_mensal.toFixed(2)} e aplicar assim que a renda principal entrar.`
               : `Reservar R$ ${economiaMensal.toFixed(2)} assim que a renda principal entrar.`,
            rendaMedia > 0
               ? `Nao deixar as despesas passarem de ${Math.max(0, Math.round(((despesaMedia - economiaMensal) / rendaMedia) * 100))}% da sua renda media.`
               : "Reavaliar a meta ao fechar o mes com base no fluxo real.",
         ],
      },
   };
}

class IAnController {
   static async getPlanoAtivo(req, res) {
      try {
         const userId = req.userId;
         const { mesa_id: mesaId } = req.query;

         if (!mesaId) {
            return res.status(400).json({
               error: "Informe a mesa para recuperar o acompanhamento do IAn.",
            });
         }

         const mesa = await Mesa.findById(mesaId, userId);
         if (!mesa) {
            return res.status(403).json({ error: "Sem acesso a esta mesa" });
         }

         const payload = await getPlanoAtivoComAcompanhamento(userId, mesa.id);
         return res.json(payload || { plano_ativo: null, acompanhamento: null });
      } catch (error) {
         console.error("Erro ao buscar plano ativo do IAn:", error);
         return res
            .status(500)
            .json({ error: "Erro ao buscar o acompanhamento do IAn" });
      }
   }

   static async salvarPlanoAtivo(req, res) {
      try {
         const userId = req.userId;
         const { mesa_id: mesaIdInput, estrategia_id: estrategiaId, plano } =
            req.body || {};

         if (!mesaIdInput || !estrategiaId || !plano?.objetivo?.descricao) {
            return res.status(400).json({
               error: "Dados insuficientes para ativar o acompanhamento do IAn.",
            });
         }

         const mesa = await Mesa.findById(mesaIdInput, userId);
         if (!mesa) {
            return res.status(403).json({ error: "Sem acesso a esta mesa" });
         }

         const estrategia = plano?.estrategias?.find(
            (item) => item.id === estrategiaId,
         );

         if (!estrategia) {
            return res.status(400).json({
               error: "A estrategia escolhida nao existe neste plano.",
            });
         }

         await IAnPlano.saveActive({
            userId,
            mesaId: mesa.id,
            objetivoDescricao: plano.objetivo.descricao,
            estrategiaId,
            plano,
         });

         const payload = await getPlanoAtivoComAcompanhamento(userId, mesa.id);
         return res.json(payload);
      } catch (error) {
         console.error("Erro ao salvar plano ativo do IAn:", error);
         return res
            .status(500)
            .json({ error: "Erro ao ativar o acompanhamento do IAn" });
      }
   }

   static async salvarRegistroMensal(req, res) {
      try {
         const userId = req.userId;
         const {
            mesa_id: mesaIdInput,
            referencia_mes: referenciaMesInput,
            valor_guardado: valorGuardadoInput,
            valor_investido: valorInvestidoInput,
            dividendos_recebidos: dividendosRecebidosInput,
            observacoes,
            investimentos,
         } = req.body || {};

         if (!mesaIdInput) {
            return res.status(400).json({
               error: "Selecione a mesa para registrar a evolucao mensal do IAn.",
            });
         }

         const mesa = await Mesa.findById(mesaIdInput, userId);
         if (!mesa) {
            return res.status(403).json({ error: "Sem acesso a esta mesa" });
         }

         const planoAtivo = await IAnPlano.findActiveByMesa(mesa.id);
         if (!planoAtivo?.id) {
            return res.status(400).json({
               error: "Ative um plano do IAn antes de registrar o progresso mensal.",
            });
         }

         await IAnRegistroMensal.upsert({
            planoId: planoAtivo.id,
            userId,
            mesaId: mesa.id,
            referenciaMes: referenciaMesInput || getMesAtual(),
            valorGuardado: valorGuardadoInput,
            valorInvestido: valorInvestidoInput,
            dividendosRecebidos: dividendosRecebidosInput,
            investimentos,
            observacoes,
         });

         const payload = await getPlanoAtivoComAcompanhamento(userId, mesa.id);
         return res.json(payload);
      } catch (error) {
         console.error("Erro ao salvar registro mensal do IAn:", error);

         if (error?.message === "MES_INVALIDO") {
            return res.status(400).json({
               error: "Informe um mes valido no formato AAAA-MM.",
            });
         }

         return res.status(500).json({
            error: "Erro ao salvar o registro mensal do IAn",
         });
      }
   }

   static async gerarPlano(req, res) {
      try {
         const userId = req.userId;
         const {
            objetivo,
            valor_objetivo: valorObjetivoInput,
            prazo_final: prazoFinalInput,
            mesa_id: mesaIdInput,
         } = req.body || {};

         if (!objetivo || String(objetivo).trim().length < 6) {
            return res.status(400).json({
               error: "Descreva um objetivo um pouco melhor para o IAn montar o plano.",
            });
         }

         let mesas;
         if (mesaIdInput) {
            const mesa = await Mesa.findById(mesaIdInput, userId);
            if (!mesa) {
               return res.status(403).json({ error: "Sem acesso a esta mesa" });
            }
            mesas = [mesa];
         } else {
            mesas = await Mesa.findByUserId(userId);
         }

         if (!mesas.length) {
            return res.status(400).json({
               error: "Crie ou selecione uma mesa para o IAn analisar seus dados.",
            });
         }

         const mesaIds = mesas.map((mesa) => mesa.id);
         const placeholders = mesaIds.map(() => "?").join(",");
         const periodoInicio = formatDateOnly(getFirstDayMonthsAgo(2));
         const mesAtual = getMesAtual();
         const prazoFinal = parseGoalDate(prazoFinalInput);
         const prazoMeses = diffMonthsInclusive(prazoFinal);
         const tipoObjetivo = detectGoalType(objetivo);

         const [receitasRows] = await db.query(
            `SELECT
               DATE_FORMAT(data_recebimento, '%Y-%m') AS mes,
               SUM(COALESCE(valor_real, valor)) AS total
             FROM receitas
             WHERE mesa_id IN (${placeholders})
               AND ativa = TRUE
               AND status = 'recebida'
               AND data_recebimento >= ?
             GROUP BY DATE_FORMAT(data_recebimento, '%Y-%m')
             ORDER BY mes ASC`,
            [...mesaIds, periodoInicio],
         );

         const [despesasRows] = await db.query(
            `SELECT
               DATE_FORMAT(data_vencimento, '%Y-%m') AS mes,
               SUM(COALESCE(valor_real, valor_provisionado)) AS total
             FROM despesas
             WHERE mesa_id IN (${placeholders})
               AND ativa = TRUE
               AND data_cancelamento IS NULL
               AND data_vencimento >= ?
             GROUP BY DATE_FORMAT(data_vencimento, '%Y-%m')
             ORDER BY mes ASC`,
            [...mesaIds, periodoInicio],
         );

         const [categoriasRows] = await db.query(
            `SELECT
               COALESCE(c.nome, 'Sem categoria') AS categoria,
               SUM(COALESCE(d.valor_real, d.valor_provisionado)) AS total,
               COUNT(*) AS quantidade
             FROM despesas d
             LEFT JOIN categorias c ON c.id = d.categoria_id
             WHERE d.mesa_id IN (${placeholders})
               AND d.ativa = TRUE
               AND d.data_cancelamento IS NULL
               AND d.data_vencimento >= ?
             GROUP BY COALESCE(c.nome, 'Sem categoria')
             ORDER BY total DESC
             LIMIT 6`,
            [...mesaIds, periodoInicio],
         );

         const [horariosRows] = await db.query(
            `SELECT
               CASE
                  WHEN HOUR(created_at) BETWEEN 6 AND 11 THEN 'manha'
                  WHEN HOUR(created_at) BETWEEN 12 AND 17 THEN 'tarde'
                  WHEN HOUR(created_at) BETWEEN 18 AND 22 THEN 'noite'
                  ELSE 'madrugada'
               END AS bucket,
               SUM(COALESCE(valor_real, valor_provisionado)) AS total,
               COUNT(*) AS quantidade
             FROM despesas
             WHERE mesa_id IN (${placeholders})
               AND ativa = TRUE
               AND data_cancelamento IS NULL
               AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
             GROUP BY bucket
             ORDER BY total DESC`,
            [...mesaIds],
         );

         const [[resumoAtual]] = await db.query(
            `SELECT
               COALESCE((
                  SELECT SUM(COALESCE(valor_real, valor))
                  FROM receitas
                  WHERE mesa_id IN (${placeholders})
                    AND ativa = TRUE
                    AND status = 'recebida'
                    AND DATE_FORMAT(data_recebimento, '%Y-%m') = ?
               ), 0) AS receitas_mes,
               COALESCE((
                  SELECT SUM(COALESCE(valor_real, valor_provisionado))
                  FROM despesas
                  WHERE mesa_id IN (${placeholders})
                    AND ativa = TRUE
                    AND data_cancelamento IS NULL
                    AND DATE_FORMAT(data_vencimento, '%Y-%m') = ?
               ), 0) AS despesas_mes,
               COALESCE((
                  SELECT SUM(valor_provisionado)
                  FROM despesas
                  WHERE mesa_id IN (${placeholders})
                    AND ativa = TRUE
                    AND data_cancelamento IS NULL
                    AND paga = FALSE
                    AND DATE_FORMAT(data_vencimento, '%Y-%m') = ?
               ), 0) AS pendente_mes`,
            [...mesaIds, mesAtual, ...mesaIds, mesAtual, ...mesaIds, mesAtual],
         );

         const [cartaoColumns] = await db.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'cartoes'
               AND COLUMN_NAME IN ('tipo', 'limite_pessoal')`,
         );

         const hasTipo = cartaoColumns.some(
            (column) => column.COLUMN_NAME === "tipo",
         );
         const hasLimitePessoal = cartaoColumns.some(
            (column) => column.COLUMN_NAME === "limite_pessoal",
         );

         const [cartoesRows] = await db.query(
            `SELECT
               c.id,
               c.nome,
               ${hasTipo ? "c.tipo" : "'credito' AS tipo"},
               c.limite_real,
               ${hasLimitePessoal ? "c.limite_pessoal" : "NULL AS limite_pessoal"},
               COALESCE((
                  SELECT SUM(COALESCE(d.valor_real, d.valor_provisionado))
                  FROM despesas d
                  LEFT JOIN faturas f ON f.id = d.fatura_id
                  WHERE d.cartao_id = c.id
                    AND d.ativa = TRUE
                    AND d.data_cancelamento IS NULL
                    AND DATE_FORMAT(COALESCE(f.data_vencimento, d.data_vencimento), '%Y-%m') = ?
               ), 0) AS gasto_mes
             FROM cartoes c
             WHERE c.user_id = ?
               AND c.ativa = TRUE`,
            [mesAtual, userId],
         );

         const receitaMedia =
            receitasRows.reduce((acc, row) => acc + safeNumber(row.total), 0) / 3;
         const despesaMedia =
            despesasRows.reduce((acc, row) => acc + safeNumber(row.total), 0) / 3;
         const saldoMedio = receitaMedia - despesaMedia;
         const categorias = categoriasRows.map((row) => ({
            categoria: row.categoria,
            total: safeNumber(row.total),
            quantidade: Number(row.quantidade || 0),
            perfil: classifyCategory(row.categoria),
         }));

         const totalCategorias = categorias.reduce(
            (acc, categoria) => acc + categoria.total,
            0,
         );

         const flexivelTotal = categorias
            .filter((categoria) => categoria.perfil === "flexivel")
            .reduce((acc, categoria) => acc + categoria.total, 0);
         const mistoTotal = categorias
            .filter((categoria) => categoria.perfil === "misto")
            .reduce((acc, categoria) => acc + categoria.total, 0);

         const topWindow = horariosRows[0]?.bucket || "tarde";
         const janelas = horariosRows.map((row) => ({
            bucket: row.bucket,
            label: summarizeWindowLabel(row.bucket),
            total: safeNumber(row.total),
            quantidade: Number(row.quantidade || 0),
         }));

         const cartoesCriticos = cartoesRows
            .map((cartao) => {
               const limite = safeNumber(
                  cartao.limite_pessoal || cartao.limite_real,
               );
               const gastoMes = safeNumber(cartao.gasto_mes);
               const percentual = limite ? (gastoMes / limite) * 100 : 0;

               return {
                  id: cartao.id,
                  nome: cartao.nome,
                  limite,
                  gasto_mes: gastoMes,
                  percentual: Math.round(percentual),
               };
            })
            .filter(
               (cartao) =>
                  cartao.limite > 0 &&
                  cartao.percentual >= 70 &&
                  (!hasTipo || cartoesRows.find((item) => item.id === cartao.id)?.tipo === "credito"),
            )
            .sort((a, b) => b.percentual - a.percentual)
            .slice(0, 3);

         const valorObjetivoInformado = safeNumber(valorObjetivoInput);
         const valorObjetivoEstimado =
            tipoObjetivo === "recuperacao"
               ? Math.max(
                    Math.abs(Math.min(0, saldoMedio)) * prazoMeses,
                    safeNumber(resumoAtual.pendente_mes) * 0.7,
                    despesaMedia * 0.15,
                 )
               : Math.max(despesaMedia * 0.2, 1000);

         const valorObjetivo = valorObjetivoInformado || valorObjetivoEstimado;
         const metaMensalSemJuros =
            prazoMeses > 0 ? valorObjetivo / prazoMeses : valorObjetivo;
         const usarJurosCompostos =
            tipoObjetivo !== "recuperacao" && valorObjetivo > 0 && prazoMeses > 0;
         const projectionRates = {
            suave: usarJurosCompostos ? 0.0045 : 0,
            equilibrada: usarJurosCompostos ? 0.007 : 0,
            agressiva: usarJurosCompostos ? 0.0095 : 0,
         };
         const compoundProjections = {
            suave: calculateCompoundProjection(
               valorObjetivo,
               prazoMeses,
               projectionRates.suave,
            ),
            equilibrada: calculateCompoundProjection(
               valorObjetivo,
               prazoMeses,
               projectionRates.equilibrada,
            ),
            agressiva: calculateCompoundProjection(
               valorObjetivo,
               prazoMeses,
               projectionRates.agressiva,
            ),
         };

         const necessidadeRecuperacao = Math.max(0, -saldoMedio);
         const economiaBaseSuave =
            necessidadeRecuperacao +
            Math.max(compoundProjections.suave.aporte_mensal, despesaMedia * 0.06);
         const economiaBaseEquilibrada =
            necessidadeRecuperacao +
            Math.max(compoundProjections.equilibrada.aporte_mensal, despesaMedia * 0.1);
         const economiaBaseAgressiva =
            necessidadeRecuperacao +
            Math.max(compoundProjections.agressiva.aporte_mensal, despesaMedia * 0.15);

         const tetoPratico =
            flexivelTotal * 0.55 + mistoTotal * 0.22 + Math.max(0, receitaMedia * 0.05);

         const strategies = [
            createStrategy({
               id: "suave",
               nome: "Linha suave",
               intensidade: "suave",
               cor: "#0f766e",
               economiaMensal: economiaBaseSuave,
               metaMensalNecessaria:
                  necessidadeRecuperacao +
                  compoundProjections.suave.aporte_mensal,
               valorObjetivo,
               categorias,
               topWindow,
               rendaMedia: receitaMedia,
               despesaMedia,
               saldoMedio,
               cartoesCriticos: cartoesCriticos.length,
               prazoMeses,
               compoundProjection: compoundProjections.suave,
            }),
            createStrategy({
               id: "equilibrada",
               nome: "Linha equilibrada",
               intensidade: "equilibrada",
               cor: "#2563eb",
               economiaMensal: economiaBaseEquilibrada,
               metaMensalNecessaria:
                  necessidadeRecuperacao +
                  compoundProjections.equilibrada.aporte_mensal,
               valorObjetivo,
               categorias,
               topWindow,
               rendaMedia: receitaMedia,
               despesaMedia,
               saldoMedio,
               cartoesCriticos: cartoesCriticos.length,
               prazoMeses,
               compoundProjection: compoundProjections.equilibrada,
            }),
            createStrategy({
               id: "agressiva",
               nome: "Linha agressiva",
               intensidade: "agressiva",
               cor: "#dc2626",
               economiaMensal: economiaBaseAgressiva,
               metaMensalNecessaria:
                  necessidadeRecuperacao +
                  compoundProjections.agressiva.aporte_mensal,
               valorObjetivo,
               categorias,
               topWindow,
               rendaMedia: receitaMedia,
               despesaMedia,
               saldoMedio,
               cartoesCriticos: cartoesCriticos.length,
               prazoMeses,
               compoundProjection: compoundProjections.agressiva,
            }),
         ].map((strategy) => ({
            ...strategy,
            viabilidade:
               strategy.economia_mensal <= tetoPratico * 0.9
                  ? "alta"
                  : strategy.economia_mensal <= tetoPratico * 1.15
                    ? "media"
                    : "desafiadora",
         }));

         const statusFinanceiro =
            saldoMedio < 0
               ? "no vermelho"
               : saldoMedio < despesaMedia * 0.08
                 ? "apertado"
                 : saldoMedio < despesaMedia * 0.18
                   ? "estavel"
                   : "com folga";

         const sinais = [];

         if (categorias[0] && totalCategorias > 0) {
            sinais.push(
               `${categorias[0].categoria} puxa ${Math.round((categorias[0].total / totalCategorias) * 100)}% das suas despesas recentes.`,
            );
         }

         if (janelas[0]) {
            sinais.push(getWindowTone(janelas[0].bucket));
         }

         if (cartoesCriticos[0]) {
            sinais.push(
               `${cartoesCriticos[0].nome} ja consumiu ${cartoesCriticos[0].percentual}% do limite monitorado neste mes.`,
            );
         }

         if (safeNumber(resumoAtual.pendente_mes) > 0) {
            sinais.push(
               `Voce ainda carrega R$ ${safeNumber(resumoAtual.pendente_mes).toFixed(2)} em despesas pendentes no mes atual.`,
            );
         }

         return res.json({
            objetivo: {
               descricao: String(objetivo).trim(),
               tipo: tipoObjetivo,
               valor_objetivo: Math.round(valorObjetivo * 100) / 100,
               valor_informado: valorObjetivoInformado > 0,
               prazo_final: prazoFinal ? prazoFinalInput : null,
               prazo_meses: prazoMeses,
               meta_mensal_necessaria:
                  compoundProjections.equilibrada.aporte_mensal,
               meta_mensal_sem_juros:
                  Math.round(metaMensalSemJuros * 100) / 100,
               usar_juros_compostos: usarJurosCompostos,
            },
            diagnostico: {
               status_financeiro: statusFinanceiro,
               receita_media: Math.round(receitaMedia * 100) / 100,
               despesa_media: Math.round(despesaMedia * 100) / 100,
               saldo_medio: Math.round(saldoMedio * 100) / 100,
               receitas_mes_atual: safeNumber(resumoAtual.receitas_mes),
               despesas_mes_atual: safeNumber(resumoAtual.despesas_mes),
               pendente_mes_atual: safeNumber(resumoAtual.pendente_mes),
               potencial_flexivel: Math.round(flexivelTotal * 100) / 100,
               janelas_gasto: janelas,
               categorias_criticas: categorias,
               cartoes_criticos: cartoesCriticos,
            },
            sinais,
            estrategias: strategies,
         });
      } catch (error) {
         console.error("Erro ao gerar plano do IAn:", error);
         return res
            .status(500)
            .json({ error: "Erro ao gerar o plano inteligente do IAn" });
      }
   }

   static async getSugestoesInvestimento(req, res) {
      try {
         const userId = req.userId;
         const { mesa_id: mesaIdInput, plano } = req.body || {};

         if (!mesaIdInput) {
            return res.status(400).json({
               error: "Selecione uma mesa para o IAn sugerir possibilidades de aplicacao.",
            });
         }

         const mesa = await Mesa.findById(mesaIdInput, userId);
         if (!mesa) {
            return res.status(403).json({ error: "Sem acesso a esta mesa" });
         }

         const payload = await getSugestoesInvestimento({
            mesaId: mesa.id,
            planoInput: plano,
         });

         if (!payload) {
            return res.status(400).json({
               error: "Gere ou ative um plano do IAn antes de pedir sugestoes de aplicacao.",
            });
         }

         return res.json(payload);
      } catch (error) {
         console.error("Erro ao gerar sugestoes de investimento do IAn:", error);
         return res.status(500).json({
            error: "Erro ao montar as sugestoes educativas de aplicacao do IAn",
         });
      }
   }
}

module.exports = IAnController;
