const Receita = require("../models/Receita");
const Mesa = require("../models/Mesa");
const TipoPagamento = require("../models/TipoPagamento");
const Categoria = require("../models/Categoria");

class ReceitaController {
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
         } = req.body;
         const userId = req.userId;

         if (!mesa_id || !descricao || !valor || !data_recebimento) {
            return res.status(400).json({
               error: "Mesa, descrição, valor e data de recebimento são obrigatórios",
            });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         // Validar tipo de pagamento (se fornecido)
         if (tipo_pagamento_id) {
            const tipoPagamento =
               await TipoPagamento.findById(tipo_pagamento_id);
            if (!tipoPagamento || !tipoPagamento.ativa) {
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
            }
         }

         // Validar categoria (se fornecida)
         if (categoria_id) {
            const categoria = await Categoria.findById(categoria_id);
            if (!categoria || !categoria.ativa) {
               return res
                  .status(400)
                  .json({ error: "Categoria inválida ou inativa" });
            }
            if (categoria.tipo !== "receita") {
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'receita'" });
            }
         }

         const receitaId = await Receita.create(
            mesa_id,
            descricao,
            valor,
            data_recebimento,
            categoria_id,
            tipo_pagamento_id,
            recorrente,
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
         const { mesa_id, incluirInativas } = req.query;
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

         const receitas = await Receita.findByMesaId(
            mesa_id,
            incluirInativas === "true",
         );

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
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         const receita = await Receita.findById(id, mesa_id);
         if (!receita) {
            return res.status(404).json({ error: "Receita não encontrada" });
         }

         // Validar tipo de pagamento (se fornecido)
         if (tipo_pagamento_id) {
            const tipoPagamento =
               await TipoPagamento.findById(tipo_pagamento_id);
            if (!tipoPagamento || !tipoPagamento.ativa) {
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
            }
         }

         // Validar categoria (se fornecida)
         if (categoria_id) {
            const categoria = await Categoria.findById(categoria_id);
            if (!categoria || !categoria.ativa) {
               return res
                  .status(400)
                  .json({ error: "Categoria inválida ou inativa" });
            }
            if (categoria.tipo !== "receita") {
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'receita'" });
            }
         }

         await Receita.update(
            id,
            mesa_id,
            descricao,
            valor,
            data_recebimento,
            categoria_id,
            tipo_pagamento_id,
            recorrente,
         );

         res.json({ message: "Receita atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar receita" });
      }
   }

   static async inativar(req, res) {
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

         await Receita.inativar(id, mesa_id);

         res.json({ message: "Receita inativada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar receita" });
      }
   }

   static async reativar(req, res) {
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

         await Receita.delete(id, mesa_id);

         res.json({ message: "Receita deletada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao deletar receita" });
      }
   }
}

module.exports = ReceitaController;
