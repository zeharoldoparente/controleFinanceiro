const express = require("express");
const NotificacaoController = require("../controllers/notificacaoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/notificacoes:
 *   get:
 *     summary: Listar notificações do usuário
 *     description: Retorna todas as notificações do usuário logado
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de notificações
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 notificacoes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 2
 *                       tipo:
 *                         type: string
 *                         enum: [convite_mesa, sistema, outros]
 *                         example: convite_mesa
 *                       titulo:
 *                         type: string
 *                         example: Novo convite de mesa
 *                       mensagem:
 *                         type: string
 *                         example: José Silva convidou você para participar da mesa "Minha Casa"
 *                       lida:
 *                         type: boolean
 *                         example: false
 *                       link:
 *                         type: string
 *                         example: /convites/abc123
 *                       dados_extras:
 *                         type: object
 *                       created_at:
 *                         type: string
 *                         format: date-time
 */
router.get("/", NotificacaoController.list);

/**
 * @swagger
 * /api/notificacoes/nao-lidas/count:
 *   get:
 *     summary: Contar notificações não lidas
 *     description: Retorna o número de notificações não lidas do usuário (para o "sininho")
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Total de notificações não lidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 3
 */
router.get("/nao-lidas/count", NotificacaoController.countNaoLidas);

/**
 * @swagger
 * /api/notificacoes/{id}/marcar-lida:
 *   patch:
 *     summary: Marcar notificação como lida
 *     description: Marca uma notificação específica como lida
 *     tags: [Notificações]
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
 *         description: Notificação marcada como lida
 */
router.patch("/:id/marcar-lida", NotificacaoController.marcarLida);

/**
 * @swagger
 * /api/notificacoes/marcar-todas-lidas:
 *   patch:
 *     summary: Marcar todas as notificações como lidas
 *     description: Marca todas as notificações do usuário como lidas
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações marcadas como lidas
 */
router.patch("/marcar-todas-lidas", NotificacaoController.marcarTodasLidas);

/**
 * @swagger
 * /api/notificacoes/{id}:
 *   delete:
 *     summary: Deletar notificação
 *     description: Remove uma notificação específica
 *     tags: [Notificações]
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
 *         description: Notificação deletada
 */
router.delete("/:id", NotificacaoController.delete);

module.exports = router;
