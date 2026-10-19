const express = require("express");
const CartaoController = require("../controllers/cartaoController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/cartoes:
 *   post:
 *     summary: Criar cartão
 *     description: Cadastra um novo cartão de crédito ou débito do usuário
 *     tags: [Cartões]
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
 *               - bandeira_id
 *             properties:
 *               nome:
 *                 type: string
 *                 description: Nome do cartão
 *                 example: Nubank Roxinho
 *               tipo:
 *                 type: string
 *                 enum: [credito, debito]
 *                 description: Tipo do cartão
 *                 example: credito
 *               bandeira_id:
 *                 type: integer
 *                 description: ID da bandeira
 *                 example: 2
 *               limite_real:
 *                 type: number
 *                 description: Limite real do cartão (do banco)
 *                 example: 5000
 *               limite_pessoal:
 *                 type: number
 *                 description: Limite pessoal (meta do usuário)
 *                 example: 3000
 *               dia_fechamento:
 *                 type: integer
 *                 description: Dia do fechamento da fatura (1-31)
 *                 example: 8
 *               dia_vencimento:
 *                 type: integer
 *                 description: Dia do vencimento da fatura (1-31)
 *                 example: 15
 *               cor:
 *                 type: string
 *                 description: Cor do cartão em hexadecimal
 *                 example: "#8B5CF6"
 *     responses:
 *       201:
 *         description: Cartão criado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post("/", CartaoController.create);

/**
 * @swagger
 * /api/cartoes:
 *   get:
 *     summary: Listar cartões do usuário
 *     description: Retorna todos os cartões cadastrados pelo usuário logado
 *     tags: [Cartões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: incluirInativas
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Incluir cartões inativos (opcional, padrão false)
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de cartões
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cartoes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       nome:
 *                         type: string
 *                         example: Nubank Roxinho
 *                       bandeira_id:
 *                         type: integer
 *                         example: 2
 *                       bandeira_nome:
 *                         type: string
 *                         example: Mastercard
 *                       tipo_pagamento_id:
 *                         type: integer
 *                         example: 1
 *                       tipo_pagamento_nome:
 *                         type: string
 *                         example: Cartão de Crédito
 *                       limite_real:
 *                         type: number
 *                         example: 5000
 *                       limite_pessoal:
 *                         type: number
 *                         example: 3000
 *                       dia_fechamento:
 *                         type: integer
 *                         example: 8
 *                       dia_vencimento:
 *                         type: integer
 *                         example: 15
 *                       cor:
 *                         type: string
 *                         example: "#8B5CF6"
 *                       ativa:
 *                         type: boolean
 *                         example: true
 *                       created_at:
 *                         type: string
 *                         format: date-time
 */
router.get("/", CartaoController.list);

/**
 * @swagger
 * /api/cartoes/limites:
 *   get:
 *     summary: Limite disponível e previsão por cartão de crédito
 *     description: |
 *       Para cada cartão de crédito ativo do usuário, retorna o limite já comprometido
 *       (parcelas e compras ainda não pagas, em todas as mesas), o limite disponível hoje
 *       e uma projeção mês a mês com o valor previsto de cada fatura e o limite que ficará
 *       livre após o pagamento dela.
 *     tags: [Cartões]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: meses
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *         description: Quantidade de meses da projeção (padrão 6)
 *         example: 6
 *       - in: query
 *         name: mes_inicial
 *         schema:
 *           type: string
 *         description: Mês inicial da projeção no formato YYYY-MM (padrão é o mês atual)
 *         example: 2026-10
 *     responses:
 *       200:
 *         description: Resumo de limites por cartão
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 limites:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cartao_id:
 *                         type: integer
 *                         example: 1
 *                       limite:
 *                         type: number
 *                         example: 5000
 *                       limite_comprometido:
 *                         type: number
 *                         example: 1800
 *                       limite_disponivel:
 *                         type: number
 *                         example: 3200
 *                       percentual_usado:
 *                         type: number
 *                         example: 36
 *                       faturas_atrasadas:
 *                         type: number
 *                         example: 0
 *                       fatura_mes_atual:
 *                         type: number
 *                         example: 600
 *                       projecao:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             mes:
 *                               type: string
 *                               example: 2026-11
 *                             fatura_prevista:
 *                               type: number
 *                               example: 600
 *                             fatura_em_aberto:
 *                               type: number
 *                               example: 600
 *                             limite_comprometido_apos_pagamento:
 *                               type: number
 *                               example: 600
 *                             limite_disponivel_apos_pagamento:
 *                               type: number
 *                               example: 4400
 *       400:
 *         description: Parâmetros inválidos
 */
router.get("/limites", CartaoController.limites);

/**
 * @swagger
 * /api/cartoes/{id}:
 *   get:
 *     summary: Buscar cartão específico
 *     description: Retorna detalhes de um cartão do usuário
 *     tags: [Cartões]
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
 *         description: Detalhes do cartão
 *       404:
 *         description: Cartão não encontrado
 */
router.get("/:id", CartaoController.show);

/**
 * @swagger
 * /api/cartoes/{id}:
 *   put:
 *     summary: Atualizar cartão
 *     description: Atualiza informações de um cartão do usuário
 *     tags: [Cartões]
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
 *               - bandeira_id
 *             properties:
 *               nome:
 *                 type: string
 *                 example: Nubank Roxinho
 *               tipo:
 *                 type: string
 *                 enum: [credito, debito]
 *                 example: credito
 *               bandeira_id:
 *                 type: integer
 *                 example: 2
 *               limite_real:
 *                 type: number
 *                 example: 6000
 *               limite_pessoal:
 *                 type: number
 *                 example: 4000
 *               dia_fechamento:
 *                 type: integer
 *                 example: 8
 *               dia_vencimento:
 *                 type: integer
 *                 example: 15
 *               cor:
 *                 type: string
 *                 example: "#8B5CF6"
 *     responses:
 *       200:
 *         description: Cartão atualizado
 */
router.put("/:id", CartaoController.update);

/**
 * @swagger
 * /api/cartoes/{id}/reativar:
 *   patch:
 *     summary: Reativar cartão
 *     description: Reativa um cartão que foi inativado
 *     tags: [Cartões]
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
 *         description: Cartão reativado com sucesso
 *       404:
 *         description: Cartão não encontrado
 */
router.patch("/:id/reativar", CartaoController.reativar);

/**
 * @swagger
 * /api/cartoes/{id}:
 *   delete:
 *     summary: Inativar cartão
 *     description: Inativa um cartão (soft delete - não remove do banco)
 *     tags: [Cartões]
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
 *         description: Cartão inativado com sucesso
 *       404:
 *         description: Cartão não encontrado
 */
router.delete("/:id", CartaoController.delete);

module.exports = router;
