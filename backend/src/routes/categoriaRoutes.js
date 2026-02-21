const express = require("express");
const CategoriaController = require("../controllers/categoriaController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/categorias:
 *   post:
 *     summary: Criar categoria
 *     description: Cria uma nova categoria de receita ou despesa
 *     tags: [Categorias]
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
 *               - tipo
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome da categoria
 *                 example: Alimentação
 *               tipo:
 *                 type: string
 *                 enum: [receita, despesa]
 *                 description: Tipo da categoria
 *                 example: despesa
 *     responses:
 *       201:
 *         description: Categoria criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Categoria criada com sucesso!
 *                 categoriaId:
 *                   type: integer
 *                   example: 1
 *       400:
 *         description: Dados inválidos
 */
router.post("/", CategoriaController.create);

/**
 * @swagger
 * /api/categorias:
 *   get:
 *     summary: Listar categorias
 *     description: Lista todas as categorias, com opção de filtrar por tipo
 *     tags: [Categorias]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [receita, despesa]
 *         description: Filtrar por tipo (opcional)
 *         example: despesa
 *     responses:
 *       200:
 *         description: Lista de categorias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categorias:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: Alimentação
 *                       tipo:
 *                         type: string
 *                         example: despesa
 *                       created_at:
 *                         type: string
 *                         format: date-time
 */
router.get("/", CategoriaController.list);

/**
 * @swagger
 * /api/categorias/{id}:
 *   get:
 *     summary: Buscar categoria específica
 *     description: Retorna detalhes de uma categoria
 *     tags: [Categorias]
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
 *         description: Detalhes da categoria
 *       404:
 *         description: Categoria não encontrada
 */
router.get("/:id", CategoriaController.show);

/**
 * @swagger
 * /api/categorias/{id}:
 *   put:
 *     summary: Atualizar categoria
 *     description: Atualiza nome e/ou tipo da categoria
 *     tags: [Categorias]
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
 *               - tipo
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Alimentação
 *               tipo:
 *                 type: string
 *                 enum: [receita, despesa]
 *                 example: despesa
 *     responses:
 *       200:
 *         description: Categoria atualizada
 */
router.put("/:id", CategoriaController.update);

/**
 * @swagger
 * /api/categorias/{id}:
 *   delete:
 *     summary: Deletar categoria
 *     description: Remove uma categoria do sistema
 *     tags: [Categorias]
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
 *         description: Categoria deletada
 */
router.delete("/:id", CategoriaController.delete);

module.exports = router;
