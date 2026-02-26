const express = require("express");
const ReceitaController = require("../controllers/receitaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/receitas:
 *   post:
 *     summary: Criar receita
 *     description: Cadastra uma nova receita em uma mesa
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mesa_id
 *               - descricao
 *               - valor
 *               - data_recebimento
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 description: ID da mesa
 *                 example: 2
 *               descricao:
 *                 type: string
 *                 description: Descrição da receita
 *                 example: Salário de Fevereiro
 *               valor:
 *                 type: number
 *                 format: float
 *                 description: Valor da receita
 *                 example: 5000.00
 *               data_recebimento:
 *                 type: string
 *                 format: date
 *                 description: Data de recebimento
 *                 example: 2026-02-05
 *               categoria_id:
 *                 type: integer
 *                 description: ID da categoria (opcional)
 *                 example: 2
 *               tipo_pagamento_id:
 *                 type: integer
 *                 description: ID do tipo de pagamento (opcional)
 *                 example: 3
 *               recorrente:
 *                 type: boolean
 *                 description: Se a receita é recorrente
 *                 example: false
 *     responses:
 *       201:
 *         description: Receita criada com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.post("/", ReceitaController.create);

/**
 * @swagger
 * /api/receitas:
 *   get:
 *     summary: Listar receitas de uma mesa
 *     description: Retorna todas as receitas de uma mesa específica
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da mesa
 *         example: 2
 *       - in: query
 *         name: incluirInativas
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Incluir receitas inativas (opcional, padrão false)
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de receitas
 */
router.get("/", ReceitaController.list);

/**
 * @swagger
 * /api/receitas/{id}:
 *   get:
 *     summary: Buscar receita específica
 *     description: Retorna detalhes de uma receita
 *     tags: [Receitas]
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
 *         description: Detalhes da receita
 *       404:
 *         description: Receita não encontrada
 */
router.get("/:id", ReceitaController.show);

/**
 * @swagger
 * /api/receitas/{id}:
 *   put:
 *     summary: Atualizar receita
 *     description: Atualiza informações de uma receita
 *     tags: [Receitas]
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
 *               - descricao
 *               - valor
 *               - data_recebimento
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               descricao:
 *                 type: string
 *                 example: Salário de Fevereiro (Atualizado)
 *               valor:
 *                 type: number
 *                 example: 5500.00
 *               data_recebimento:
 *                 type: string
 *                 format: date
 *                 example: 2026-02-05
 *               categoria_id:
 *                 type: integer
 *                 example: 2
 *               tipo_pagamento_id:
 *                 type: integer
 *                 example: 3
 *               recorrente:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Receita atualizada
 */
router.put("/:id", ReceitaController.update);

/**
 * @swagger
 * /api/receitas/{id}/reativar:
 *   patch:
 *     summary: Reativar receita
 *     description: Reativa uma receita que foi inativada
 *     tags: [Receitas]
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
 *         description: Receita reativada com sucesso
 *       404:
 *         description: Receita não encontrada
 */
router.patch("/:id/reativar", ReceitaController.reativar);

/**
 * @swagger
 * /api/receitas/{id}:
 *   delete:
 *     summary: Inativar receita
 *     description: Inativa uma receita (soft delete)
 *     tags: [Receitas]
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
 *         description: Receita inativada com sucesso
 */
router.delete("/:id", ReceitaController.inativar);

module.exports = router;
