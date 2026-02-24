const express = require("express");
const BandeiraController = require("../controllers/bandeiraController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/bandeiras:
 *   post:
 *     summary: Criar bandeira
 *     description: Cria uma nova bandeira de cartão
 *     tags: [Bandeiras]
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
 *                 example: Visa
 *     responses:
 *       201:
 *         description: Bandeira criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/", BandeiraController.create);

/**
 * @swagger
 * /api/bandeiras:
 *   get:
 *     summary: Listar bandeiras
 *     description: Lista todas as bandeiras cadastradas
 *     tags: [Bandeiras]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: incluirInativas
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Incluir bandeiras inativas (opcional, padrão false)
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de bandeiras
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 bandeiras:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: Visa
 *                       ativa:
 *                         type: boolean
 *                         example: true
 */
router.get("/", BandeiraController.list);

/**
 * @swagger
 * /api/bandeiras/{id}:
 *   get:
 *     summary: Buscar bandeira específica
 *     description: Retorna detalhes de uma bandeira
 *     tags: [Bandeiras]
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
 *         description: Detalhes da bandeira
 *       404:
 *         description: Bandeira não encontrada
 */
router.get("/:id", BandeiraController.show);

/**
 * @swagger
 * /api/bandeiras/{id}:
 *   put:
 *     summary: Atualizar bandeira
 *     description: Atualiza o nome da bandeira
 *     tags: [Bandeiras]
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
 *                 example: Visa Platinum
 *     responses:
 *       200:
 *         description: Bandeira atualizada
 */
router.put("/:id", BandeiraController.update);

/**
 * @swagger
 * /api/bandeiras/{id}/reativar:
 *   patch:
 *     summary: Reativar bandeira
 *     description: Reativa uma bandeira que foi inativada
 *     tags: [Bandeiras]
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
 *         description: Bandeira reativada com sucesso
 *       404:
 *         description: Bandeira não encontrada
 */
router.patch("/:id/reativar", BandeiraController.reativar);

/**
 * @swagger
 * /api/bandeiras/{id}:
 *   delete:
 *     summary: Inativar bandeira
 *     description: Inativa uma bandeira (soft delete)
 *     tags: [Bandeiras]
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
 *         description: Bandeira inativada com sucesso
 *       404:
 *         description: Bandeira não encontrada
 */
router.delete("/:id", BandeiraController.delete);

module.exports = router;
