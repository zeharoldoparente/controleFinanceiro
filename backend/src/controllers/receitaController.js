const Receita = require("../models/Receita");
const Mesa = require("../models/Mesa");
const TipoPagamento = require("../models/TipoPagamento");
const Categoria = require("../models/Categoria");

class ReceitaController {
   // ─── CREATE ───────────────────────────────────────────────────────────────

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
            parcelas,
         } = req.body;
         const userId = req.userId;

         if (!mesa_id || !descricao || !valor || !data_recebimento) {
            return res.status(400).json({
               error: "Mesa, descrição, valor e data de recebimento são obrigatórios",
            });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const resourceOwnerId = Number(mesa.criador_id) || Number(userId);

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
                  .json({ error: "Categoria inválida ou inativa" });
            if (cat.tipo !== "receita")
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'receita'" });
         }

         // Recorrente não pode ter parcelas
         const totalParcelas = recorrente ? 1 : parseInt(parcelas) || 1;
         if (totalParcelas > 60)
            return res.status(400).json({ error: "Máximo de 60 parcelas" });

         const ids = await Receita.create({
            mesaId: mesa_id,
            descricao,
            valor: parseFloat(valor),
            dataRecebimento: data_recebimento,
            categoriaId: categoria_id,
            tipoPagamentoId: tipo_pagamento_id,
            recorrente: !!recorrente,
            parcelas: totalParcelas,
         });

         res.status(201).json({
            message: `${ids.length} receita(s) criada(s) com sucesso!`,
            ids,
            receitaId: ids[0],
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar receita" });
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
         const receitas = await Receita.findByMesaIdFiltrado(
            mesa_id,
            mesFiltro,
         );

         res.json({ receitas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar receitas" });
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

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         res.json({ receita });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar receita" });
      }
   }

   // ─── UPDATE ───────────────────────────────────────────────────────────────

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
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const resourceOwnerId = Number(mesa.criador_id) || Number(userId);

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

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
                  .json({ error: "Categoria inválida ou inativa" });
            if (cat.tipo !== "receita")
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'receita'" });
         }

         await Receita.update(id, mesa_id, {
            descricao,
            valor: parseFloat(valor),
            dataRecebimento: data_recebimento,
            categoriaId: categoria_id,
            tipoPagamentoId: tipo_pagamento_id,
            recorrente: !!recorrente,
         });

         res.json({ message: "Receita atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar receita" });
      }
   }

   // ─── CONFIRMAR RECEBIMENTO ────────────────────────────────────────────────

   static async confirmar(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id, valor_real, mes } = req.body;
         const userId = req.userId;

         if (!mesa_id || !mes) {
            return res
               .status(400)
               .json({ error: "mesa_id e mes são obrigatórios" });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         const valorConfirmado =
            valor_real != null
               ? parseFloat(valor_real)
               : parseFloat(receita.valor);

         const resultado = await Receita.confirmar(
            id,
            mesa_id,
            valorConfirmado,
            mes,
         );

         res.json({
            message: "Recebimento confirmado com sucesso!",
            ...resultado,
         });
      } catch (error) {
         console.error(error);
         const status = error.message.includes("já confirmado") ? 409 : 500;
         res.status(status).json({
            error: error.message || "Erro ao confirmar recebimento",
         });
      }
   }

   // ─── DESFAZER CONFIRMAÇÃO ─────────────────────────────────────────────────

   static async desfazerConfirmacao(req, res) {
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

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         if (
            receita.status !== "recebida" &&
            receita.origem_recorrente_id == null
         ) {
            return res
               .status(400)
               .json({ error: "Receita não está confirmada" });
         }

         await Receita.desfazerConfirmacao(id, mesa_id);
         res.json({ message: "Confirmação desfeita com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao desfazer confirmação" });
      }
   }


   // ─── GRUPO DE PARCELAS ────────────────────────────────────────────────────

   static async getByGrupoParcela(req, res) {
      try {
         const { grupo_parcela } = req.params;
         const { mesa_id } = req.query;
         const userId = req.userId;

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receitas = await Receita.findByGrupoParcela(grupo_parcela, mesa_id);
         res.json({ receitas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar grupo de parcelas" });
      }
   }
   // ─── INATIVAR / REATIVAR / DELETE ─────────────────────────────────────────

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

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita nao encontrada" });

         const escopoExclusao = escopo === "posteriores" ? "posteriores" : "apenas";

         if (
            escopoExclusao === "posteriores" &&
            receita.parcelas > 1 &&
            receita.grupo_parcela
         ) {
            await Receita.inativarGrupoApartirParcela(
               receita.grupo_parcela,
               mesa_id,
               receita.parcela_atual,
            );
            return res.json({
               message: "Receita atual e posteriores excluidas com sucesso!",
            });
         }

         const ehRecorrente = !!receita.recorrente || receita.origem_recorrente_id != null;

         if (escopoExclusao === "posteriores" && ehRecorrente) {
            const hasOrigemRecorrente =
               await Receita.hasOrigemRecorrenteColumn();

            if (!hasOrigemRecorrente) {
               await Receita.inativar(id, mesa_id);
               return res.json({
                  message: "Receita recorrente excluida com sucesso!",
               });
            }
            const origemRecorrenteId = receita.origem_recorrente_id ?? receita.id;
            const mesValido = /^\d{4}-(0[1-9]|1[0-2])$/.test(String(mes || ""));
            const mesBase = mesValido
               ? String(mes)
               : String(
                    receita.mes_referencia ||
                       String(receita.data_recebimento).substring(0, 7),
                 );

            try {
               await Receita.cancelarRecorrencia(
                  origemRecorrenteId,
                  mesa_id,
                  `${mesBase}-01`,
               );
               await Receita.inativarConfirmacoesRecorrentesApartirMes(
                  origemRecorrenteId,
                  mesa_id,
                  mesBase,
               );

               return res.json({
                  message: "Recorrencia cancelada a partir do mes selecionado!",
               });
            } catch (error) {
               if (error.message === "COLUNA_DATA_CANCELAMENTO_AUSENTE") {
                  await Receita.inativarRecorrenciaCompleta(
                     origemRecorrenteId,
                     mesa_id,
                  );
                  return res.json({
                     message: "Receita recorrente excluida com sucesso!",
                  });
               }
               throw error;
            }
         }

         await Receita.inativar(id, mesa_id);
         res.json({ message: "Receita excluida com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao excluir receita" });
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

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

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

         if (!mesa_id)
            return res.status(400).json({ error: "ID da mesa é obrigatório" });

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa)
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });

         const receita = await Receita.findById(id, mesa_id);
         if (!receita)
            return res.status(404).json({ error: "Receita não encontrada" });

         await Receita.delete(id, mesa_id);
         res.json({ message: "Receita deletada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao deletar receita" });
      }
   }
}

module.exports = ReceitaController;
