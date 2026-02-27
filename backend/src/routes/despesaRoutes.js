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
 *                 example: 2
 *               descricao:
 *                 type: string
 *                 example: Notebook Dell
 *               tipo:
 *                 type: string
 *                 enum: [variavel, fixa, assinatura]
 *                 example: variavel
 *               valor_provisionado:
 *                 type: number
 *                 example: 3000.00
 *               data_vencimento:
 *                 type: string
 *                 format: date
 *                 example: 2026-03-10
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
 *                 example: false
 *               parcelas:
 *                 type: integer
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
 *     description: Retorna despesas filtradas por mês. Despesas recorrentes aparecem em todos os meses a partir da criação.
 *     tags: [Despesas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 2
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Mês no formato YYYY-MM (padrão = mês atual)
 *         example: 2026-03
 *     responses:
 *       200:
 *         description: Lista de despesas
 */
router.get("/", DespesaController.list);

// ──────────────────────────────────────────────────────────────────────────────
// ATENÇÃO: rotas específicas com sufixo DEVEM vir ANTES de /:id
// para o Express não confundir o sufixo com o parâmetro id
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/despesas/grupo/{parcela_grupo_id}:
 *   get:
 *     summary: Buscar todas as parcelas de um grupo
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
 *         description: Lista de parcelas do grupo
 */
router.get("/grupo/:parcela_grupo_id", DespesaController.getByParcelaGrupo);

/**
 * @swagger
 * /api/despesas/grupo/{parcela_grupo_id}/inativar:
 *   patch:
 *     summary: Inativar todas as parcelas de um grupo
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

// ──────────────────────────────────────────────────────────────────────────────
// Rotas com /:id — específicas com sufixo ANTES da genérica /:id
// ──────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/despesas/{id}:
 *   get:
 *     summary: Buscar despesa específica
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
 *               tipo:
 *                 type: string
 *                 enum: [variavel, fixa, assinatura]
 *                 example: fixa
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
 *     description: Marca uma despesa como paga com valor real e comprovante opcional
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
 * /api/despesas/{id}/desfazer-pagamento:
 *   patch:
 *     summary: Desfazer pagamento de uma despesa
 *     description: Remove o pagamento, valor real e comprovante, retornando a despesa ao status anterior
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
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Pagamento desfeito com sucesso
 *       400:
 *         description: Despesa não está marcada como paga
 *       404:
 *         description: Despesa não encontrada
 */
router.patch("/:id/desfazer-pagamento", DespesaController.desmarcarPagamento);

/**
 * @swagger
 * /api/despesas/{id}/cancelar-recorrencia:
 *   patch:
 *     summary: Cancelar recorrência a partir de um mês
 *     description: Define data_cancelamento para que a despesa fixa/assinatura pare de aparecer a partir do mês informado (inclusive)
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
 *               - mes
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               mes:
 *                 type: string
 *                 description: Mês a partir do qual a recorrência para (YYYY-MM)
 *                 example: "2026-08"
 *     responses:
 *       200:
 *         description: Recorrência cancelada com sucesso
 *       400:
 *         description: Despesa não é recorrente ou mês inválido
 */
router.patch(
   "/:id/cancelar-recorrencia",
   DespesaController.cancelarRecorrencia,
);

/**
 * @swagger
 * /api/despesas/{id}/remover-cancelamento:
 *   patch:
 *     summary: Remover cancelamento de recorrência
 *     description: Remove a data_cancelamento fazendo a despesa voltar a aparecer em todos os meses
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
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       200:
 *         description: Cancelamento removido com sucesso
 */
router.patch(
   "/:id/remover-cancelamento",
   DespesaController.removerCancelamento,
);

/**
 * @swagger
 * /api/despesas/{id}/reativar:
 *   patch:
 *     summary: Reativar despesa inativada
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
 * /api/despesas/{id}/comprovante:
 *   post:
 *     summary: Upload/Atualizar comprovante
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
 *     summary: Inativar despesa (soft delete)
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
