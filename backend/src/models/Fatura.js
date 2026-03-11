const db = require("../config/database");

class Fatura {
   static schemaPromise = null;

   static async getSchemaInfo() {
      if (!this.schemaPromise) {
         this.schemaPromise = (async () => {
            const [cartaoColumns] = await db.query(
               `
               SELECT COLUMN_NAME
               FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'cartoes'
               `,
            );

            const cartaoColumnSet = new Set(
               cartaoColumns.map((c) => c.COLUMN_NAME),
            );

            return {
               hasTipo: cartaoColumnSet.has("tipo"),
               hasTipoPagamentoId: cartaoColumnSet.has("tipo_pagamento_id"),
               hasCor: cartaoColumnSet.has("cor"),
            };
         })().catch((error) => {
            this.schemaPromise = null;
            throw error;
         });
      }

      return this.schemaPromise;
   }

   static buildCartaoTipoSelect(schemaInfo, alias = "cartao_tipo") {
      if (schemaInfo.hasTipo) return `c.tipo AS ${alias}`;
      if (schemaInfo.hasTipoPagamentoId) {
         return `CASE
            WHEN LOWER(tp.nome) LIKE '%debito%' OR LOWER(tp.nome) LIKE '%débito%' THEN 'debito'
            ELSE 'credito'
          END AS ${alias}`;
      }
      return `'credito' AS ${alias}`;
   }

   /**
    * Retorna a fatura correta para um lancamento no cartao.
    * Se nao existir, cria automaticamente.
    *
    * Regra:
    *   - dia do lancamento < dia_fechamento  -> fatura do mes atual
    *   - dia do lancamento >= dia_fechamento -> fatura do proximo mes
    */
   static async obterOuCriarFatura(cartaoId, mesaId, dataLancamento) {
      const [cartoes] = await db.query(
         "SELECT dia_fechamento, dia_vencimento FROM cartoes WHERE id = ? AND ativa = TRUE",
         [cartaoId],
      );
      if (!cartoes.length) throw new Error("Cartão não encontrado ou inativo");

      const { dia_fechamento, dia_vencimento } = cartoes[0];

      const data = new Date(dataLancamento + "T12:00:00");
      const diaLancamento = data.getDate();
      const mesLancamento = data.getMonth();
      const anoLancamento = data.getFullYear();

      let mesRef;
      let anoRef;
      if (diaLancamento < dia_fechamento) {
         mesRef = mesLancamento + 1;
         anoRef = anoLancamento;
      } else {
         mesRef = mesLancamento + 2;
         anoRef = anoLancamento;
         if (mesRef > 12) {
            mesRef = 1;
            anoRef += 1;
         }
      }

      const mesReferenciaStr = `${anoRef}-${String(mesRef).padStart(2, "0")}-01`;
      const dataFechamento = `${anoRef}-${String(mesRef).padStart(2, "0")}-${String(dia_fechamento).padStart(2, "0")}`;
      const dataVencimento = `${anoRef}-${String(mesRef).padStart(2, "0")}-${String(dia_vencimento).padStart(2, "0")}`;

      const [existentes] = await db.query(
         "SELECT id, valor_total, status FROM faturas WHERE cartao_id = ? AND mesa_id = ? AND mes_referencia = ? AND ativa = 1",
         [cartaoId, mesaId, mesReferenciaStr],
      );

      if (existentes.length > 0) {
         return existentes[0];
      }

      const [result] = await db.query(
         `INSERT INTO faturas
          (cartao_id, mesa_id, mes_referencia, data_fechamento, data_vencimento, valor_total, status)
          VALUES (?, ?, ?, ?, ?, 0.00, 'aberta')`,
         [cartaoId, mesaId, mesReferenciaStr, dataFechamento, dataVencimento],
      );

      return { id: result.insertId, valor_total: 0, status: "aberta" };
   }

   /**
    * Recalcula e atualiza o valor_total de uma fatura
    * somando todas as despesas ativas vinculadas a ela.
    */
   static async recalcularTotal(faturaId) {
      await db.query(
         `UPDATE faturas f
          SET f.valor_total = (
             SELECT COALESCE(SUM(d.valor_provisionado), 0)
             FROM despesas d
             WHERE d.fatura_id = ? AND d.ativa = TRUE
          )
          WHERE f.id = ?`,
         [faturaId, faturaId],
      );
   }

   /**
    * Lista todas as faturas de um cartao, ordenadas por mes.
    * Inclui resumo das despesas vinculadas.
    */
   static async findByCartaoId(cartaoId, mesaId) {
      const schemaInfo = await this.getSchemaInfo();
      const cartaoTipoSelect = this.buildCartaoTipoSelect(schemaInfo);

      const [rows] = await db.query(
         `SELECT
            f.*,
            c.nome AS cartao_nome,
            ${cartaoTipoSelect},
            COUNT(d.id) AS total_lancamentos
          FROM faturas f
          INNER JOIN cartoes c ON f.cartao_id = c.id
          ${
             schemaInfo.hasTipoPagamentoId
                ? "LEFT JOIN tipos_pagamento tp ON c.tipo_pagamento_id = tp.id"
                : ""
          }
          LEFT JOIN despesas d ON d.fatura_id = f.id AND d.ativa = TRUE
          WHERE f.cartao_id = ? AND f.mesa_id = ? AND f.ativa = 1
          GROUP BY f.id
          ORDER BY f.mes_referencia DESC`,
         [cartaoId, mesaId],
      );
      return rows;
   }

   /**
    * Busca uma fatura com todos os seus lancamentos detalhados.
    */
   static async findByIdComDetalhes(faturaId, mesaId) {
      const schemaInfo = await this.getSchemaInfo();
      const cartaoTipoSelect = this.buildCartaoTipoSelect(schemaInfo);

      const [faturas] = await db.query(
         `SELECT f.*, c.nome AS cartao_nome, ${cartaoTipoSelect}
          FROM faturas f
          INNER JOIN cartoes c ON f.cartao_id = c.id
          ${
             schemaInfo.hasTipoPagamentoId
                ? "LEFT JOIN tipos_pagamento tp ON c.tipo_pagamento_id = tp.id"
                : ""
          }
          WHERE f.id = ? AND f.mesa_id = ? AND f.ativa = 1`,
         [faturaId, mesaId],
      );
      if (!faturas.length) return null;

      const fatura = faturas[0];

      const [lancamentos] = await db.query(
         `SELECT
            d.*,
            cat.nome AS categoria_nome,
            tp.nome AS tipo_pagamento_nome
          FROM despesas d
          LEFT JOIN categorias cat ON d.categoria_id = cat.id
          LEFT JOIN tipos_pagamento tp ON d.tipo_pagamento_id = tp.id
          WHERE d.fatura_id = ? AND d.ativa = TRUE
          ORDER BY d.data_vencimento ASC, d.id ASC`,
         [faturaId],
      );

      return { ...fatura, lancamentos };
   }

   /**
    * Lista faturas de uma mesa para o mes informado.
    * Usado na aba Despesas para mostrar as linhas de fatura unificada.
    */
   static async findByMesaIdMes(mesaId, mes) {
      const schemaInfo = await this.getSchemaInfo();
      const cartaoCorSelect = schemaInfo.hasCor
         ? "c.cor AS cartao_cor"
         : "NULL AS cartao_cor";

      const [rows] = await db.query(
         `SELECT
            f.*,
            c.nome AS cartao_nome,
            c.bandeira_id,
            ${cartaoCorSelect}
          FROM faturas f
          INNER JOIN cartoes c ON f.cartao_id = c.id
          WHERE f.mesa_id = ?
            AND DATE_FORMAT(f.data_vencimento, '%Y-%m') = ?
            AND f.ativa = 1
          ORDER BY f.data_vencimento ASC`,
         [mesaId, mes],
      );
      return rows;
   }

   /**
    * Marca uma fatura como paga.
    */
   static async pagar(faturaId, mesaId, valorReal, dataPagamento) {
      const [faturas] = await db.query(
         "SELECT * FROM faturas WHERE id = ? AND mesa_id = ? AND ativa = 1",
         [faturaId, mesaId],
      );
      if (!faturas.length) throw new Error("Fatura não encontrada");
      if (faturas[0].status === "paga") throw new Error("Fatura já está paga");

      const hoje = dataPagamento || new Date().toISOString().slice(0, 10);
      const valorFinal = valorReal ?? faturas[0].valor_total;

      await db.query(
         `UPDATE faturas
          SET status = 'paga', valor_real = ?, data_pagamento = ?
          WHERE id = ? AND mesa_id = ?`,
         [valorFinal, hoje, faturaId, mesaId],
      );

      await db.query(
         `UPDATE despesas
          SET paga = TRUE, valor_real = valor_provisionado, data_pagamento = ?
          WHERE fatura_id = ? AND ativa = TRUE`,
         [hoje, faturaId],
      );

      return { faturaId, valorPago: valorFinal };
   }

   /**
    * Desfaz o pagamento de uma fatura.
    */
   static async desfazerPagamento(faturaId, mesaId) {
      const [faturas] = await db.query(
         "SELECT * FROM faturas WHERE id = ? AND mesa_id = ? AND ativa = 1",
         [faturaId, mesaId],
      );
      if (!faturas.length) throw new Error("Fatura não encontrada");
      if (faturas[0].status !== "paga") throw new Error("Fatura não está paga");

      await db.query(
         `UPDATE faturas
          SET status = 'aberta', valor_real = NULL, data_pagamento = NULL
          WHERE id = ? AND mesa_id = ?`,
         [faturaId, mesaId],
      );

      await db.query(
         `UPDATE despesas
          SET paga = FALSE, valor_real = NULL, data_pagamento = NULL
          WHERE fatura_id = ? AND ativa = TRUE`,
         [faturaId],
      );
   }

   static async findById(faturaId, mesaId) {
      const [rows] = await db.query(
         "SELECT * FROM faturas WHERE id = ? AND mesa_id = ? AND ativa = 1",
         [faturaId, mesaId],
      );
      return rows[0];
   }
}

module.exports = Fatura;
