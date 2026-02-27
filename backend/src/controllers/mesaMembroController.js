const db = require("../config/database");

class MesaMembroController {
   // Lista membros de uma mesa (dono + convidados)
   static async listar(req, res) {
      try {
         const { mesa_id } = req.params;
         const userId = req.userId;

         // Verifica se o usuário tem acesso à mesa
         const [acesso] = await db.query(
            `SELECT m.id FROM mesas m
             LEFT JOIN mesa_usuarios mu ON mu.mesa_id = m.id AND mu.user_id = ?
             WHERE m.id = ? AND (m.criador_id = ? OR mu.user_id = ?)`,
            [userId, mesa_id, userId, userId],
         );
         if (!acesso.length) {
            return res.status(403).json({ error: "Acesso negado" });
         }

         // Busca dono
         const [dono] = await db.query(
            `SELECT u.id, u.nome, u.email, 'dono' AS papel
             FROM mesas m
             INNER JOIN users u ON u.id = m.criador_id
             WHERE m.id = ?`,
            [mesa_id],
         );

         // Busca convidados aceitos
         const [convidados] = await db.query(
            `SELECT u.id, u.nome, u.email, mu.papel, mu.created_at AS membro_desde
             FROM mesa_usuarios mu
             INNER JOIN users u ON u.id = mu.user_id
             WHERE mu.mesa_id = ?
             ORDER BY mu.created_at ASC`,
            [mesa_id],
         );

         // Busca convites pendentes
         const [pendentes] = await db.query(
            `SELECT id, email_convidado, created_at, expira_em
             FROM convites
             WHERE mesa_id = ? AND status = 'pendente' AND expira_em > NOW()
             ORDER BY created_at DESC`,
            [mesa_id],
         );

         res.json({
            dono: dono[0],
            membros: convidados,
            convites_pendentes: pendentes,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar membros" });
      }
   }

   // Remove um membro da mesa (apenas o dono pode)
   static async remover(req, res) {
      try {
         const { mesa_id, user_id } = req.params;
         const userId = req.userId;

         // Verifica se é dono
         const [mesa] = await db.query(
            "SELECT criador_id FROM mesas WHERE id = ?",
            [mesa_id],
         );
         if (!mesa[0] || mesa[0].criador_id !== userId) {
            return res
               .status(403)
               .json({ error: "Apenas o dono pode remover membros" });
         }

         // Não pode remover a si mesmo
         if (parseInt(user_id) === userId) {
            return res
               .status(400)
               .json({ error: "O dono não pode ser removido da mesa" });
         }

         await db.query(
            "DELETE FROM mesa_usuarios WHERE mesa_id = ? AND user_id = ?",
            [mesa_id, user_id],
         );

         res.json({ message: "Membro removido com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao remover membro" });
      }
   }

   // Cancela um convite pendente (apenas o dono pode)
   static async cancelarConvite(req, res) {
      try {
         const { mesa_id, convite_id } = req.params;
         const userId = req.userId;

         const [mesa] = await db.query(
            "SELECT criador_id FROM mesas WHERE id = ?",
            [mesa_id],
         );
         if (!mesa[0] || mesa[0].criador_id !== userId) {
            return res.status(403).json({ error: "Acesso negado" });
         }

         await db.query(
            "UPDATE convites SET status = 'cancelado' WHERE id = ? AND mesa_id = ?",
            [convite_id, mesa_id],
         );

         res.json({ message: "Convite cancelado" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao cancelar convite" });
      }
   }
}

module.exports = MesaMembroController;
