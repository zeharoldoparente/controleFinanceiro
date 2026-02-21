const db = require("../config/database");

class Receita {
   static async create(mesaId, descricao, valor, dataRecebimento, categoriaId) {
      const [result] = await db.query(
         "INSERT INTO receitas (mesa_id, descricao, valor, data_recebimento, categoria_id) VALUES (?, ?, ?, ?, ?)",
         [mesaId, descricao, valor, dataRecebimento, categoriaId],
      );
      return result.insertId;
   }

   static async findByMesaId(mesaId) {
      const [rows] = await db.query(
         `
      SELECT r.*, c.nome as categoria_nome
      FROM receitas r
      LEFT JOIN categorias c ON r.categoria_id = c.id
      WHERE r.mesa_id = ?
      ORDER BY r.data_recebimento DESC
    `,
         [mesaId],
      );
      return rows;
   }

   static async findById(id, mesaId) {
      const [rows] = await db.query(
         `
      SELECT r.*, c.nome as categoria_nome
      FROM receitas r
      LEFT JOIN categorias c ON r.categoria_id = c.id
      WHERE r.id = ? AND r.mesa_id = ?
    `,
         [id, mesaId],
      );
      return rows[0];
   }

   static async update(
      id,
      mesaId,
      descricao,
      valor,
      dataRecebimento,
      categoriaId,
   ) {
      await db.query(
         "UPDATE receitas SET descricao = ?, valor = ?, data_recebimento = ?, categoria_id = ? WHERE id = ? AND mesa_id = ?",
         [descricao, valor, dataRecebimento, categoriaId, id, mesaId],
      );
   }

   static async delete(id, mesaId) {
      await db.query("DELETE FROM receitas WHERE id = ? AND mesa_id = ?", [
         id,
         mesaId,
      ]);
   }

   static async verificarAcesso(receitaId, userId) {
      const [rows] = await db.query(
         `
      SELECT r.id
      FROM receitas r
      INNER JOIN mesa_usuarios mu ON r.mesa_id = mu.mesa_id
      WHERE r.id = ? AND mu.user_id = ?
    `,
         [receitaId, userId],
      );
      return rows.length > 0;
   }
}

module.exports = Receita;
