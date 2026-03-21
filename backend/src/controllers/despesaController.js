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

         const resourceOwnerId = Number(mesa.criador_id) || Number(userId);

         if (cartao_id) {
            const cartao = await Cartao.findById(cartao_id, resourceOwnerId);
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
            const tp = await TipoPagamento.findById(
               tipo_pagamento_id,
               resourceOwnerId,
            );
            if (!tp || !tp.ativa)
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
         }

         if (categoria_id) {
            const cat = await Categoria.findById(categoria_id, resourceOwnerId);
            if (!cat || !cat.ativa)
               return res
                  .status(400)
                  .json({ error: "Categoria invalida ou inativa" });
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

         const resourceOwnerId = Number(mesa.criador_id) || Number(userId);

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa não encontrada" });

         if (tipo_pagamento_id) {
            const tp = await TipoPagamento.findById(
               tipo_pagamento_id,
               resourceOwnerId,
            );
            if (!tp || !tp.ativa)
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
         }

         if (categoria_id) {
            const cat = await Categoria.findById(categoria_id, resourceOwnerId);
            if (!cat || !cat.ativa)
               return res
                  .status(400)
                  .json({ error: "Categoria invalida ou inativa" });
            if (cat.tipo !== "despesa")
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'despesa'" });
         }

         if (cartao_id) {
            const cartao = await Cartao.findById(cartao_id, resourceOwnerId);
            if (!cartao || !cartao.ativa)
               return res
                  .status(400)
                  .json({ error: "CartÃ£o invÃ¡lido ou inativo" });
            if (cartao.tipo !== "credito")
               return res
                  .status(400)
                  .json({ error: "Apenas cartÃµes de crÃ©dito geram fatura" });
            if (recorrente)
               return res.status(400).json({
                  error: "Despesas de cartÃ£o de crÃ©dito nÃ£o podem ser recorrentes",
               });
         }

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
         const mes = req.body.mes;
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

         const resultado = await Despesa.marcarComoPaga(
            id,
            mesa_id,
            valorReal,
            data_pagamento,
            comprovante,
            mes,
         );
         res.json({ message: "Despesa paga com sucesso!", ...resultado });
      } catch (error) {
         console.error(error);
         if (error.message === "MES_REFERENCIA_OBRIGATORIO") {
            return res.status(400).json({
               error: "mes e obrigatorio para marcar recorrencias como pagas",
            });
         }

         if (error.message.includes("ja confirmado")) {
            return res.status(409).json({ error: error.message });
         }

         res.status(500).json({
            error: error.message || "Erro ao marcar despesa como paga",
         });
      }
   }

   // ─── DESMARCAR PAGAMENTO ──────────────────────────────────────────────────

   static async desmarcarPagamento(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id, escopo } = req.body;
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

         const resultado = await Despesa.desmarcarPagamento(id, mesa_id, {
            escopo,
         });

         const message =
            resultado.tipo === "recorrente" &&
            resultado.escopo === "anteriores"
               ? "Pagamentos do mes atual e anteriores foram desfeitos com sucesso!"
               : "Pagamento desfeito com sucesso!";

         res.json({ message, ...resultado });
      } catch (error) {
         console.error(error);
         res.status(500).json({
            error: error.message || "Erro ao desfazer pagamento",
         });
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

         const despesaOrigem = await Despesa.findOrigemRecorrente(
            despesa,
            mesa_id,
         );
         const origemRecorrenteId = despesaOrigem?.id;

         if (!despesaOrigem?.recorrente || !origemRecorrenteId)
            return res.status(400).json({ error: "Despesa não é recorrente" });

         await Despesa.cancelarRecorrencia(
            origemRecorrenteId,
            mesa_id,
            `${mes}-01`,
         );
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

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa nÃ£o encontrada" });

         const despesaOrigem = await Despesa.findOrigemRecorrente(
            despesa,
            mesa_id,
         );
         const origemRecorrenteId = despesaOrigem?.id;

         if (!origemRecorrenteId)
            return res.status(400).json({ error: "Despesa nÃ£o Ã© recorrente" });

         await Despesa.removerCancelamento(origemRecorrenteId, mesa_id);
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
         const { mesa_id, escopo, mes } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa e obrigatorio" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Voce nao tem acesso a esta mesa" });

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa)
            return res.status(404).json({ error: "Despesa nao encontrada" });

         const escopoExclusao = escopo === "posteriores" ? "posteriores" : "apenas";

         if (
            escopoExclusao === "posteriores" &&
            despesa.parcelas > 1 &&
            despesa.parcela_grupo_id
         ) {
            await Despesa.inativarGrupoApartirParcela(
               despesa.parcela_grupo_id,
               mesa_id,
               despesa.parcela_atual,
            );
            return res.json({
               message: "Despesa atual e posteriores excluidas com sucesso!",
            });
         }

         const despesaOrigem = await Despesa.findOrigemRecorrente(
            despesa,
            mesa_id,
         );
         const origemRecorrenteId = despesaOrigem?.id;
         const ehRecorrente = !!despesaOrigem?.recorrente;

         if (escopoExclusao === "posteriores" && ehRecorrente && origemRecorrenteId) {
            const mesValido = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(mes || ""));
            const mesBase = mesValido
               ? String(mes)
               : Despesa.formatMonthReference(
                    despesa.mes_referencia || despesa.data_vencimento,
                 );

            await Despesa.cancelarRecorrencia(
               origemRecorrenteId,
               mesa_id,
               `${mesBase}-01`,
            );
            return res.json({
               message: "Recorrencia cancelada a partir do mes selecionado!",
            });
         }

         await Despesa.inativar(id, mesa_id);
         res.json({ message: "Despesa excluida com sucesso!" });
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

         const filePath = path.resolve(__dirname, "../../uploads", comprovante);
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
            const filePath = path.resolve(__dirname, "../../uploads", comprovante);
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
