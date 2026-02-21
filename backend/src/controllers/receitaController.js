const Receita = require("../models/Receita");
const Mesa = require("../models/Mesa");

class ReceitaController {
   static async create(req, res) {
      try {
         const { mesa_id, descricao, valor, data_recebimento, categoria_id } =
            req.body;
         const userId = req.userId;

         if (!mesa_id || !descricao || !valor || !data_recebimento) {
            return res
               .status(400)
               .json({
                  error: "Mesa, descrição, valor e data de recebimento são obrigatórios",
               });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         const receitaId = await Receita.create(
            mesa_id,
            descricao,
            valor,
            data_recebimento,
            categoria_id,
         );

         res.status(201).json({
            message: "Receita criada com sucesso!",
            receitaId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar receita" });
      }
   }

   static async list(req, res) {
      try {
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id) {
            return res.status(400).json({ error: "ID da mesa é obrigatório" });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         const receitas = await Receita.findByMesaId(mesa_id);

         res.json({ receitas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar receitas" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id) {
            return res.status(400).json({ error: "ID da mesa é obrigatório" });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         const receita = await Receita.findById(id, mesa_id);

         if (!receita) {
            return res.status(404).json({ error: "Receita não encontrada" });
         }

         res.json({ receita });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar receita" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id, descricao, valor, data_recebimento, categoria_id } =
            req.body;
         const userId = req.userId;
         if (!mesa_id || !descricao || !valor || !data_recebimento) {
            return res
               .status(400)
               .json({
                  error: "Mesa, descrição, valor e data de recebimento são obrigatórios",
               });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         await Receita.update(
            id,
            mesa_id,
            descricao,
            valor,
            data_recebimento,
            categoria_id,
         );

         res.json({ message: "Receita atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar receita" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;
         if (!mesa_id) {
            return res.status(400).json({ error: "ID da mesa é obrigatório" });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         await Receita.delete(id, mesa_id);

         res.json({ message: "Receita deletada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao deletar receita" });
      }
   }
}

module.exports = ReceitaController;
