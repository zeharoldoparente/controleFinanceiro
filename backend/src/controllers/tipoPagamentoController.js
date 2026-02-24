const TipoPagamento = require("../models/TipoPagamento");

class TipoPagamentoController {
   static async create(req, res) {
      try {
         const { nome } = req.body;

         if (!nome) {
            return res.status(400).json({ error: "Nome é obrigatório" });
         }

         const tipoPagamentoId = await TipoPagamento.create(nome);

         res.status(201).json({
            message: "Tipo de pagamento criado com sucesso!",
            tipoPagamentoId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar tipo de pagamento" });
      }
   }

   static async list(req, res) {
      try {
         const { incluirInativas } = req.query;
         const tiposPagamento = await TipoPagamento.findAll(
            incluirInativas === "true",
         );
         res.json({ tiposPagamento });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar tipos de pagamento" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;
         const tipoPagamento = await TipoPagamento.findById(id);

         if (!tipoPagamento) {
            return res
               .status(404)
               .json({ error: "Tipo de pagamento não encontrado" });
         }

         res.json({ tipoPagamento });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar tipo de pagamento" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const { nome } = req.body;

         if (!nome) {
            return res.status(400).json({ error: "Nome é obrigatório" });
         }

         const tipoPagamento = await TipoPagamento.findById(id);
         if (!tipoPagamento) {
            return res
               .status(404)
               .json({ error: "Tipo de pagamento não encontrado" });
         }

         await TipoPagamento.update(id, nome);
         res.json({ message: "Tipo de pagamento atualizado com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar tipo de pagamento" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;

         const tipoPagamento = await TipoPagamento.findById(id);
         if (!tipoPagamento) {
            return res
               .status(404)
               .json({ message: "Tipo de pagamento não encontrado" });
         }

         await TipoPagamento.inativar(id);
         res.json({ message: "Tipo de pagamento inativado com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar tipo de pagamento" });
      }
   }

   static async reativar(req, res) {
      try {
         const { id } = req.params;

         const tipoPagamento = await TipoPagamento.findById(id);
         if (!tipoPagamento) {
            return res
               .status(404)
               .json({ message: "Tipo de pagamento não encontrado" });
         }

         await TipoPagamento.reativar(id);
         res.json({ message: "Tipo de pagamento reativado com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar tipo de pagamento" });
      }
   }
}

module.exports = TipoPagamentoController;
