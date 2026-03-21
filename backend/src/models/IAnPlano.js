const db = require("../config/database");

let tabelaGarantida = false;

class IAnPlano {
   static async ensureTable() {
      if (tabelaGarantida) return;

      await db.query(`
         CREATE TABLE IF NOT EXISTS ian_planos (
            id INT PRIMARY KEY AUTO_INCREMENT,
            user_id INT NOT NULL,
            mesa_id INT NOT NULL,
            objetivo_descricao VARCHAR(500) NOT NULL,
            estrategia_id VARCHAR(30) NOT NULL,
            plano_json LONGTEXT NOT NULL,
            ativo TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_ian_planos_user_mesa_ativo (user_id, mesa_id, ativo),
            INDEX idx_ian_planos_updated_at (updated_at),
            CONSTRAINT fk_ian_planos_user
               FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_ian_planos_mesa
               FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      tabelaGarantida = true;
   }

   static parseRow(row) {
      if (!row) return null;

      let plano = null;
      try {
         plano = row.plano_json ? JSON.parse(row.plano_json) : null;
      } catch (_) {
         plano = null;
      }

      return {
         id: row.id,
         user_id: row.user_id,
         mesa_id: row.mesa_id,
         objetivo_descricao: row.objetivo_descricao,
         estrategia_id: row.estrategia_id,
         ativo: !!row.ativo,
         created_at: row.created_at,
         updated_at: row.updated_at,
         plano,
      };
   }

   static async findActiveByMesa(mesaId) {
      await this.ensureTable();

      const [rows] = await db.query(
         `SELECT *
          FROM ian_planos
          WHERE mesa_id = ? AND ativo = 1
          ORDER BY updated_at DESC
          LIMIT 1`,
         [mesaId],
      );

      return this.parseRow(rows[0]);
   }

   static async findAllActiveByUser(userId) {
      await this.ensureTable();

      const [rows] = await db.query(
         `SELECT *
          FROM ian_planos ip
          INNER JOIN mesa_usuarios mu ON mu.mesa_id = ip.mesa_id
          WHERE mu.user_id = ? AND ip.ativo = 1
          ORDER BY updated_at DESC`,
         [userId],
      );

      const unicos = new Map();
      for (const row of rows) {
         const parsed = this.parseRow(row);
         if (parsed && !unicos.has(parsed.mesa_id)) {
            unicos.set(parsed.mesa_id, parsed);
         }
      }

      return Array.from(unicos.values());
   }

   static async saveActive({
      userId,
      mesaId,
      objetivoDescricao,
      estrategiaId,
      plano,
   }) {
      await this.ensureTable();

      const planoJson = JSON.stringify(plano);
      const existente = await this.findActiveByMesa(mesaId);

      if (existente?.id) {
         await db.query(
            `UPDATE ian_planos
             SET user_id = ?, objetivo_descricao = ?, estrategia_id = ?, plano_json = ?, ativo = 1
             WHERE id = ?`,
            [userId, objetivoDescricao, estrategiaId, planoJson, existente.id],
         );

         return this.findActiveByMesa(mesaId);
      }

      await db.query(
         `INSERT INTO ian_planos
            (user_id, mesa_id, objetivo_descricao, estrategia_id, plano_json, ativo)
          VALUES (?, ?, ?, ?, ?, 1)`,
         [userId, mesaId, objetivoDescricao, estrategiaId, planoJson],
      );

      return this.findActiveByMesa(mesaId);
   }
}

module.exports = IAnPlano;
