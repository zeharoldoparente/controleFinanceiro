const express = require("express");
const router = express.Router();
const ConviteController = require("../controllers/conviteController");
const authMiddleware = require("../middlewares/authMiddleware");
const { createRateLimiter } = require("../middlewares/rateLimitMiddleware");

router.use(authMiddleware);

const conviteAcaoLimiter = createRateLimiter({
   windowMs: 10 * 60 * 1000,
   max: 20,
   keyGenerator: (req) => req.ip,
   message: "Muitas tentativas de processamento de convite. Aguarde alguns minutos.",
});

/**
 * @swagger
 * /api/convites:
 *   post:
 *     summary: Enviar convite para participar de uma mesa
 *     description: >
 *       Envia um convite por email para outro usuário participar de uma mesa.
 *       Apenas o criador da mesa pode enviar convites.
 *       Se o convidado já é cadastrado, recebe email com botão para aceitar.
 *       Se não é cadastrado, recebe email com link para se registrar.
 *     tags: [Convites]
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
 *               - email_convidado
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 description: ID da mesa para convidar
 *                 example: 1
 *               email_convidado:
 *                 type: string
 *                 format: email
 *                 description: Email da pessoa a ser convidada
 *                 example: amigo@example.com
 *     responses:
 *       201:
 *         description: Convite enviado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Convite enviado com sucesso!
 *                 conviteId:
 *                   type: integer
 *                   example: 5
 *       400:
 *         description: Dados inválidos ou usuário já é membro
 *       403:
 *         description: Apenas o criador da mesa pode convidar
 *       404:
 *         description: Mesa não encontrada
 */
router.post("/", ConviteController.create);

/**
 * @swagger
 * /api/convites/pendentes:
 *   get:
 *     summary: Listar convites pendentes recebidos
 *     description: Retorna todos os convites pendentes recebidos pelo usuário logado, incluindo dados da mesa e do remetente
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de convites pendentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 convites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       mesa_id:
 *                         type: integer
 *                         example: 1
 *                       mesa_nome:
 *                         type: string
 *                         example: Minha Casa
 *                       convidado_por_nome:
 *                         type: string
 *                         example: José Silva
 *                       token:
 *                         type: string
 *                       status:
 *                         type: string
 *                         example: pendente
 *                       expira_em:
 *                         type: string
 *                         format: date-time
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Não autenticado
 */
router.get("/pendentes", ConviteController.listPendentes);

/**
 * @swagger
 * /api/convites/enviados:
 *   get:
 *     summary: Listar convites enviados
 *     description: Retorna todos os convites enviados pelo usuário logado, com status atual de cada um
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de convites enviados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 convites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       mesa_id:
 *                         type: integer
 *                       mesa_nome:
 *                         type: string
 *                       email_convidado:
 *                         type: string
 *                       status:
 *                         type: string
 *                         enum: [pendente, aceito, recusado, expirado]
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Não autenticado
 */
router.get("/enviados", ConviteController.listEnviados);

/**
 * @swagger
 * /api/convites/{token}/aceitar:
 *   post:
 *     summary: Aceitar um convite
 *     description: >
 *       Aceita um convite pelo token. O usuário logado é adicionado como membro da mesa
 *       com papel de "convidado". O convite só pode ser aceito pelo destinatário.
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token único do convite
 *         example: a1b2c3d4e5f6g7h8i9j0
 *     responses:
 *       200:
 *         description: Convite aceito com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Convite aceito! Você agora faz parte da mesa.
 *       400:
 *         description: Convite expirado ou já processado
 *       403:
 *         description: Convite não pertence ao usuário logado
 *       404:
 *         description: Convite não encontrado
 */
router.post("/:token/aceitar", conviteAcaoLimiter, ConviteController.aceitar);

/**
 * @swagger
 * /api/convites/{token}/recusar:
 *   post:
 *     summary: Recusar um convite
 *     description: Recusa um convite pelo token. O status é alterado para "recusado".
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token único do convite
 *         example: a1b2c3d4e5f6g7h8i9j0
 *     responses:
 *       200:
 *         description: Convite recusado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Convite recusado.
 *       400:
 *         description: Convite expirado ou já processado
 *       403:
 *         description: Convite não pertence ao usuário logado
 *       404:
 *         description: Convite não encontrado
 */
router.post("/:token/recusar", conviteAcaoLimiter, ConviteController.recusar);

module.exports = router;
