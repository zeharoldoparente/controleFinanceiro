const db = require("../config/database");

class MesaMembroController {
   // ── Listar membros, dono e convites pendentes ──────────────
   static async listar(req, res) {
      try {
         const { mesa_id } = req.params;
         const userId = req.userId;

         // Verifica acesso à mesa (dono ou convidado aceito)
         const [acesso] = await db.query(
            `SELECT m.id FROM mesas m
             LEFT JOIN mesa_usuarios mu ON mu.mesa_id = m.id AND mu.user_id = ?
             WHERE m.id = ? AND (m.criador_id = ? OR mu.user_id = ?)`,
            [userId, mesa_id, userId, userId],
         );
         if (!acesso.length) {
            return res.status(403).json({ error: "Acesso negado" });
         }

         // Dono da mesa
         const [dono] = await db.query(
            `SELECT u.id, u.nome, u.email, 'dono' AS papel
             FROM mesas m
             INNER JOIN users u ON u.id = m.criador_id
             WHERE m.id = ?`,
            [mesa_id],
         );

         // Membros convidados — exclui o dono caso também esteja em mesa_usuarios
         const [convidados] = await db.query(
            `SELECT u.id, u.nome, u.email, mu.papel, mu.created_at AS membro_desde
             FROM mesa_usuarios mu
             INNER JOIN users u ON u.id = mu.user_id
             INNER JOIN mesas m ON m.id = mu.mesa_id
             WHERE mu.mesa_id = ? AND mu.user_id != m.criador_id
             ORDER BY mu.created_at ASC`,
            [mesa_id],
         );

         // Convites pendentes ainda válidos
         const [pendentes] = await db.query(
            `SELECT id, email_convidado, created_at, expira_em
             FROM convites
             WHERE mesa_id = ? AND status = 'pendente' AND expira_em > NOW()
             ORDER BY created_at DESC`,
            [mesa_id],
         );

         res.json({
            dono: dono[0] || null,
            membros: convidados,
            convites_pendentes: pendentes,
         });
      } catch (error) {
         console.error("[mesaMembro] listar:", error);
         res.status(500).json({ error: "Erro ao listar membros" });
      }
   }

   // ── Remover membro ─────────────────────────────────────────
   static async remover(req, res) {
      try {
         const { mesa_id, user_id } = req.params;
         const userId = req.userId;

         console.log(
            `[remover] mesa_id=${mesa_id} user_id=${user_id} userId=${userId}`,
         );

         // Apenas o dono pode remover
         const [mesa] = await db.query(
            "SELECT criador_id FROM mesas WHERE id = ?",
            [mesa_id],
         );
         if (!mesa[0]) {
            return res.status(404).json({ error: "Mesa não encontrada" });
         }
         if (parseInt(mesa[0].criador_id) !== parseInt(userId)) {
            return res
               .status(403)
               .json({ error: "Apenas o dono pode remover membros" });
         }

         // Dono não pode se remover
         if (parseInt(user_id) === parseInt(userId)) {
            return res
               .status(400)
               .json({ error: "O dono não pode ser removido da mesa" });
         }

         const [result] = await db.query(
            "DELETE FROM mesa_usuarios WHERE mesa_id = ? AND user_id = ?",
            [mesa_id, user_id],
         );

         if (result.affectedRows === 0) {
            return res
               .status(404)
               .json({ error: "Membro não encontrado nesta mesa" });
         }

         res.json({ message: "Membro removido com sucesso" });
      } catch (error) {
         console.error("[mesaMembro] remover:", error);
         res.status(500).json({ error: "Erro ao remover membro" });
      }
   }

   // ── Cancelar convite pendente ──────────────────────────────
   static async cancelarConvite(req, res) {
      try {
         const { mesa_id, convite_id } = req.params;
         const userId = req.userId;

         console.log(
            `[cancelarConvite] mesa_id=${mesa_id} convite_id=${convite_id} userId=${userId}`,
         );

         // Apenas o dono pode cancelar
         const [mesa] = await db.query(
            "SELECT criador_id FROM mesas WHERE id = ?",
            [mesa_id],
         );
         if (!mesa[0]) {
            return res.status(404).json({ error: "Mesa não encontrada" });
         }
         if (parseInt(mesa[0].criador_id) !== parseInt(userId)) {
            return res.status(403).json({ error: "Acesso negado" });
         }

         // Tenta UPDATE do status primeiro; se o ENUM não aceitar 'cancelado',
         // faz DELETE direto do convite
         try {
            const [upd] = await db.query(
               "UPDATE convites SET status = 'cancelado' WHERE id = ? AND mesa_id = ? AND status = 'pendente'",
               [convite_id, mesa_id],
            );
            if (upd.affectedRows === 0) {
               // Pode ter expirado ou já processado — tenta delete como fallback
               await db.query(
                  "DELETE FROM convites WHERE id = ? AND mesa_id = ?",
                  [convite_id, mesa_id],
               );
            }
         } catch (enumError) {
            // ENUM não suporta 'cancelado' — deleta o convite diretamente
            console.warn(
               "[cancelarConvite] UPDATE falhou (ENUM?), usando DELETE:",
               enumError.message,
            );
            await db.query(
               "DELETE FROM convites WHERE id = ? AND mesa_id = ?",
               [convite_id, mesa_id],
            );
         }

         res.json({ message: "Convite cancelado com sucesso" });
      } catch (error) {
         console.error("[mesaMembro] cancelarConvite:", error);
         res.status(500).json({ error: "Erro ao cancelar convite" });
      }
   }
}

module.exports = MesaMembroController;
