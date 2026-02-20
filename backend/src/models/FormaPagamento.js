const db = require("../config/database");

class FormaPagamento {
   static async create(nome) {
      const [result] = await db.query(
         "INSERT INTO formas_pagamento (nome) VALUES (?)",
         [nome],
      );
      return result.insertId;
   }

   static async findAll() {
      const [rows] = await db.query(
         "SELECT * FROM formas_pagamento ORDER BY nome",
      );
      return rows;
   }

   static async findById(id) {
      const [rows] = await db.query(
         "SELECT * FROM formas_pagamento WHERE id = ?",
         [id],
      );
      return rows[0];
   }

   static async update(id, nome) {
      await db.query("UPDATE formas_pagamento SET nome = ? WHERE id = ?", [
         nome,
         id,
      ]);
   }

   static async delete(id) {
      await db.query("DELETE FROM formas_pagamento WHERE id = ?", [id]);
   }
}

module.exports = FormaPagamento;
