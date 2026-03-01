const Despesa = require("../models/Despesa");
const Mesa = require("../models/Mesa");
const TipoPagamento = require("../models/TipoPagamento");
const Categoria = require("../models/Categoria");
const Cartao = require("../models/Cartao");
const path = require("path");
const fs = require("fs");

class DespesaController {
   // ─── CREATE ───────────────────────────────────────────────────────────────

   static async create(req, res) {
      try {
         const {
            mesa_id,
            descricao,
            tipo,
            valor_total, // NOVO: valor total da compra
            valor_provisionado, // legado — aceita ambos por compatibilidade
            data_vencimento,
            categoria_id,
            tipo_pagamento_id,
            cartao_id,
            recorrente,
            parcelas,
         } = req.body;
         const userId = req.userId;

         const valorFinal = valor_total ?? valor_provisionado;

         if (!mesa_id || !descricao || !valorFinal || !data_vencimento) {
            return res.status(400).json({
               error: "Mesa, descrição, valor e data de vencimento são obrigatórios",
            });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         if (cartao_id) {
            const cartao = await Cartao.findById(cartao_id);
            if (!cartao || !cartao.ativa)
               return res
                  .status(400)
                  .json({ error: "Cartão inválido ou inativo" });
            if (cartao.tipo !== "credito")
               return res
                  .status(400)
                  .json({ error: "Apenas cartões de crédito geram fatura" });
            if (recorrente)
               return res.status(400).json({
                  error: "Despesas de cartão de crédito não podem ser recorrentes",
               });
         }

         if (tipo_pagamento_id) {
            const tp = await TipoPagamento.findById(tipo_pagamento_id);
            if (!tp || !tp.ativa)
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
         }

         if (categoria_id) {
            const cat = await Categoria.findById(categoria_id);
            if (!cat || !cat.ativa)
               return res
                  .status(400)
                  .json({ error: "Categoria inválida ou inativa" });
            if (cat.tipo !== "despesa")
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'despesa'" });
         }

         const totalParcelas = recorrente ? 1 : parseInt(parcelas) || 1;
         if (totalParcelas > 60)
            return res.status(400).json({ error: "Máximo de 60 parcelas" });

         const ids = await Despesa.create({
            mesaId: mesa_id,
            descricao,
            tipo,
            valorTotal: parseFloat(valorFinal),
            dataVencimento: data_vencimento,
            categoriaId: categoria_id,
            tipoPagamentoId: tipo_pagamento_id,
            cartaoId: cartao_id,
            recorrente: !!recorrente,
            parcelas: totalParcelas,
         });

         res.status(201).json({
            message: `${ids.length} despesa(s) criada(s) com sucesso!`,
            ids,
            despesaId: ids[0],
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({
            error: error.message || "Erro ao criar despesa",
         });
      }
   }

   // ─── LIST ─────────────────────────────────────────────────────────────────

   static async list(req, res) {
      try {
         const { mesa_id, mes } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const mesFiltro = mes || new Date().toISOString().slice(0, 7);
         const despesas = await Despesa.findByMesaIdFiltrado(
            mesa_id,
            mesFiltro,
         );

         res.json({ despesas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar despesas" });
      }
   }

   // ─── SHOW ─────────────────────────────────────────────────────────────────

   static async show(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa não encontrada" });

         res.json({ despesa });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar despesa" });
      }
   }

   // ─── UPDATE ───────────────────────────────────────────────────────────────

   static async update(req, res) {
      try {
         const { id } = req.params;
         const {
            mesa_id,
            descricao,
            tipo,
            valor_total,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            tipo_pagamento_id,
            cartao_id,
            recorrente,
         } = req.body;
         const userId = req.userId;

         const valorFinal = valor_total ?? valor_provisionado;

         if (!mesa_id || !descricao || !valorFinal || !data_vencimento)
            return res
               .status(400)
               .json({ error: "Campos obrigatórios ausentes" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa não encontrada" });

         await Despesa.update(id, mesa_id, {
            descricao,
            tipo,
            valorProvisionado: parseFloat(valorFinal),
            dataVencimento: data_vencimento,
            categoriaId: categoria_id,
            tipoPagamentoId: tipo_pagamento_id,
            cartaoId: cartao_id,
            recorrente: !!recorrente,
         });

         res.json({ message: "Despesa atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar despesa" });
      }
   }

   // ─── MARCAR COMO PAGA ─────────────────────────────────────────────────────

   static async marcarComoPaga(req, res) {
      try {
         const { id } = req.params;
         const userId = req.userId;
         const mesa_id = req.body.mesa_id;
         const data_pagamento = req.body.data_pagamento;
         const valor_real = req.body.valor_real;
         const comprovante = req.file ? req.file.filename : null;

         if (!mesa_id)
            return res.status(400).json({ error: "mesa_id é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa não encontrada" });

         if (despesa.fatura_id)
            return res.status(400).json({
               error: "Esta despesa é de cartão de crédito. Pague pela fatura do cartão.",
               fatura_id: despesa.fatura_id,
            });

         const valorReal =
            valor_real != null
               ? parseFloat(valor_real)
               : parseFloat(despesa.valor_provisionado);

         await Despesa.marcarComoPaga(
            id,
            mesa_id,
            valorReal,
            data_pagamento,
            comprovante,
         );
         res.json({ message: "Despesa paga com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao marcar despesa como paga" });
      }
   }

   // ─── DESMARCAR PAGAMENTO ──────────────────────────────────────────────────

   static async desmarcarPagamento(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.body;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "mesa_id é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa não encontrada" });

         await Despesa.desmarcarPagamento(id, mesa_id);
         res.json({ message: "Pagamento desfeito com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao desfazer pagamento" });
      }
   }

   // ─── CANCELAR RECORRÊNCIA ─────────────────────────────────────────────────

   static async cancelarRecorrencia(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id, mes } = req.body;
         const userId = req.userId;

         if (!mesa_id || !mes)
            return res
               .status(400)
               .json({ error: "mesa_id e mes são obrigatórios" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa não encontrada" });

         if (!despesa.recorrente)
            return res.status(400).json({ error: "Despesa não é recorrente" });

         await Despesa.cancelarRecorrencia(id, mesa_id, `${mes}-01`);
         res.json({ message: "Recorrência cancelada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao cancelar recorrência" });
      }
   }

   // ─── REMOVER CANCELAMENTO ─────────────────────────────────────────────────

   static async removerCancelamento(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.body;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "mesa_id é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         await Despesa.removerCancelamento(id, mesa_id);
         res.json({ message: "Cancelamento removido com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao remover cancelamento" });
      }
   }

   // ─── INATIVAR / REATIVAR ──────────────────────────────────────────────────

   static async inativar(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa não encontrada" });

         await Despesa.inativar(id, mesa_id);
         res.json({ message: "Despesa excluída com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao excluir despesa" });
      }
   }

   static async reativar(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         await Despesa.reativar(id, mesa_id);
         res.json({ message: "Despesa reativada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar despesa" });
      }
   }

   // ─── GRUPO DE PARCELAS ────────────────────────────────────────────────────

   static async getByParcelaGrupo(req, res) {
      try {
         const { parcela_grupo_id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const despesas = await Despesa.findByParcelaGrupo(
            parcela_grupo_id,
            mesa_id,
         );
         res.json({ despesas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar grupo de parcelas" });
      }
   }

   static async inativarGrupo(req, res) {
      try {
         const { parcela_grupo_id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         await Despesa.inativarGrupo(parcela_grupo_id, mesa_id);
         res.json({ message: "Grupo de parcelas inativado com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar grupo" });
      }
   }

   // ─── COMPROVANTE ─────────────────────────────────────────────────────────

   static async uploadComprovante(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.body;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "mesa_id é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         if (!req.file)
            return res.status(400).json({ error: "Arquivo não enviado" });

         await Despesa.atualizarComprovante(id, mesa_id, req.file.filename);
         res.json({ message: "Comprovante atualizado com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao fazer upload do comprovante" });
      }
   }

   static async getComprovante(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const comprovante = await Despesa.getComprovante(id, mesa_id);
         if (!comprovante)
            return res
               .status(404)
               .json({ error: "Comprovante não encontrado" });

         const filePath = path.join(
            __dirname,
            "../uploads/comprovantes",
            comprovante,
         );
         if (!fs.existsSync(filePath))
            return res.status(404).json({ error: "Arquivo não encontrado" });

         res.download(filePath);
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao baixar comprovante" });
      }
   }

   static async deleteComprovante(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const comprovante = await Despesa.getComprovante(id, mesa_id);
         if (comprovante) {
            const filePath = path.join(
               __dirname,
               "../uploads/comprovantes",
               comprovante,
            );
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
         }

         await Despesa.removerComprovante(id, mesa_id);
         res.json({ message: "Comprovante removido com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao remover comprovante" });
      }
   }
}

module.exports = DespesaController;
