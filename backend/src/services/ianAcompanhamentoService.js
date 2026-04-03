const db = require("../config/database");
const IAnPlano = require("../models/IAnPlano");
const IAnRegistroMensal = require("../models/IAnRegistroMensal");
const Notificacao = require("../models/Notificacao");

function safeNumber(value) {
   const parsed = Number.parseFloat(value ?? 0);
   return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value) {
   return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
   }).format(safeNumber(value));
}

function roundMoney(value) {
   return Math.round(safeNumber(value) * 100) / 100;
}

function getCurrentMonth() {
   const now = new Date();
   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function getTodayDate() {
   const now = new Date();
   return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getMonthProgress() {
   const now = new Date();
   const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
   return {
      currentDay: now.getDate(),
      daysInMonth,
      ratio: now.getDate() / daysInMonth,
   };
}

function getWeekReference() {
   const today = new Date();
   const firstDay = new Date(today.getFullYear(), 0, 1);
   const diffDays = Math.floor((today - firstDay) / 86400000);
   const week = Math.ceil((diffDays + firstDay.getDay() + 1) / 7);
   return `${today.getFullYear()}-${String(week).padStart(2, "0")}`;
}

function addMonthsToReference(referenciaMes, monthsToAdd) {
   const [year, month] = String(referenciaMes || "").split("-").map(Number);
   if (!year || !month) return null;

   const date = new Date(year, month - 1 + Math.max(0, monthsToAdd), 1);
   return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function calculateMetaProgress(planoSalvo, estrategia, registros) {
   const valorObjetivo = safeNumber(planoSalvo?.plano?.objetivo?.valor_objetivo);
   const totalGuardado = registros.reduce(
      (acc, item) => acc + safeNumber(item.valor_guardado),
      0,
   );
   const totalInvestido = registros.reduce(
      (acc, item) => acc + safeNumber(item.valor_investido),
      0,
   );
   const totalDividendos = registros.reduce(
      (acc, item) => acc + safeNumber(item.dividendos_recebidos),
      0,
   );
   const patrimonioAcumulado = totalGuardado + totalInvestido + totalDividendos;

   const carteiraMap = new Map();

   for (const registro of registros) {
      for (const investimento of registro.investimentos || []) {
         const key = investimento.codigo || investimento.nome;
         if (!key) continue;

         const existente = carteiraMap.get(key) || {
            nome: investimento.nome || investimento.codigo || "Investimento",
            codigo: investimento.codigo || null,
            quantidade_total: 0,
            total_investido: 0,
            dividendos_estimados_mensais: 0,
         };

         existente.quantidade_total += safeNumber(investimento.quantidade);
         existente.total_investido += safeNumber(investimento.valor_total);
         existente.dividendos_estimados_mensais += safeNumber(
            investimento.dividendos_estimados_mensais,
         );

         carteiraMap.set(key, existente);
      }
   }

   const carteiraResumo = Array.from(carteiraMap.values())
      .map((item) => ({
         ...item,
         quantidade_total: roundMoney(item.quantidade_total),
         total_investido: roundMoney(item.total_investido),
         dividendos_estimados_mensais: roundMoney(
            item.dividendos_estimados_mensais,
         ),
      }))
      .sort((a, b) => b.total_investido - a.total_investido);

   const dividendosEstimadosMensais = carteiraResumo.reduce(
      (acc, item) => acc + safeNumber(item.dividendos_estimados_mensais),
      0,
   );
   const mesesComHistorico = registros.length;
   const aporteRealMedio =
      mesesComHistorico > 0
         ? (totalGuardado + totalInvestido) / mesesComHistorico
         : safeNumber(estrategia?.projecao_composta?.aporte_mensal);
   const ritmoMedioMensal =
      mesesComHistorico > 0
         ? patrimonioAcumulado / mesesComHistorico
         : safeNumber(estrategia?.projecao_composta?.aporte_mensal);
   const ritmoProjetadoMensal = Math.max(
      aporteRealMedio + dividendosEstimadosMensais,
      safeNumber(estrategia?.projecao_composta?.aporte_mensal),
      1,
   );
   const valorFaltante = Math.max(0, valorObjetivo - patrimonioAcumulado);
   const percentualConcluido =
      valorObjetivo > 0
         ? Math.min(100, (patrimonioAcumulado / valorObjetivo) * 100)
         : 0;
   const prazoRestanteMeses =
      valorFaltante > 0 ? Math.ceil(valorFaltante / ritmoProjetadoMensal) : 0;
   const conclusaoPrevistaEm =
      valorObjetivo > 0
         ? addMonthsToReference(getCurrentMonth(), prazoRestanteMeses)
         : null;
   const proximoMesProjetado =
      patrimonioAcumulado + aporteRealMedio + dividendosEstimadosMensais;

   const registrosFormatados = registros.map((registro) => ({
      ...registro,
      total_mes: roundMoney(
         safeNumber(registro.valor_guardado) +
            safeNumber(registro.valor_investido) +
            safeNumber(registro.dividendos_recebidos),
      ),
   }));

   return {
      valor_objetivo: roundMoney(valorObjetivo),
      patrimonio_acumulado: roundMoney(patrimonioAcumulado),
      total_guardado: roundMoney(totalGuardado),
      total_investido: roundMoney(totalInvestido),
      total_dividendos: roundMoney(totalDividendos),
      percentual_concluido: roundMoney(percentualConcluido),
      valor_faltante: roundMoney(valorFaltante),
      aporte_real_medio: roundMoney(aporteRealMedio),
      ritmo_medio_mensal: roundMoney(ritmoMedioMensal),
      ritmo_planejado_mensal: roundMoney(
         safeNumber(estrategia?.projecao_composta?.aporte_mensal),
      ),
      dividendos_estimados_mensais: roundMoney(dividendosEstimadosMensais),
      proximo_mes_projetado: roundMoney(proximoMesProjetado),
      prazo_restante_meses: prazoRestanteMeses,
      conclusao_prevista_em: conclusaoPrevistaEm,
      registros: registrosFormatados,
      carteira_resumo: carteiraResumo.slice(0, 6),
      meses_com_historico: mesesComHistorico,
   };
}

function getStrategyFromPlan(planoSalvo) {
   if (!planoSalvo?.plano?.estrategias?.length) return null;
   return (
      planoSalvo.plano.estrategias.find(
         (item) => item.id === planoSalvo.estrategia_id,
      ) || null
   );
}

async function getMesaUserIds(mesaId) {
   const [rows] = await db.query(
      `SELECT user_id
       FROM mesa_usuarios
       WHERE mesa_id = ?`,
      [mesaId],
   );

   return rows
      .map((row) => Number(row.user_id))
      .filter((userId) => Number.isInteger(userId) && userId > 0);
}

async function getCategoryTracking(mesaId, categoryNames) {
   if (!categoryNames.length) return { currentMap: {}, averageMap: {} };

   const placeholders = categoryNames.map(() => "?").join(",");

   const [rows] = await db.query(
      `SELECT
         COALESCE(c.nome, 'Sem categoria') AS categoria,
         DATE_FORMAT(d.data_vencimento, '%Y-%m') AS mes,
         SUM(COALESCE(d.valor_real, d.valor_provisionado)) AS total
       FROM despesas d
       LEFT JOIN categorias c ON c.id = d.categoria_id
       WHERE d.mesa_id = ?
         AND d.ativa = TRUE
         AND d.data_cancelamento IS NULL
         AND d.data_vencimento >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)
         AND COALESCE(c.nome, 'Sem categoria') IN (${placeholders})
       GROUP BY COALESCE(c.nome, 'Sem categoria'), DATE_FORMAT(d.data_vencimento, '%Y-%m')`,
      [mesaId, ...categoryNames],
   );

   const mesAtual = getCurrentMonth();
   const grouped = new Map();

   for (const row of rows) {
      const categoria = row.categoria;
      const total = safeNumber(row.total);
      const list = grouped.get(categoria) || [];
      list.push({ mes: row.mes, total });
      grouped.set(categoria, list);
   }

   const currentMap = {};
   const averageMap = {};

   for (const categoria of categoryNames) {
      const entries = grouped.get(categoria) || [];
      currentMap[categoria] = safeNumber(
         entries.find((item) => item.mes === mesAtual)?.total,
      );
      averageMap[categoria] =
         entries.reduce((acc, item) => acc + item.total, 0) /
            Math.max(entries.length, 1) || 0;
   }

   return { currentMap, averageMap };
}

async function getWindowAndWeeklySignals(mesaId) {
   const [weeklyRows] = await db.query(
      `SELECT
         COALESCE(c.nome, 'Sem categoria') AS categoria,
         SUM(COALESCE(d.valor_real, d.valor_provisionado)) AS total,
         SUM(CASE WHEN d.cartao_id IS NOT NULL THEN COALESCE(d.valor_real, d.valor_provisionado) ELSE 0 END) AS total_cartao
       FROM despesas d
       LEFT JOIN categorias c ON c.id = d.categoria_id
       WHERE d.mesa_id = ?
         AND d.ativa = TRUE
         AND d.data_cancelamento IS NULL
         AND d.data_vencimento >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY COALESCE(c.nome, 'Sem categoria')
       ORDER BY total DESC`,
      [mesaId],
   );

   const [[todayRow]] = await db.query(
      `SELECT
         COUNT(*) AS quantidade,
         COALESCE(SUM(COALESCE(valor_real, valor_provisionado)), 0) AS total
       FROM despesas
       WHERE mesa_id = ?
         AND ativa = TRUE
         AND data_cancelamento IS NULL
         AND DATE(created_at) = CURDATE()`,
      [mesaId],
   );

   const [[todayTopCategoryRow]] = await db.query(
      `SELECT
         COALESCE(c.nome, 'Sem categoria') AS categoria,
         SUM(COALESCE(d.valor_real, d.valor_provisionado)) AS total
       FROM despesas d
       LEFT JOIN categorias c ON c.id = d.categoria_id
       WHERE d.mesa_id = ?
         AND d.ativa = TRUE
         AND d.data_cancelamento IS NULL
         AND DATE(d.created_at) = CURDATE()
       GROUP BY COALESCE(c.nome, 'Sem categoria')
       ORDER BY total DESC
       LIMIT 1`,
      [mesaId],
   );

   return {
      weeklyRows: weeklyRows.map((row) => ({
         categoria: row.categoria,
         total: safeNumber(row.total),
         total_cartao: safeNumber(row.total_cartao),
      })),
      today: {
         quantidade: Number(todayRow?.quantidade || 0),
         total: safeNumber(todayRow?.total),
         categoria_topo: todayTopCategoryRow?.categoria || null,
         total_categoria_topo: safeNumber(todayTopCategoryRow?.total),
      },
   };
}

async function buildAcompanhamento(planoSalvo) {
   const estrategia = getStrategyFromPlan(planoSalvo);
   if (!estrategia || !planoSalvo?.mesa_id || !planoSalvo?.plano) {
      return null;
   }

   const mesaId = planoSalvo.mesa_id;
   const { ratio } = getMonthProgress();
   const despesaMedia = safeNumber(planoSalvo.plano?.diagnostico?.despesa_media);
   const gastoAlvoMes = Math.max(0, despesaMedia - safeNumber(estrategia.economia_mensal));
   const gastoEsperadoAteAgora = gastoAlvoMes * ratio;

   const [[mesAtualRow]] = await db.query(
      `SELECT
         COALESCE(SUM(COALESCE(valor_real, valor_provisionado)), 0) AS total
       FROM despesas
       WHERE mesa_id = ?
         AND ativa = TRUE
         AND data_cancelamento IS NULL
         AND DATE_FORMAT(data_vencimento, '%Y-%m') = ?`,
      [mesaId, getCurrentMonth()],
   );

   const gastoAtualMes = safeNumber(mesAtualRow?.total);
   const desvioAtual = gastoAtualMes - gastoEsperadoAteAgora;
   const tolerancia = Math.max(100, safeNumber(estrategia.economia_mensal) * 0.15);

   const statusGeral =
      desvioAtual <= 0 ? "no_rumo" : desvioAtual <= tolerancia ? "atencao" : "fora_do_rumo";

   const categoryNames = (estrategia.ajustes || []).map((item) => item.categoria);
   const { currentMap, averageMap } = await getCategoryTracking(
      mesaId,
      categoryNames,
   );
   const { weeklyRows, today } = await getWindowAndWeeklySignals(mesaId);
   const registros = await IAnRegistroMensal.listByPlan(planoSalvo.id);
   const progressoMeta = calculateMetaProgress(planoSalvo, estrategia, registros);

   const diarios = [];
   const semanais = [];
   const mensais = [];

   if (today.total > 0 && today.categoria_topo) {
      diarios.push(
         `Hoje ja saiu ${formatMoney(today.total)} em ${today.quantidade} lancamento(s). O maior peso foi ${today.categoria_topo} com ${formatMoney(today.total_categoria_topo)}.`,
      );
   } else {
      diarios.push(
         "Hoje ainda nao apareceu gasto novo. Bom momento para blindar cartao, delivery e compra por impulso.",
      );
   }

   const weeklyCardTotal = weeklyRows.reduce(
      (acc, row) => acc + safeNumber(row.total_cartao),
      0,
   );
   const topWeekly = weeklyRows[0];

   if (topWeekly) {
      semanais.push(
         `Nesta semana, ${topWeekly.categoria} lidera seus gastos com ${formatMoney(topWeekly.total)}.`,
      );
   }

   if (weeklyCardTotal > safeNumber(estrategia.projecao_composta.aporte_mensal)) {
      semanais.push(
         `O cartao consumiu ${formatMoney(weeklyCardTotal)} nos ultimos 7 dias. Segurar esse ritmo ajuda mais do que tentar compensar no fim do mes.`,
      );
   }

   const categoriasEmAlerta = (estrategia.ajustes || [])
      .map((ajuste) => {
         const media = safeNumber(averageMap[ajuste.categoria]);
         const atual = safeNumber(currentMap[ajuste.categoria]);
         const alvoCategoria = Math.max(0, media - safeNumber(ajuste.economia_sugerida));
         const alvoAteAgora = alvoCategoria * ratio;
         const excedente = atual - alvoAteAgora;

         return {
            categoria: ajuste.categoria,
            atual,
            media,
            alvo_categoria: alvoCategoria,
            excedente,
         };
      })
      .filter((item) => item.excedente > 40)
      .sort((a, b) => b.excedente - a.excedente);

   if (categoriasEmAlerta[0]) {
      mensais.push(
         `${categoriasEmAlerta[0].categoria} ja esta ${formatMoney(categoriasEmAlerta[0].excedente)} acima do ritmo ideal deste mes.`,
      );
   }

   if (progressoMeta.meses_com_historico > 0) {
      mensais.push(
         `Voce ja acumulou ${formatMoney(progressoMeta.patrimonio_acumulado)} para a meta, o que representa ${progressoMeta.percentual_concluido.toFixed(1)}% do objetivo.`,
      );
   } else {
      mensais.push(
         "Assim que voce registrar o fechamento do mes, o IAn passa a medir o quanto da meta ja virou patrimonio real.",
      );
   }

   if (statusGeral === "fora_do_rumo") {
      mensais.push(
         `Seu mes esta ${formatMoney(desvioAtual)} acima do ritmo planejado. O corte precisa vir das categorias mais flexiveis primeiro.`,
      );
   } else if (statusGeral === "atencao") {
      mensais.push(
         `Voce esta perto do limite do plano. Se segurar cartao e lazer nesta reta, ainda da para fechar bem o mes.`,
      );
   } else {
      mensais.push(
         `Voce esta dentro do ritmo planejado. A chave agora e manter constancia ate o fechamento.`,
      );
   }

   if (semanais.length === 0) {
      semanais.push(
         "A semana esta relativamente controlada. Continue comparando cartao e comida antes de cada compra.",
      );
   }

   if (mensais.length === 0) {
      mensais.push(
         "O mes segue sem desvios fortes. Mantenha o plano ativo e concentre cortes no que e flexivel.",
      );
   }

   return {
      status_geral: statusGeral,
      resumo:
         statusGeral === "fora_do_rumo"
            ? "O IAn encontrou desvios que pedem ajuste imediato."
            : statusGeral === "atencao"
              ? "O plano ainda e recuperavel, mas o ritmo pede disciplina agora."
              : "Seu comportamento esta alinhado com a estrategia ativa.",
      indicadores: {
         gasto_mes_atual: roundMoney(gastoAtualMes),
         gasto_esperado_ate_agora: roundMoney(gastoEsperadoAteAgora),
         desvio_atual: roundMoney(desvioAtual),
         gasto_cartao_semana: roundMoney(weeklyCardTotal),
         gasto_hoje: roundMoney(today.total),
         restante_sugerido_mes: roundMoney(Math.max(0, gastoAlvoMes - gastoAtualMes)),
      },
      progresso_meta: progressoMeta,
      categorias_em_alerta: categoriasEmAlerta.slice(0, 3),
      alertas: {
         diarios: diarios.slice(0, 3),
         semanais: semanais.slice(0, 3),
         mensais: mensais.slice(0, 3),
      },
   };
}

async function getPlanoAtivoComAcompanhamento(userId, mesaId) {
   const planoSalvo = await IAnPlano.findActiveByMesa(mesaId);
   if (!planoSalvo) return null;

   const acompanhamento = await buildAcompanhamento(planoSalvo);

   return {
      plano_ativo: {
         id: planoSalvo.id,
         mesa_id: planoSalvo.mesa_id,
         estrategia_id: planoSalvo.estrategia_id,
         objetivo_descricao: planoSalvo.objetivo_descricao,
         created_at: planoSalvo.created_at,
         updated_at: planoSalvo.updated_at,
         plano: planoSalvo.plano,
      },
      acompanhamento,
   };
}

async function verificarAcompanhamentosIAn(userId) {
   const planos = await IAnPlano.findAllActiveByUser(userId);

   for (const plano of planos) {
      const payload = await getPlanoAtivoComAcompanhamento(userId, plano.mesa_id);
      const acompanhamento = payload?.acompanhamento;
      if (!acompanhamento) continue;

      const strategy = getStrategyFromPlan(plano);
      if (!strategy) continue;
      const membros = await getMesaUserIds(plano.mesa_id);
      if (!membros.length) continue;

      const todayRef = getTodayDate();
      const weekRef = getWeekReference();
      const monthRef = getCurrentMonth();

      for (const membroId of membros) {
         if (acompanhamento.alertas.diarios[0]) {
            await Notificacao.createComReferencia(
               membroId,
               `ian_diario_${plano.id}_${todayRef}`,
               "alerta_financeiro",
               `IAn: olho no objetivo "${plano.objetivo_descricao}"`,
               acompanhamento.alertas.diarios[0],
               "/dashboard/ian",
               {
                  plano_id: plano.id,
                  mesa_id: plano.mesa_id,
                  estrategia_id: strategy.id,
                  periodicidade: "diaria",
               },
               todayRef,
            );
         }

         if (
            acompanhamento.status_geral !== "no_rumo" &&
            acompanhamento.alertas.semanais[0]
         ) {
            await Notificacao.createComReferencia(
               membroId,
               `ian_semanal_${plano.id}_${weekRef}`,
               "alerta_financeiro",
               `IAn semanal: ${strategy.nome}`,
               acompanhamento.alertas.semanais[0],
               "/dashboard/ian",
               {
                  plano_id: plano.id,
                  mesa_id: plano.mesa_id,
                  estrategia_id: strategy.id,
                  periodicidade: "semanal",
               },
               null,
            );
         }

         if (
            acompanhamento.status_geral === "fora_do_rumo" &&
            acompanhamento.alertas.mensais[0]
         ) {
            await Notificacao.createComReferencia(
               membroId,
               `ian_mensal_${plano.id}_${monthRef}`,
               "alerta_financeiro",
               `IAn mensal: ajuste de rota necessario`,
               acompanhamento.alertas.mensais[0],
               "/dashboard/ian",
               {
                  plano_id: plano.id,
                  mesa_id: plano.mesa_id,
                  estrategia_id: strategy.id,
                  periodicidade: "mensal",
               },
               null,
            );
         }
      }
   }
}

module.exports = {
   getPlanoAtivoComAcompanhamento,
   verificarAcompanhamentosIAn,
};
