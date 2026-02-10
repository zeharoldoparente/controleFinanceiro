const db = require("../config/database");
const bcrypt = require("bcryptjs");

class User {
   static async findByEmail(email) {
      const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
         email,
      ]);
      return rows[0];
   }
   static async findById(id) {
      const [rows] = await db.query(
         "SELECT id, nome, email, created_at FROM users WHERE id = ?",
         [id],
      );
      return rows[0];
   }
   static async create(nome, email, senha) {
      const senhaHash = await bcrypt.hash(senha, 10);
      const [result] = await db.query(
         "INSERT INTO users (nome, email, senha) VALUES (?,?,?)",
         [nome, email, senhaHash],
      );
      return result.insertId;
   }
   static async verificarSenha(senha, senhaHash) {
      return await bcrypt.compare(senha, senhaHash);
   }
}

module.exports = User;
