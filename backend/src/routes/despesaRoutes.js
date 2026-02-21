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
 *     description: Cadastra uma nova despesa em uma mesa
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
 *                 example: Conta de Luz
 *               valor_provisionado:
 *                 type: number
 *                 format: float
 *                 description: Valor estimado da despesa
 *                 example: 150.00
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 description: Data de vencimento
 *                 example: 2026-02-15
 *               categoria_id:
 *                 type: integer
 *                 description: ID da categoria (opcional)
 *                 example: 1
 *               forma_pagamento_id:
 *                 type: integer
 *                 description: ID da forma de pagamento (opcional)
 *                 example: 1
 *               cartao_id:
 *                 type: integer
 *                 description: ID do cartão (opcional)
 *                 example: 1
 *               recorrente:
 *                 type: boolean
 *                 description: Se a despesa é recorrente
 *                 example: true
 *               parcelas:
 *                 type: integer
 *                 description: Número de parcelas (opcional)
 *                 example: 3
 *               parcela_atual:
 *                 type: integer
 *                 description: Parcela atual (opcional)
 *                 example: 1
 *     responses:
 *       201:
 *         description: Despesa criada com sucesso
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
 *     responses:
 *       200:
 *         description: Lista de despesas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 despesas:
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
 *                         example: Conta de Luz
 *                       valor_provisionado:
 *                         type: number
 *                         example: 150.00
 *                       valor_real:
 *                         type: number
 *                         example: 148.50
 *                       data_vencimento:
 *                         type: string
 *                         format: date
 *                       paga:
 *                         type: boolean
 *                         example: true
 *                       data_pagamento:
 *                         type: string
 *                         format: date
 *                       comprovante:
 *                         type: string
 *                         example: c1c3702d204b0a7b16cd7a709e681cff.jpeg
 *                       categoria_nome:
 *                         type: string
 *                         example: Alimentação
 *                       forma_pagamento_nome:
 *                         type: string
 *                         example: PIX
 *                       cartao_nome:
 *                         type: string
 *                         example: Nubank Roxinho
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
 * /api/despesas/{id}:
 *   put:
 *     summary: Atualizar despesa
 *     description: Atualiza informações de uma despesa
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
 *               forma_pagamento_id:
 *                 type: integer
 *                 example: 1
 *               cartao_id:
 *                 type: integer
 *                 example: 1
 *               recorrente:
 *                 type: boolean
 *                 example: true
 *               parcelas:
 *                 type: integer
 *                 example: 3
 *               parcela_atual:
 *                 type: integer
 *                 example: 1
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
 *         description: ID da despesa
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
 *                 description: ID da mesa
 *                 example: 2
 *               valor_real:
 *                 type: number
 *                 format: float
 *                 description: Valor real pago (se diferente do provisionado)
 *                 example: 148.50
 *               data_pagamento:
 *                 type: string
 *                 format: date
 *                 description: Data do pagamento
 *                 example: 2026-02-14
 *               comprovante:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem do comprovante (opcional)
 *     responses:
 *       200:
 *         description: Despesa marcada como paga
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Despesa marcada como paga!
 *                 comprovante:
 *                   type: string
 *                   example: c1c3702d204b0a7b16cd7a709e681cff.jpeg
 */
router.patch(
   "/:id/pagar",
   upload.single("comprovante"),
   DespesaController.marcarComoPaga,
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
 *                 description: ID da mesa
 *                 example: 2
 *               comprovante:
 *                 type: string
 *                 format: binary
 *                 description: Arquivo de imagem do comprovante
 *     responses:
 *       200:
 *         description: Comprovante atualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Comprovante atualizado com sucesso!
 *                 comprovante:
 *                   type: string
 *                   example: a1b2c3d4e5f6g7h8.jpeg
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
 *         content:
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Comprovante não encontrado
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
 *     summary: Deletar despesa
 *     description: Remove uma despesa e seu comprovante (se houver)
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
 *         description: Despesa deletada
 */
router.delete("/:id", DespesaController.delete);

module.exports = router;
