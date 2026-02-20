const Mesa = require("../models/Mesa");

class MesaController {
   static async create(req, res) {
      try {
         const { nome } = req.body;
         const userId = req.userId;

         if (!nome) {
            return res
               .status(400)
               .json({ error: "Nome da mesa é obrigatório" });
         }

         const mesaId = await Mesa.create(nome, userId);

         res.status(201).json({
            message: "Mesa criada com sucesso!",
            mesaId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar mesa" });
      }
   }

   static async list(req, res) {
      try {
         const userId = req.userId;
         const mesas = await Mesa.findByUserId(userId);

         res.json({ mesas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar mesas" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;

         const mesa = await Mesa.findById(id, userId);

         if (!mesa) {
            return res.status(404).json({ error: "Mesa não encontrada" });
         }

         res.json({ mesa });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar mesa" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const { nome } = req.body;
         const userId = req.userId;

         if (!nome) {
            return res
               .status(400)
               .json({ error: "Nome da mesa é obrigatório" });
         }

         await Mesa.update(id, nome, userId);

         res.json({ message: "Mesa atualizada com sucesso!" });
      } catch (error) {
         console.error(error);

         if (error.message === "Apenas o criador pode editar a mesa") {
            return res.status(403).json({ error: error.message });
         }

         res.status(500).json({ error: "Erro ao atualizar mesa" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;

         await Mesa.delete(id, userId);

         res.json({ message: "Mesa deletada com sucesso!" });
      } catch (error) {
         console.error(error);

         if (error.message === "Apenas o criador pode deletar a mesa") {
            return res.status(403).json({ error: error.message });
         }

         res.status(500).json({ error: "Erro ao deletar mesa" });
      }
   }
}

module.exports = MesaController;
