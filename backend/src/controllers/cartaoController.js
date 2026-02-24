const Cartao = require("../models/Cartao");
const Bandeira = require("../models/Bandeira");
const TipoPagamento = require("../models/TipoPagamento");

class CartaoController {
   static async create(req, res) {
      try {
         const userId = req.userId;
         const {
            nome,
            bandeira_id,
            tipo_pagamento_id,
            limite_real,
            limite_pessoal,
            dia_fechamento,
            dia_vencimento,
            cor,
         } = req.body;

         if (!nome || !bandeira_id || !tipo_pagamento_id) {
            return res.status(400).json({
               error: "Nome, bandeira e tipo de pagamento são obrigatórios",
            });
         }

         // Validar bandeira
         const bandeira = await Bandeira.findById(bandeira_id);
         if (!bandeira || !bandeira.ativa) {
            return res
               .status(400)
               .json({ error: "Bandeira inválida ou inativa" });
         }

         // Validar tipo de pagamento
         const tipoPagamento = await TipoPagamento.findById(tipo_pagamento_id);
         if (!tipoPagamento || !tipoPagamento.ativa) {
            return res
               .status(400)
               .json({ error: "Tipo de pagamento inválido ou inativo" });
         }

         // Validar dias (se fornecidos)
         if (dia_fechamento && (dia_fechamento < 1 || dia_fechamento > 31)) {
            return res
               .status(400)
               .json({ error: "Dia de fechamento deve estar entre 1 e 31" });
         }

         if (dia_vencimento && (dia_vencimento < 1 || dia_vencimento > 31)) {
            return res
               .status(400)
               .json({ error: "Dia de vencimento deve estar entre 1 e 31" });
         }

         const cartaoId = await Cartao.create(
            userId,
            nome,
            bandeira_id,
            tipo_pagamento_id,
            limite_real || null,
            limite_pessoal || null,
            dia_fechamento || null,
            dia_vencimento || null,
            cor || "#8B5CF6",
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
         const { incluirInativas } = req.query;

         const cartoes = await Cartao.findAll(
            userId,
            incluirInativas === "true",
         );
         res.json({ cartoes });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar cartões" });
      }
   }

   static async show(req, res) {
      try {
         const userId = req.userId;
         const { id } = req.params;

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
         const userId = req.userId;
         const { id } = req.params;
         const {
            nome,
            bandeira_id,
            tipo_pagamento_id,
            limite_real,
            limite_pessoal,
            dia_fechamento,
            dia_vencimento,
            cor,
         } = req.body;

         const cartao = await Cartao.findById(id, userId);
         if (!cartao) {
            return res.status(404).json({ error: "Cartão não encontrado" });
         }

         if (!nome || !bandeira_id || !tipo_pagamento_id) {
            return res.status(400).json({
               error: "Nome, bandeira e tipo de pagamento são obrigatórios",
            });
         }

         // Validar bandeira
         const bandeira = await Bandeira.findById(bandeira_id);
         if (!bandeira || !bandeira.ativa) {
            return res
               .status(400)
               .json({ error: "Bandeira inválida ou inativa" });
         }

         // Validar tipo de pagamento
         const tipoPagamento = await TipoPagamento.findById(tipo_pagamento_id);
         if (!tipoPagamento || !tipoPagamento.ativa) {
            return res
               .status(400)
               .json({ error: "Tipo de pagamento inválido ou inativo" });
         }

         // Validar dias (se fornecidos)
         if (dia_fechamento && (dia_fechamento < 1 || dia_fechamento > 31)) {
            return res
               .status(400)
               .json({ error: "Dia de fechamento deve estar entre 1 e 31" });
         }

         if (dia_vencimento && (dia_vencimento < 1 || dia_vencimento > 31)) {
            return res
               .status(400)
               .json({ error: "Dia de vencimento deve estar entre 1 e 31" });
         }

         await Cartao.update(
            id,
            userId,
            nome,
            bandeira_id,
            tipo_pagamento_id,
            limite_real || null,
            limite_pessoal || null,
            dia_fechamento || null,
            dia_vencimento || null,
            cor || "#8B5CF6",
         );

         res.json({ message: "Cartão atualizado com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar cartão" });
      }
   }

   static async delete(req, res) {
      try {
         const userId = req.userId;
         const { id } = req.params;

         const cartao = await Cartao.findById(id, userId);
         if (!cartao) {
            return res.status(404).json({ message: "Cartão não encontrado" });
         }

         // TODO: Verificar se tem despesas vinculadas antes de inativar
         // Se tiver, não permitir inativação

         await Cartao.inativar(id, userId);
         res.json({ message: "Cartão inativado com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar cartão" });
      }
   }

   static async reativar(req, res) {
      try {
         const userId = req.userId;
         const { id } = req.params;

         const cartao = await Cartao.findById(id, userId);
         if (!cartao) {
            return res.status(404).json({ message: "Cartão não encontrado" });
         }

         await Cartao.reativar(id, userId);
         res.json({ message: "Cartão reativado com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar cartão" });
      }
   }
}

module.exports = CartaoController;
