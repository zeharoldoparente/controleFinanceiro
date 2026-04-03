const db = require("../config/database");
const IAnPlano = require("./IAnPlano");

let tabelaGarantida = false;

function safeNumber(value) {
   const parsed = Number.parseFloat(value ?? 0);
   return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeMonth(value) {
   const mes = String(value || "").trim();
   return /^\d{4}-\d{2}$/.test(mes) ? mes : null;
}

function sanitizeInvestimentos(investimentos) {
   if (!Array.isArray(investimentos)) return [];

   return investimentos
      .map((item) => {
         const nome = String(item?.nome || item?.codigo || "").trim();
         const codigo = String(item?.codigo || "").trim().toUpperCase();
         const quantidade = safeNumber(item?.quantidade);
         const valorUnitario = safeNumber(item?.valor_unitario);
         const valorTotalInformado = safeNumber(item?.valor_total);
         const valorTotal =
            valorTotalInformado > 0
               ? valorTotalInformado
               : quantidade > 0 && valorUnitario > 0
                 ? quantidade * valorUnitario
                 : 0;
         const dividendosEstimadosMensais = safeNumber(
            item?.dividendos_estimados_mensais,
         );

         if (!nome && !codigo && valorTotal <= 0) {
            return null;
         }

         return {
            nome: nome || codigo || "Investimento",
            codigo: codigo || null,
            quantidade: quantidade > 0 ? quantidade : 0,
            valor_unitario: valorUnitario > 0 ? valorUnitario : 0,
            valor_total: Math.round(valorTotal * 100) / 100,
            dividendos_estimados_mensais:
               Math.round(dividendosEstimadosMensais * 100) / 100,
         };
      })
      .filter(Boolean);
}

class IAnRegistroMensal {
   static async ensureTable() {
      if (tabelaGarantida) return;

      await IAnPlano.ensureTable();

      await db.query(`
         CREATE TABLE IF NOT EXISTS ian_registros_mensais (
            id INT PRIMARY KEY AUTO_INCREMENT,
            plano_id INT NOT NULL,
            user_id INT NOT NULL,
            mesa_id INT NOT NULL,
            referencia_mes CHAR(7) NOT NULL,
            valor_guardado DECIMAL(12,2) NOT NULL DEFAULT 0,
            valor_investido DECIMAL(12,2) NOT NULL DEFAULT 0,
            dividendos_recebidos DECIMAL(12,2) NOT NULL DEFAULT 0,
            investimentos_json LONGTEXT NULL,
            observacoes VARCHAR(1000) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_ian_registros_plano_mes (plano_id, referencia_mes),
            INDEX idx_ian_registros_user_mesa (user_id, mesa_id),
            INDEX idx_ian_registros_referencia (referencia_mes),
            CONSTRAINT fk_ian_registros_plano
               FOREIGN KEY (plano_id) REFERENCES ian_planos(id) ON DELETE CASCADE,
            CONSTRAINT fk_ian_registros_user
               FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            CONSTRAINT fk_ian_registros_mesa
               FOREIGN KEY (mesa_id) REFERENCES mesas(id) ON DELETE CASCADE
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      tabelaGarantida = true;
   }

   static parseRow(row) {
      if (!row) return null;

      let investimentos = [];
      try {
         investimentos = row.investimentos_json
            ? JSON.parse(row.investimentos_json)
            : [];
      } catch (_) {
         investimentos = [];
      }

      const investimentoTotal =
         investimentos.reduce(
            (acc, item) => acc + safeNumber(item?.valor_total),
            0,
         ) || 0;

      return {
         id: row.id,
         plano_id: row.plano_id,
         user_id: row.user_id,
         mesa_id: row.mesa_id,
         referencia_mes: row.referencia_mes,
         valor_guardado: safeNumber(row.valor_guardado),
         valor_investido: Math.max(safeNumber(row.valor_investido), investimentoTotal),
         dividendos_recebidos: safeNumber(row.dividendos_recebidos),
         investimentos,
         observacoes: row.observacoes || "",
         created_at: row.created_at,
         updated_at: row.updated_at,
      };
   }

   static async listByPlan(planoId) {
      await this.ensureTable();

      const [rows] = await db.query(
         `SELECT *
          FROM ian_registros_mensais
          WHERE plano_id = ?
          ORDER BY referencia_mes DESC, updated_at DESC`,
         [planoId],
      );

      return rows.map((row) => this.parseRow(row)).filter(Boolean);
   }

   static async upsert({
      planoId,
      userId,
      mesaId,
      referenciaMes,
      valorGuardado,
      valorInvestido,
      dividendosRecebidos,
      investimentos,
      observacoes,
   }) {
      await this.ensureTable();

      const referenciaMesSanitizada = sanitizeMonth(referenciaMes);
      if (!referenciaMesSanitizada) {
         throw new Error("MES_INVALIDO");
      }

      const investimentosSanitizados = sanitizeInvestimentos(investimentos);
      const investimentoTotal = investimentosSanitizados.reduce(
         (acc, item) => acc + safeNumber(item.valor_total),
         0,
      );
      const valorInvestidoFinal = Math.max(
         safeNumber(valorInvestido),
         investimentoTotal,
      );

      await db.query(
         `INSERT INTO ian_registros_mensais
            (
               plano_id,
               user_id,
               mesa_id,
               referencia_mes,
               valor_guardado,
               valor_investido,
               dividendos_recebidos,
               investimentos_json,
               observacoes
            )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
             valor_guardado = VALUES(valor_guardado),
             valor_investido = VALUES(valor_investido),
             dividendos_recebidos = VALUES(dividendos_recebidos),
             investimentos_json = VALUES(investimentos_json),
             observacoes = VALUES(observacoes)`,
         [
            planoId,
            userId,
            mesaId,
            referenciaMesSanitizada,
            Math.round(safeNumber(valorGuardado) * 100) / 100,
            Math.round(valorInvestidoFinal * 100) / 100,
            Math.round(safeNumber(dividendosRecebidos) * 100) / 100,
            JSON.stringify(investimentosSanitizados),
            String(observacoes || "").trim().slice(0, 1000) || null,
         ],
      );

      const [rows] = await db.query(
         `SELECT *
          FROM ian_registros_mensais
          WHERE plano_id = ? AND referencia_mes = ?
          LIMIT 1`,
         [planoId, referenciaMesSanitizada],
      );

      return this.parseRow(rows[0]);
   }
}

module.exports = IAnRegistroMensal;
