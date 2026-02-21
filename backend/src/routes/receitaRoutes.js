const express = require("express");
const ReceitaController = require("../controllers/receitaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/receitas:
 *   post:
 *     summary: Criar receita
 *     description: Cadastra uma nova receita em uma mesa
 *     tags: [Receitas]
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
 *               - descricao
 *               - valor
 *               - data_recebimento
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 description: ID da mesa
 *                 example: 2
 *               descricao:
 *                 type: string
 *                 description: Descrição da receita
 *                 example: Salário de Fevereiro
 *               valor:
 *                 type: number
 *                 format: float
 *                 description: Valor da receita
 *                 example: 5000.00
 *               data_recebimento:
 *                 type: string
 *                 format: date
 *                 description: Data de recebimento
 *                 example: 2026-02-05
 *               categoria_id:
 *                 type: integer
 *                 description: ID da categoria (opcional)
 *                 example: 2
 *     responses:
 *       201:
 *         description: Receita criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Receita criada com sucesso!
 *                 receitaId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.post("/", ReceitaController.create);

/**
 * @swagger
 * /api/receitas:
 *   get:
 *     summary: Listar receitas de uma mesa
 *     description: Retorna todas as receitas de uma mesa específica
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da mesa
 *         example: 2
 *     responses:
 *       200:
 *         description: Lista de receitas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 receitas:
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
 *                       descricao:
 *                         type: string
 *                         example: Salário de Fevereiro
 *                       valor:
 *                         type: number
 *                         example: 5000.00
 *                       data_recebimento:
 *                         type: string
 *                         format: date
 *                         example: 2026-02-05
 *                       categoria_id:
 *                         type: integer
 *                         example: 2
 *                       categoria_nome:
 *                         type: string
 *                         example: Salário
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: ID da mesa não fornecido
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.get("/", ReceitaController.list);

/**
 * @swagger
 * /api/receitas/{id}:
 *   get:
 *     summary: Buscar receita específica
 *     description: Retorna detalhes de uma receita
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Detalhes da receita
 *       404:
 *         description: Receita não encontrada
 */
router.get("/:id", ReceitaController.show);

/**
 * @swagger
 * /api/receitas/{id}:
 *   put:
 *     summary: Atualizar receita
 *     description: Atualiza informações de uma receita
 *     tags: [Receitas]
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
 *               - mesa_id
 *               - descricao
 *               - valor
 *               - data_recebimento
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               descricao:
 *                 type: string
 *                 example: Salário de Fevereiro (Atualizado)
 *               valor:
 *                 type: number
 *                 example: 5500.00
 *               data_recebimento:
 *                 type: string
 *                 format: date
 *                 example: 2026-02-05
 *               categoria_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Receita atualizada
 */
router.put("/:id", ReceitaController.update);

/**
 * @swagger
 * /api/receitas/{id}:
 *   delete:
 *     summary: Deletar receita
 *     description: Remove uma receita
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Receita deletada
 */
router.delete("/:id", ReceitaController.delete);

module.exports = router;
