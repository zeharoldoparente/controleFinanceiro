const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const IAnController = require("../controllers/ianController");

const router = express.Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/ian/plano-ativo:
 *   get:
 *     summary: Buscar plano ativo do IAn
 *     description: Retorna o plano ativo do IAn para a mesa informada junto com o acompanhamento atual.
 *     tags: [IAn]
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
 *         description: Plano ativo e acompanhamento atual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plano_ativo:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 4
 *                     mesa_id:
 *                       type: integer
 *                       example: 2
 *                     estrategia_id:
 *                       type: string
 *                       example: equilibrada
 *                     objetivo_descricao:
 *                       type: string
 *                       example: Montar uma reserva de emergencia
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                     plano:
 *                       type: object
 *                 acompanhamento:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     status_geral:
 *                       type: string
 *                       example: no_rumo
 *                     resumo:
 *                       type: string
 *                       example: Seu comportamento esta alinhado com a estrategia ativa.
 *                     indicadores:
 *                       type: object
 *                     categorias_em_alerta:
 *                       type: array
 *                       items:
 *                         type: object
 *                     alertas:
 *                       type: object
 *       400:
 *         description: Mesa nao informada
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.get("/plano-ativo", IAnController.getPlanoAtivo);

/**
 * @swagger
 * /api/ian/plano:
 *   post:
 *     summary: Gerar plano inteligente do IAn
 *     description: Analisa o historico financeiro do usuario e monta um plano com diagnostico, sinais e estrategias.
 *     tags: [IAn]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - objetivo
 *             properties:
 *               objetivo:
 *                 type: string
 *                 description: Objetivo financeiro que o IAn deve trabalhar
 *                 example: Quero juntar dinheiro para minha reserva de emergencia
 *               valor_objetivo:
 *                 type: number
 *                 format: float
 *                 description: Valor alvo opcional
 *                 example: 10000
 *               prazo_final:
 *                 type: string
 *                 format: date
 *                 description: Data limite opcional para a meta
 *                 example: 2026-12-31
 *               mesa_id:
 *                 type: integer
 *                 description: Mesa especifica para a analise. Se omitida, o IAn considera as mesas acessiveis.
 *                 example: 2
 *     responses:
 *       200:
 *         description: Plano gerado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 objetivo:
 *                   type: object
 *                 diagnostico:
 *                   type: object
 *                 sinais:
 *                   type: array
 *                   items:
 *                     type: string
 *                 estrategias:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Dados insuficientes para gerar o plano
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.post("/plano", IAnController.gerarPlano);

/**
 * @swagger
 * /api/ian/ativar:
 *   post:
 *     summary: Ativar acompanhamento do IAn
 *     description: Salva a estrategia escolhida como plano ativo do IAn para a mesa informada.
 *     tags: [IAn]
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
 *               - estrategia_id
 *               - plano
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               estrategia_id:
 *                 type: string
 *                 description: ID da estrategia escolhida no plano gerado
 *                 example: equilibrada
 *               plano:
 *                 type: object
 *                 description: Plano completo retornado por /api/ian/plano
 *                 properties:
 *                   objetivo:
 *                     type: object
 *                     properties:
 *                       descricao:
 *                         type: string
 *                         example: Montar uma reserva de emergencia
 *                   estrategias:
 *                     type: array
 *                     items:
 *                       type: object
 *     responses:
 *       200:
 *         description: Plano ativado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 plano_ativo:
 *                   type: object
 *                 acompanhamento:
 *                   type: object
 *       400:
 *         description: Dados insuficientes ou estrategia inexistente
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.post("/ativar", IAnController.salvarPlanoAtivo);

/**
 * @swagger
 * /api/ian/registro-mensal:
 *   post:
 *     summary: Registrar evolucao mensal da meta do IAn
 *     description: Salva ou atualiza o fechamento de um mes com valor guardado, investimentos realizados e dividendos recebidos.
 *     tags: [IAn]
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
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 example: 2
 *               referencia_mes:
 *                 type: string
 *                 description: Mes de referencia no formato AAAA-MM
 *                 example: 2026-04
 *               valor_guardado:
 *                 type: number
 *                 format: float
 *                 example: 100
 *               valor_investido:
 *                 type: number
 *                 format: float
 *                 example: 300
 *               dividendos_recebidos:
 *                 type: number
 *                 format: float
 *                 example: 8.4
 *               observacoes:
 *                 type: string
 *                 example: Segui a sugestao do IAn e comprei duas cotas de HGLG11.
 *               investimentos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     nome:
 *                       type: string
 *                       example: CSHG Logistica
 *                     codigo:
 *                       type: string
 *                       example: HGLG11
 *                     quantidade:
 *                       type: number
 *                       example: 2
 *                     valor_unitario:
 *                       type: number
 *                       example: 150
 *                     valor_total:
 *                       type: number
 *                       example: 300
 *                     dividendos_estimados_mensais:
 *                       type: number
 *                       example: 2.6
 *     responses:
 *       200:
 *         description: Registro salvo com sucesso
 *       400:
 *         description: Mesa invalida, plano inexistente ou mes invalido
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.post("/registro-mensal", IAnController.salvarRegistroMensal);

/**
 * @swagger
 * /api/ian/sugestoes:
 *   post:
 *     summary: Gerar sugestoes de investimento do IAn
 *     description: Retorna sugestoes educativas de aplicacao com base no plano do IAn e no contexto financeiro da mesa.
 *     tags: [IAn]
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
 *             properties:
 *               mesa_id:
 *                 type: integer
 *                 description: ID da mesa
 *                 example: 2
 *               plano:
 *                 type: object
 *                 description: Plano opcional para gerar sugestoes sem depender do plano ativo salvo
 *     responses:
 *       200:
 *         description: Sugestoes geradas com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 contexto:
 *                   type: object
 *                 aviso_geral:
 *                   type: string
 *                 disclaimer:
 *                   type: string
 *                 sugestoes:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Mesa nao informada ou plano inexistente
 *       403:
 *         description: Sem acesso a esta mesa
 */
router.post("/sugestoes", IAnController.getSugestoesInvestimento);

module.exports = router;
