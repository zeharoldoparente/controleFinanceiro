const express = require("express");
const TipoPagamentoController = require("../controllers/tipoPagamentoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/tipos-pagamento:
 *   post:
 *     summary: Criar tipo de pagamento
 *     description: Cria um novo tipo de pagamento
 *     tags: [Tipos de Pagamento]
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
 *                 example: Pix
 *     responses:
 *       201:
 *         description: Tipo de pagamento criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/", TipoPagamentoController.create);

/**
 * @swagger
 * /api/tipos-pagamento:
 *   get:
 *     summary: Listar tipos de pagamento
 *     description: Lista todos os tipos de pagamento cadastrados
 *     tags: [Tipos de Pagamento]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: incluirInativas
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Incluir tipos inativos (opcional, padrão false)
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de tipos de pagamento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tiposPagamento:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: Pix
 *                       ativa:
 *                         type: boolean
 *                         example: true
 */
router.get("/", TipoPagamentoController.list);

/**
 * @swagger
 * /api/tipos-pagamento/{id}:
 *   get:
 *     summary: Buscar tipo de pagamento específico
 *     description: Retorna detalhes de um tipo de pagamento
 *     tags: [Tipos de Pagamento]
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
 *         description: Detalhes do tipo de pagamento
 *       404:
 *         description: Tipo de pagamento não encontrado
 */
router.get("/:id", TipoPagamentoController.show);

/**
 * @swagger
 * /api/tipos-pagamento/{id}:
 *   put:
 *     summary: Atualizar tipo de pagamento
 *     description: Atualiza o nome do tipo de pagamento
 *     tags: [Tipos de Pagamento]
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
 *                 example: Pix Automático
 *     responses:
 *       200:
 *         description: Tipo de pagamento atualizado
 */
router.put("/:id", TipoPagamentoController.update);

/**
 * @swagger
 * /api/tipos-pagamento/{id}/reativar:
 *   patch:
 *     summary: Reativar tipo de pagamento
 *     description: Reativa um tipo de pagamento que foi inativado
 *     tags: [Tipos de Pagamento]
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
 *         description: Tipo de pagamento reativado com sucesso
 *       404:
 *         description: Tipo de pagamento não encontrado
 */
router.patch("/:id/reativar", TipoPagamentoController.reativar);

/**
 * @swagger
 * /api/tipos-pagamento/{id}:
 *   delete:
 *     summary: Inativar tipo de pagamento
 *     description: Inativa um tipo de pagamento (soft delete)
 *     tags: [Tipos de Pagamento]
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
 *         description: Tipo de pagamento inativado com sucesso
 *       404:
 *         description: Tipo de pagamento não encontrado
 */
router.delete("/:id", TipoPagamentoController.delete);

module.exports = router;
