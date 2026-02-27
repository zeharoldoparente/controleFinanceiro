const express = require("express");
const MesaMembroController = require("../controllers/mesaMembroController");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router({ mergeParams: true });

router.use(authMiddleware);

/**
 * @swagger
 * /api/mesa/{mesa_id}/membros:
 *   get:
 *     summary: Listar membros de uma mesa
 *     description: Retorna o dono, membros convidados e convites pendentes de uma mesa. Acessível por qualquer membro da mesa.
 *     tags: [Membros de Mesa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da mesa
 *         example: 1
 *     responses:
 *       200:
 *         description: Estrutura de membros da mesa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dono:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     nome:
 *                       type: string
 *                       example: José Silva
 *                     email:
 *                       type: string
 *                       example: jose@email.com
 *                     papel:
 *                       type: string
 *                       example: dono
 *                 membros:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       nome:
 *                         type: string
 *                         example: Maria Souza
 *                       email:
 *                         type: string
 *                         example: maria@email.com
 *                       papel:
 *                         type: string
 *                         example: convidado
 *                       membro_desde:
 *                         type: string
 *                         format: date-time
 *                 convites_pendentes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 5
 *                       email_convidado:
 *                         type: string
 *                         example: novo@email.com
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       expira_em:
 *                         type: string
 *                         format: date-time
 *       403:
 *         description: Acesso negado — usuário não é membro desta mesa
 *       500:
 *         description: Erro interno
 */
router.get("/", MesaMembroController.listar);

/**
 * @swagger
 * /api/mesa/{mesa_id}/membros/{user_id}:
 *   delete:
 *     summary: Remover membro da mesa
 *     description: Remove um convidado da mesa. Apenas o dono pode executar esta ação. O dono não pode remover a si mesmo.
 *     tags: [Membros de Mesa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da mesa
 *         example: 1
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do usuário a ser removido
 *         example: 2
 *     responses:
 *       200:
 *         description: Membro removido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Membro removido com sucesso
 *       400:
 *         description: Tentativa de remover o próprio dono
 *       403:
 *         description: Apenas o dono pode remover membros
 *       500:
 *         description: Erro interno
 */
router.delete("/:user_id", MesaMembroController.remover);

/**
 * @swagger
 * /api/mesa/{mesa_id}/membros/convites/{convite_id}:
 *   delete:
 *     summary: Cancelar convite pendente
 *     description: Cancela um convite que ainda não foi aceito ou recusado. Apenas o dono da mesa pode cancelar convites.
 *     tags: [Membros de Mesa]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mesa_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID da mesa
 *         example: 1
 *       - in: path
 *         name: convite_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do convite a ser cancelado
 *         example: 3
 *     responses:
 *       200:
 *         description: Convite cancelado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Convite cancelado
 *       403:
 *         description: Apenas o dono pode cancelar convites
 *       500:
 *         description: Erro interno
 */
router.delete("/convites/:convite_id", MesaMembroController.cancelarConvite);

module.exports = router;
