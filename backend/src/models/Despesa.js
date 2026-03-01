const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const Fatura = require("./Fatura");

class Despesa {
   /**
    * Cria uma ou mais despesas.
    *
    * CARTÃO DE CRÉDITO:
    *   - O valor informado é o TOTAL. O sistema divide por parcelas.
    *   - Cada parcela é vinculada à fatura correta do mês.
    *   - Parcelas futuras vão para faturas dos meses subsequentes.
    *
    * OUTROS PAGAMENTOS (Pix, dinheiro, débito, etc.):
    *   - O valor informado é o TOTAL. O sistema divide por parcelas.
    *   - Se parcelas > 1, cria N registros mês a mês (mesmo padrão das receitas).
    *   - Recorrente não pode ter parcelas.
    *
    * Retorna array de IDs criados.
    */
   static async create(dados) {
      const {
         mesaId,
         descricao,
         tipo,
         valorTotal, // NOVO: valor total da compra
         dataVencimento,
         categoriaId,
         tipoPagamentoId,
         cartaoId,
         recorrente,
         parcelas,
      } = dados;

      const totalParcelas = recorrente
         ? 1
         : Math.max(1, parseInt(parcelas) || 1);
      if (totalParcelas > 60) throw new Error("Máximo de 60 parcelas");

      const valorParcela = parseFloat((valorTotal / totalParcelas).toFixed(2));
      const grupoParcela = totalParcelas > 1 ? uuidv4() : uuidv4(); // sempre gera para rastreabilidade

      const isCartaoCredito = !!cartaoId;
      const ids = [];

      for (let i = 1; i <= totalParcelas; i++) {
         // Calcula a data de cada parcela (mês a mês)
         const [ano, mes, dia] = dataVencimento.split("-").map(Number);
         const dataBase = new Date(ano, mes - 1 + (i - 1), dia);
         const dataFormatada = `${dataBase.getFullYear()}-${String(dataBase.getMonth() + 1).padStart(2, "0")}-${String(dataBase.getDate()).padStart(2, "0")}`;

         const descFinal =
            totalParcelas > 1
               ? `${descricao} (${i}/${totalParcelas})`
               : descricao;

         let faturaId = null;

         if (isCartaoCredito) {
            // Vincula à fatura correta baseado na data do lançamento
            const fatura = await Fatura.obterOuCriarFatura(
               cartaoId,
               mesaId,
               dataFormatada,
            );
            faturaId = fatura.id;
         }

         const [result] = await db.query(
            `INSERT INTO despesas 
             (mesa_id, descricao, tipo, valor_provisionado, data_vencimento, 
              categoria_id, tipo_pagamento_id, cartao_id, recorrente, 
              parcelas, parcela_atual, parcela_grupo_id, fatura_id, ativa)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
            [
               mesaId,
               descFinal,
               tipo || "variavel",
               valorParcela,
               dataFormatada,
               categoriaId || null,
               tipoPagamentoId || null,
               cartaoId || null,
               recorrente ? 1 : 0,
               totalParcelas,
               i,
               grupoParcela,
               faturaId,
            ],
         );

         ids.push(result.insertId);

         // Recalcula o total da fatura após cada inserção
         if (faturaId) {
            await Fatura.recalcularTotal(faturaId);
         }
      }

      return ids;
   }

   /**
    * Busca filtrada por mês para a aba Despesas.
    *
    * CARTÃO DE CRÉDITO: NÃO aparece aqui (é tratado como fatura separada).
    * OUTROS: aparece normalmente (normal, recorrente, parcelada).
    */
   static async findByMesaIdFiltrado(mesaId, mes) {
      const primeiroDia = `${mes}-01`;

      const [rows] = await db.query(
         `SELECT 
            d.*,
            c.nome  AS categoria_nome,
            tp.nome AS tipo_pagamento_nome,
            car.nome AS cartao_nome
          FROM despesas d
          LEFT JOIN categorias c      ON d.categoria_id      = c.id
          LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
          LEFT JOIN cartoes car        ON d.cartao_id         = car.id
          WHERE d.mesa_id = ?
            AND d.ativa   = TRUE
            AND d.fatura_id IS NULL          -- exclui despesas de cartão de crédito
            AND (
               -- Normal (não recorrente): apenas no mês exato
               (d.recorrente = FALSE AND DATE_FORMAT(d.data_vencimento, '%Y-%m') = ?)
               OR
               -- Recorrente: do mês de criação em diante (sem cancelamento)
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

   // Mantido para compatibilidade
   static async findByMesaId(mesaId, incluirInativas = false) {
      let query = `
         SELECT 
            d.*,
            c.nome  AS categoria_nome,
            tp.nome AS tipo_pagamento_nome,
            car.nome AS cartao_nome
         FROM despesas d
         LEFT JOIN categorias c      ON d.categoria_id      = c.id
         LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
         LEFT JOIN cartoes car        ON d.cartao_id         = car.id
         WHERE d.mesa_id = ?
      `;
      if (!incluirInativas) query += " AND d.ativa = TRUE";
      query += " ORDER BY d.data_vencimento ASC";
      const [rows] = await db.query(query, [mesaId]);
      return rows;
   }

   static async findById(id, mesaId) {
      const [rows] = await db.query(
         `SELECT 
            d.*,
            c.nome  AS categoria_nome,
            tp.nome AS tipo_pagamento_nome,
            car.nome AS cartao_nome
          FROM despesas d
          LEFT JOIN categorias c      ON d.categoria_id      = c.id
          LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
          LEFT JOIN cartoes car        ON d.cartao_id         = car.id
          WHERE d.id = ? AND d.mesa_id = ?`,
         [id, mesaId],
      );
      return rows[0];
   }

   static async findByParcelaGrupo(parcelaGrupoId, mesaId) {
      const [rows] = await db.query(
         `SELECT 
            d.*,
            c.nome  AS categoria_nome,
            tp.nome AS tipo_pagamento_nome,
            car.nome AS cartao_nome
          FROM despesas d
          LEFT JOIN categorias c      ON d.categoria_id      = c.id
          LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
          LEFT JOIN cartoes car        ON d.cartao_id         = car.id
          WHERE d.parcela_grupo_id = ? AND d.mesa_id = ?
          ORDER BY d.parcela_atual ASC`,
         [parcelaGrupoId, mesaId],
      );
      return rows;
   }

   static async update(id, mesaId, dados) {
      const {
         descricao,
         tipo,
         valorProvisionado,
         dataVencimento,
         categoriaId,
         tipoPagamentoId,
         cartaoId,
         recorrente,
      } = dados;

      await db.query(
         `UPDATE despesas 
          SET descricao = ?, tipo = ?, valor_provisionado = ?, data_vencimento = ?,
              categoria_id = ?, tipo_pagamento_id = ?, cartao_id = ?, recorrente = ?
          WHERE id = ? AND mesa_id = ?`,
         [
            descricao,
            tipo || "variavel",
            valorProvisionado,
            dataVencimento,
            categoriaId || null,
            tipoPagamentoId || null,
            cartaoId || null,
            recorrente ? 1 : 0,
            id,
            mesaId,
         ],
      );

      // Se a despesa tem fatura, recalcula o total
      const despesa = await Despesa.findById(id, mesaId);
      if (despesa?.fatura_id) {
         await Fatura.recalcularTotal(despesa.fatura_id);
      }
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

   static async cancelarRecorrencia(id, mesaId, dataCancelamento) {
      await db.query(
         `UPDATE despesas 
          SET data_cancelamento = ?
          WHERE id = ? AND mesa_id = ? AND recorrente = TRUE`,
         [dataCancelamento, id, mesaId],
      );
   }

   static async removerCancelamento(id, mesaId) {
      await db.query(
         "UPDATE despesas SET data_cancelamento = NULL WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
   }

   static async inativar(id, mesaId) {
      const despesa = await Despesa.findById(id, mesaId);
      await db.query(
         "UPDATE despesas SET ativa = FALSE WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
      // Recalcula fatura se necessário
      if (despesa?.fatura_id) {
         await Fatura.recalcularTotal(despesa.fatura_id);
      }
   }

   static async inativarGrupo(parcelaGrupoId, mesaId) {
      // Busca fatura_id de qualquer despesa do grupo antes de inativar
      const [rows] = await db.query(
         "SELECT DISTINCT fatura_id FROM despesas WHERE parcela_grupo_id = ? AND mesa_id = ? AND fatura_id IS NOT NULL",
         [parcelaGrupoId, mesaId],
      );

      await db.query(
         "UPDATE despesas SET ativa = FALSE WHERE parcela_grupo_id = ? AND mesa_id = ?",
         [parcelaGrupoId, mesaId],
      );

      // Recalcula todas as faturas afetadas
      for (const row of rows) {
         await Fatura.recalcularTotal(row.fatura_id);
      }
   }

   static async reativar(id, mesaId) {
      await db.query(
         "UPDATE despesas SET ativa = TRUE WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
      const despesa = await Despesa.findById(id, mesaId);
      if (despesa?.fatura_id) {
         await Fatura.recalcularTotal(despesa.fatura_id);
      }
   }

   static async delete(id, mesaId) {
      const despesa = await Despesa.findById(id, mesaId);
      await db.query("DELETE FROM despesas WHERE id = ? AND mesa_id = ?", [
         id,
         mesaId,
      ]);
      if (despesa?.fatura_id) {
         await Fatura.recalcularTotal(despesa.fatura_id);
      }
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
