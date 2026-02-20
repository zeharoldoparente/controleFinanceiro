const FormaPagamento = require("../models/FormaPagamento");

class FormaPagamentoController {
   static async create(req, res) {
      try {
         const { nome } = req.body;

         if (!nome) {
            return res.status(400).json({ error: "Nome é obrigatório" });
         }

         const formaPagamentoId = await FormaPagamento.create(nome);

         res.status(201).json({
            message: "Forma de pagamento criada com sucesso!",
            formaPagamentoId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar forma de pagamento" });
      }
   }

   static async list(req, res) {
      try {
         const formasPagamento = await FormaPagamento.findAll();
         res.json({ formasPagamento });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar formas de pagamento" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;

         const formaPagamento = await FormaPagamento.findById(id);

         if (!formaPagamento) {
            return res
               .status(404)
               .json({ error: "Forma de pagamento não encontrada" });
         }

         res.json({ formaPagamento });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar forma de pagamento" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const { nome } = req.body;

         if (!nome) {
            return res.status(400).json({ error: "Nome é obrigatório" });
         }

         await FormaPagamento.update(id, nome);

         res.json({ message: "Forma de pagamento atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({
            error: "Erro ao atualizar forma de pagamento",
         });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;

         await FormaPagamento.delete(id);

         res.json({ message: "Forma de pagamento deletada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao deletar forma de pagamento" });
      }
   }
}

module.exports = FormaPagamentoController;
