const express = require("express");
const FormaPagamentoController = require("../controllers/formaPagamentoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/formas-pagamento:
 *   post:
 *     summary: Criar forma de pagamento
 *     description: Cria uma nova forma de pagamento (PIX, Dinheiro, Cartão, etc)
 *     tags: [Formas de Pagamento]
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
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome da forma de pagamento
 *                 example: PIX
 *     responses:
 *       201:
 *         description: Forma de pagamento criada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Forma de pagamento criada com sucesso!
 *                 formaPagamentoId:
 *                   type: integer
 *                   example: 1
 */
router.post("/", FormaPagamentoController.create);

/**
 * @swagger
 * /api/formas-pagamento:
 *   get:
 *     summary: Listar formas de pagamento
 *     description: Lista todas as formas de pagamento cadastradas
 *     tags: [Formas de Pagamento]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de formas de pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 formasPagamento:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: PIX
 *                       created_at:
 *                         type: string
 *                         format: date-time
 */
router.get("/", FormaPagamentoController.list);

/**
 * @swagger
 * /api/formas-pagamento/{id}:
 *   get:
 *     summary: Buscar forma de pagamento específica
 *     description: Retorna detalhes de uma forma de pagamento
 *     tags: [Formas de Pagamento]
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
 *         description: Detalhes da forma de pagamento
 *       404:
 *         description: Forma de pagamento não encontrada
 */
router.get("/:id", FormaPagamentoController.show);

/**
 * @swagger
 * /api/formas-pagamento/{id}:
 *   put:
 *     summary: Atualizar forma de pagamento
 *     description: Atualiza o nome da forma de pagamento
 *     tags: [Formas de Pagamento]
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
 *             properties:
 *               nome:
 *                 type: string
 *                 example: PIX
 *     responses:
 *       200:
 *         description: Forma de pagamento atualizada
 */
router.put("/:id", FormaPagamentoController.update);

/**
 * @swagger
 * /api/formas-pagamento/{id}:
 *   delete:
 *     summary: Deletar forma de pagamento
 *     description: Remove uma forma de pagamento
 *     tags: [Formas de Pagamento]
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
 *         description: Forma de pagamento deletada
 */
router.delete("/:id", FormaPagamentoController.delete);

module.exports = router;
