const db = require("../config/database");

class Notificacao {
   static async create(userId, tipo, titulo, mensagem, link, dadosExtras) {
      const [result] = await db.query(
         "INSERT INTO notificacoes (user_id, tipo, titulo, mensagem, link, dados_extras) VALUES (?, ?, ?, ?, ?, ?)",
         [userId, tipo, titulo, mensagem, link, JSON.stringify(dadosExtras)],
      );
      return result.insertId;
   }

   static async findByUserId(userId) {
      const [rows] = await db.query(
         "SELECT * FROM notificacoes WHERE user_id = ? ORDER BY created_at DESC",
         [userId],
      );
      return rows;
   }

   static async countNaoLidas(userId) {
      const [rows] = await db.query(
         "SELECT COUNT(*) as total FROM notificacoes WHERE user_id = ? AND lida = FALSE",
         [userId],
      );
      return rows[0].total;
   }

   static async marcarComoLida(id, userId) {
      await db.query(
         "UPDATE notificacoes SET lida = TRUE WHERE id = ? AND user_id = ?",
         [id, userId],
      );
   }

   static async marcarTodasComoLidas(userId) {
      await db.query("UPDATE notificacoes SET lida = TRUE WHERE user_id = ?", [
         userId,
      ]);
   }

   static async delete(id, userId) {
      await db.query("DELETE FROM notificacoes WHERE id = ? AND user_id = ?", [
         id,
         userId,
      ]);
   }
}

module.exports = Notificacao;
