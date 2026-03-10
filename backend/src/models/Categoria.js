const db = require("../config/database");

class Categoria {
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
                 AND TABLE_NAME = 'categorias'
                 AND COLUMN_NAME = 'user_id'
               `,
            );

            if (userIdColumn.length === 0) {
               await db.query(
                  "ALTER TABLE categorias ADD COLUMN user_id INT NULL AFTER tipo",
               );
            }

            const [scopeIndex] = await db.query(
               `
               SELECT INDEX_NAME
               FROM INFORMATION_SCHEMA.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'categorias'
                 AND INDEX_NAME = 'idx_categorias_nome_tipo_user'
               `,
            );
            if (scopeIndex.length === 0) {
               await db.query(
                  "CREATE INDEX idx_categorias_nome_tipo_user ON categorias (nome, tipo, user_id)",
               );
            }

            const [userIndex] = await db.query(
               `
               SELECT INDEX_NAME
               FROM INFORMATION_SCHEMA.STATISTICS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'categorias'
                 AND INDEX_NAME = 'idx_categorias_user_id'
               `,
            );
            if (userIndex.length === 0) {
               await db.query(
                  "CREATE INDEX idx_categorias_user_id ON categorias (user_id)",
               );
            }

            const [fk] = await db.query(
               `
               SELECT CONSTRAINT_NAME
               FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'categorias'
                 AND COLUMN_NAME = 'user_id'
                 AND REFERENCED_TABLE_NAME = 'users'
               `,
            );
            if (fk.length === 0) {
               await db.query(
                  "ALTER TABLE categorias ADD CONSTRAINT fk_categorias_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE",
               );
            }
         })().catch((error) => {
            this.schemaPromise = null;
            throw error;
         });
      }

      return this.schemaPromise;
   }

   static async create(nome, tipo, userId = null) {
      await this.ensureSchema();

      const [result] = await db.query(
         "INSERT INTO categorias (nome, tipo, ativa, user_id) VALUES (?, ?, TRUE, ?)",
         [this.normalizeNome(nome), tipo, userId],
      );
      return result.insertId;
   }

   static async findByName(nome, tipo, userId) {
      await this.ensureSchema();

      const [rows] = await db.query(
         `
         SELECT *
         FROM categorias
         WHERE nome = ?
           AND tipo = ?
           AND (user_id IS NULL OR user_id = ?)
         ORDER BY user_id IS NULL DESC
         LIMIT 1
         `,
         [this.normalizeNome(nome), tipo, userId],
      );
      return rows[0];
   }

   static async findAll(incluirInativas = false, userId = null) {
      await this.ensureSchema();

      let query = `
         SELECT
            c.*,
            (c.user_id IS NULL) AS is_padrao,
            (c.user_id = ?) AS pertence_ao_usuario
         FROM categorias c
      `;

      const where = [];
      const params = [Number(userId) || 0];

      if (!incluirInativas) {
         where.push("c.ativa = TRUE");
      }

      if (userId) {
         where.push("(c.user_id IS NULL OR c.user_id = ?)");
         params.push(userId);
      }

      if (where.length > 0) {
         query += ` WHERE ${where.join(" AND ")}`;
      }

      query += " ORDER BY c.tipo ASC, c.user_id IS NULL DESC, c.nome ASC";

      const [rows] = await db.query(query, params);
      return rows;
   }

   static async findByTipo(tipo, incluirInativas = false, userId = null) {
      await this.ensureSchema();

      let query = `
         SELECT
            c.*,
            (c.user_id IS NULL) AS is_padrao,
            (c.user_id = ?) AS pertence_ao_usuario
         FROM categorias c
         WHERE c.tipo = ?
      `;
      const params = [Number(userId) || 0, tipo];

      if (!incluirInativas) {
         query += " AND c.ativa = TRUE";
      }

      if (userId) {
         query += " AND (c.user_id IS NULL OR c.user_id = ?)";
         params.push(userId);
      }

      query += " ORDER BY c.user_id IS NULL DESC, c.nome ASC";

      const [rows] = await db.query(query, params);
      return rows;
   }

   static async findById(id, userId = null) {
      await this.ensureSchema();

      let query = `
         SELECT
            c.*,
            (c.user_id IS NULL) AS is_padrao,
            (c.user_id = ?) AS pertence_ao_usuario
         FROM categorias c
         WHERE c.id = ?
      `;
      const params = [Number(userId) || 0, id];

      if (userId) {
         query += " AND (c.user_id IS NULL OR c.user_id = ?)";
         params.push(userId);
      }

      const [rows] = await db.query(query, params);
      return rows[0];
   }

   static async findOwnedById(id, userId) {
      await this.ensureSchema();

      const [rows] = await db.query(
         "SELECT * FROM categorias WHERE id = ? AND user_id = ?",
         [id, userId],
      );
      return rows[0];
   }

   static async update(id, nome, tipo, userId) {
      await this.ensureSchema();

      await db.query(
         "UPDATE categorias SET nome = ?, tipo = ? WHERE id = ? AND user_id = ?",
         [this.normalizeNome(nome), tipo, id, userId],
      );
   }

   static async delete(id) {
      await this.ensureSchema();
      await db.query("DELETE FROM categorias WHERE id = ?", [id]);
   }

   static async inativar(id, userId) {
      await this.ensureSchema();
      await db.query(
         "UPDATE categorias SET ativa = FALSE WHERE id = ? AND user_id = ?",
         [id, userId],
      );
   }

   static async reativar(id, userId) {
      await this.ensureSchema();
      await db.query(
         "UPDATE categorias SET ativa = TRUE WHERE id = ? AND user_id = ?",
         [id, userId],
      );
   }
}

module.exports = Categoria;
