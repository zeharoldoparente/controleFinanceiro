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
 *     description: Cadastra uma nova receita em uma mesa. Se parcelas > 1, cria N lançamentos com mesmo grupo_parcela (mês a mês). Recorrente não pode ter parcelas.
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
 *                 description: Valor provisionado (estimado) da receita
 *                 example: 5000.00
 *               data_recebimento:
 *                 type: string
 *                 format: date
 *                 description: Data de recebimento (ou data da 1ª parcela)
 *                 example: 2026-02-05
 *               categoria_id:
 *                 type: integer
 *                 description: ID da categoria (opcional)
 *                 example: 2
 *               tipo_pagamento_id:
 *                 type: integer
 *                 description: ID do tipo de pagamento (opcional)
 *                 example: 3
 *               recorrente:
 *                 type: boolean
 *                 description: Se a receita é recorrente (se repete todo mês). Incompatível com parcelas > 1.
 *                 example: false
 *               parcelas:
 *                 type: integer
 *                 description: Número de parcelas (1 a 60). Só válido se recorrente = false. Cria N lançamentos mês a mês.
 *                 example: 4
 *     responses:
 *       201:
 *         description: Receita(s) criada(s) com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 4 receita(s) criada(s) com sucesso!
 *                 ids:
 *                   type: array
 *                   items:
 *                     type: integer
 *                   example: [10, 11, 12, 13]
 *                 receitaId:
 *                   type: integer
 *                   description: ID do primeiro lançamento criado
 *                   example: 10
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
 *     description: >
 *       Retorna as receitas do mês informado com suporte a recorrentes.
 *       Receitas normais aparecem só no mês da data_recebimento.
 *       Receitas recorrentes aparecem a partir do mês de criação (sem confirmação já criada para o mês).
 *       Confirmações de recorrentes (origem_recorrente_id preenchido) aparecem no mês do mes_referencia.
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
 *       - in: query
 *         name: mes
 *         schema:
 *           type: string
 *         description: Mês no formato YYYY-MM (padrão é o mês atual)
 *         example: 2026-03
 *     responses:
 *       200:
 *         description: Lista de receitas do mês
 *       400:
 *         description: ID da mesa não informado
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
 *     description: Atualiza informações de uma receita. Não permite alterar parcelas nem status de confirmação.
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
 *               tipo_pagamento_id:
 *                 type: integer
 *                 example: 3
 *               recorrente:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Receita atualizada com sucesso
 *       404:
 *         description: Receita não encontrada
 */
router.put("/:id", ReceitaController.update);

/**
 * @swagger
 * /api/receitas/{id}/confirmar:
 *   patch:
 *     summary: Confirmar recebimento
 *     description: >
 *       Confirma o recebimento de uma receita com o valor efetivamente recebido.
 *       Para receitas NORMAIS: atualiza status para 'recebida' e registra valor_real e data_confirmacao.
 *       Para receitas RECORRENTES: cria um registro filho (confirmação do mês) com status='recebida',
 *       mantendo a recorrente original intacta para os próximos meses.
 *       O valor_real é opcional — se omitido, usa o valor provisionado.
 *       Apenas o valor confirmado (valor_real) é contabilizado no saldo.
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
 *               - mes
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 description: ID da mesa
 *                 example: 2
 *               mes:
 *                 type: string
 *                 description: Mês de referência no formato YYYY-MM
 *                 example: 2026-03
 *               valor_real:
 *                 type: number
 *                 format: float
 *                 description: Valor efetivamente recebido (opcional, padrão = valor provisionado)
 *                 example: 4850.00
 *     responses:
 *       200:
 *         description: Recebimento confirmado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Recebimento confirmado com sucesso!
 *                 tipo:
 *                   type: string
 *                   enum: [normal, recorrente]
 *                   description: Tipo de confirmação realizada
 *                 novoId:
 *                   type: integer
 *                   description: ID do registro filho criado (apenas para recorrentes)
 *                   example: 25
 *       400:
 *         description: Dados inválidos ou mesa_id/mes ausentes
 *       403:
 *         description: Sem acesso a esta mesa
 *       404:
 *         description: Receita não encontrada
 *       409:
 *         description: Recebimento já confirmado para este mês
 */
router.patch("/:id/confirmar", ReceitaController.confirmar);

/**
 * @swagger
 * /api/receitas/{id}/desfazer-confirmacao:
 *   patch:
 *     summary: Desfazer confirmação de recebimento
 *     description: >
 *       Reverte a confirmação de recebimento de uma receita.
 *       Para receitas NORMAIS confirmadas: reverte status para 'a_receber' e limpa valor_real e data_confirmacao.
 *       Para CONFIRMAÇÕES de recorrentes (origem_recorrente_id preenchido): remove o registro filho,
 *       fazendo a recorrente original voltar a aparecer como 'a_receber' no mês.
 *     tags: [Receitas]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 25
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
 *                 description: ID da mesa
 *                 example: 2
 *     responses:
 *       200:
 *         description: Confirmação desfeita com sucesso
 *       400:
 *         description: Receita não está confirmada ou mesa_id ausente
 *       403:
 *         description: Sem acesso a esta mesa
 *       404:
 *         description: Receita não encontrada
 */
router.patch(
   "/:id/desfazer-confirmacao",
   ReceitaController.desfazerConfirmacao,
);

/**
 * @swagger
 * /api/receitas/{id}/reativar:
 *   patch:
 *     summary: Reativar receita
 *     description: Reativa uma receita que foi inativada (soft delete)
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
 *         description: Receita reativada com sucesso
 *       404:
 *         description: Receita não encontrada
 */
router.patch("/:id/reativar", ReceitaController.reativar);

/**
 * @swagger
 * /api/receitas/{id}:
 *   delete:
 *     summary: Inativar receita
 *     description: Inativa uma receita (soft delete). Para remover permanentemente use o endpoint de delete físico.
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
 *         description: Receita inativada com sucesso
 *       404:
 *         description: Receita não encontrada
 */
router.delete("/:id", ReceitaController.inativar);

module.exports = router;
