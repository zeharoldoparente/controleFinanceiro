const db = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class Receita {
   static schemaPromise = null;

   static async ensureSchema() {
      if (!this.schemaPromise) {
         this.schemaPromise = (async () => {
            const [comprovanteColumn] = await db.query(
               `SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = 'receitas'
                  AND COLUMN_NAME = 'comprovante'`,
            );

            if (comprovanteColumn.length === 0) {
               await db.query(
                  "ALTER TABLE receitas ADD COLUMN comprovante VARCHAR(255) DEFAULT NULL COMMENT 'Nome do arquivo de comprovante' AFTER data_confirmacao",
               );
            }
         })().catch((error) => {
            this.schemaPromise = null;
            throw error;
         });
      }

      return this.schemaPromise;
   }

   static toCents(value) {
      return Math.round(parseFloat(String(value ?? 0)) * 100);
   }

   static distribuirCentavos(totalCentavos, quantidade) {
      if (quantidade <= 0) return [];

      const base = Math.floor(totalCentavos / quantidade);
      const resto = totalCentavos % quantidade;

      return Array.from({ length: quantidade }, (_, index) =>
         base + (index < resto ? 1 : 0),
      );
   }

   static async buscarParcelasPendentesPosteriores(
      grupoParcela,
      mesaId,
      parcelaAtual,
      connection = db,
   ) {
      const [rows] = await connection.query(
         `SELECT id, valor, parcela_atual
          FROM receitas
          WHERE grupo_parcela = ?
            AND mesa_id = ?
            AND ativa = TRUE
            AND status = 'a_receber'
            AND parcela_atual > ?
          ORDER BY parcela_atual ASC, id ASC`,
         [grupoParcela, mesaId, parcelaAtual],
      );

      return rows;
   }

   static async create(dados) {
      await Receita.ensureSchema();

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

      const totalParcelas = recorrente ? 1 : Math.max(1, parseInt(parcelas));
      const grupoParcela = totalParcelas > 1 ? uuidv4() : null;
      const ids = [];

      for (let i = 1; i <= totalParcelas; i += 1) {
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

   static async hasOrigemRecorrenteColumn() {
      try {
         const [cols] = await db.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'receitas' AND COLUMN_NAME = 'origem_recorrente_id'",
         );
         return cols.length > 0;
      } catch (_) {
         return false;
      }
   }

   static async hasDataCancelamentoColumn() {
      try {
         const [cols] = await db.query(
            "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'receitas' AND COLUMN_NAME = 'data_cancelamento'",
         );
         return cols.length > 0;
      } catch (_) {
         return false;
      }
   }

   static async findByMesaIdFiltrado(mesaId, mes) {
      await Receita.ensureSchema();

      const primeiroDia = `${mes}-01`;
      const hasNewColumns = await Receita.hasOrigemRecorrenteColumn();
      const hasDataCancelamento = hasNewColumns
         ? await Receita.hasDataCancelamentoColumn()
         : false;

      if (hasNewColumns && hasDataCancelamento) {
         const [rows] = await db.query(
            `SELECT
                r.*,
                c.nome  AS categoria_nome,
                tp.nome AS tipo_pagamento_nome
             FROM receitas r
             LEFT JOIN categorias c ON r.categoria_id = c.id
             LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
             WHERE r.mesa_id = ?
               AND r.ativa = TRUE
               AND (
                  (r.recorrente = FALSE AND r.origem_recorrente_id IS NULL
                   AND DATE_FORMAT(r.data_recebimento, '%Y-%m') = ?)
                  OR
                  (r.recorrente = TRUE AND r.data_recebimento <= LAST_DAY(?)
                   AND (
                      r.data_cancelamento IS NULL
                      OR DATE_FORMAT(r.data_cancelamento, '%Y-%m') > ?
                   )
                   AND NOT EXISTS (
                      SELECT 1 FROM receitas cf
                      WHERE cf.origem_recorrente_id = r.id
                        AND cf.mes_referencia = ?
                        AND cf.ativa = TRUE
                   ))
                  OR
                  (r.origem_recorrente_id IS NOT NULL AND r.mes_referencia = ?)
               )
             ORDER BY r.data_recebimento ASC, r.id ASC`,
            [mesaId, mes, primeiroDia, mes, mes, mes],
         );
         return rows;
      }

      if (hasNewColumns) {
         const [rows] = await db.query(
            `SELECT
                r.*,
                c.nome  AS categoria_nome,
                tp.nome AS tipo_pagamento_nome
             FROM receitas r
             LEFT JOIN categorias c ON r.categoria_id = c.id
             LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
             WHERE r.mesa_id = ?
               AND r.ativa = TRUE
               AND (
                  (r.recorrente = FALSE AND r.origem_recorrente_id IS NULL
                   AND DATE_FORMAT(r.data_recebimento, '%Y-%m') = ?)
                  OR
                  (r.recorrente = TRUE AND r.data_recebimento <= LAST_DAY(?)
                   AND NOT EXISTS (
                      SELECT 1 FROM receitas cf
                      WHERE cf.origem_recorrente_id = r.id
                        AND cf.mes_referencia = ?
                        AND cf.ativa = TRUE
                   ))
                  OR
                  (r.origem_recorrente_id IS NOT NULL AND r.mes_referencia = ?)
               )
             ORDER BY r.data_recebimento ASC, r.id ASC`,
            [mesaId, mes, primeiroDia, mes, mes],
         );
         return rows;
      }

      const [rows] = await db.query(
         `SELECT
             r.*,
             c.nome  AS categoria_nome,
             tp.nome AS tipo_pagamento_nome
          FROM receitas r
          LEFT JOIN categorias c ON r.categoria_id = c.id
          LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
          WHERE r.mesa_id = ?
            AND r.ativa = TRUE
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

   static async confirmar(id, mesaId, valorReal, mes, options = {}) {
      await Receita.ensureSchema();

      const receita = await Receita.findById(id, mesaId);
      if (!receita) throw new Error("Receita nao encontrada");

      const valorConfirmado = parseFloat(String(valorReal ?? receita.valor));
      const comprovante = options.comprovante || null;
      const ajusteRestante =
         options.ajusteRestante === "redistribuir"
            ? "redistribuir"
            : "desconto";

      if (receita.recorrente) {
         const [existing] = await db.query(
            `SELECT id
             FROM receitas
             WHERE origem_recorrente_id = ?
               AND mes_referencia = ?
               AND ativa = TRUE`,
            [id, mes],
         );

         if (existing.length > 0) {
            throw new Error("Recebimento ja confirmado para este mes");
         }

         const [result] = await db.query(
            `INSERT INTO receitas
             (mesa_id, descricao, valor, data_recebimento, categoria_id,
              tipo_pagamento_id, recorrente, status, valor_real, data_confirmacao,
              comprovante, origem_recorrente_id, mes_referencia, ativa)
             VALUES (?, ?, ?, ?, ?, ?, FALSE, 'recebida', ?, CURDATE(), ?, ?, ?, TRUE)`,
            [
               mesaId,
               receita.descricao,
               receita.valor,
               `${mes}-01`,
               receita.categoria_id || null,
               receita.tipo_pagamento_id || null,
               valorConfirmado,
               comprovante,
               id,
               mes,
            ],
         );

         return { tipo: "recorrente", novoId: result.insertId };
      }

      if (receita.status === "recebida") {
         throw new Error("Receita ja confirmada");
      }

      const valorPrevistoAtual = parseFloat(String(receita.valor ?? 0));
      const ehParceladaAjustavel =
         receita.origem_recorrente_id == null &&
         !receita.recorrente &&
         Number(receita.parcelas) > 1 &&
         valorConfirmado < valorPrevistoAtual;

      const connection = await db.getConnection();

      try {
         await connection.beginTransaction();

         if (ehParceladaAjustavel) {
            const diferencaCentavos =
               Receita.toCents(valorPrevistoAtual) -
               Receita.toCents(valorConfirmado);

            const parcelasPendentes = receita.grupo_parcela
               ? await Receita.buscarParcelasPendentesPosteriores(
                    receita.grupo_parcela,
                    mesaId,
                    receita.parcela_atual,
                    connection,
                 )
               : [];

            if (
               ajusteRestante === "redistribuir" &&
               parcelasPendentes.length === 0
            ) {
               throw new Error(
                  "Nao ha parcelas restantes para redistribuir a diferenca",
               );
            }

            await connection.query(
               `UPDATE receitas
                SET valor = ?, status = 'recebida', valor_real = ?, data_confirmacao = CURDATE(), comprovante = ?
                WHERE id = ? AND mesa_id = ?`,
               [valorConfirmado, valorConfirmado, comprovante, id, mesaId],
            );

            if (
               ajusteRestante === "redistribuir" &&
               diferencaCentavos > 0 &&
               parcelasPendentes.length > 0
            ) {
               const distribuicao = Receita.distribuirCentavos(
                  diferencaCentavos,
                  parcelasPendentes.length,
               );

               for (let index = 0; index < parcelasPendentes.length; index += 1) {
                  const parcela = parcelasPendentes[index];
                  const incremento = distribuicao[index] / 100;
                  const novoValor =
                     parseFloat(String(parcela.valor ?? 0)) + incremento;

                  await connection.query(
                     `UPDATE receitas
                      SET valor = ?
                      WHERE id = ? AND mesa_id = ?`,
                     [novoValor, parcela.id, mesaId],
                  );
               }
            }

            await connection.commit();

            return {
               tipo: "normal",
               ajuste_aplicado: ajusteRestante,
            };
         }

         await connection.query(
            `UPDATE receitas
             SET status = 'recebida', valor_real = ?, data_confirmacao = CURDATE(), comprovante = ?
             WHERE id = ? AND mesa_id = ?`,
            [valorConfirmado, comprovante, id, mesaId],
         );

         await connection.commit();
         return { tipo: "normal" };
      } catch (error) {
         await connection.rollback();
         throw error;
      } finally {
         connection.release();
      }
   }

   static async desfazerConfirmacao(id, mesaId) {
      await Receita.ensureSchema();

      const receita = await Receita.findById(id, mesaId);
      if (!receita) throw new Error("Receita nao encontrada");

      if (receita.origem_recorrente_id != null) {
         await db.query("DELETE FROM receitas WHERE id = ? AND mesa_id = ?", [
            id,
            mesaId,
         ]);
      } else {
         await db.query(
            `UPDATE receitas
             SET status = 'a_receber', valor_real = NULL, data_confirmacao = NULL, comprovante = NULL
             WHERE id = ? AND mesa_id = ?`,
            [id, mesaId],
         );
      }
   }

   static async findById(id, mesaId) {
      await Receita.ensureSchema();

      const [rows] = await db.query(
         `SELECT r.*,
             c.nome  AS categoria_nome,
             tp.nome AS tipo_pagamento_nome
          FROM receitas r
          LEFT JOIN categorias c ON r.categoria_id = c.id
          LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
          WHERE r.id = ? AND r.mesa_id = ?`,
         [id, mesaId],
      );
      return rows[0];
   }

   static async findByGrupoParcela(grupoParcela, mesaId) {
      await Receita.ensureSchema();

      const [rows] = await db.query(
         `SELECT r.*,
             c.nome  AS categoria_nome,
             tp.nome AS tipo_pagamento_nome
          FROM receitas r
          LEFT JOIN categorias c ON r.categoria_id = c.id
          LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
          WHERE r.grupo_parcela = ? AND r.mesa_id = ?
          ORDER BY r.parcela_atual ASC`,
         [grupoParcela, mesaId],
      );
      return rows;
   }

   static async findByMesaId(mesaId, incluirInativas = false) {
      await Receita.ensureSchema();

      let query = `
         SELECT r.*,
            c.nome  AS categoria_nome,
            tp.nome AS tipo_pagamento_nome
         FROM receitas r
         LEFT JOIN categorias c ON r.categoria_id = c.id
         LEFT JOIN tipos_pagamento tp ON r.tipo_pagamento_id = tp.id
         WHERE r.mesa_id = ?
      `;

      if (!incluirInativas) query += " AND r.ativa = TRUE";
      query += " ORDER BY r.data_recebimento DESC";

      const [rows] = await db.query(query, [mesaId]);
      return rows;
   }

   static async update(id, mesaId, dados) {
      await Receita.ensureSchema();

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

   static async cancelarRecorrencia(id, mesaId, dataCancelamento) {
      const hasDataCancelamento = await Receita.hasDataCancelamentoColumn();
      if (!hasDataCancelamento) {
         throw new Error("COLUNA_DATA_CANCELAMENTO_AUSENTE");
      }

      await db.query(
         `UPDATE receitas
          SET data_cancelamento = ?
          WHERE id = ? AND mesa_id = ? AND recorrente = TRUE`,
         [dataCancelamento, id, mesaId],
      );
   }

   static async inativarGrupoApartirParcela(grupoParcela, mesaId, parcelaAtual) {
      await db.query(
         `UPDATE receitas
          SET ativa = FALSE
          WHERE grupo_parcela = ?
            AND mesa_id = ?
            AND parcela_atual >= ?`,
         [grupoParcela, mesaId, parcelaAtual],
      );
   }

   static async inativarConfirmacoesRecorrentesApartirMes(
      origemRecorrenteId,
      mesaId,
      mesReferencia,
   ) {
      await db.query(
         `UPDATE receitas
          SET ativa = FALSE
          WHERE origem_recorrente_id = ?
            AND mesa_id = ?
            AND mes_referencia IS NOT NULL
            AND mes_referencia >= ?`,
         [origemRecorrenteId, mesaId, mesReferencia],
      );
   }

   static async inativarRecorrenciaCompleta(origemRecorrenteId, mesaId) {
      await db.query(
         `UPDATE receitas
          SET ativa = FALSE
          WHERE mesa_id = ?
            AND (id = ? OR origem_recorrente_id = ?)`,
         [mesaId, origemRecorrenteId, origemRecorrenteId],
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

   static async atualizarComprovante(id, mesaId, comprovante) {
      await Receita.ensureSchema();

      await db.query(
         "UPDATE receitas SET comprovante = ? WHERE id = ? AND mesa_id = ?",
         [comprovante, id, mesaId],
      );
   }

   static async getComprovante(id, mesaId) {
      await Receita.ensureSchema();

      const [rows] = await db.query(
         "SELECT comprovante FROM receitas WHERE id = ? AND mesa_id = ?",
         [id, mesaId],
      );
      return rows[0]?.comprovante || null;
   }

   static async removerComprovante(id, mesaId) {
      await Receita.ensureSchema();

      await db.query(
         "UPDATE receitas SET comprovante = NULL WHERE id = ? AND mesa_id = ?",
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
