/**
 * alertasController.js
 * Expõe o endpoint POST /api/notificacoes/verificar-alertas
 * Chamado pelo frontend ao entrar no dashboard.
 */

const { verificarTodosAlertas } = require("../services/alertasService");

class AlertasController {
   static async verificar(req, res) {
      try {
         const userId = req.userId;
         const totalNaoLidas = await verificarTodosAlertas(userId);

         res.json({
            message: "Alertas verificados com sucesso",
            nao_lidas: totalNaoLidas,
         });
      } catch (error) {
         console.error("[AlertasController] Erro:", error);
         // Nunca retorna 500 para o frontend — alertas são secundários
         res.json({ message: "Verificação parcial", nao_lidas: 0 });
      }
   }
}

module.exports = AlertasController;
