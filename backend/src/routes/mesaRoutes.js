const express = require("express");
const MesaController = require("../controllers/mesaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/mesas:
 *   post:
 *     summary: Criar nova mesa
 *     description: Cria uma nova mesa de controle financeiro (limite de 2 mesas no plano free)
 *     tags: [Mesas]
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
 *                 description: Nome da mesa
 *                 example: Minha Casa
 *     responses:
 *       201:
 *         description: Mesa criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mesa criada com sucesso!
 *                 mesaId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Limite de mesas atingido ou dados inválidos
 *       401:
 *         description: Não autenticado
 */
router.post("/", MesaController.create);

/**
 * @swagger
 * /api/mesas:
 *   get:
 *     summary: Listar mesas do usuário
 *     description: Retorna todas as mesas que o usuário criou ou foi convidado
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de mesas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 mesas:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: Minha Casa
 *                       criador_id:
 *                         type: integer
 *                         example: 1
 *                       criador_nome:
 *                         type: string
 *                         example: José Silva
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2026-02-20T14:21:39.000Z
 */
router.get("/", MesaController.list);

/**
 * @swagger
 * /api/mesas/{id}:
 *   get:
 *     summary: Buscar mesa específica
 *     description: Retorna detalhes de uma mesa específica
 *     tags: [Mesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da mesa
 *         example: 1
 *     responses:
 *       200:
 *         description: Detalhes da mesa
 *       404:
 *         description: Mesa não encontrada
 */
router.get("/:id", MesaController.show);

/**
 * @swagger
 * /api/mesas/{id}:
 *   put:
 *     summary: Atualizar mesa
 *     description: Atualiza o nome da mesa (apenas criador pode editar)
 *     tags: [Mesas]
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
 *                 example: Casa Renovada
 *     responses:
 *       200:
 *         description: Mesa atualizada
 *       403:
 *         description: Apenas o criador pode editar
 */
router.put("/:id", MesaController.update);

/**
 * @swagger
 * /api/mesas/{id}:
 *   delete:
 *     summary: Deletar mesa
 *     description: Deleta uma mesa (apenas criador pode deletar)
 *     tags: [Mesas]
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
 *         description: Mesa deletada
 *       403:
 *         description: Apenas o criador pode deletar
 */
router.delete("/:id", MesaController.delete);

module.exports = router;
