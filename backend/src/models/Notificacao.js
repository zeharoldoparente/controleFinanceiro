const db = require("../config/database");

class Notificacao {
   /**
    * Cria uma notificação simples (sem anti-duplicata).
    * Usado pelos controllers de convite etc.
    */
   static async create(userId, tipo, titulo, mensagem, link, dadosExtras) {
      const [result] = await db.query(
         `INSERT INTO notificacoes
            (user_id, tipo, titulo, mensagem, link, dados_extras)
          VALUES (?, ?, ?, ?, ?, ?)`,
         [userId, tipo, titulo, mensagem, link, JSON.stringify(dadosExtras)],
      );
      return result.insertId;
   }

   /**
    * Cria uma notificação com referência única (anti-duplicata).
    * Usado pelo alertasService para alertas financeiros automáticos.
    *
    * @param {string} referencia  - Chave única do evento (ex: "despesa_vencida_42")
    * @param {string|null} expiresAt - Data ISO "YYYY-MM-DD" em que o alerta pode ser recriado
    */
   static async createComReferencia(
      userId,
      referencia,
      tipo,
      titulo,
      mensagem,
      link = null,
      dadosExtras = null,
      expiresAt = null,
   ) {
      // Verifica se já existe notificação ativa com essa referência
      const [existente] = await db.query(
         `SELECT id FROM notificacoes
          WHERE user_id = ? AND referencia = ?
            AND (expires_at IS NULL OR expires_at >= CURDATE())
          LIMIT 1`,
         [userId, referencia],
      );
      if (existente.length > 0) return null; // já notificado, não duplica

      const [result] = await db.query(
         `INSERT INTO notificacoes
            (user_id, referencia, tipo, titulo, mensagem, link, dados_extras, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
         [
            userId,
            referencia,
            tipo,
            titulo,
            mensagem,
            link,
            dadosExtras ? JSON.stringify(dadosExtras) : null,
            expiresAt,
         ],
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
