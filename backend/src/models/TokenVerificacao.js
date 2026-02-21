const db = require("../config/database");
const crypto = require("crypto");

class TokenVerificacao {
   static async create(userId, tipo, horasExpiracao = 24) {
      const token = crypto.randomBytes(32).toString("hex");

      const expiraEm = new Date();
      expiraEm.setHours(expiraEm.getHours() + horasExpiracao);

      const [result] = await db.query(
         "INSERT INTO tokens_verificacao (user_id, token, tipo, expira_em) VALUES (?, ?, ?, ?)",
         [userId, token, tipo, expiraEm],
      );

      return token;
   }

   static async findByToken(token) {
      const [rows] = await db.query(
         "SELECT * FROM tokens_verificacao WHERE token = ?",
         [token],
      );
      return rows[0];
   }

   static async validar(token, tipo) {
      const tokenData = await this.findByToken(token);

      if (!tokenData) {
         throw new Error("Token inválido");
      }

      if (tokenData.usado) {
         throw new Error("Token já foi usado");
      }

      if (new Date(tokenData.expira_em) < new Date()) {
         throw new Error("Token expirado");
      }

      if (tokenData.tipo !== tipo) {
         throw new Error("Tipo de token inválido");
      }

      return tokenData;
   }

   static async marcarComoUsado(token) {
      await db.query(
         "UPDATE tokens_verificacao SET usado = TRUE WHERE token = ?",
         [token],
      );
   }

   static async invalidarTokensAntigos(userId, tipo) {
      await db.query(
         "UPDATE tokens_verificacao SET usado = TRUE WHERE user_id = ? AND tipo = ? AND usado = FALSE",
         [userId, tipo],
      );
   }
}

module.exports = TokenVerificacao;
