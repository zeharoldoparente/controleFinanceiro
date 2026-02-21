const db = require("../config/database");
const crypto = require("crypto");

class Convite {
   static async create(mesaId, emailConvidado, convidadoPor) {
      const token = crypto.randomBytes(32).toString("hex");

      const expiraEm = new Date();
      expiraEm.setDate(expiraEm.getDate() + 7);

      const [result] = await db.query(
         "INSERT INTO convites (mesa_id, email_convidado, convidado_por, token, expira_em) VALUES (?, ?, ?, ?, ?)",
         [mesaId, emailConvidado, convidadoPor, token, expiraEm],
      );

      return { conviteId: result.insertId, token };
   }

   static async findByToken(token) {
      const [rows] = await db.query(
         `
      SELECT c.*, m.nome as mesa_nome, u.nome as convidado_por_nome
      FROM convites c
      INNER JOIN mesas m ON c.mesa_id = m.id
      INNER JOIN users u ON c.convidado_por = u.id
      WHERE c.token = ?
    `,
         [token],
      );
      return rows[0];
   }

   static async findPendentesByEmail(email) {
      const [rows] = await db.query(
         `
      SELECT c.*, m.nome as mesa_nome, u.nome as convidado_por_nome
      FROM convites c
      INNER JOIN mesas m ON c.mesa_id = m.id
      INNER JOIN users u ON c.convidado_por = u.id
      WHERE c.email_convidado = ? AND c.status = 'pendente' AND c.expira_em > NOW()
      ORDER BY c.created_at DESC
    `,
         [email],
      );
      return rows;
   }

   static async verificarConviteExistente(mesaId, email) {
      const [rows] = await db.query(
         'SELECT id FROM convites WHERE mesa_id = ? AND email_convidado = ? AND status = "pendente"',
         [mesaId, email],
      );
      return rows.length > 0;
   }

   static async aceitar(conviteId, token) {
      await db.query(
         'UPDATE convites SET status = "aceito" WHERE id = ? AND token = ?',
         [conviteId, token],
      );
   }

   static async recusar(conviteId, token) {
      await db.query(
         'UPDATE convites SET status = "recusado" WHERE id = ? AND token = ?',
         [conviteId, token],
      );
   }

   static async findEnviadosByUserId(userId) {
      const [rows] = await db.query(
         `
      SELECT c.*, m.nome as mesa_nome
      FROM convites c
      INNER JOIN mesas m ON c.mesa_id = m.id
      WHERE c.convidado_por = ?
      ORDER BY c.created_at DESC
    `,
         [userId],
      );
      return rows;
   }
}

module.exports = Convite;
