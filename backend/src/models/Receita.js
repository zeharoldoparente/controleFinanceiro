const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class Receita {
   // ─── CREATE ───────────────────────────────────────────────────────────────

   /**
    * Cria uma ou mais receitas.
    * Se parcelas > 1, cria N registros com mesmo grupo_parcela (UUID).
    * Retorna array de IDs criados.
    */
   static async create(dados) {
      const {
         mesaId,
         descricao,
         valor,
         dataRecebimento,
         categoriaId,
         tipoPagamentoId,
         recorrente,
         parcelas = 1,
      } = dados;

      // Recorrente nunca tem parcelas
      const totalParcelas = recorrente ? 1 : Math.max(1, parseInt(parcelas));
      const grupoParcela = totalParcelas > 1 ? uuidv4() : null;
      const ids = [];

      for (let i = 1; i <= totalParcelas; i++) {
         // Incrementa mês para cada parcela
         const [ano, mes, dia] = dataRecebimento.split("-").map(Number);
         const dataBase = new Date(ano, mes - 1 + (i - 1), dia);
         const dataFormatada = `${dataBase.getFullYear()}-${String(dataBase.getMonth() + 1).padStart(2, "0")}-${String(dataBase.getDate()).padStart(2, "0")}`;

         const descFinal =
            totalParcelas > 1
               ? `${descricao} (${i}/${totalParcelas})`
               : descricao;

         const [result] = await db.query(
            `INSERT INTO receitas
             (mesa_id, descricao, valor, data_recebimento, categoria_id,
              tipo_pagamento_id, recorrente, status, parcelas, parcela_atual,
              grupo_parcela, ativa)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'a_receber', ?, ?, ?, TRUE)`,
            [
               mesaId,
               descFinal,
               valor,
               dataFormatada,
               categoriaId || null,
               tipoPagamentoId || null,
               recorrente ? 1 : 0,
               totalParcelas,
               i,
               grupoParcela,
            ],
         );
         ids.push(result.insertId);
      }

      return ids;
   }

   // ─── LIST ─────────────────────────────────────────────────────────────────

   /**
    * Busca receitas de um mês com suporte a recorrentes:
    *
    * 1. Receita NORMAL do mês (não recorrente, sem origem)
    * 2. Receita RECORRENTE ativa para o mês, SEM confirmação já criada
    * 3. CONFIRMAÇÃO de recorrente para esse mês específico
    */
   static async findByMesaIdFiltrado(mesaId, mes) {
      const primeiroDia = `${mes}-01`;

      // Verifica se as colunas novas existem (compatibilidade com BDs sem migration)
      let hasNewColumns = false;
      try {
         const [cols] = await db.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = 'receitas'
               AND COLUMN_NAME = 'origem_recorrente_id'`,
         );
         hasNewColumns = cols.length > 0;
      } catch (_) {}

      if (hasNewColumns) {
         // Query completa com suporte a confirmações de recorrentes
         const [rows] = await db.query(
            `SELECT
                r.*,
                c.nome  AS categoria_nome,
                tp.nome AS tipo_pagamento_nome
             FROM receitas r
             LEFT JOIN categorias      c  ON r.categoria_id      = c.id
             LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
             WHERE r.mesa_id = ?
               AND r.ativa   = TRUE
               AND (
                  (r.recorrente = FALSE AND r.origem_recorrente_id IS NULL
                   AND DATE_FORMAT(r.data_recebimento, '%Y-%m') = ?)
                  OR
                  (r.recorrente = TRUE AND r.data_recebimento <= LAST_DAY(?)
                   AND NOT EXISTS (
                      SELECT 1 FROM receitas cf
                      WHERE cf.origem_recorrente_id = r.id
                        AND cf.mes_referencia       = ?
                        AND cf.ativa                = TRUE
                   ))
                  OR
                  (r.origem_recorrente_id IS NOT NULL AND r.mes_referencia = ?)
               )
             ORDER BY r.data_recebimento ASC, r.id ASC`,
            [mesaId, mes, primeiroDia, mes, mes],
         );
         return rows;
      } else {
         // Query compatível com schema original (sem colunas de confirmação)
         const [rows] = await db.query(
            `SELECT
                r.*,
                c.nome  AS categoria_nome,
                tp.nome AS tipo_pagamento_nome
             FROM receitas r
             LEFT JOIN categorias      c  ON r.categoria_id      = c.id
             LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
             WHERE r.mesa_id = ?
               AND r.ativa   = TRUE
               AND (
                  (r.recorrente = FALSE AND DATE_FORMAT(r.data_recebimento, '%Y-%m') = ?)
                  OR
                  (r.recorrente = TRUE AND r.data_recebimento <= LAST_DAY(?))
               )
             ORDER BY r.data_recebimento ASC, r.id ASC`,
            [mesaId, mes, primeiroDia],
         );
         return rows;
      }
   }

   // ─── CONFIRMAR ────────────────────────────────────────────────────────────

   /**
    * Confirma o recebimento de uma receita.
    *
    * Normal:      UPDATE status='recebida', valor_real, data_confirmacao
    * Recorrente:  INSERT registro filho (confirmação do mês) com status='recebida'
    */
   static async confirmar(id, mesaId, valorReal, mes) {
      const receita = await Receita.findById(id, mesaId);
      if (!receita) throw new Error("Receita não encontrada");

      if (receita.recorrente) {
         // Verifica duplicidade
         const [existing] = await db.query(
            `SELECT id FROM receitas
             WHERE origem_recorrente_id = ? AND mes_referencia = ? AND ativa = TRUE`,
            [id, mes],
         );
         if (existing.length > 0)
            throw new Error("Recebimento já confirmado para este mês");

         const [result] = await db.query(
            `INSERT INTO receitas
             (mesa_id, descricao, valor, data_recebimento, categoria_id,
              tipo_pagamento_id, recorrente, status, valor_real, data_confirmacao,
              origem_recorrente_id, mes_referencia, ativa)
             VALUES (?, ?, ?, ?, ?, ?, FALSE, 'recebida', ?, CURDATE(), ?, ?, TRUE)`,
            [
               mesaId,
               receita.descricao,
               receita.valor,
               `${mes}-01`,
               receita.categoria_id || null,
               receita.tipo_pagamento_id || null,
               valorReal,
               id,
               mes,
            ],
         );
         return { tipo: "recorrente", novoId: result.insertId };
      } else {
         await db.query(
            `UPDATE receitas
             SET status = 'recebida', valor_real = ?, data_confirmacao = CURDATE()
             WHERE id = ? AND mesa_id = ?`,
            [valorReal, id, mesaId],
         );
         return { tipo: "normal" };
      }
   }

   // ─── DESFAZER CONFIRMAÇÃO ─────────────────────────────────────────────────

   /**
    * Desfaz a confirmação:
    * - Confirmação de recorrente (tem origem_recorrente_id): DELETE
    * - Receita normal confirmada: reverte para 'a_receber'
    */
   static async desfazerConfirmacao(id, mesaId) {
      const receita = await Receita.findById(id, mesaId);
      if (!receita) throw new Error("Receita não encontrada");

      if (receita.origem_recorrente_id != null) {
         await db.query("DELETE FROM receitas WHERE id = ? AND mesa_id = ?", [
            id,
            mesaId,
         ]);
      } else {
         await db.query(
            `UPDATE receitas
             SET status = 'a_receber', valor_real = NULL, data_confirmacao = NULL
             WHERE id = ? AND mesa_id = ?`,
            [id, mesaId],
         );
      }
   }

   // ─── FIND BY ID ───────────────────────────────────────────────────────────

   static async findById(id, mesaId) {
      const [rows] = await db.query(
         `SELECT r.*,
             c.nome  AS categoria_nome,
             tp.nome AS tipo_pagamento_nome
          FROM receitas r
          LEFT JOIN categorias      c  ON r.categoria_id      = c.id
          LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
          WHERE r.id = ? AND r.mesa_id = ?`,
         [id, mesaId],
      );
      return rows[0];
   }

   static async findByMesaId(mesaId, incluirInativas = false) {
      let query = `
         SELECT r.*,
            c.nome  AS categoria_nome,
            tp.nome AS tipo_pagamento_nome
         FROM receitas r
         LEFT JOIN categorias      c  ON r.categoria_id      = c.id
         LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
         WHERE r.mesa_id = ?
      `;
      if (!incluirInativas) query += " AND r.ativa = TRUE";
      query += " ORDER BY r.data_recebimento DESC";
      const [rows] = await db.query(query, [mesaId]);
      return rows;
   }

   // ─── UPDATE ───────────────────────────────────────────────────────────────

   static async update(id, mesaId, dados) {
      const {
         descricao,
         valor,
         dataRecebimento,
         categoriaId,
         tipoPagamentoId,
         recorrente,
      } = dados;
      await db.query(
         `UPDATE receitas
          SET descricao = ?, valor = ?, data_recebimento = ?,
              categoria_id = ?, tipo_pagamento_id = ?, recorrente = ?
          WHERE id = ? AND mesa_id = ?`,
         [
            descricao,
            valor,
            dataRecebimento,
            categoriaId || null,
            tipoPagamentoId || null,
            recorrente ? 1 : 0,
            id,
            mesaId,
         ],
      );
   }

   // ─── SOFT DELETE ─────────────────────────────────────────────────────────

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
         `SELECT r.id FROM receitas r
          INNER JOIN mesa_usuarios mu ON r.mesa_id = mu.mesa_id
          WHERE r.id = ? AND mu.user_id = ?`,
         [receitaId, userId],
      );
      return rows.length > 0;
   }
}

module.exports = Receita;
