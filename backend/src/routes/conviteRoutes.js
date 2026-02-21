const express = require("express");
const ConviteController = require("../controllers/conviteController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/convites:
 *   post:
 *     summary: Criar convite
 *     description: Envia um convite para outro usuário participar de uma mesa (apenas criador pode convidar)
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
 *                 description: ID da mesa
 *                 example: 2
 *               email_convidado:
 *                 type: string
 *                 format: email
 *                 description: Email do usuário a ser convidado
 *                 example: maria@example.com
 *     responses:
 *       201:
 *         description: Convite criado e email enviado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Convite enviado! O usuário receberá uma notificação e um email.
 *                 conviteId:
 *                   type: integer
 *                   example: 1
 *                 usuarioCadastrado:
 *                   type: boolean
 *                   example: true
 *       400:
 *         description: Dados inválidos ou convite já existe
 *       403:
 *         description: Apenas o criador pode enviar convites
 */
router.post("/", ConviteController.create);

/**
 * @swagger
 * /api/convites/pendentes:
 *   get:
 *     summary: Listar convites pendentes recebidos
 *     description: Retorna todos os convites pendentes para o usuário logado
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
 *                         example: 1
 *                       mesa_id:
 *                         type: integer
 *                         example: 2
 *                       mesa_nome:
 *                         type: string
 *                         example: Minha Casa
 *                       email_convidado:
 *                         type: string
 *                         example: maria@example.com
 *                       convidado_por:
 *                         type: integer
 *                         example: 1
 *                       convidado_por_nome:
 *                         type: string
 *                         example: José Silva
 *                       status:
 *                         type: string
 *                         example: pendente
 *                       token:
 *                         type: string
 *                       expira_em:
 *                         type: string
 *                         format: date-time
 */
router.get("/pendentes", ConviteController.listPendentes);

/**
 * @swagger
 * /api/convites/enviados:
 *   get:
 *     summary: Listar convites enviados
 *     description: Retorna todos os convites enviados pelo usuário logado
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de convites enviados
 */
router.get("/enviados", ConviteController.listEnviados);

/**
 * @swagger
 * /api/convites/{token}/aceitar:
 *   post:
 *     summary: Aceitar convite
 *     description: Aceita um convite para participar de uma mesa (limite de 2 mesas compartilhadas no plano free)
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token do convite
 *         example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
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
 *                   example: Convite aceito com sucesso!
 *       400:
 *         description: Convite inválido, expirado ou limite atingido
 *       403:
 *         description: Convite não enviado para você
 */
router.post("/:token/aceitar", ConviteController.aceitar);

/**
 * @swagger
 * /api/convites/{token}/recusar:
 *   post:
 *     summary: Recusar convite
 *     description: Recusa um convite para participar de uma mesa
 *     tags: [Convites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token do convite
 *         example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
 *     responses:
 *       200:
 *         description: Convite recusado
 *       400:
 *         description: Convite inválido ou já processado
 */
router.post("/:token/recusar", ConviteController.recusar);

module.exports = router;
