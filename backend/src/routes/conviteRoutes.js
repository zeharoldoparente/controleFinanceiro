const express = require("express");
const router = express.Router();
const ConviteController = require("../controllers/conviteController");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

/**
 * @swagger
 * /api/convites:
 *   post:
 *     summary: Enviar convite para participar de uma mesa
 *     tags: [Convites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [mesa_id, email_convidado]
 *             properties:
 *               mesa_id:
 *                 type: integer
 *               email_convidado:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Convite enviado com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Apenas o criador da mesa pode convidar
 */
router.post("/", ConviteController.create);

/**
 * @swagger
 * /api/convites/pendentes:
 *   get:
 *     summary: Listar convites pendentes recebidos pelo usuário logado
 *     tags: [Convites]
 *     responses:
 *       200:
 *         description: Lista de convites pendentes
 */
router.get("/pendentes", ConviteController.listPendentes);

/**
 * @swagger
 * /api/convites/enviados:
 *   get:
 *     summary: Listar convites enviados pelo usuário logado
 *     tags: [Convites]
 *     responses:
 *       200:
 *         description: Lista de convites enviados
 */
router.get("/enviados", ConviteController.listEnviados);

/**
 * @swagger
 * /api/convites/{token}/aceitar:
 *   post:
 *     summary: Aceitar um convite pelo token
 *     tags: [Convites]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Convite aceito com sucesso
 *       400:
 *         description: Convite expirado ou já processado
 *       403:
 *         description: Convite não pertence ao usuário logado
 */
router.post("/:token/aceitar", ConviteController.aceitar);

/**
 * @swagger
 * /api/convites/{token}/recusar:
 *   post:
 *     summary: Recusar um convite pelo token
 *     tags: [Convites]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Convite recusado
 */
router.post("/:token/recusar", ConviteController.recusar);

module.exports = router;
