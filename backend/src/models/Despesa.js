const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class Despesa {
   static async create(
      mesaId,
      descricao,
      tipo,
      valorProvisionado,
      dataVencimento,
      categoriaId,
      tipoPagamentoId,
      cartaoId,
      recorrente,
      parcelas,
      parcelaAtual,
      parcelaGrupoId,
   ) {
      const [result] = await db.query(
         `INSERT INTO despesas 
         (mesa_id, descricao, tipo, valor_provisionado, data_vencimento, categoria_id, tipo_pagamento_id, cartao_id, recorrente, parcelas, parcela_atual, parcela_grupo_id, ativa) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
         [
            mesaId,
            descricao,
            tipo || "variavel",
            valorProvisionado,
            dataVencimento,
            categoriaId,
            tipoPagamentoId,
            cartaoId,
            recorrente || false,
            parcelas || 1,
            parcelaAtual || 1,
            parcelaGrupoId || uuidv4(),
         ],
      );
      return result.insertId;
   }

   static async createMultiple(despesas) {
      const values = despesas.map((d) => [
         d.mesaId,
         d.descricao,
         d.tipo || "variavel",
         d.valorProvisionado,
         d.dataVencimento,
         d.categoriaId,
         d.tipoPagamentoId,
         d.cartaoId,
         d.recorrente || false,
         d.parcelas || 1,
         d.parcelaAtual,
         d.parcelaGrupoId,
         true,
      ]);

      const placeholders = values
         .map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
         .join(", ");
      const flatValues = values.flat();

      await db.query(
         `INSERT INTO despesas 
         (mesa_id, descricao, tipo, valor_provisionado, data_vencimento, categoria_id, tipo_pagamento_id, cartao_id, recorrente, parcelas, parcela_atual, parcela_grupo_id, ativa) 
         VALUES ${placeholders}`,
         flatValues,
      );
   }

   // Busca filtrada por mês — usada pela listagem principal
   // Despesas normais: apenas no mês exato do vencimento
   // Despesas recorrentes: aparecem em todos os meses a partir do vencimento
   //   até o mês anterior ao data_cancelamento (exclusive)
   static async findByMesaIdFiltrado(mesaId, mes) {
      // mes formato: "YYYY-MM"
      const primeiroDia = `${mes}-01`;

      const [rows] = await db.query(
         `SELECT 
            d.*,
            c.nome as categoria_nome,
            tp.nome as tipo_pagamento_nome,
            car.nome as cartao_nome
         FROM despesas d
         LEFT JOIN categorias c ON d.categoria_id = c.id
         LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
         LEFT JOIN cartoes car ON d.cartao_id = car.id
         WHERE d.mesa_id = ? AND d.ativa = TRUE AND (
            -- Despesas normais (não recorrentes): apenas no mês exato
            (d.recorrente = FALSE AND DATE_FORMAT(d.data_vencimento, '%Y-%m') = ?)
            OR
            -- Despesas recorrentes: do mês de criação em diante,
            -- mas APENAS se não foi cancelada antes ou durante este mês
            (
               d.recorrente = TRUE
               AND d.data_vencimento <= LAST_DAY(?)
               AND (
                  d.data_cancelamento IS NULL
                  OR DATE_FORMAT(d.data_cancelamento, '%Y-%m') > ?
               )
            )
         )
         ORDER BY d.data_vencimento ASC`,
         [mesaId, mes, primeiroDia, mes],
      );
      return rows;
   }

   // Mantido para compatibilidade com outros usos
   static async findByMesaId(mesaId, incluirInativas = false) {
      let query = `
         SELECT 
            d.*,
            c.nome as categoria_nome,
            tp.nome as tipo_pagamento_nome,
            car.nome as cartao_nome
         FROM despesas d
         LEFT JOIN categorias c ON d.categoria_id = c.id
         LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
         LEFT JOIN cartoes car ON d.cartao_id = car.id
         WHERE d.mesa_id = ?
      `;

      if (!incluirInativas) {
         query += " AND d.ativa = TRUE";
      }

      query += " ORDER BY d.data_vencimento ASC";

      const [rows] = await db.query(query, [mesaId]);
      return rows;
   }

   static async findById(id, mesaId) {
      const [rows] = await db.query(
         `SELECT 
            d.*,
            c.nome as categoria_nome,
            tp.nome as tipo_pagamento_nome,
            car.nome as cartao_nome
         FROM despesas d
         LEFT JOIN categorias c ON d.categoria_id = c.id
         LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
         LEFT JOIN cartoes car ON d.cartao_id = car.id
         WHERE d.id = ? AND d.mesa_id = ?`,
         [id, mesaId],
      );
      return rows[0];
   }

   static async findByParcelaGrupo(parcelaGrupoId, mesaId) {
      const [rows] = await db.query(
         `SELECT 
            d.*,
            c.nome as categoria_nome,
            tp.nome as tipo_pagamento_nome,
            car.nome as cartao_nome
         FROM despesas d
         LEFT JOIN categorias c ON d.categoria_id = c.id
         LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
         LEFT JOIN cartoes car ON d.cartao_id = car.id
         WHERE d.parcela_grupo_id = ? AND d.mesa_id = ?
         ORDER BY d.parcela_atual ASC`,
         [parcelaGrupoId, mesaId],
      );
      return rows;
   }

   static async update(
      id,
      mesaId,
      descricao,
      tipo,
      valorProvisionado,
      dataVencimento,
      categoriaId,
      tipoPagamentoId,
      cartaoId,
      recorrente,
   ) {
      await db.query(
         `UPDATE despesas 
         SET descricao = ?, tipo = ?, valor_provisionado = ?, data_vencimento = ?, categoria_id = ?, tipo_pagamento_id = ?, cartao_id = ?, recorrente = ?
         WHERE id = ? AND mesa_id = ?`,
         [
            descricao,
            tipo || "variavel",
            valorProvisionado,
            dataVencimento,
            categoriaId,
            tipoPagamentoId,
            cartaoId,
            recorrente || false,
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

   static async desmarcarPagamento(id, mesaId) {
      await db.query(
         `UPDATE despesas 
         SET paga = FALSE, valor_real = NULL, data_pagamento = NULL, comprovante = NULL
         WHERE id = ? AND mesa_id = ?`,
         [id, mesaId],
      );
   }

   // Cancela recorrência a partir do mês informado (inclusive)
   // Formato: dataCancelamento = 'YYYY-MM-01'
   static async cancelarRecorrencia(id, mesaId, dataCancelamento) {
      await db.query(
         `UPDATE despesas 
         SET data_cancelamento = ?
         WHERE id = ? AND mesa_id = ? AND recorrente = TRUE`,
         [dataCancelamento, id, mesaId],
      );
   }

   // Remove cancelamento, tornando a recorrência infinita novamente
   static async removerCancelamento(id, mesaId) {
      await db.query(
         "UPDATE despesas SET data_cancelamento = NULL WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
   }

   static async inativar(id, mesaId) {
      await db.query(
         "UPDATE despesas SET ativa = FALSE WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
   }

   static async inativarGrupo(parcelaGrupoId, mesaId) {
      await db.query(
         "UPDATE despesas SET ativa = FALSE WHERE parcela_grupo_id = ? AND mesa_id = ?",
         [parcelaGrupoId, mesaId],
      );
   }

   static async reativar(id, mesaId) {
      await db.query(
         "UPDATE despesas SET ativa = TRUE WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
   }

   static async delete(id, mesaId) {
      await db.query("DELETE FROM despesas WHERE id = ? AND mesa_id = ?", [
         id,
         mesaId,
      ]);
   }

   static async atualizarComprovante(id, mesaId, comprovante) {
      await db.query(
         "UPDATE despesas SET comprovante = ? WHERE id = ? AND mesa_id = ?",
         [comprovante, id, mesaId],
      );
   }

   static async getComprovante(id, mesaId) {
      const [rows] = await db.query(
         "SELECT comprovante FROM despesas WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
      return rows[0]?.comprovante;
   }

   static async removerComprovante(id, mesaId) {
      await db.query(
         "UPDATE despesas SET comprovante = NULL WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
   }
}

module.exports = Despesa;
