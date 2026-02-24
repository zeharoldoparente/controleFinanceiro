const db = require("../config/database");

class Bandeira {
   static async create(nome) {
      const [result] = await db.query(
         "INSERT INTO bandeiras (nome, ativa) VALUES (?, TRUE)",
         [nome],
      );
      return result.insertId;
   }

   static async findAll(incluirInativas = false) {
      let query = "SELECT * FROM bandeiras";

      if (!incluirInativas) {
         query += " WHERE ativa = TRUE";
      }

      query += " ORDER BY nome ASC";

      const [rows] = await db.query(query);
      return rows;
   }

   static async findById(id) {
      const [rows] = await db.query("SELECT * FROM bandeiras WHERE id = ?", [
         id,
      ]);
      return rows[0];
   }

   static async update(id, nome) {
      await db.query("UPDATE bandeiras SET nome = ? WHERE id = ?", [nome, id]);
   }

   static async inativar(id) {
      await db.query("UPDATE bandeiras SET ativa = FALSE WHERE id = ?", [id]);
   }

   static async reativar(id) {
      await db.query("UPDATE bandeiras SET ativa = TRUE WHERE id = ?", [id]);
   }
}

module.exports = Bandeira;
