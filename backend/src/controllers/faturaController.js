const Fatura = require("../models/Fatura");
const Mesa = require("../models/Mesa");
const Cartao = require("../models/Cartao");

class FaturaController {
   // ─── LISTAR FATURAS DE UM CARTÃO ──────────────────────────────────────────

   static async listByCartao(req, res) {
      try {
         const { cartao_id, mesa_id } = req.query;
         const userId = req.userId;

         if (!cartao_id || !mesa_id)
            return res
               .status(400)
               .json({ error: "cartao_id e mesa_id são obrigatórios" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const faturas = await Fatura.findByCartaoId(cartao_id, mesa_id);
         res.json({ faturas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar faturas" });
      }
   }

   // ─── LISTAR FATURAS DA MESA POR MÊS (para aba Despesas) ──────────────────

   static async listByMesa(req, res) {
      try {
         const { mesa_id, mes } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "mesa_id é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const mesFiltro = mes || new Date().toISOString().slice(0, 7);
         const faturas = await Fatura.findByMesaIdMes(mesa_id, mesFiltro);
         res.json({ faturas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar faturas da mesa" });
      }
   }

   // ─── DETALHAR FATURA (extrato completo) ───────────────────────────────────

   static async show(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "mesa_id é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const fatura = await Fatura.findByIdComDetalhes(id, mesa_id);
         if (!fatura)
            return res.status(404).json({ error: "Fatura não encontrada" });

         res.json({ fatura });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar fatura" });
      }
   }

   // ─── PAGAR FATURA ─────────────────────────────────────────────────────────

   static async pagar(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id, valor_real, data_pagamento } = req.body;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "mesa_id é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const resultado = await Fatura.pagar(
            id,
            mesa_id,
            valor_real ? parseFloat(valor_real) : undefined,
            data_pagamento,
         );

         res.json({
            message: "Fatura paga com sucesso!",
            ...resultado,
         });
      } catch (error) {
         console.error(error);
         const status =
            error.message === "Fatura já está paga"
               ? 409
               : error.message === "Fatura não encontrada"
                 ? 404
                 : 500;
         res.status(status).json({
            error: error.message || "Erro ao pagar fatura",
         });
      }
   }

   // ─── DESFAZER PAGAMENTO ───────────────────────────────────────────────────

   static async desfazerPagamento(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.body;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "mesa_id é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         await Fatura.desfazerPagamento(id, mesa_id);
         res.json({ message: "Pagamento desfeito com sucesso!" });
      } catch (error) {
         console.error(error);
         const status =
            error.message === "Fatura não está paga"
               ? 400
               : error.message === "Fatura não encontrada"
                 ? 404
                 : 500;
         res.status(status).json({
            error: error.message || "Erro ao desfazer pagamento",
         });
      }
   }
}

module.exports = FaturaController;
