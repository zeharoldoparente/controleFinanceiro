const Receita = require("../models/Receita");
const Mesa = require("../models/Mesa");
const TipoPagamento = require("../models/TipoPagamento");
const Categoria = require("../models/Categoria");

class ReceitaController {
   // ─── CREATE ───────────────────────────────────────────────────────────────

   static async create(req, res) {
      try {
         const {
            mesa_id,
            descricao,
            valor,
            data_recebimento,
            categoria_id,
            tipo_pagamento_id,
            recorrente,
            parcelas,
         } = req.body;
         const userId = req.userId;

         if (!mesa_id || !descricao || !valor || !data_recebimento) {
            return res.status(400).json({
               error: "Mesa, descrição, valor e data de recebimento são obrigatórios",
            });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         if (tipo_pagamento_id) {
            const tp = await TipoPagamento.findById(tipo_pagamento_id);
            if (!tp || !tp.ativa)
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
         }

         if (categoria_id) {
            const cat = await Categoria.findById(categoria_id);
            if (!cat || !cat.ativa)
               return res
                  .status(400)
                  .json({ error: "Categoria inválida ou inativa" });
            if (cat.tipo !== "receita")
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'receita'" });
         }

         // Recorrente não pode ter parcelas
         const totalParcelas = recorrente ? 1 : parseInt(parcelas) || 1;
         if (totalParcelas > 60)
            return res.status(400).json({ error: "Máximo de 60 parcelas" });

         const ids = await Receita.create({
            mesaId: mesa_id,
            descricao,
            valor: parseFloat(valor),
            dataRecebimento: data_recebimento,
            categoriaId: categoria_id,
            tipoPagamentoId: tipo_pagamento_id,
            recorrente: !!recorrente,
            parcelas: totalParcelas,
         });

         res.status(201).json({
            message: `${ids.length} receita(s) criada(s) com sucesso!`,
            ids,
            receitaId: ids[0],
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar receita" });
      }
   }

   // ─── LIST ─────────────────────────────────────────────────────────────────

   static async list(req, res) {
      try {
         const { mesa_id, mes } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const mesFiltro = mes || new Date().toISOString().slice(0, 7);
         const receitas = await Receita.findByMesaIdFiltrado(
            mesa_id,
            mesFiltro,
         );

         res.json({ receitas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar receitas" });
      }
   }

   // ─── SHOW ─────────────────────────────────────────────────────────────────

   static async show(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         res.json({ receita });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar receita" });
      }
   }

   // ─── UPDATE ───────────────────────────────────────────────────────────────

   static async update(req, res) {
      try {
         const { id } = req.params;
         const {
            mesa_id,
            descricao,
            valor,
            data_recebimento,
            categoria_id,
            tipo_pagamento_id,
            recorrente,
         } = req.body;
         const userId = req.userId;

         if (!mesa_id || !descricao || !valor || !data_recebimento) {
            return res.status(400).json({
               error: "Mesa, descrição, valor e data de recebimento são obrigatórios",
            });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         if (tipo_pagamento_id) {
            const tp = await TipoPagamento.findById(tipo_pagamento_id);
            if (!tp || !tp.ativa)
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
         }

         if (categoria_id) {
            const cat = await Categoria.findById(categoria_id);
            if (!cat || !cat.ativa)
               return res
                  .status(400)
                  .json({ error: "Categoria inválida ou inativa" });
            if (cat.tipo !== "receita")
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'receita'" });
         }

         await Receita.update(id, mesa_id, {
            descricao,
            valor: parseFloat(valor),
            dataRecebimento: data_recebimento,
            categoriaId: categoria_id,
            tipoPagamentoId: tipo_pagamento_id,
            recorrente: !!recorrente,
         });

         res.json({ message: "Receita atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar receita" });
      }
   }

   // ─── CONFIRMAR RECEBIMENTO ────────────────────────────────────────────────

   static async confirmar(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id, valor_real, mes } = req.body;
         const userId = req.userId;

         if (!mesa_id || !mes) {
            return res
               .status(400)
               .json({ error: "mesa_id e mes são obrigatórios" });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         const valorConfirmado =
            valor_real != null
               ? parseFloat(valor_real)
               : parseFloat(receita.valor);

         const resultado = await Receita.confirmar(
            id,
            mesa_id,
            valorConfirmado,
            mes,
         );

         res.json({
            message: "Recebimento confirmado com sucesso!",
            ...resultado,
         });
      } catch (error) {
         console.error(error);
         const status = error.message.includes("já confirmado") ? 409 : 500;
         res.status(status).json({
            error: error.message || "Erro ao confirmar recebimento",
         });
      }
   }

   // ─── DESFAZER CONFIRMAÇÃO ─────────────────────────────────────────────────

   static async desfazerConfirmacao(req, res) {
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

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         if (
            receita.status !== "recebida" &&
            receita.origem_recorrente_id == null
         ) {
            return res
               .status(400)
               .json({ error: "Receita não está confirmada" });
         }

         await Receita.desfazerConfirmacao(id, mesa_id);
         res.json({ message: "Confirmação desfeita com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao desfazer confirmação" });
      }
   }

   // ─── INATIVAR / REATIVAR / DELETE ─────────────────────────────────────────

   static async inativar(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         await Receita.inativar(id, mesa_id);
         res.json({ message: "Receita excluída com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao excluir receita" });
      }
   }

   static async reativar(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         await Receita.reativar(id, mesa_id);
         res.json({ message: "Receita reativada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar receita" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         await Receita.delete(id, mesa_id);
         res.json({ message: "Receita deletada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao deletar receita" });
      }
   }
}

module.exports = ReceitaController;
