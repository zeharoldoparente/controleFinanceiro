const db = require("../config/database");

class Cartao {
   static async create(
      userId,
      nome,
      bandeiraId,
      tipoPagamentoId,
      limiteReal,
      limitePessoal,
      diaFechamento,
      diaVencimento,
      cor,
   ) {
      const [result] = await db.query(
         `INSERT INTO cartoes 
         (user_id, nome, bandeira_id, tipo_pagamento_id, limite_real, limite_pessoal, dia_fechamento, dia_vencimento, cor, ativa) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
         [
            userId,
            nome,
            bandeiraId,
            tipoPagamentoId,
            limiteReal,
            limitePessoal,
            diaFechamento,
            diaVencimento,
            cor,
         ],
      );
      return result.insertId;
   }

   static async findAll(userId, incluirInativas = false) {
      let query = `
         SELECT 
            c.*, 
            b.nome as bandeira_nome,
            tp.nome as tipo_pagamento_nome
         FROM cartoes c
         LEFT JOIN bandeiras b ON c.bandeira_id = b.id
         LEFT JOIN tipos_pagamento tp ON c.tipo_pagamento_id = tp.id
         WHERE c.user_id = ?
      `;

      if (!incluirInativas) {
         query += " AND c.ativa = TRUE";
      }

      query += " ORDER BY c.nome ASC";

      const [rows] = await db.query(query, [userId]);
      return rows;
   }

   static async findById(id, userId) {
      const [rows] = await db.query(
         `SELECT 
            c.*, 
            b.nome as bandeira_nome,
            tp.nome as tipo_pagamento_nome
         FROM cartoes c
         LEFT JOIN bandeiras b ON c.bandeira_id = b.id
         LEFT JOIN tipos_pagamento tp ON c.tipo_pagamento_id = tp.id
         WHERE c.id = ? AND c.user_id = ?`,
         [id, userId],
      );
      return rows[0];
   }

   static async update(
      id,
      userId,
      nome,
      bandeiraId,
      tipoPagamentoId,
      limiteReal,
      limitePessoal,
      diaFechamento,
      diaVencimento,
      cor,
   ) {
      await db.query(
         `UPDATE cartoes 
         SET nome = ?, bandeira_id = ?, tipo_pagamento_id = ?, limite_real = ?, 
             limite_pessoal = ?, dia_fechamento = ?, dia_vencimento = ?, cor = ?
         WHERE id = ? AND user_id = ?`,
         [
            nome,
            bandeiraId,
            tipoPagamentoId,
            limiteReal,
            limitePessoal,
            diaFechamento,
            diaVencimento,
            cor,
            id,
            userId,
         ],
      );
   }

   static async inativar(id, userId) {
      await db.query(
         "UPDATE cartoes SET ativa = FALSE WHERE id = ? AND user_id = ?",
         [id, userId],
      );
   }

   static async reativar(id, userId) {
      await db.query(
         "UPDATE cartoes SET ativa = TRUE WHERE id = ? AND user_id = ?",
         [id, userId],
      );
   }

   static async delete(id, userId) {
      await db.query("DELETE FROM cartoes WHERE id = ? AND user_id = ?", [
         id,
         userId,
      ]);
   }
}

module.exports = Cartao;
