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

   /**
    * Busca receitas filtrando por mês com suporte a recorrentes.
    * - Receita NORMAL: aparece apenas no mês da data_recebimento.
    * - Receita RECORRENTE: aparece em todos os meses a partir do mês de criação.
    *
    * @param {number} mesaId
    * @param {string} mes - formato "YYYY-MM" (ex: "2026-03")
    */
   static async findByMesaIdFiltrado(mesaId, mes) {
      const primeiroDia = `${mes}-01`;

      const [rows] = await db.query(
         `SELECT 
            r.*,
            c.nome AS categoria_nome,
            tp.nome AS tipo_pagamento_nome
          FROM receitas r
          LEFT JOIN categorias c ON r.categoria_id = c.id
          LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
          WHERE r.mesa_id = ?
            AND r.ativa = TRUE
            AND (
               -- Receita normal: só no mês da data_recebimento
               (r.recorrente = FALSE AND DATE_FORMAT(r.data_recebimento, '%Y-%m') = ?)
               OR
               -- Receita recorrente: a partir do mês de criação em diante
               (r.recorrente = TRUE AND r.data_recebimento <= LAST_DAY(?))
            )
          ORDER BY r.data_recebimento ASC`,
         [mesaId, mes, primeiroDia],
      );

      return rows;
   }

   // Mantido para compatibilidade com outros usos internos
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
