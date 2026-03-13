const db = require("../config/database");
const Mesa = require("../models/Mesa");

let hasPapelColumnCache = null;

function parsePositiveInt(value) {
   if (typeof Mesa.parsePositiveInt === "function") {
      return Mesa.parsePositiveInt(value);
   }

   if (typeof value === "number" && Number.isInteger(value) && value > 0) {
      return value;
   }

   if (typeof value === "string" && /^\d+$/.test(value.trim())) {
      const parsed = Number(value);
      if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
   }

   return null;
}

function getMesaIdFromRequest(req) {
   return (
      req.body?.mesa_id ??
      req.query?.mesa_id ??
      req.params?.mesa_id ??
      req.params?.mesaId
   );
}

function getAllowedWriteRoles() {
   const raw = String(process.env.MESA_WRITE_ROLES || "criador,editor,convidado");
   return new Set(
      raw
         .split(",")
         .map((item) => item.trim().toLowerCase())
         .filter(Boolean),
   );
}

async function hasPapelColumn() {
   if (hasPapelColumnCache !== null) return hasPapelColumnCache;

   try {
      await db.query("SELECT papel FROM mesa_usuarios LIMIT 1");
      hasPapelColumnCache = true;
      return true;
   } catch (error) {
      if (
         error?.code === "ER_BAD_FIELD_ERROR" ||
         error?.code === "ER_NO_SUCH_TABLE"
      ) {
         hasPapelColumnCache = false;
         return false;
      }

      throw error;
   }
}

async function requireMesaWriteAccess(req, res, next) {
   try {
      const mesaId = parsePositiveInt(getMesaIdFromRequest(req));
      if (!mesaId) {
         return res.status(400).json({ error: "mesa_id e obrigatorio" });
      }

      const userId = parsePositiveInt(req.userId);
      if (!userId) {
         return res.status(401).json({ error: "Token invalido" });
      }

      const mesa = await Mesa.findById(mesaId, userId);
      if (!mesa) {
         return res
            .status(403)
            .json({ error: "Voce nao tem acesso a esta mesa" });
      }

      // Criador sempre pode editar.
      if (Number(mesa.criador_id) === userId) {
         req.mesa = mesa;
         return next();
      }

      const roleBasedAccessAvailable = await hasPapelColumn();
      if (!roleBasedAccessAvailable) {
         req.mesa = mesa;
         return next();
      }

      const [rows] = await db.query(
         "SELECT papel FROM mesa_usuarios WHERE mesa_id = ? AND user_id = ? LIMIT 1",
         [mesaId, userId],
      );

      const papel = String(rows[0]?.papel || "")
         .trim()
         .toLowerCase();
      const allowedWriteRoles = getAllowedWriteRoles();

      if (!allowedWriteRoles.has(papel)) {
         return res.status(403).json({
            error: "Sem permissao para alterar dados desta mesa",
         });
      }

      req.mesa = mesa;
      next();
   } catch (error) {
      console.error("[mesaWriteAccess]", error);
      res.status(500).json({ error: "Erro ao validar permissao da mesa" });
   }
}

module.exports = requireMesaWriteAccess;
