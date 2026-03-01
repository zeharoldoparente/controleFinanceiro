const db = require("../config/database");

class Fatura {
   /**
    * Retorna a fatura correta para um lançamento no cartão.
    * Se não existir, cria automaticamente.
    *
    * Regra:
    *   - dia do lançamento < dia_fechamento  → fatura do mês atual
    *   - dia do lançamento >= dia_fechamento → fatura do próximo mês
    */
   static async obterOuCriarFatura(cartaoId, mesaId, dataLancamento) {
      // Busca dados do cartão
      const [cartoes] = await db.query(
         "SELECT dia_fechamento, dia_vencimento FROM cartoes WHERE id = ? AND ativa = TRUE",
         [cartaoId],
      );
      if (!cartoes.length) throw new Error("Cartão não encontrado ou inativo");

      const { dia_fechamento, dia_vencimento } = cartoes[0];

      // Calcula a qual mês de referência pertence o lançamento
      const data = new Date(dataLancamento + "T12:00:00"); // evita bug de fuso
      const diaLancamento = data.getDate();
      const mesLancamento = data.getMonth(); // 0-11
      const anoLancamento = data.getFullYear();

      let mesRef, anoRef;
      if (diaLancamento < dia_fechamento) {
         // Cai na fatura do mês atual
         mesRef = mesLancamento + 1; // 1-12
         anoRef = anoLancamento;
      } else {
         // Cai na fatura do próximo mês
         mesRef = mesLancamento + 2; // 1-12
         anoRef = anoLancamento;
         if (mesRef > 12) {
            mesRef = 1;
            anoRef += 1;
         }
      }

      const mesReferenciaStr = `${anoRef}-${String(mesRef).padStart(2, "0")}-01`;

      // Data de fechamento: dia_fechamento do mês da fatura
      // Mas a fatura de "março" fecha no dia 02/03
      // mesRef aqui é o mês do vencimento, não do fechamento
      // Ex: fecha dia 2, vence dia 9 → fatura de março fecha 02/03 e vence 09/03
      const dataFechamento = `${anoRef}-${String(mesRef).padStart(2, "0")}-${String(dia_fechamento).padStart(2, "0")}`;
      const dataVencimento = `${anoRef}-${String(mesRef).padStart(2, "0")}-${String(dia_vencimento).padStart(2, "0")}`;

      // Verifica se já existe fatura para esse cartão/mês
      const [existentes] = await db.query(
         "SELECT id, valor_total, status FROM faturas WHERE cartao_id = ? AND mes_referencia = ? AND ativa = 1",
         [cartaoId, mesReferenciaStr],
      );

      if (existentes.length > 0) {
         return existentes[0];
      }

      // Cria nova fatura
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
    * Lista todas as faturas de um cartão, ordenadas por mês.
    * Inclui resumo das despesas vinculadas.
    */
   static async findByCartaoId(cartaoId, mesaId) {
      const [rows] = await db.query(
         `SELECT 
            f.*,
            c.nome AS cartao_nome,
            c.tipo AS cartao_tipo,
            COUNT(d.id) AS total_lancamentos
          FROM faturas f
          INNER JOIN cartoes c ON f.cartao_id = c.id
          LEFT JOIN despesas d ON d.fatura_id = f.id AND d.ativa = TRUE
          WHERE f.cartao_id = ? AND f.mesa_id = ? AND f.ativa = 1
          GROUP BY f.id
          ORDER BY f.mes_referencia DESC`,
         [cartaoId, mesaId],
      );
      return rows;
   }

   /**
    * Busca uma fatura com todos os seus lançamentos detalhados.
    */
   static async findByIdComDetalhes(faturaId, mesaId) {
      // Dados da fatura
      const [faturas] = await db.query(
         `SELECT f.*, c.nome AS cartao_nome, c.tipo AS cartao_tipo
          FROM faturas f
          INNER JOIN cartoes c ON f.cartao_id = c.id
          WHERE f.id = ? AND f.mesa_id = ? AND f.ativa = 1`,
         [faturaId, mesaId],
      );
      if (!faturas.length) return null;

      const fatura = faturas[0];

      // Lançamentos da fatura
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
    * Lista faturas de uma mesa para o mês informado.
    * Usado na aba Despesas para mostrar as linhas de fatura unificada.
    */
   static async findByMesaIdMes(mesaId, mes) {
      // mes formato: "YYYY-MM"
      const primeiroDia = `${mes}-01`;

      const [rows] = await db.query(
         `SELECT 
            f.*,
            c.nome AS cartao_nome,
            c.bandeira_id,
            c.cor AS cartao_cor
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
      // Busca a fatura
      const [faturas] = await db.query(
         "SELECT * FROM faturas WHERE id = ? AND mesa_id = ? AND ativa = 1",
         [faturaId, mesaId],
      );
      if (!faturas.length) throw new Error("Fatura não encontrada");
      if (faturas[0].status === "paga") throw new Error("Fatura já está paga");

      const hoje = dataPagamento || new Date().toISOString().slice(0, 10);
      const valorFinal = valorReal ?? faturas[0].valor_total;

      // Atualiza fatura
      await db.query(
         `UPDATE faturas 
          SET status = 'paga', valor_real = ?, data_pagamento = ?
          WHERE id = ? AND mesa_id = ?`,
         [valorFinal, hoje, faturaId, mesaId],
      );

      // Marca todas as despesas vinculadas como pagas
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
