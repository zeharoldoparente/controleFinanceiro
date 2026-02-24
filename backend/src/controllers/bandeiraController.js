const Bandeira = require("../models/Bandeira");

class BandeiraController {
   static async create(req, res) {
      try {
         const { nome } = req.body;

         if (!nome) {
            return res.status(400).json({ error: "Nome é obrigatório" });
         }

         const bandeiraId = await Bandeira.create(nome);

         res.status(201).json({
            message: "Bandeira criada com sucesso!",
            bandeiraId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar bandeira" });
      }
   }

   static async list(req, res) {
      try {
         const { incluirInativas } = req.query;
         const bandeiras = await Bandeira.findAll(incluirInativas === "true");
         res.json({ bandeiras });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar bandeiras" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;
         const bandeira = await Bandeira.findById(id);

         if (!bandeira) {
            return res.status(404).json({ error: "Bandeira não encontrada" });
         }

         res.json({ bandeira });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar bandeira" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const { nome } = req.body;

         if (!nome) {
            return res.status(400).json({ error: "Nome é obrigatório" });
         }

         const bandeira = await Bandeira.findById(id);
         if (!bandeira) {
            return res.status(404).json({ error: "Bandeira não encontrada" });
         }

         await Bandeira.update(id, nome);
         res.json({ message: "Bandeira atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar bandeira" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;

         const bandeira = await Bandeira.findById(id);
         if (!bandeira) {
            return res.status(404).json({ message: "Bandeira não encontrada" });
         }

         await Bandeira.inativar(id);
         res.json({ message: "Bandeira inativada com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar bandeira" });
      }
   }

   static async reativar(req, res) {
      try {
         const { id } = req.params;

         const bandeira = await Bandeira.findById(id);
         if (!bandeira) {
            return res.status(404).json({ message: "Bandeira não encontrada" });
         }

         await Bandeira.reativar(id);
         res.json({ message: "Bandeira reativada com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar bandeira" });
      }
   }
}

module.exports = BandeiraController;
