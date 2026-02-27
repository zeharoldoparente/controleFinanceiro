const express = require("express");
const DashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Dados consolidados do dashboard
 *     description: >
 *       Retorna todos os dados necessários para o dashboard em uma única requisição.
 *       Quando mesa_id é omitido, agrega dados de todas as mesas do usuário.
 *       Inclui: resumo financeiro, alertas, cartões, maiores gastos por categoria,
 *       evolução dos últimos 6 meses, fluxo de caixa diário e últimas movimentações.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Mês no formato YYYY-MM (padrão é o mês atual)
 *         example: 2026-03
 *       - in: query
 *         name: mesa_id
 *         schema:
 *           type: integer
 *         description: ID de uma mesa específica (opcional — omitir para consolidado)
 *         example: 2
 *     responses:
 *       200:
 *         description: Dados do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mes:
 *                   type: string
 *                   example: 2026-03
 *                 mesas:
 *                   type: array
 *                   description: Mesas incluídas no cálculo
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       nome:
 *                         type: string
 *                 resumo:
 *                   type: object
 *                   properties:
 *                     receitas:
 *                       type: object
 *                       properties:
 *                         confirmado:
 *                           type: number
 *                           description: Valor efetivamente recebido (valor_real)
 *                         provisionado:
 *                           type: number
 *                           description: Soma de confirmado + a receber
 *                         qtd_confirmadas:
 *                           type: integer
 *                     despesas:
 *                       type: object
 *                       properties:
 *                         pago:
 *                           type: number
 *                           description: Valor efetivamente pago (valor_pago)
 *                         provisionado:
 *                           type: number
 *                           description: Soma de pago + pendente
 *                         pendente:
 *                           type: number
 *                         qtd_pagas:
 *                           type: integer
 *                         qtd_pendentes:
 *                           type: integer
 *                     saldo:
 *                       type: object
 *                       properties:
 *                         real:
 *                           type: number
 *                           description: receitas.confirmado − despesas.pago
 *                         previsto:
 *                           type: number
 *                           description: receitas.provisionado − despesas.provisionado
 *                 alertas:
 *                   type: object
 *                   properties:
 *                     despesas_vencidas:
 *                       type: array
 *                       description: Despesas com status vencida (até 5)
 *                       items:
 *                         type: object
 *                     despesas_hoje:
 *                       type: array
 *                       description: Despesas que vencem hoje (até 5)
 *                     cartoes_criticos:
 *                       type: array
 *                       description: Cartões com uso >= 80% do limite
 *                 cartoes:
 *                   type: array
 *                   description: Todos os cartões com gasto e percentual do mês
 *                 gastos_por_categoria:
 *                   type: array
 *                   description: Top 6 categorias por valor gasto no mês
 *                 evolucao_mensal:
 *                   type: array
 *                   description: Receitas e despesas confirmadas dos últimos 6 meses
 *                 fluxo_caixa:
 *                   type: array
 *                   description: Saldo acumulado dia a dia no mês
 *                 ultimas_movimentacoes:
 *                   type: array
 *                   description: Últimas 10 receitas/despesas confirmadas/pagas
 *       403:
 *         description: Sem acesso à mesa especificada
 *       500:
 *         description: Erro interno ao carregar dados
 */
router.get("/", DashboardController.getDados);

module.exports = router;
