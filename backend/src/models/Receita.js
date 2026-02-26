const db = require("../config/database");

class Receita {
   static async create(
      mesaId,
      descricao,
      valor,
      dataRecebimento,
      categoriaId,
      tipoPagamentoId,
      recorrente,
   ) {
      const [result] = await db.query(
         `INSERT INTO receitas 
         (mesa_id, descricao, valor, data_recebimento, categoria_id, tipo_pagamento_id, recorrente, ativa) 
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
         [
            mesaId,
            descricao,
            valor,
            dataRecebimento,
            categoriaId,
            tipoPagamentoId,
            recorrente || false,
         ],
      );
      return result.insertId;
   }

   static async findByMesaId(mesaId, incluirInativas = false) {
      let query = `
         SELECT r.*, 
            c.nome as categoria_nome,
            tp.nome as tipo_pagamento_nome
         FROM receitas r
         LEFT JOIN categorias c ON r.categoria_id = c.id
         LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
         WHERE r.mesa_id = ?
      `;

      if (!incluirInativas) {
         query += " AND r.ativa = TRUE";
      }

      query += " ORDER BY r.data_recebimento DESC";

      const [rows] = await db.query(query, [mesaId]);
      return rows;
   }

   static async findById(id, mesaId) {
      const [rows] = await db.query(
         `SELECT r.*, 
            c.nome as categoria_nome,
            tp.nome as tipo_pagamento_nome
         FROM receitas r
         LEFT JOIN categorias c ON r.categoria_id = c.id
         LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
         WHERE r.id = ? AND r.mesa_id = ?`,
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
      tipoPagamentoId,
      recorrente,
   ) {
      await db.query(
         `UPDATE receitas 
         SET descricao = ?, valor = ?, data_recebimento = ?, categoria_id = ?, tipo_pagamento_id = ?, recorrente = ?
         WHERE id = ? AND mesa_id = ?`,
         [
            descricao,
            valor,
            dataRecebimento,
            categoriaId,
            tipoPagamentoId,
            recorrente || false,
            id,
            mesaId,
         ],
      );
   }

   static async inativar(id, mesaId) {
      await db.query(
         "UPDATE receitas SET ativa = FALSE WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
   }

   static async reativar(id, mesaId) {
      await db.query(
         "UPDATE receitas SET ativa = TRUE WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
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
         `SELECT r.id
         FROM receitas r
         INNER JOIN mesa_usuarios mu ON r.mesa_id = mu.mesa_id
         WHERE r.id = ? AND mu.user_id = ?`,
         [receitaId, userId],
      );
      return rows.length > 0;
   }
}

module.exports = Receita;
