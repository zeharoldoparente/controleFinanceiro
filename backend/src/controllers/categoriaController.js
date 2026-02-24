const Categoria = require("../models/Categoria");

class CategoriaController {
   static async create(req, res) {
      try {
         const { nome, tipo } = req.body;

         if (!nome || !tipo) {
            return res
               .status(400)
               .json({ error: "Nome e tipo são obrigatórios" });
         }

         if (tipo !== "receita" && tipo !== "despesa") {
            return res
               .status(400)
               .json({ error: 'Tipo deve ser "receita" ou "despesa"' });
         }

         const categoriaId = await Categoria.create(nome, tipo);

         res.status(201).json({
            message: "Categoria criada com sucesso!",
            categoriaId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar categoria" });
      }
   }

   static async list(req, res) {
      try {
         const { tipo, incluirInativas } = req.query;

         let categorias;

         // Se incluirInativas for true, busca todas (ativas e inativas)
         // Senão busca só ativas
         if (tipo) {
            categorias = await Categoria.findByTipo(
               tipo,
               incluirInativas === "true",
            );
         } else {
            categorias = await Categoria.findAll(incluirInativas === "true");
         }

         res.json({ categorias });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar categorias" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;

         const categoria = await Categoria.findById(id);

         if (!categoria) {
            return res.status(404).json({ error: "Categoria não encontrada" });
         }

         res.json({ categoria });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar categoria" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const { nome, tipo } = req.body;

         if (!nome || !tipo) {
            return res
               .status(400)
               .json({ error: "Nome e tipo são obrigatórios" });
         }

         if (tipo !== "receita" && tipo !== "despesa") {
            return res
               .status(400)
               .json({ error: 'Tipo deve ser "receita" ou "despesa"' });
         }

         await Categoria.update(id, nome, tipo);

         res.json({ message: "Categoria atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar categoria" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;

         const categoria = await Categoria.findById(id);

         if (!categoria) {
            return res
               .status(404)
               .json({ message: "Categoria não encontrada" });
         }

         // Soft delete - inativar
         await Categoria.inativar(id);

         res.json({ message: "Categoria inativada com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar categoria" });
      }
   }

   static async reativar(req, res) {
      try {
         const { id } = req.params;

         const categoria = await Categoria.findById(id);

         if (!categoria) {
            return res
               .status(404)
               .json({ message: "Categoria não encontrada" });
         }

         await Categoria.reativar(id);

         res.json({ message: "Categoria reativada com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar categoria" });
      }
   }
}

module.exports = CategoriaController;
