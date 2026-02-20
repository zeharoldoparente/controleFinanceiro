const db = require("../config/database");

class Categoria {
   static async create(nome, tipo) {
      const [result] = await db.query(
         "INSERT INTO categorias (nome, tipo) VALUES (?,?)",
         [nome, tipo],
      );
      return result.insertId;
   }

   static async findAll() {
      const [rows] = await db.query(
         "SELECT * FROM categorias ORDER BY tipo, nome",
      );
      return rows;
   }

   static async findByTipo(tipo) {
      const [rows] = await db.query(
         "SELECT * FROM categorias WHERE tipo = ? ORDER BY nome",
         [tipo],
      );
      return rows;
   }

   static async findById(id) {
      const [rows] = await db.query("SELECT * FROM categorias WHERE id  = ?", [
         id,
      ]);
      return rows[0];
   }

   static async update(id, nome, tipo) {
      await db.query(
         "UPDATE categorias SEET nome = ?, tipo = ?, WHERE id = ?",
         [nome, tipo, id],
      );
   }

   static async delete(id) {
      await db.query("DELETE FROM categorias WHERE id = ?", [id]);
   }
}

module.exports = Categoria;
