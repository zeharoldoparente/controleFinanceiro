const Notificacao = require("../models/Notificacao");

class NotificacaoController {
   static async list(req, res) {
      try {
         const userId = req.userId;
         const notificacoes = await Notificacao.findByUserId(userId);

         res.json({ notificacoes });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar notificações" });
      }
   }

   static async countNaoLidas(req, res) {
      try {
         const userId = req.userId;
         const total = await Notificacao.countNaoLidas(userId);

         res.json({ total });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao contar notificações" });
      }
   }

   static async marcarLida(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;

         await Notificacao.marcarComoLida(id, userId);

         res.json({ message: "Notificação marcada como lida" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao marcar notificação" });
      }
   }

   static async marcarTodasLidas(req, res) {
      try {
         const userId = req.userId;

         await Notificacao.marcarTodasComoLidas(userId);

         res.json({
            message: "Todas as notificações foram marcadas como lidas",
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao marcar notificações" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;

         await Notificacao.delete(id, userId);

         res.json({ message: "Notificação deletada" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao deletar notificação" });
      }
   }
}

module.exports = NotificacaoController;
