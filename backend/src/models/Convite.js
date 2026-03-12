const db = require("../config/database");
const crypto = require("crypto");

class Convite {
   static _cachedMeta = null;
   static _cachedMetaAt = 0;

   static quoteIdentifier(identifier) {
      return `\`${identifier}\``;
   }

   static pickColumn(columns, candidates, required = false, label = "") {
      for (const candidate of candidates) {
         if (columns.has(candidate)) return candidate;
      }

      if (required) {
         const available = Array.from(columns).join(", ");
         throw new Error(
            `Coluna obrigatoria nao encontrada (${label || candidates[0]}). Disponiveis: ${available}`,
         );
      }

      return null;
   }

   static async getMeta() {
      const now = Date.now();
      const cacheAgeMs = 60 * 1000;

      if (this._cachedMeta && now - this._cachedMetaAt < cacheAgeMs) {
         return this._cachedMeta;
      }

      const [, fields] = await db.query("SELECT * FROM convites LIMIT 0");
      const columns = new Set(fields.map((field) => field.name));

      const map = {
         id: this.pickColumn(columns, ["id", "convite_id"], true, "id"),
         mesaId: this.pickColumn(columns, ["mesa_id", "id_mesa"], true, "mesa_id"),
         emailConvidado: this.pickColumn(
            columns,
            [
               "email_convidado",
               "email",
               "convidado_email",
               "email_destinatario",
            ],
            true,
            "email_convidado",
         ),
         convidadoPor: this.pickColumn(columns, ["convidado_por", "enviado_por"]),
         token: this.pickColumn(columns, ["token", "codigo", "hash"]),
         status: this.pickColumn(columns, ["status", "situacao"]),
         expiraEm: this.pickColumn(columns, ["expira_em", "expires_at"]),
         createdAt: this.pickColumn(columns, ["created_at", "criado_em"]),
      };

      const meta = { columns, map };

      this._cachedMeta = meta;
      this._cachedMetaAt = now;

      return meta;
   }

   static parseLegacyToken(token) {
      if (!token) return null;

      const match = /^id-(\d+)$/.exec(String(token));
      if (match) return Number(match[1]);

      if (/^\d+$/.test(String(token))) return Number(token);

      return null;
   }

   static async create(mesaId, emailConvidado, convidadoPor) {
      const token = crypto.randomBytes(32).toString("hex");

      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7);

      const { map } = await this.getMeta();

      const insertColumns = [map.mesaId, map.emailConvidado];
      const insertValues = [mesaId, emailConvidado];

      if (map.convidadoPor) {
         insertColumns.push(map.convidadoPor);
         insertValues.push(convidadoPor);
      }

      if (map.token) {
         insertColumns.push(map.token);
         insertValues.push(token);
      }

      if (map.expiraEm) {
         insertColumns.push(map.expiraEm);
         insertValues.push(expiraEm);
      }

      if (map.status) {
         insertColumns.push(map.status);
         insertValues.push("pendente");
      }

      const quotedColumns = insertColumns.map((column) =>
         this.quoteIdentifier(column),
      );
      const placeholders = insertColumns.map(() => "?").join(", ");

      const sql = `INSERT INTO convites (${quotedColumns.join(", ")}) VALUES (${placeholders})`;
      const [result] = await db.query(sql, insertValues);

      return {
         conviteId: result.insertId,
         token: map.token ? token : `id-${result.insertId}`,
      };
   }

   static async findByToken(token) {
      const { map } = await this.getMeta();

      let whereClause = "";
      let params = [];

      if (map.token) {
         whereClause = `c.${this.quoteIdentifier(map.token)} = ?`;
         params = [token];
      } else {
         const conviteId = this.parseLegacyToken(token);
         if (!conviteId) return null;

         whereClause = `c.${this.quoteIdentifier(map.id)} = ?`;
         params = [conviteId];
      }

      const tokenSelect = map.token
         ? `c.${this.quoteIdentifier(map.token)}`
         : `CONCAT("id-", c.${this.quoteIdentifier(map.id)})`;

      const statusSelect = map.status
         ? `c.${this.quoteIdentifier(map.status)}`
         : "NULL";

      const expiraSelect = map.expiraEm
         ? `c.${this.quoteIdentifier(map.expiraEm)}`
         : "NULL";

      const senderJoin = map.convidadoPor
         ? `LEFT JOIN users u ON c.${this.quoteIdentifier(map.convidadoPor)} = u.id`
         : "LEFT JOIN users u ON m.criador_id = u.id";

      const [rows] = await db.query(
         `
      SELECT
         c.*,
         c.${this.quoteIdentifier(map.mesaId)} AS mesa_id,
         c.${this.quoteIdentifier(map.emailConvidado)} AS email_convidado,
         ${tokenSelect} AS token,
         ${statusSelect} AS status,
         ${expiraSelect} AS expira_em,
         m.nome AS mesa_nome,
         u.nome AS convidado_por_nome
      FROM convites c
      INNER JOIN mesas m ON c.${this.quoteIdentifier(map.mesaId)} = m.id
      ${senderJoin}
      WHERE ${whereClause}
    `,
         params,
      );

      return rows[0];
   }

   static async findPendentesByEmail(email) {
      const { map } = await this.getMeta();

      const whereClauses = [
         `c.${this.quoteIdentifier(map.emailConvidado)} = ?`,
      ];

      if (map.status) {
         whereClauses.push(`c.${this.quoteIdentifier(map.status)} = 'pendente'`);
      }

      if (map.expiraEm) {
         whereClauses.push(`c.${this.quoteIdentifier(map.expiraEm)} > NOW()`);
      }

      const orderBy = map.createdAt
         ? `ORDER BY c.${this.quoteIdentifier(map.createdAt)} DESC`
         : `ORDER BY c.${this.quoteIdentifier(map.id)} DESC`;

      const tokenSelect = map.token
         ? `c.${this.quoteIdentifier(map.token)}`
         : `CONCAT("id-", c.${this.quoteIdentifier(map.id)})`;

      const statusSelect = map.status
         ? `c.${this.quoteIdentifier(map.status)}`
         : "NULL";

      const expiraSelect = map.expiraEm
         ? `c.${this.quoteIdentifier(map.expiraEm)}`
         : "NULL";

      const senderJoin = map.convidadoPor
         ? `LEFT JOIN users u ON c.${this.quoteIdentifier(map.convidadoPor)} = u.id`
         : "LEFT JOIN users u ON m.criador_id = u.id";

      const [rows] = await db.query(
         `
      SELECT
         c.*,
         c.${this.quoteIdentifier(map.mesaId)} AS mesa_id,
         c.${this.quoteIdentifier(map.emailConvidado)} AS email_convidado,
         ${tokenSelect} AS token,
         ${statusSelect} AS status,
         ${expiraSelect} AS expira_em,
         m.nome AS mesa_nome,
         u.nome AS convidado_por_nome
      FROM convites c
      INNER JOIN mesas m ON c.${this.quoteIdentifier(map.mesaId)} = m.id
      ${senderJoin}
      WHERE ${whereClauses.join(" AND ")}
      ${orderBy}
    `,
         [email],
      );

      return rows;
   }

   static async verificarConviteExistente(mesaId, email) {
      const { map } = await this.getMeta();

      const whereClauses = [
         `${this.quoteIdentifier(map.mesaId)} = ?`,
         `${this.quoteIdentifier(map.emailConvidado)} = ?`,
      ];

      if (map.status) {
         whereClauses.push(`${this.quoteIdentifier(map.status)} = 'pendente'`);
      }

      const [rows] = await db.query(
         `SELECT ${this.quoteIdentifier(map.id)} AS id FROM convites WHERE ${whereClauses.join(" AND ")} LIMIT 1`,
         [mesaId, email],
      );

      return rows.length > 0;
   }

   static async aceitar(conviteId, token) {
      const { map } = await this.getMeta();
      if (!map.status) return 0;

      const whereClauses = [`${this.quoteIdentifier(map.id)} = ?`];
      const params = [conviteId];

      if (map.token) {
         whereClauses.push(`${this.quoteIdentifier(map.token)} = ?`);
         params.push(token);
      }

      whereClauses.push(`${this.quoteIdentifier(map.status)} = 'pendente'`);

      const [result] = await db.query(
         `UPDATE convites SET ${this.quoteIdentifier(map.status)} = 'aceito' WHERE ${whereClauses.join(" AND ")}`,
         params,
      );

      return result.affectedRows;
   }

   static async recusar(conviteId, token) {
      const { map } = await this.getMeta();
      if (!map.status) return 0;

      const whereClauses = [`${this.quoteIdentifier(map.id)} = ?`];
      const params = [conviteId];

      if (map.token) {
         whereClauses.push(`${this.quoteIdentifier(map.token)} = ?`);
         params.push(token);
      }

      whereClauses.push(`${this.quoteIdentifier(map.status)} = 'pendente'`);

      const [result] = await db.query(
         `UPDATE convites SET ${this.quoteIdentifier(map.status)} = 'recusado' WHERE ${whereClauses.join(" AND ")}`,
         params,
      );

      return result.affectedRows;
   }

   static async findEnviadosByUserId(userId) {
      const { map } = await this.getMeta();

      const orderBy = map.createdAt
         ? `ORDER BY c.${this.quoteIdentifier(map.createdAt)} DESC`
         : `ORDER BY c.${this.quoteIdentifier(map.id)} DESC`;

      const tokenSelect = map.token
         ? `c.${this.quoteIdentifier(map.token)}`
         : `CONCAT("id-", c.${this.quoteIdentifier(map.id)})`;

      const statusSelect = map.status
         ? `c.${this.quoteIdentifier(map.status)}`
         : "NULL";

      const expiraSelect = map.expiraEm
         ? `c.${this.quoteIdentifier(map.expiraEm)}`
         : "NULL";

      if (map.convidadoPor) {
         const [rows] = await db.query(
            `
      SELECT
         c.*,
         c.${this.quoteIdentifier(map.mesaId)} AS mesa_id,
         c.${this.quoteIdentifier(map.emailConvidado)} AS email_convidado,
         ${tokenSelect} AS token,
         ${statusSelect} AS status,
         ${expiraSelect} AS expira_em,
         m.nome AS mesa_nome
      FROM convites c
      INNER JOIN mesas m ON c.${this.quoteIdentifier(map.mesaId)} = m.id
      WHERE c.${this.quoteIdentifier(map.convidadoPor)} = ?
      ${orderBy}
    `,
            [userId],
         );

         return rows;
      }

      const [rows] = await db.query(
         `
      SELECT
         c.*,
         c.${this.quoteIdentifier(map.mesaId)} AS mesa_id,
         c.${this.quoteIdentifier(map.emailConvidado)} AS email_convidado,
         ${tokenSelect} AS token,
         ${statusSelect} AS status,
         ${expiraSelect} AS expira_em,
         m.nome AS mesa_nome
      FROM convites c
      INNER JOIN mesas m ON c.${this.quoteIdentifier(map.mesaId)} = m.id
      WHERE m.criador_id = ?
      ${orderBy}
    `,
         [userId],
      );

      return rows;
   }
}

module.exports = Convite;
