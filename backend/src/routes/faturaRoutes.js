const express = require("express");
const FaturaController = require("../controllers/faturaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

/**
 * @swagger
 * /api/faturas:
 *   get:
 *     summary: Listar faturas de um cartão
 *     description: Retorna todas as faturas de um cartão específico com total de lançamentos.
 *     tags: [Faturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cartao_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Lista de faturas do cartão
 *       400:
 *         description: Parâmetros obrigatórios não informados
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.get("/", FaturaController.listByCartao);

/**
 * @swagger
 * /api/faturas/mesa:
 *   get:
 *     summary: Listar faturas da mesa por mês
 *     description: Retorna faturas de todos os cartões de uma mesa para um mês específico. Usado na aba Despesas para exibir a linha unificada de cada cartão.
 *     tags: [Faturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Mês no formato YYYY-MM (padrão é o mês atual)
 *         example: 2026-03
 *     responses:
 *       200:
 *         description: Lista de faturas do mês
 */
router.get("/mesa", FaturaController.listByMesa);

/**
 * @swagger
 * /api/faturas/{id}:
 *   get:
 *     summary: Detalhar fatura com todos os lançamentos
 *     description: Retorna os dados completos da fatura incluindo todos os lançamentos vinculados (extrato do cartão).
 *     tags: [Faturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Dados da fatura com lançamentos
 *       404:
 *         description: Fatura não encontrada
 */
router.get("/:id", FaturaController.show);

/**
 * @swagger
 * /api/faturas/{id}/pagar:
 *   patch:
 *     summary: Pagar fatura
 *     description: Marca a fatura como paga e quita todas as despesas vinculadas automaticamente.
 *     tags: [Faturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mesa_id
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               valor_real:
 *                 type: number
 *                 description: Valor efetivamente pago (opcional, padrão = valor_total da fatura)
 *                 example: 270.00
 *               data_pagamento:
 *                 type: string
 *                 format: date
 *                 description: Data do pagamento (opcional, padrão = hoje)
 *                 example: 2026-03-09
 *     responses:
 *       200:
 *         description: Fatura paga com sucesso
 *       404:
 *         description: Fatura não encontrada
 *       409:
 *         description: Fatura já está paga
 */
router.patch("/:id/pagar", FaturaController.pagar);

/**
 * @swagger
 * /api/faturas/{id}/desfazer-pagamento:
 *   patch:
 *     summary: Desfazer pagamento de fatura
 *     description: Reverte o pagamento da fatura e de todas as despesas vinculadas.
 *     tags: [Faturas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mesa_id
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Pagamento desfeito com sucesso
 *       400:
 *         description: Fatura não está paga
 *       404:
 *         description: Fatura não encontrada
 */
router.patch("/:id/desfazer-pagamento", FaturaController.desfazerPagamento);

module.exports = router;
