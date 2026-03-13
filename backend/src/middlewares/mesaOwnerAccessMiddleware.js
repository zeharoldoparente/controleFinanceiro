const Mesa = require("../models/Mesa");

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

async function requireMesaOwnerAccess(req, res, next) {
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

      if (Number(mesa.criador_id) !== userId) {
         return res.status(403).json({
            error: "Somente o proprietario da mesa pode acessar as faturas",
         });
      }

      req.mesa = mesa;
      next();
   } catch (error) {
      console.error("[mesaOwnerAccess]", error);
      res.status(500).json({ error: "Erro ao validar proprietario da mesa" });
   }
}

module.exports = requireMesaOwnerAccess;
