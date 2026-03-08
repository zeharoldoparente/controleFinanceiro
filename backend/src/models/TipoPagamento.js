const db = require("../config/database");

class TipoPagamento {
   static schemaPromise = null;

   static normalizeNome(nome = "") {
      return nome.trim().replace(/\s+/g, " ");
   }

   static async ensureSchema() {
      if (!this.schemaPromise) {
         this.schemaPromise = (async () => {
            const [userIdColumn] = await db.query(
               `
               SELECT COLUMN_NAME
               FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'tipos_pagamento'
                 AND COLUMN_NAME = 'user_id'
               `,
            );

            if (userIdColumn.length === 0) {
               await db.query(
                  "ALTER TABLE tipos_pagamento ADD COLUMN user_id INT NULL AFTER nome",
               );
            }

            const [nomeUniqueIndexes] = await db.query(
               `
               SELECT INDEX_NAME
               FROM INFORMATION_SCHEMA.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'tipos_pagamento'
                 AND COLUMN_NAME = 'nome'
                 AND NON_UNIQUE = 0
               GROUP BY INDEX_NAME
               HAVING COUNT(*) = 1
               `,
            );

            for (const idx of nomeUniqueIndexes) {
               if (
                  idx.INDEX_NAME !== "PRIMARY" &&
                  /^[A-Za-z0-9_]+$/.test(idx.INDEX_NAME)
               ) {
                  await db.query(
                     `ALTER TABLE tipos_pagamento DROP INDEX ${idx.INDEX_NAME}`,
                  );
               }
            }

            const [scopeIndex] = await db.query(
               `
               SELECT INDEX_NAME
               FROM INFORMATION_SCHEMA.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'tipos_pagamento'
                 AND INDEX_NAME = 'idx_tipos_pagamento_nome_user'
               `,
            );
            if (scopeIndex.length === 0) {
               await db.query(
                  "CREATE INDEX idx_tipos_pagamento_nome_user ON tipos_pagamento (nome, user_id)",
               );
            }

            const [userIndex] = await db.query(
               `
               SELECT INDEX_NAME
               FROM INFORMATION_SCHEMA.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'tipos_pagamento'
                 AND INDEX_NAME = 'idx_tipos_pagamento_user_id'
               `,
            );
            if (userIndex.length === 0) {
               await db.query(
                  "CREATE INDEX idx_tipos_pagamento_user_id ON tipos_pagamento (user_id)",
               );
            }

            const [fk] = await db.query(
               `
               SELECT CONSTRAINT_NAME
               FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'tipos_pagamento'
                 AND COLUMN_NAME = 'user_id'
                 AND REFERENCED_TABLE_NAME = 'users'
               `,
            );
            if (fk.length === 0) {
               await db.query(
                  "ALTER TABLE tipos_pagamento ADD CONSTRAINT fk_tipos_pagamento_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
               );
            }
         })().catch((error) => {
            this.schemaPromise = null;
            throw error;
         });
      }

      return this.schemaPromise;
   }

   static async create(nome, userId = null) {
      await this.ensureSchema();

      const [result] = await db.query(
         "INSERT INTO tipos_pagamento (nome, ativa, user_id) VALUES (?, TRUE, ?)",
         [this.normalizeNome(nome), userId],
      );
      return result.insertId;
   }

   static async findByName(nome, userId) {
      await this.ensureSchema();

      const [rows] = await db.query(
         `
         SELECT *
         FROM tipos_pagamento
         WHERE nome = ?
           AND (user_id IS NULL OR user_id = ?)
         ORDER BY user_id IS NULL DESC
         LIMIT 1
         `,
         [this.normalizeNome(nome), userId],
      );
      return rows[0];
   }

   static async findAll(incluirInativas = false, userId = null) {
      await this.ensureSchema();

      let query = `
         SELECT
            tp.*,
            (tp.user_id IS NULL) AS is_padrao,
            (tp.user_id = ?) AS pertence_ao_usuario
         FROM tipos_pagamento tp
      `;

      const where = [];
      const params = [Number(userId) || 0];

      if (!incluirInativas) {
         where.push("tp.ativa = TRUE");
      }

      if (userId) {
         where.push("(tp.user_id IS NULL OR tp.user_id = ?)");
         params.push(userId);
      }

      if (where.length > 0) {
         query += ` WHERE ${where.join(" AND ")}`;
      }

      query += " ORDER BY tp.user_id IS NULL DESC, tp.nome ASC";

      const [rows] = await db.query(query, params);
      return rows;
   }

   static async findById(id, userId = null) {
      await this.ensureSchema();

      let query = `
         SELECT
            tp.*,
            (tp.user_id IS NULL) AS is_padrao,
            (tp.user_id = ?) AS pertence_ao_usuario
         FROM tipos_pagamento tp
         WHERE tp.id = ?
      `;
      const params = [Number(userId) || 0, id];

      if (userId) {
         query += " AND (tp.user_id IS NULL OR tp.user_id = ?)";
         params.push(userId);
      }

      const [rows] = await db.query(query, params);
      return rows[0];
   }

   static async findOwnedById(id, userId) {
      await this.ensureSchema();

      const [rows] = await db.query(
         "SELECT * FROM tipos_pagamento WHERE id = ? AND user_id = ?",
         [id, userId],
      );
      return rows[0];
   }

   static async update(id, nome, userId) {
      await this.ensureSchema();
      await db.query(
         "UPDATE tipos_pagamento SET nome = ? WHERE id = ? AND user_id = ?",
         [this.normalizeNome(nome), id, userId],
      );
   }

   static async inativar(id, userId) {
      await this.ensureSchema();
      await db.query(
         "UPDATE tipos_pagamento SET ativa = FALSE WHERE id = ? AND user_id = ?",
         [id, userId],
      );
   }

   static async reativar(id, userId) {
      await this.ensureSchema();
      await db.query(
         "UPDATE tipos_pagamento SET ativa = TRUE WHERE id = ? AND user_id = ?",
         [id, userId],
      );
   }
}

module.exports = TipoPagamento;
