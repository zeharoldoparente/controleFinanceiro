const db = require("../config/database");

class Mesa {
   static async create(nome, criadorId) {
      const connection = await db.getConnection();

      try {
         await connection.beginTransaction();

         const [result] = await connection.query(
            "INSERT INTO mesas (nome, criador_id) VALUES (?,?)",
            [nome, criadorId],
         );

         const mesaId = result.insertId;

         await connection.query(
            " INSERT INTO mesa_usuarios (mesa_id, user_id) VALUES (?, ?)",
            [mesaId, criadorId],
         );

         await connection.commit();
         return mesaId;
      } catch (error) {
         await connection.rollback();
         throw error;
      } finally {
         connection.release();
      }
   }

   static async findByUserId(userId) {
      const [rows] = await db.query(
         `
      SELECT m.*, u.nome as criador_nome
      FROM mesas m
      INNER JOIN mesa_usuarios mu ON m.id = mu.mesa_id
      INNER JOIN users u ON m.criador_id = u.id
      WHERE mu.user_id = ?
      ORDER BY m.created_at DESC
    `,
         [userId],
      );

      return rows;
   }

   static async findById(mesaId, userId) {
      const [rows] = await db.query(
         `
      SELECT m.*, u.nome as criador_nome
      FROM mesas m
      INNER JOIN mesa_usuarios mu ON m.id = mu.mesa_id
      INNER JOIN users u ON m.criador_id = u.id
      WHERE m.id = ? AND mu.user_id = ?
    `,
         [mesaId, userId],
      );

      return rows[0];
   }

   static async update(mesaId, nome, userId) {
      const [mesa] = await db.query(
         "SELECT criador_id FROM mesas WHERE id = ?",
         [mesaId],
      );

      if (!mesa[0] || mesa[0].criador_id !== userId) {
         throw new Error("Apenas o criador pode editar a mesa");
      }

      await db.query("UPDATE mesas SET nome = ? WHERE id = ?", [mesa, mesaId]);
   }

   static async delete(mesaId, userId) {
      const [mesa] = await db.query(
         "SELECT criador_id FROM mesas WHERE id = ?",
         [mesaId],
      );

      if (!mesa[0] || mesa[0].criador_id !== userId) {
         throw new Error("Apenas o criador pode deletar a mesa");
      }

      await db.query("DELETE FROM mesas WHERE id = ?", [mesaId]);
   }
}

module.exports = Mesa;
