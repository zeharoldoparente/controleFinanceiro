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
 *       Retorna todos os indicadores financeiros do mês para exibição no dashboard.
 *       Inclui totais de receitas (confirmadas e pendentes), despesas (pagas e a vencer),
 *       saldo, alertas de vencimento, evolução mensal e maiores gastos por categoria.
 *       Se mesa_id não for informado, consolida dados de todas as mesas do usuário.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Mês no formato YYYY-MM (padrão é o mês atual)
 *         example: "2026-03"
 *       - in: query
 *         name: mesa_id
 *         schema:
 *           type: integer
 *         description: ID da mesa (opcional — se omitido, consolida todas)
 *         example: 2
 *     responses:
 *       200:
 *         description: Dados consolidados do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 receitas:
 *                   type: object
 *                   properties:
 *                     confirmado:
 *                       type: number
 *                       description: Total de receitas confirmadas no mês
 *                       example: 5200.00
 *                     pendente:
 *                       type: number
 *                       description: Total de receitas a receber no mês
 *                       example: 800.00
 *                     provisionado:
 *                       type: number
 *                       description: Total estimado (confirmado + pendente)
 *                       example: 6000.00
 *                 despesas:
 *                   type: object
 *                   properties:
 *                     pago:
 *                       type: number
 *                       description: Total de despesas pagas no mês
 *                       example: 2350.00
 *                     pendente:
 *                       type: number
 *                       description: Total de despesas a vencer no mês
 *                       example: 1200.00
 *                     provisionado:
 *                       type: number
 *                       description: Total estimado (pago + pendente)
 *                       example: 3550.00
 *                 saldo:
 *                   type: object
 *                   properties:
 *                     atual:
 *                       type: number
 *                       description: Saldo atual (receitas confirmadas - despesas pagas)
 *                       example: 2850.00
 *                     previsto:
 *                       type: number
 *                       description: Saldo previsto (provisionado receitas - provisionado despesas)
 *                       example: 2450.00
 *                 alertas:
 *                   type: object
 *                   properties:
 *                     despesas_vencidas:
 *                       type: array
 *                       description: Até 5 despesas vencidas não pagas
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           descricao:
 *                             type: string
 *                           valor:
 *                             type: number
 *                           data_vencimento:
 *                             type: string
 *                             format: date
 *                           mesa_nome:
 *                             type: string
 *                     despesas_hoje:
 *                       type: array
 *                       description: Despesas que vencem hoje
 *                       items:
 *                         type: object
 *                 evolucao:
 *                   type: array
 *                   description: Evolução mensal dos últimos 6 meses
 *                   items:
 *                     type: object
 *                     properties:
 *                       mes:
 *                         type: string
 *                         example: "2026-03"
 *                       receitas:
 *                         type: number
 *                         example: 6000.00
 *                       despesas:
 *                         type: number
 *                         example: 3550.00
 *                 maiores_gastos:
 *                   type: array
 *                   description: Top categorias de gastos no mês
 *                   items:
 *                     type: object
 *                     properties:
 *                       categoria_id:
 *                         type: integer
 *                         nullable: true
 *                       categoria_nome:
 *                         type: string
 *                         example: Alimentação
 *                       total:
 *                         type: number
 *                         example: 850.00
 *                       percentual:
 *                         type: number
 *                         example: 23.94
 *       403:
 *         description: Sem acesso à mesa informada
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/", DashboardController.getDados);

/**
 * @swagger
 * /api/dashboard/detalhes-categoria:
 *   get:
 *     summary: Lançamentos individuais de uma categoria no mês
 *     description: >
 *       Retorna todas as despesas de uma categoria específica no mês,
 *       incluindo despesas normais (pagas) e despesas de cartão de crédito.
 *       Usado para o dropdown expandível no card "Maiores gastos" do dashboard.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: categoria_id
 *         schema:
 *           type: integer
 *           nullable: true
 *         description: ID da categoria (omitir ou "null" para "Sem categoria")
 *         example: 5
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Mês no formato YYYY-MM (padrão é o mês atual)
 *         example: "2026-03"
 *       - in: query
 *         name: mesa_id
 *         schema:
 *           type: integer
 *         description: ID da mesa (opcional — se omitido, consolida todas)
 *         example: 2
 *     responses:
 *       200:
 *         description: Lista de lançamentos da categoria no mês
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 itens:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 15
 *                       descricao:
 *                         type: string
 *                         example: Supermercado Extra
 *                       valor:
 *                         type: number
 *                         example: 280.50
 *                       data_vencimento:
 *                         type: string
 *                         format: date
 *                         example: "2026-03-10"
 *                       parcela_atual:
 *                         type: integer
 *                         nullable: true
 *                         example: 2
 *                       parcelas:
 *                         type: integer
 *                         nullable: true
 *                         example: 3
 *                       forma_pagamento:
 *                         type: string
 *                         nullable: true
 *                         example: Pix
 *                       e_cartao:
 *                         type: boolean
 *                         example: false
 *                       cartao_cor:
 *                         type: string
 *                         nullable: true
 *                         example: "#8B5CF6"
 *       403:
 *         description: Sem acesso à mesa informada
 *       500:
 *         description: Erro interno do servidor
 */
router.get("/detalhes-categoria", DashboardController.getDetalhesCategoria);

module.exports = router;
