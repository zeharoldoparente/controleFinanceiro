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
 *               - bandeira
 *               - dia_vencimento
 *               - tipo
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome identificador do cartão
 *                 example: Nubank Roxinho
 *               bandeira:
 *                 type: string
 *                 description: Bandeira do cartão
 *                 example: Mastercard
 *               limite:
 *                 type: number
 *                 format: float
 *                 description: Limite do cartão (opcional, geralmente para crédito)
 *                 example: 5000.00
 *               dia_vencimento:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 31
 *                 description: Dia do vencimento da fatura
 *                 example: 15
 *               tipo:
 *                 type: string
 *                 enum: [credito, debito]
 *                 description: Tipo do cartão
 *                 example: credito
 *     responses:
 *       201:
 *         description: Cartão criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Cartão criado com sucesso!
 *                 cartaoId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Dados inválidos ou tipo inválido
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
 *                       bandeira:
 *                         type: string
 *                         example: Mastercard
 *                       limite:
 *                         type: number
 *                         example: 5000.00
 *                       dia_vencimento:
 *                         type: integer
 *                         example: 15
 *                       tipo:
 *                         type: string
 *                         example: credito
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
 *               - bandeira
 *               - dia_vencimento
 *               - tipo
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Nubank Roxinho
 *               bandeira:
 *                 type: string
 *                 example: Mastercard
 *               limite:
 *                 type: number
 *                 example: 6000.00
 *               dia_vencimento:
 *                 type: integer
 *                 example: 15
 *               tipo:
 *                 type: string
 *                 enum: [credito, debito]
 *                 example: credito
 *     responses:
 *       200:
 *         description: Cartão atualizado
 */
router.put("/:id", CartaoController.update);

/**
 * @swagger
 * /api/cartoes/{id}:
 *   delete:
 *     summary: Deletar cartão
 *     description: Remove um cartão do usuário
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
 *         description: Cartão deletado
 */
router.delete("/:id", CartaoController.delete);

module.exports = router;
