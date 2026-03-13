const Categoria = require("../models/Categoria");
const Mesa = require("../models/Mesa");

class CategoriaController {
   static async create(req, res) {
      try {
         const nomeNormalizado = Categoria.normalizeNome(req.body?.nome);
         const { tipo } = req.body;

         if (!nomeNormalizado || !tipo) {
            return res
               .status(400)
               .json({ error: "Nome e tipo sao obrigatorios" });
         }

         if (tipo !== "receita" && tipo !== "despesa") {
            return res
               .status(400)
               .json({ error: 'Tipo deve ser "receita" ou "despesa"' });
         }

         const existente = await Categoria.findByName(
            nomeNormalizado,
            tipo,
            req.userId,
         );

         if (existente && Number(existente.user_id) === Number(req.userId)) {
            if (!existente.ativa) {
               await Categoria.reativar(existente.id, req.userId);
               return res.status(200).json({
                  message: "Categoria reativada com sucesso!",
                  categoriaId: existente.id,
               });
            }

            return res
               .status(409)
               .json({ error: "Voce ja tem essa categoria" });
         }

         if (existente && existente.user_id == null) {
            return res.status(409).json({
               error: "Essa categoria ja existe na lista padrao",
            });
         }

         const categoriaId = await Categoria.create(
            nomeNormalizado,
            tipo,
            req.userId,
         );

         res.status(201).json({
            message: "Categoria personalizada criada com sucesso!",
            categoriaId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar categoria" });
      }
   }

   static async list(req, res) {
      try {
         const { tipo, incluirInativas, mesa_id } = req.query;

         if (tipo && tipo !== "receita" && tipo !== "despesa") {
            return res
               .status(400)
               .json({ error: 'Tipo deve ser "receita" ou "despesa"' });
         }

         let scopeUserId = req.userId;
         if (mesa_id) {
            const mesa = await Mesa.findById(mesa_id, req.userId);
            if (!mesa) {
               return res
                  .status(403)
                  .json({ error: "VocÃª nÃ£o tem acesso a esta mesa" });
            }
            scopeUserId = mesa.criador_id;
         }

         let categorias;

         if (tipo) {
            categorias = await Categoria.findByTipo(
               tipo,
               incluirInativas === "true",
               scopeUserId,
            );
         } else {
            categorias = await Categoria.findAll(
               incluirInativas === "true",
               scopeUserId,
            );
         }

         const normalizadas = categorias.map((cat) => ({
            ...cat,
            is_padrao: Boolean(cat.is_padrao),
            pertence_ao_usuario: Boolean(cat.pertence_ao_usuario),
         }));

         res.json({ categorias: normalizadas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar categorias" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;

         const categoria = await Categoria.findById(id, req.userId);

         if (!categoria) {
            return res.status(404).json({ error: "Categoria nao encontrada" });
         }

         res.json({
            categoria: {
               ...categoria,
               is_padrao: Boolean(categoria.is_padrao),
               pertence_ao_usuario: Boolean(categoria.pertence_ao_usuario),
            },
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar categoria" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const nomeNormalizado = Categoria.normalizeNome(req.body?.nome);
         const { tipo } = req.body;

         if (!nomeNormalizado || !tipo) {
            return res
               .status(400)
               .json({ error: "Nome e tipo sao obrigatorios" });
         }

         if (tipo !== "receita" && tipo !== "despesa") {
            return res
               .status(400)
               .json({ error: 'Tipo deve ser "receita" ou "despesa"' });
         }

         const categoria = await Categoria.findById(id, req.userId);
         if (!categoria) {
            return res.status(404).json({ error: "Categoria nao encontrada" });
         }

         if (Number(categoria.user_id) !== Number(req.userId)) {
            return res.status(403).json({
               error: "Categorias padrao nao podem ser editadas",
            });
         }

         const existente = await Categoria.findByName(
            nomeNormalizado,
            tipo,
            req.userId,
         );

         if (existente && Number(existente.id) !== Number(id)) {
            return res.status(409).json({
               error: "Ja existe uma categoria com esse nome e tipo",
            });
         }

         await Categoria.update(id, nomeNormalizado, tipo, req.userId);

         res.json({ message: "Categoria atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar categoria" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;

         const categoria = await Categoria.findById(id, req.userId);

         if (!categoria) {
            return res.status(404).json({ message: "Categoria nao encontrada" });
         }

         if (Number(categoria.user_id) !== Number(req.userId)) {
            return res.status(403).json({
               error: "Categorias padrao nao podem ser inativadas",
            });
         }

         await Categoria.inativar(id, req.userId);

         res.json({ message: "Categoria inativada com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar categoria" });
      }
   }

   static async reativar(req, res) {
      try {
         const { id } = req.params;

         const categoria = await Categoria.findById(id, req.userId);

         if (!categoria) {
            return res.status(404).json({ message: "Categoria nao encontrada" });
         }

         if (Number(categoria.user_id) !== Number(req.userId)) {
            return res.status(403).json({
               error: "Categorias padrao nao podem ser reativadas manualmente",
            });
         }

         await Categoria.reativar(id, req.userId);

         res.json({ message: "Categoria reativada com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar categoria" });
      }
   }
}

module.exports = CategoriaController;
