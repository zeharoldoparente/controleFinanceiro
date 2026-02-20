const db = require("../config/database");

class Cartao {
   static async create(userId, nome, bandeira, limite, diaVencimento, tipo) {
      const [result] = await db.query(
         "INSERT INTO cartoes (user_id, nome, bandeira, limite, dia_vencimento, tipo) VALUES (?, ?, ?, ?, ?, ?)",
         [userId, nome, bandeira, limite, diaVencimento, tipo],
      );
      return result.insertId;
   }

   static async findByUserId(userId) {
      const [rows] = await db.query(
         "SELECT * FROM cartoes WHERE user_id = ? ORDER BY nome",
         [userId],
      );
      return rows;
   }

   static async findById(id, userId) {
      const [rows] = await db.query(
         "SELECT * FROM cartoes WHERE id = ? AND user_id = ?",
         [id, userId],
      );
      return rows[0];
   }

   static async update(
      id,
      userId,
      nome,
      bandeira,
      limite,
      diaVencimento,
      tipo,
   ) {
      await db.query(
         "UPDATE cartoes SET nome = ?, bandeira = ?, limite = ?, dia_vencimento = ?, tipo = ? WHERE id = ? AND user_id = ?",
         [nome, bandeira, limite, diaVencimento, tipo, id, userId],
      );
   }

   static async delete(id, userId) {
      await db.query("DELETE FROM cartoes WHERE id = ? AND user_id = ?", [
         id,
         userId,
      ]);
   }
}

module.exports = Cartao;
