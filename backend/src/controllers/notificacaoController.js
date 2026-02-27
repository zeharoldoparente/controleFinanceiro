const db = require("../config/database");

class NotificacaoController {
   // GET /api/notificacoes
   static async list(req, res) {
      try {
         const userId = req.userId;
         const { apenas_nao_lidas } = req.query;

         let query = `
            SELECT id, tipo, titulo, mensagem, link, dados_extras, lida, created_at
            FROM notificacoes
            WHERE user_id = ?
         `;
         if (apenas_nao_lidas === "true") {
            query += " AND lida = FALSE";
         }
         query += " ORDER BY created_at DESC LIMIT 50";

         const [rows] = await db.query(query, [userId]);

         const [contagem] = await db.query(
            "SELECT COUNT(*) AS total FROM notificacoes WHERE user_id = ? AND lida = FALSE",
            [userId],
         );

         res.json({
            notificacoes: rows.map((n) => ({
               ...n,
               dados_extras: n.dados_extras
                  ? typeof n.dados_extras === "string"
                     ? JSON.parse(n.dados_extras)
                     : n.dados_extras
                  : null,
            })),
            nao_lidas: contagem[0].total,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar notificações" });
      }
   }

   // GET /api/notificacoes/nao-lidas/count
   static async countNaoLidas(req, res) {
      try {
         const userId = req.userId;
         const [rows] = await db.query(
            "SELECT COUNT(*) AS total FROM notificacoes WHERE user_id = ? AND lida = FALSE",
            [userId],
         );
         res.json({ total: rows[0].total });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao contar notificações" });
      }
   }

   // PATCH /api/notificacoes/:id/marcar-lida
   static async marcarLida(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;

         const [result] = await db.query(
            "UPDATE notificacoes SET lida = TRUE WHERE id = ? AND user_id = ?",
            [id, userId],
         );

         if (result.affectedRows === 0) {
            return res
               .status(404)
               .json({ error: "Notificação não encontrada" });
         }

         res.json({ message: "Notificação marcada como lida" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao marcar notificação" });
      }
   }

   // PATCH /api/notificacoes/marcar-todas-lidas
   static async marcarTodasLidas(req, res) {
      try {
         const userId = req.userId;

         await db.query(
            "UPDATE notificacoes SET lida = TRUE WHERE user_id = ? AND lida = FALSE",
            [userId],
         );

         res.json({ message: "Todas as notificações marcadas como lidas" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar notificações" });
      }
   }

   // DELETE /api/notificacoes/:id
   static async delete(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;

         const [result] = await db.query(
            "DELETE FROM notificacoes WHERE id = ? AND user_id = ?",
            [id, userId],
         );

         if (result.affectedRows === 0) {
            return res
               .status(404)
               .json({ error: "Notificação não encontrada" });
         }

         res.json({ message: "Notificação removida" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao remover notificação" });
      }
   }
}

module.exports = NotificacaoController;
