const express = require("express");
const DespesaController = require("../controllers/despesaController");
const authMiddleware = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/despesas:
 *   post:
 *     summary: Criar despesa
 *     description: Cadastra uma nova despesa em uma mesa. Se parcelas > 1, cria automaticamente todas as parcelas.
 *     tags: [Despesas]
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
 *               - valor_provisionado
 *               - data_vencimento
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 description: ID da mesa
 *                 example: 2
 *               descricao:
 *                 type: string
 *                 description: Descrição da despesa
 *                 example: Notebook Dell
 *               valor_provisionado:
 *                 type: number
 *                 format: float
 *                 description: Valor total da despesa
 *                 example: 3000.00
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento (primeira parcela se parcelado)
 *                 example: 2026-03-10
 *               categoria_id:
 *                 type: integer
 *                 description: ID da categoria (opcional)
 *                 example: 1
 *               tipo_pagamento_id:
 *                 type: integer
 *                 description: ID do tipo de pagamento (opcional)
 *                 example: 1
 *               cartao_id:
 *                 type: integer
 *                 description: ID do cartão (obrigatório se tipo for Cartão)
 *                 example: 1
 *               recorrente:
 *                 type: boolean
 *                 description: Se a despesa é recorrente
 *                 example: false
 *               parcelas:
 *                 type: integer
 *                 description: Número de parcelas (divide automaticamente)
 *                 example: 3
 *     responses:
 *       201:
 *         description: Despesa(s) criada(s) com sucesso
 *       400:
 *         description: Dados inválidos
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.post("/", DespesaController.create);

/**
 * @swagger
 * /api/despesas:
 *   get:
 *     summary: Listar despesas de uma mesa
 *     description: Retorna todas as despesas de uma mesa específica
 *     tags: [Despesas]
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
 *       - in: query
 *         name: incluirInativas
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Incluir despesas inativas (opcional, padrão false)
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de despesas
 */
router.get("/", DespesaController.list);

/**
 * @swagger
 * /api/despesas/{id}:
 *   get:
 *     summary: Buscar despesa específica
 *     description: Retorna detalhes de uma despesa
 *     tags: [Despesas]
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
 *         description: Detalhes da despesa
 *       404:
 *         description: Despesa não encontrada
 */
router.get("/:id", DespesaController.show);

/**
 * @swagger
 * /api/despesas/grupo/{parcela_grupo_id}:
 *   get:
 *     summary: Buscar todas as parcelas de um grupo
 *     description: Retorna todas as parcelas vinculadas a um parcela_grupo_id
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parcela_grupo_id
 *         required: true
 *         schema:
 *           type: string
 *         description: UUID do grupo de parcelas
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Lista de parcelas do grupo
 */
router.get("/grupo/:parcela_grupo_id", DespesaController.getByParcelaGrupo);

/**
 * @swagger
 * /api/despesas/{id}:
 *   put:
 *     summary: Atualizar despesa
 *     description: Atualiza informações de uma despesa (não altera parcelamento)
 *     tags: [Despesas]
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
 *               - valor_provisionado
 *               - data_vencimento
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               descricao:
 *                 type: string
 *                 example: Conta de Luz (Atualizada)
 *               valor_provisionado:
 *                 type: number
 *                 example: 160.00
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 example: 2026-02-15
 *               categoria_id:
 *                 type: integer
 *                 example: 1
 *               tipo_pagamento_id:
 *                 type: integer
 *                 example: 1
 *               cartao_id:
 *                 type: integer
 *                 example: 1
 *               recorrente:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Despesa atualizada
 */
router.put("/:id", DespesaController.update);

/**
 * @swagger
 * /api/despesas/{id}/pagar:
 *   patch:
 *     summary: Marcar despesa como paga
 *     description: Marca uma despesa como paga, com opção de upload de comprovante
 *     tags: [Despesas]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - mesa_id
 *               - data_pagamento
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               valor_real:
 *                 type: number
 *                 example: 148.50
 *               data_pagamento:
 *                 type: string
 *                 format: date
 *                 example: 2026-02-14
 *               comprovante:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Despesa marcada como paga
 */
router.patch(
   "/:id/pagar",
   upload.single("comprovante"),
   DespesaController.marcarComoPaga,
);

/**
 * @swagger
 * /api/despesas/{id}/reativar:
 *   patch:
 *     summary: Reativar despesa
 *     description: Reativa uma despesa que foi inativada
 *     tags: [Despesas]
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
 *         description: Despesa reativada com sucesso
 */
router.patch("/:id/reativar", DespesaController.reativar);

/**
 * @swagger
 * /api/despesas/grupo/{parcela_grupo_id}/inativar:
 *   patch:
 *     summary: Inativar todas as parcelas de um grupo
 *     description: Inativa todas as despesas vinculadas a um parcela_grupo_id
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: parcela_grupo_id
 *         required: true
 *         schema:
 *           type: string
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *     responses:
 *       200:
 *         description: Todas as parcelas foram inativadas
 */
router.patch(
   "/grupo/:parcela_grupo_id/inativar",
   DespesaController.inativarGrupo,
);

/**
 * @swagger
 * /api/despesas/{id}/comprovante:
 *   post:
 *     summary: Upload/Atualizar comprovante
 *     description: Faz upload ou substitui o comprovante de uma despesa
 *     tags: [Despesas]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - mesa_id
 *               - comprovante
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               comprovante:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Comprovante atualizado
 */
router.post(
   "/:id/comprovante",
   upload.single("comprovante"),
   DespesaController.uploadComprovante,
);

/**
 * @swagger
 * /api/despesas/{id}/comprovante/download:
 *   get:
 *     summary: Visualizar/Baixar comprovante
 *     description: Retorna o arquivo de imagem do comprovante
 *     tags: [Despesas]
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
 *         description: Arquivo do comprovante
 */
router.get("/:id/comprovante/download", DespesaController.getComprovante);

/**
 * @swagger
 * /api/despesas/{id}/comprovante:
 *   delete:
 *     summary: Excluir comprovante
 *     description: Remove o comprovante de uma despesa
 *     tags: [Despesas]
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
 *         description: Comprovante excluído
 */
router.delete("/:id/comprovante", DespesaController.deleteComprovante);

/**
 * @swagger
 * /api/despesas/{id}:
 *   delete:
 *     summary: Inativar despesa
 *     description: Inativa uma despesa (soft delete)
 *     tags: [Despesas]
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
 *         description: Despesa inativada com sucesso
 */
router.delete("/:id", DespesaController.inativar);

module.exports = router;
