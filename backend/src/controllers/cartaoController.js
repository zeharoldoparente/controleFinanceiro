const Cartao = require("../models/Cartao");

class CartaoController {
   static async create(req, res) {
      try {
         const { nome, bandeira, limite, dia_vencimento, tipo } = req.body;
         const userId = req.userId;

         if (!nome || !bandeira || !dia_vencimento || !tipo) {
            return res.status(400).json({
               error: "Nome, bandeira, dia de vencimento e tipo são obrigatórios",
            });
         }

         if (tipo !== "credito" && tipo !== "debito") {
            return res
               .status(400)
               .json({ error: 'Tipo deve ser "credito" ou "debito"' });
         }

         const cartaoId = await Cartao.create(
            userId,
            nome,
            bandeira,
            limite,
            dia_vencimento,
            tipo,
         );

         res.status(201).json({
            message: "Cartão criado com sucesso!",
            cartaoId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar cartão" });
      }
   }

   static async list(req, res) {
      try {
         const userId = req.userId;
         const cartoes = await Cartao.findByUserId(userId);

         res.json({ cartoes });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar cartões" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;

         const cartao = await Cartao.findById(id, userId);

         if (!cartao) {
            return res.status(404).json({ error: "Cartão não encontrado" });
         }

         res.json({ cartao });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar cartão" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const { nome, bandeira, limite, dia_vencimento, tipo } = req.body;
         const userId = req.userId;

         if (!nome || !bandeira || !dia_vencimento || !tipo) {
            return res.status(400).json({
               error: "Nome, bandeira, dia de vencimento e tipo são obrigatórios",
            });
         }

         if (tipo !== "credito" && tipo !== "debito") {
            return res
               .status(400)
               .json({ error: 'Tipo deve ser "credito" ou "debito"' });
         }

         await Cartao.update(
            id,
            userId,
            nome,
            bandeira,
            limite,
            dia_vencimento,
            tipo,
         );

         res.json({ message: "Cartão atualizado com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar cartão" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;

         await Cartao.delete(id, userId);

         res.json({ message: "Cartão deletado com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao deletar cartão" });
      }
   }
}

module.exports = CartaoController;
