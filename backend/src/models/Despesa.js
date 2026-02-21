const db = require("../config/database");

class Despesa {
   static async create(
      mesaId,
      descricao,
      valorProvisionado,
      dataVencimento,
      categoriaId,
      formaPagamentoId,
      cartaoId,
      recorrente,
      parcelas,
      parcelaAtual,
   ) {
      const [result] = await db.query(
         `INSERT INTO despesas 
      (mesa_id, descricao, valor_provisionado, data_vencimento, categoria_id, forma_pagamento_id, cartao_id, recorrente, parcelas, parcela_atual) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [
            mesaId,
            descricao,
            valorProvisionado,
            dataVencimento,
            categoriaId,
            formaPagamentoId,
            cartaoId,
            recorrente,
            parcelas,
            parcelaAtual,
         ],
      );
      return result.insertId;
   }

   static async findByMesaId(mesaId) {
      const [rows] = await db.query(
         `
      SELECT 
        d.*,
        c.nome as categoria_nome,
        fp.nome as forma_pagamento_nome,
        car.nome as cartao_nome
      FROM despesas d
      LEFT JOIN categorias c ON d.categoria_id = c.id
      LEFT JOIN formas_pagamento fp ON d.forma_pagamento_id = fp.id
      LEFT JOIN cartoes car ON d.cartao_id = car.id
      WHERE d.mesa_id = ?
      ORDER BY d.data_vencimento DESC
    `,
         [mesaId],
      );
      return rows;
   }

   static async findById(id, mesaId) {
      const [rows] = await db.query(
         `
      SELECT 
        d.*,
        c.nome as categoria_nome,
        fp.nome as forma_pagamento_nome,
        car.nome as cartao_nome
      FROM despesas d
      LEFT JOIN categorias c ON d.categoria_id = c.id
      LEFT JOIN formas_pagamento fp ON d.forma_pagamento_id = fp.id
      LEFT JOIN cartoes car ON d.cartao_id = car.id
      WHERE d.id = ? AND d.mesa_id = ?
    `,
         [id, mesaId],
      );
      return rows[0];
   }

   static async update(
      id,
      mesaId,
      descricao,
      valorProvisionado,
      dataVencimento,
      categoriaId,
      formaPagamentoId,
      cartaoId,
      recorrente,
      parcelas,
      parcelaAtual,
   ) {
      await db.query(
         `UPDATE despesas 
      SET descricao = ?, valor_provisionado = ?, data_vencimento = ?, categoria_id = ?, forma_pagamento_id = ?, cartao_id = ?, recorrente = ?, parcelas = ?, parcela_atual = ?
      WHERE id = ? AND mesa_id = ?`,
         [
            descricao,
            valorProvisionado,
            dataVencimento,
            categoriaId,
            formaPagamentoId,
            cartaoId,
            recorrente,
            parcelas,
            parcelaAtual,
            id,
            mesaId,
         ],
      );
   }

   static async marcarComoPaga(
      id,
      mesaId,
      valorReal,
      dataPagamento,
      comprovante,
   ) {
      await db.query(
         `UPDATE despesas 
      SET paga = TRUE, valor_real = ?, data_pagamento = ?, comprovante = ?
      WHERE id = ? AND mesa_id = ?`,
         [valorReal, dataPagamento, comprovante, id, mesaId],
      );
   }

   static async delete(id, mesaId) {
      await db.query("DELETE FROM despesas WHERE id = ? AND mesa_id = ?", [
         id,
         mesaId,
      ]);
   }
}

module.exports = Despesa;
