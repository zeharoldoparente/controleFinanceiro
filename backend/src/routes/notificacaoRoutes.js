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
 *     description: Retorna todas as notificações do usuário logado. Inclui contagem de não lidas na resposta.
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: apenas_nao_lidas
 *         schema:
 *           type: boolean
 *         description: Se true, retorna apenas notificações não lidas
 *         example: false
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
 *                         example: { "token": "abc123", "mesa_id": 1 }
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 nao_lidas:
 *                   type: integer
 *                   description: Total de notificações não lidas
 *                   example: 2
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno
 */
router.get("/", NotificacaoController.list);

/**
 * @swagger
 * /api/notificacoes/nao-lidas/count:
 *   get:
 *     summary: Contar notificações não lidas
 *     description: Retorna apenas o número de notificações não lidas (usado para o badge do sino)
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
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno
 */
router.get("/nao-lidas/count", NotificacaoController.countNaoLidas);

/**
 * @swagger
 * /api/notificacoes/marcar-todas-lidas:
 *   patch:
 *     summary: Marcar todas as notificações como lidas
 *     description: Marca todas as notificações não lidas do usuário como lidas de uma vez
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas as notificações marcadas como lidas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Todas as notificações marcadas como lidas
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno
 */
router.patch("/marcar-todas-lidas", NotificacaoController.marcarTodasLidas);

/**
 * @swagger
 * /api/notificacoes/{id}/marcar-lida:
 *   patch:
 *     summary: Marcar notificação como lida
 *     description: Marca uma notificação específica como lida. A notificação só some visualmente após o usuário abrir o menu e selecioná-la.
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notificação marcada como lida
 *       404:
 *         description: Notificação não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno
 */
router.patch("/:id/marcar-lida", NotificacaoController.marcarLida);

/**
 * @swagger
 * /api/notificacoes/{id}:
 *   delete:
 *     summary: Deletar notificação
 *     description: Remove permanentemente uma notificação específica do usuário
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
 *         description: Notificação removida
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Notificação removida
 *       404:
 *         description: Notificação não encontrada
 *       401:
 *         description: Não autenticado
 *       500:
 *         description: Erro interno
 */
router.delete("/:id", NotificacaoController.delete);

module.exports = router;
