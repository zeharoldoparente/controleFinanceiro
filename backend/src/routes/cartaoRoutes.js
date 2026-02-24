const express = require("express");
const CartaoController = require("../controllers/cartaoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/cartoes:
 *   post:
 *     summary: Criar cartão
 *     description: Cadastra um novo cartão de crédito ou débito do usuário
 *     tags: [Cartões]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - tipo
 *               - bandeira_id
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do cartão
 *                 example: Nubank Roxinho
 *               tipo:
 *                 type: string
 *                 enum: [credito, debito]
 *                 description: Tipo do cartão
 *                 example: credito
 *               bandeira_id:
 *                 type: integer
 *                 description: ID da bandeira
 *                 example: 2
 *               limite_real:
 *                 type: number
 *                 description: Limite real do cartão (do banco)
 *                 example: 5000
 *               limite_pessoal:
 *                 type: number
 *                 description: Limite pessoal (meta do usuário)
 *                 example: 3000
 *               dia_fechamento:
 *                 type: integer
 *                 description: Dia do fechamento da fatura (1-31)
 *                 example: 8
 *               dia_vencimento:
 *                 type: integer
 *                 description: Dia do vencimento da fatura (1-31)
 *                 example: 15
 *               cor:
 *                 type: string
 *                 description: Cor do cartão em hexadecimal
 *                 example: "#8B5CF6"
 *     responses:
 *       201:
 *         description: Cartão criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/", CartaoController.create);

/**
 * @swagger
 * /api/cartoes:
 *   get:
 *     summary: Listar cartões do usuário
 *     description: Retorna todos os cartões cadastrados pelo usuário logado
 *     tags: [Cartões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: incluirInativas
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Incluir cartões inativos (opcional, padrão false)
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de cartões
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cartoes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: Nubank Roxinho
 *                       bandeira_id:
 *                         type: integer
 *                         example: 2
 *                       bandeira_nome:
 *                         type: string
 *                         example: Mastercard
 *                       tipo_pagamento_id:
 *                         type: integer
 *                         example: 1
 *                       tipo_pagamento_nome:
 *                         type: string
 *                         example: Cartão de Crédito
 *                       limite_real:
 *                         type: number
 *                         example: 5000
 *                       limite_pessoal:
 *                         type: number
 *                         example: 3000
 *                       dia_fechamento:
 *                         type: integer
 *                         example: 8
 *                       dia_vencimento:
 *                         type: integer
 *                         example: 15
 *                       cor:
 *                         type: string
 *                         example: "#8B5CF6"
 *                       ativa:
 *                         type: boolean
 *                         example: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 */
router.get("/", CartaoController.list);

/**
 * @swagger
 * /api/cartoes/{id}:
 *   get:
 *     summary: Buscar cartão específico
 *     description: Retorna detalhes de um cartão do usuário
 *     tags: [Cartões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Detalhes do cartão
 *       404:
 *         description: Cartão não encontrado
 */
router.get("/:id", CartaoController.show);

/**
 * @swagger
 * /api/cartoes/{id}:
 *   put:
 *     summary: Atualizar cartão
 *     description: Atualiza informações de um cartão do usuário
 *     tags: [Cartões]
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
 *               - nome
 *               - tipo
 *               - bandeira_id
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Nubank Roxinho
 *               tipo:
 *                 type: string
 *                 enum: [credito, debito]
 *                 example: credito
 *               bandeira_id:
 *                 type: integer
 *                 example: 2
 *               limite_real:
 *                 type: number
 *                 example: 6000
 *               limite_pessoal:
 *                 type: number
 *                 example: 4000
 *               dia_fechamento:
 *                 type: integer
 *                 example: 8
 *               dia_vencimento:
 *                 type: integer
 *                 example: 15
 *               cor:
 *                 type: string
 *                 example: "#8B5CF6"
 *     responses:
 *       200:
 *         description: Cartão atualizado
 */
router.put("/:id", CartaoController.update);

/**
 * @swagger
 * /api/cartoes/{id}/reativar:
 *   patch:
 *     summary: Reativar cartão
 *     description: Reativa um cartão que foi inativado
 *     tags: [Cartões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Cartão reativado com sucesso
 *       404:
 *         description: Cartão não encontrado
 */
router.patch("/:id/reativar", CartaoController.reativar);

/**
 * @swagger
 * /api/cartoes/{id}:
 *   delete:
 *     summary: Inativar cartão
 *     description: Inativa um cartão (soft delete - não remove do banco)
 *     tags: [Cartões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Cartão inativado com sucesso
 *       404:
 *         description: Cartão não encontrado
 */
router.delete("/:id", CartaoController.delete);

module.exports = router;
