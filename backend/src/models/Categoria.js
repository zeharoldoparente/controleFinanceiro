const db = require("../config/database");

class Categoria {
   static async create(nome, tipo) {
      const [result] = await db.query(
         "INSERT INTO categorias (nome, tipo, ativa) VALUES (?, ?, TRUE)",
         [nome, tipo],
      );
      return result.insertId;
   }

   static async findAll(incluirInativas = false) {
      let query = "SELECT * FROM categorias";

      if (!incluirInativas) {
         query += " WHERE ativa = TRUE";
      }

      query += " ORDER BY tipo, nome";

      const [rows] = await db.query(query);
      return rows;
   }

   static async findByTipo(tipo, incluirInativas = false) {
      let query = "SELECT * FROM categorias WHERE tipo = ?";

      if (!incluirInativas) {
         query += " AND ativa = TRUE";
      }

      query += " ORDER BY nome";

      const [rows] = await db.query(query, [tipo]);
      return rows;
   }

   static async findById(id) {
      const [rows] = await db.query("SELECT * FROM categorias WHERE id = ?", [
         id,
      ]);
      return rows[0];
   }

   static async update(id, nome, tipo) {
      await db.query("UPDATE categorias SET nome = ?, tipo = ? WHERE id = ?", [
         nome,
         tipo,
         id,
      ]);
   }

   static async delete(id) {
      // Método mantido para compatibilidade, mas não deve ser usado
      await db.query("DELETE FROM categorias WHERE id = ?", [id]);
   }

   static async inativar(id) {
      await db.query("UPDATE categorias SET ativa = FALSE WHERE id = ?", [id]);
   }

   static async reativar(id) {
      await db.query("UPDATE categorias SET ativa = TRUE WHERE id = ?", [id]);
   }
}

module.exports = Categoria;
