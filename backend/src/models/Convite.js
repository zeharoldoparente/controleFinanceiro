const db = require("../config/database");
const crypto = require("crypto");

class Convite {
   static _cachedColumns = null;
   static _cachedColumnsAt = 0;

   static async getColumns() {
      const now = Date.now();
      const cacheAgeMs = 60 * 1000;

      if (this._cachedColumns && now - this._cachedColumnsAt < cacheAgeMs) {
         return this._cachedColumns;
      }

      // Evita depender de permissao de SHOW COLUMNS em ambientes gerenciados.
      const [, fields] = await db.query("SELECT * FROM convites LIMIT 0");
      const columns = new Set(fields.map((field) => field.name));

      this._cachedColumns = columns;
      this._cachedColumnsAt = now;

      return columns;
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

      const columns = await this.getColumns();
      const insertColumns = ["mesa_id", "email_convidado"];
      const insertValues = [mesaId, emailConvidado];

      if (columns.has("convidado_por")) {
         insertColumns.push("convidado_por");
         insertValues.push(convidadoPor);
      }

      const hasTokenColumn = columns.has("token");
      if (hasTokenColumn) {
         insertColumns.push("token");
         insertValues.push(token);
      }

      if (columns.has("expira_em")) {
         insertColumns.push("expira_em");
         insertValues.push(expiraEm);
      }

      if (columns.has("status")) {
         insertColumns.push("status");
         insertValues.push("pendente");
      }

      const placeholders = insertColumns.map(() => "?").join(", ");
      const sql = `INSERT INTO convites (${insertColumns.join(", ")}) VALUES (${placeholders})`;

      const [result] = await db.query(sql, insertValues);

      return {
         conviteId: result.insertId,
         token: hasTokenColumn ? token : `id-${result.insertId}`,
      };
   }

   static async findByToken(token) {
      const columns = await this.getColumns();
      const hasTokenColumn = columns.has("token");
      const hasConvidadoPor = columns.has("convidado_por");

      let whereClause = "";
      let params = [];

      if (hasTokenColumn) {
         whereClause = "c.token = ?";
         params = [token];
      } else {
         const conviteId = this.parseLegacyToken(token);
         if (!conviteId) return null;

         whereClause = "c.id = ?";
         params = [conviteId];
      }

      const tokenSelect = hasTokenColumn
         ? "c.token"
         : 'CONCAT("id-", c.id) AS token';

      const senderJoin = hasConvidadoPor
         ? "LEFT JOIN users u ON c.convidado_por = u.id"
         : "LEFT JOIN users u ON m.criador_id = u.id";

      const [rows] = await db.query(
         `
      SELECT c.*, ${tokenSelect}, m.nome as mesa_nome, u.nome as convidado_por_nome
      FROM convites c
      INNER JOIN mesas m ON c.mesa_id = m.id
      ${senderJoin}
      WHERE ${whereClause}
    `,
         params,
      );

      return rows[0];
   }

   static async findPendentesByEmail(email) {
      const columns = await this.getColumns();
      const hasTokenColumn = columns.has("token");
      const hasConvidadoPor = columns.has("convidado_por");

      const senderJoin = hasConvidadoPor
         ? "LEFT JOIN users u ON c.convidado_por = u.id"
         : "LEFT JOIN users u ON m.criador_id = u.id";

      const whereClauses = ["c.email_convidado = ?"];
      if (columns.has("status")) {
         whereClauses.push("c.status = 'pendente'");
      }
      if (columns.has("expira_em")) {
         whereClauses.push("c.expira_em > NOW()");
      }

      const orderBy = columns.has("created_at")
         ? "ORDER BY c.created_at DESC"
         : "ORDER BY c.id DESC";

      const tokenSelect = hasTokenColumn
         ? "c.token"
         : 'CONCAT("id-", c.id) AS token';

      const [rows] = await db.query(
         `
      SELECT c.*, ${tokenSelect}, m.nome as mesa_nome, u.nome as convidado_por_nome
      FROM convites c
      INNER JOIN mesas m ON c.mesa_id = m.id
      ${senderJoin}
      WHERE ${whereClauses.join(" AND ")}
      ${orderBy}
    `,
         [email],
      );

      return rows;
   }

   static async verificarConviteExistente(mesaId, email) {
      const columns = await this.getColumns();

      const whereClauses = ["mesa_id = ?", "email_convidado = ?"];
      if (columns.has("status")) {
         whereClauses.push('status = "pendente"');
      }

      const [rows] = await db.query(
         `SELECT id FROM convites WHERE ${whereClauses.join(" AND ")} LIMIT 1`,
         [mesaId, email],
      );

      return rows.length > 0;
   }

   static async aceitar(conviteId, token) {
      const columns = await this.getColumns();
      if (!columns.has("status")) return;

      const whereClauses = ["id = ?"];
      const params = [conviteId];

      if (columns.has("token")) {
         whereClauses.push("token = ?");
         params.push(token);
      }

      await db.query(
         `UPDATE convites SET status = "aceito" WHERE ${whereClauses.join(" AND ")}`,
         params,
      );
   }

   static async recusar(conviteId, token) {
      const columns = await this.getColumns();
      if (!columns.has("status")) return;

      const whereClauses = ["id = ?"];
      const params = [conviteId];

      if (columns.has("token")) {
         whereClauses.push("token = ?");
         params.push(token);
      }

      await db.query(
         `UPDATE convites SET status = "recusado" WHERE ${whereClauses.join(" AND ")}`,
         params,
      );
   }

   static async findEnviadosByUserId(userId) {
      const columns = await this.getColumns();

      const orderBy = columns.has("created_at")
         ? "ORDER BY c.created_at DESC"
         : "ORDER BY c.id DESC";

      if (columns.has("convidado_por")) {
         const [rows] = await db.query(
            `
      SELECT c.*, m.nome as mesa_nome
      FROM convites c
      INNER JOIN mesas m ON c.mesa_id = m.id
      WHERE c.convidado_por = ?
      ${orderBy}
    `,
            [userId],
         );

         return rows;
      }

      const [rows] = await db.query(
         `
      SELECT c.*, m.nome as mesa_nome
      FROM convites c
      INNER JOIN mesas m ON c.mesa_id = m.id
      WHERE m.criador_id = ?
      ${orderBy}
    `,
         [userId],
      );

      return rows;
   }
}

module.exports = Convite;
