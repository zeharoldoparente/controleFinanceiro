const db = require("../config/database");

class Mesa {
   static parsePositiveInt(value) {
      if (typeof value === "number" && Number.isInteger(value) && value > 0) {
         return value;
      }

      if (typeof value === "string" && /^\d+$/.test(value.trim())) {
         const parsed = Number(value);
         if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
      }

      return null;
   }

   static async create(nome, criadorId) {
      const creator = this.parsePositiveInt(criadorId);
      if (!creator) throw new Error("ID de criador invalido");

      const connection = await db.getConnection();

      try {
         await connection.beginTransaction();

         const [result] = await connection.query(
            "INSERT INTO mesas (nome, criador_id) VALUES (?,?)",
            [nome, creator],
         );

         const mesaId = result.insertId;

         await connection.query(
            "INSERT INTO mesa_usuarios (mesa_id, user_id) VALUES (?, ?)",
            [mesaId, creator],
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
      const user = this.parsePositiveInt(userId);
      if (!user) return [];

      const [rows] = await db.query(
         `
      SELECT m.*, u.nome as criador_nome
      FROM mesas m
      INNER JOIN mesa_usuarios mu ON m.id = mu.mesa_id
      INNER JOIN users u ON m.criador_id = u.id
      WHERE mu.user_id = ?
      ORDER BY m.created_at DESC
    `,
         [user],
      );

      return rows;
   }

   static async findById(mesaId, userId) {
      const mesa = this.parsePositiveInt(mesaId);
      const user = this.parsePositiveInt(userId);
      if (!mesa || !user) return null;

      const [rows] = await db.query(
         `
      SELECT m.*, u.nome as criador_nome
      FROM mesas m
      INNER JOIN mesa_usuarios mu ON m.id = mu.mesa_id
      INNER JOIN users u ON m.criador_id = u.id
      WHERE m.id = ? AND mu.user_id = ?
    `,
         [mesa, user],
      );

      return rows[0];
   }

   static async update(mesaId, nome, userId) {
      const mesa = this.parsePositiveInt(mesaId);
      const user = this.parsePositiveInt(userId);
      if (!mesa || !user) throw new Error("Identificador invalido");

      const [rows] = await db.query(
         "SELECT criador_id FROM mesas WHERE id = ?",
         [mesa],
      );

      if (!rows[0] || Number(rows[0].criador_id) !== user) {
         throw new Error("Apenas o criador pode editar a mesa");
      }

      await db.query("UPDATE mesas SET nome = ? WHERE id = ?", [nome, mesa]);
   }

   static async delete(mesaId, userId) {
      const mesa = this.parsePositiveInt(mesaId);
      const user = this.parsePositiveInt(userId);
      if (!mesa || !user) throw new Error("Identificador invalido");

      const [rows] = await db.query(
         "SELECT criador_id FROM mesas WHERE id = ?",
         [mesa],
      );

      if (!rows[0] || Number(rows[0].criador_id) !== user) {
         throw new Error("Apenas o criador pode deletar a mesa");
      }

      await db.query("DELETE FROM mesas WHERE id = ?", [mesa]);
   }
}

module.exports = Mesa;
