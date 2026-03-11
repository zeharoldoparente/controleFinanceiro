const db = require("../config/database");

class Cartao {
   static schemaPromise = null;

   static normalize(value = "") {
      return String(value)
         .normalize("NFD")
         .replace(/[\u0300-\u036f]/g, "")
         .toLowerCase()
         .trim();
   }

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

            const [tipoPagamentoColumns] = await db.query(
               `
               SELECT COLUMN_NAME
               FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'tipos_pagamento'
               `,
            );

            const cartaoColumnSet = new Set(
               cartaoColumns.map((c) => c.COLUMN_NAME),
            );
            const tipoPagamentoColumnSet = new Set(
               tipoPagamentoColumns.map((c) => c.COLUMN_NAME),
            );

            return {
               hasTipo: cartaoColumnSet.has("tipo"),
               hasTipoPagamentoId: cartaoColumnSet.has("tipo_pagamento_id"),
               hasLimiteReal: cartaoColumnSet.has("limite_real"),
               hasLimitePessoal: cartaoColumnSet.has("limite_pessoal"),
               hasDiaFechamento: cartaoColumnSet.has("dia_fechamento"),
               hasDiaVencimento: cartaoColumnSet.has("dia_vencimento"),
               hasCor: cartaoColumnSet.has("cor"),
               hasAtiva: cartaoColumnSet.has("ativa"),
               hasCreatedAt: cartaoColumnSet.has("created_at"),
               hasUpdatedAt: cartaoColumnSet.has("updated_at"),
               tipoPagamentoHasUserId: tipoPagamentoColumnSet.has("user_id"),
            };
         })().catch((error) => {
            this.schemaPromise = null;
            throw error;
         });
      }

      return this.schemaPromise;
   }

   static async resolveTipoPagamentoId(tipo, userId, schemaInfo) {
      if (!schemaInfo.hasTipoPagamentoId) return null;

      const tipoNormalizado = this.normalize(tipo) === "debito" ? "debito" : "credito";

      const queryBase = `
         SELECT id, nome${schemaInfo.tipoPagamentoHasUserId ? ", user_id" : ""}
         FROM tipos_pagamento
         WHERE ativa = TRUE
      `;

      let rows;
      if (schemaInfo.tipoPagamentoHasUserId) {
         [rows] = await db.query(
            `${queryBase}
             AND (user_id IS NULL OR user_id = ?)
             ORDER BY user_id = ? DESC, user_id IS NULL DESC, id ASC`,
            [userId, userId],
         );
      } else {
         [rows] = await db.query(`${queryBase} ORDER BY id ASC`);
      }

      const match = rows.find((row) => {
         const nome = this.normalize(row.nome);
         return nome.includes("cartao") && nome.includes(tipoNormalizado);
      });

      if (!match) {
         throw new Error(`Tipo de pagamento para cartao '${tipo}' nao encontrado`);
      }

      return match.id;
   }

   static async create(
      userId,
      nome,
      tipo,
      bandeiraId,
      limiteReal,
      limitePessoal,
      diaFechamento,
      diaVencimento,
      cor,
   ) {
      const schemaInfo = await this.getSchemaInfo();
      const tipoPagamentoId = await this.resolveTipoPagamentoId(
         tipo,
         userId,
         schemaInfo,
      );

      const fields = ["user_id", "nome", "bandeira_id"];
      const values = [userId, nome, bandeiraId];

      if (schemaInfo.hasTipo) {
         fields.push("tipo");
         values.push(tipo);
      }
      if (schemaInfo.hasTipoPagamentoId) {
         fields.push("tipo_pagamento_id");
         values.push(tipoPagamentoId);
      }
      if (schemaInfo.hasLimiteReal) {
         fields.push("limite_real");
         values.push(limiteReal);
      }
      if (schemaInfo.hasLimitePessoal) {
         fields.push("limite_pessoal");
         values.push(limitePessoal);
      }
      if (schemaInfo.hasDiaFechamento) {
         fields.push("dia_fechamento");
         values.push(diaFechamento);
      }
      if (schemaInfo.hasDiaVencimento) {
         fields.push("dia_vencimento");
         values.push(diaVencimento);
      }
      if (schemaInfo.hasCor) {
         fields.push("cor");
         values.push(cor);
      }
      if (schemaInfo.hasAtiva) {
         fields.push("ativa");
         values.push(true);
      }

      const [result] = await db.query(
         `INSERT INTO cartoes (${fields.join(", ")}) VALUES (${fields
            .map(() => "?")
            .join(", ")})`,
         values,
      );
      return result.insertId;
   }

   static async findAll(userId, incluirInativas = false) {
      const schemaInfo = await this.getSchemaInfo();

      const selectTipo = schemaInfo.hasTipo
         ? "c.tipo AS tipo"
         : schemaInfo.hasTipoPagamentoId
           ? `CASE
               WHEN LOWER(tp.nome) LIKE '%debito%' THEN 'debito'
               ELSE 'credito'
             END AS tipo`
           : "'credito' AS tipo";

      const selectFields = [
         "c.id",
         "c.user_id",
         "c.nome",
         "c.bandeira_id",
         schemaInfo.hasTipoPagamentoId
            ? "c.tipo_pagamento_id"
            : "NULL AS tipo_pagamento_id",
         schemaInfo.hasTipoPagamentoId
            ? "tp.nome AS tipo_pagamento_nome"
            : "NULL AS tipo_pagamento_nome",
         selectTipo,
         schemaInfo.hasLimiteReal ? "c.limite_real" : "NULL AS limite_real",
         schemaInfo.hasLimitePessoal
            ? "c.limite_pessoal"
            : "NULL AS limite_pessoal",
         schemaInfo.hasDiaFechamento
            ? "c.dia_fechamento"
            : "NULL AS dia_fechamento",
         schemaInfo.hasDiaVencimento
            ? "c.dia_vencimento"
            : "NULL AS dia_vencimento",
         schemaInfo.hasCor ? "c.cor" : "NULL AS cor",
         schemaInfo.hasAtiva ? "c.ativa" : "TRUE AS ativa",
         schemaInfo.hasCreatedAt ? "c.created_at" : "NULL AS created_at",
         schemaInfo.hasUpdatedAt ? "c.updated_at" : "NULL AS updated_at",
         "b.nome AS bandeira_nome",
      ];

      let query = `
         SELECT
            ${selectFields.join(",\n            ")}
         FROM cartoes c
         LEFT JOIN bandeiras b ON c.bandeira_id = b.id
         ${
            schemaInfo.hasTipoPagamentoId
               ? "LEFT JOIN tipos_pagamento tp ON c.tipo_pagamento_id = tp.id"
               : ""
         }
         WHERE c.user_id = ?
      `;

      if (!incluirInativas && schemaInfo.hasAtiva) {
         query += " AND c.ativa = TRUE";
      }

      query += " ORDER BY c.nome ASC";

      const [rows] = await db.query(query, [userId]);
      return rows;
   }

   static async findById(id, userId) {
      const schemaInfo = await this.getSchemaInfo();
      const selectTipo = schemaInfo.hasTipo
         ? "c.tipo AS tipo"
         : schemaInfo.hasTipoPagamentoId
           ? `CASE
               WHEN LOWER(tp.nome) LIKE '%debito%' THEN 'debito'
               ELSE 'credito'
             END AS tipo`
           : "'credito' AS tipo";

      const [rows] = await db.query(
         `SELECT
            c.id,
            c.user_id,
            c.nome,
            c.bandeira_id,
            ${schemaInfo.hasTipoPagamentoId ? "c.tipo_pagamento_id" : "NULL AS tipo_pagamento_id"},
            ${schemaInfo.hasTipoPagamentoId ? "tp.nome AS tipo_pagamento_nome" : "NULL AS tipo_pagamento_nome"},
            ${selectTipo},
            ${schemaInfo.hasLimiteReal ? "c.limite_real" : "NULL AS limite_real"},
            ${schemaInfo.hasLimitePessoal ? "c.limite_pessoal" : "NULL AS limite_pessoal"},
            ${schemaInfo.hasDiaFechamento ? "c.dia_fechamento" : "NULL AS dia_fechamento"},
            ${schemaInfo.hasDiaVencimento ? "c.dia_vencimento" : "NULL AS dia_vencimento"},
            ${schemaInfo.hasCor ? "c.cor" : "NULL AS cor"},
            ${schemaInfo.hasAtiva ? "c.ativa" : "TRUE AS ativa"},
            ${schemaInfo.hasCreatedAt ? "c.created_at" : "NULL AS created_at"},
            ${schemaInfo.hasUpdatedAt ? "c.updated_at" : "NULL AS updated_at"},
            b.nome as bandeira_nome
         FROM cartoes c
         LEFT JOIN bandeiras b ON c.bandeira_id = b.id
         ${
            schemaInfo.hasTipoPagamentoId
               ? "LEFT JOIN tipos_pagamento tp ON c.tipo_pagamento_id = tp.id"
               : ""
         }
         WHERE c.id = ? AND c.user_id = ?`,
         [id, userId],
      );
      return rows[0];
   }

   static async update(
      id,
      userId,
      nome,
      tipo,
      bandeiraId,
      limiteReal,
      limitePessoal,
      diaFechamento,
      diaVencimento,
      cor,
   ) {
      const schemaInfo = await this.getSchemaInfo();
      const tipoPagamentoId = await this.resolveTipoPagamentoId(
         tipo,
         userId,
         schemaInfo,
      );

      const sets = ["nome = ?", "bandeira_id = ?"];
      const params = [nome, bandeiraId];

      if (schemaInfo.hasTipo) {
         sets.push("tipo = ?");
         params.push(tipo);
      }
      if (schemaInfo.hasTipoPagamentoId) {
         sets.push("tipo_pagamento_id = ?");
         params.push(tipoPagamentoId);
      }
      if (schemaInfo.hasLimiteReal) {
         sets.push("limite_real = ?");
         params.push(limiteReal);
      }
      if (schemaInfo.hasLimitePessoal) {
         sets.push("limite_pessoal = ?");
         params.push(limitePessoal);
      }
      if (schemaInfo.hasDiaFechamento) {
         sets.push("dia_fechamento = ?");
         params.push(diaFechamento);
      }
      if (schemaInfo.hasDiaVencimento) {
         sets.push("dia_vencimento = ?");
         params.push(diaVencimento);
      }
      if (schemaInfo.hasCor) {
         sets.push("cor = ?");
         params.push(cor);
      }

      params.push(id, userId);

      await db.query(
         `UPDATE cartoes
         SET ${sets.join(", ")}
         WHERE id = ? AND user_id = ?`,
         params,
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
