const Despesa = require("../models/Despesa");
const Mesa = require("../models/Mesa");
const TipoPagamento = require("../models/TipoPagamento");
const Categoria = require("../models/Categoria");
const Cartao = require("../models/Cartao");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const TIPOS_VALIDOS = ["variavel", "fixa", "assinatura"];

function mesAtual() {
   const d = new Date();
   return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

class DespesaController {
   static async create(req, res) {
      try {
         const {
            mesa_id,
            descricao,
            tipo,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            tipo_pagamento_id,
            cartao_id,
            recorrente,
            parcelas,
         } = req.body;
         const userId = req.userId;

         if (
            !mesa_id ||
            !descricao ||
            !valor_provisionado ||
            !data_vencimento
         ) {
            return res.status(400).json({
               error: "Mesa, descrição, valor provisionado e data de vencimento são obrigatórios",
            });
         }

         if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
            return res.status(400).json({
               error: "Tipo inválido. Use: variavel, fixa ou assinatura",
            });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         // Validar tipo de pagamento
         if (tipo_pagamento_id) {
            const tipoPagamento =
               await TipoPagamento.findById(tipo_pagamento_id);
            if (!tipoPagamento || !tipoPagamento.ativa) {
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
            }

            if (
               ["Cartão de Crédito", "Cartão de Débito"].includes(
                  tipoPagamento.nome,
               )
            ) {
               if (!cartao_id) {
                  return res.status(400).json({
                     error: "Cartão é obrigatório para este tipo de pagamento",
                  });
               }
            }
         }

         // Validar cartão
         if (cartao_id) {
            const cartao = await Cartao.findById(cartao_id, userId);
            if (!cartao || !cartao.ativa) {
               return res
                  .status(400)
                  .json({ error: "Cartão inválido ou inativo" });
            }
         }

         // Validar categoria
         if (categoria_id) {
            const categoria = await Categoria.findById(categoria_id);
            if (!categoria || !categoria.ativa) {
               return res
                  .status(400)
                  .json({ error: "Categoria inválida ou inativa" });
            }
            if (categoria.tipo !== "despesa") {
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'despesa'" });
            }
         }

         const tipoFinal = tipo || "variavel";
         // Assinaturas e fixas são sempre recorrentes
         const recorrenteFinal =
            tipoFinal === "assinatura" || tipoFinal === "fixa"
               ? true
               : recorrente || false;

         const totalParcelas = parcelas && parcelas > 1 ? parcelas : 1;

         if (totalParcelas > 1) {
            const parcelaGrupoId = uuidv4();
            const valorParcela = (valor_provisionado / totalParcelas).toFixed(
               2,
            );
            const dataBase = new Date(data_vencimento);

            const despesasParceladas = [];

            for (let i = 0; i < totalParcelas; i++) {
               const dataParc = new Date(dataBase);
               dataParc.setMonth(dataBase.getMonth() + i);

               despesasParceladas.push({
                  mesaId: mesa_id,
                  descricao: `${descricao} - Parcela ${i + 1}/${totalParcelas}`,
                  tipo: tipoFinal,
                  valorProvisionado:
                     i === totalParcelas - 1
                        ? (
                             valor_provisionado -
                             valorParcela * (totalParcelas - 1)
                          ).toFixed(2)
                        : valorParcela,
                  dataVencimento: dataParc.toISOString().split("T")[0],
                  categoriaId: categoria_id,
                  tipoPagamentoId: tipo_pagamento_id,
                  cartaoId: cartao_id,
                  recorrente: false, // parceladas não são recorrentes
                  parcelas: totalParcelas,
                  parcelaAtual: i + 1,
                  parcelaGrupoId,
               });
            }

            await Despesa.createMultiple(despesasParceladas);

            return res.status(201).json({
               message: `${totalParcelas} despesas parceladas criadas com sucesso!`,
               parcelas: totalParcelas,
               parcela_grupo_id: parcelaGrupoId,
            });
         }

         // Despesa única
         const despesaId = await Despesa.create(
            mesa_id,
            descricao,
            tipoFinal,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            tipo_pagamento_id,
            cartao_id,
            recorrenteFinal,
            1,
            1,
            uuidv4(),
         );

         res.status(201).json({
            message: "Despesa criada com sucesso!",
            despesaId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar despesa" });
      }
   }

   static async list(req, res) {
      try {
         const { mesa_id, mes } = req.query;
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

         const mesFiltro = mes || mesAtual();
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

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa) {
            return res.status(404).json({ error: "Despesa não encontrada" });
         }

         res.json({ despesa });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar despesa" });
      }
   }

   static async getByParcelaGrupo(req, res) {
      try {
         const { parcela_grupo_id } = req.params;
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

         const despesas = await Despesa.findByParcelaGrupo(
            parcela_grupo_id,
            mesa_id,
         );
         res.json({ despesas });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar parcelas" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const {
            mesa_id,
            descricao,
            tipo,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            tipo_pagamento_id,
            cartao_id,
            recorrente,
         } = req.body;
         const userId = req.userId;

         if (
            !mesa_id ||
            !descricao ||
            !valor_provisionado ||
            !data_vencimento
         ) {
            return res.status(400).json({
               error: "Mesa, descrição, valor provisionado e data de vencimento são obrigatórios",
            });
         }

         if (tipo && !TIPOS_VALIDOS.includes(tipo)) {
            return res.status(400).json({
               error: "Tipo inválido. Use: variavel, fixa ou assinatura",
            });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa) {
            return res.status(404).json({ error: "Despesa não encontrada" });
         }

         // Validar tipo de pagamento
         if (tipo_pagamento_id) {
            const tipoPagamento =
               await TipoPagamento.findById(tipo_pagamento_id);
            if (!tipoPagamento || !tipoPagamento.ativa) {
               return res
                  .status(400)
                  .json({ error: "Tipo de pagamento inválido ou inativo" });
            }

            if (
               ["Cartão de Crédito", "Cartão de Débito"].includes(
                  tipoPagamento.nome,
               )
            ) {
               if (!cartao_id) {
                  return res.status(400).json({
                     error: "Cartão é obrigatório para este tipo de pagamento",
                  });
               }
            }
         }

         if (cartao_id) {
            const cartao = await Cartao.findById(cartao_id, userId);
            if (!cartao || !cartao.ativa) {
               return res
                  .status(400)
                  .json({ error: "Cartão inválido ou inativo" });
            }
         }

         if (categoria_id) {
            const categoria = await Categoria.findById(categoria_id);
            if (!categoria || !categoria.ativa) {
               return res
                  .status(400)
                  .json({ error: "Categoria inválida ou inativa" });
            }
            if (categoria.tipo !== "despesa") {
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'despesa'" });
            }
         }

         const tipoFinal = tipo || despesa.tipo || "variavel";
         const recorrenteFinal =
            tipoFinal === "assinatura" || tipoFinal === "fixa"
               ? true
               : recorrente || false;

         await Despesa.update(
            id,
            mesa_id,
            descricao,
            tipoFinal,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            tipo_pagamento_id,
            cartao_id,
            recorrenteFinal,
         );

         res.json({ message: "Despesa atualizada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar despesa" });
      }
   }

   static async marcarComoPaga(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id, valor_real, data_pagamento } = req.body;
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

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa) {
            return res.status(404).json({ error: "Despesa não encontrada" });
         }

         const valorFinal = valor_real || despesa.valor_provisionado;
         const dataFinal =
            data_pagamento || new Date().toISOString().split("T")[0];
         const comprovante = req.file ? req.file.filename : null;

         await Despesa.marcarComoPaga(
            id,
            mesa_id,
            valorFinal,
            dataFinal,
            comprovante,
         );

         res.json({
            message: "Despesa marcada como paga!",
            comprovante,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao marcar despesa como paga" });
      }
   }

   static async desmarcarPagamento(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.body;
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

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa) {
            return res.status(404).json({ error: "Despesa não encontrada" });
         }

         if (!despesa.paga) {
            return res
               .status(400)
               .json({ error: "Esta despesa não está marcada como paga" });
         }

         // Remove comprovante do disco se existir
         if (despesa.comprovante) {
            const caminhoArquivo = path.join("uploads", despesa.comprovante);
            if (fs.existsSync(caminhoArquivo)) fs.unlinkSync(caminhoArquivo);
         }

         await Despesa.desmarcarPagamento(id, mesa_id);

         res.json({ message: "Pagamento desfeito com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao desfazer pagamento" });
      }
   }

   static async cancelarRecorrencia(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id, mes } = req.body;
         const userId = req.userId;

         if (!mesa_id) {
            return res.status(400).json({ error: "ID da mesa é obrigatório" });
         }
         if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
            return res
               .status(400)
               .json({ error: "Mês inválido. Use formato YYYY-MM" });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa) {
            return res.status(404).json({ error: "Despesa não encontrada" });
         }
         if (!despesa.recorrente) {
            return res
               .status(400)
               .json({ error: "Esta despesa não é recorrente" });
         }

         // data_cancelamento = primeiro dia do mês informado
         const dataCancelamento = `${mes}-01`;
         await Despesa.cancelarRecorrencia(id, mesa_id, dataCancelamento);

         res.json({
            message: `Recorrência cancelada a partir de ${mes}`,
            data_cancelamento: dataCancelamento,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao cancelar recorrência" });
      }
   }

   static async removerCancelamento(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.body;
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

         await Despesa.removerCancelamento(id, mesa_id);
         res.json({
            message:
               "Cancelamento removido. Despesa voltará a aparecer em todos os meses.",
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao remover cancelamento" });
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

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa) {
            return res.status(404).json({ error: "Despesa não encontrada" });
         }

         await Despesa.inativar(id, mesa_id);
         res.json({ message: "Despesa inativada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar despesa" });
      }
   }

   static async inativarGrupo(req, res) {
      try {
         const { parcela_grupo_id } = req.params;
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

         await Despesa.inativarGrupo(parcela_grupo_id, mesa_id);
         res.json({
            message: "Todas as parcelas foram inativadas com sucesso!",
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar parcelas" });
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

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa) {
            return res.status(404).json({ error: "Despesa não encontrada" });
         }

         await Despesa.reativar(id, mesa_id);
         res.json({ message: "Despesa reativada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar despesa" });
      }
   }

   static async uploadComprovante(req, res) {
      try {
         const { id } = req.params;
         const { mesa_id } = req.body;
         const userId = req.userId;

         if (!mesa_id) {
            return res.status(400).json({ error: "ID da mesa é obrigatório" });
         }

         if (!req.file) {
            return res
               .status(400)
               .json({ error: "Nenhum arquivo foi enviado" });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         const comprovanteAntigo = await Despesa.getComprovante(id, mesa_id);
         if (comprovanteAntigo) {
            const caminhoAntigo = path.join("uploads", comprovanteAntigo);
            if (fs.existsSync(caminhoAntigo)) fs.unlinkSync(caminhoAntigo);
         }

         await Despesa.atualizarComprovante(id, mesa_id, req.file.filename);

         res.json({
            message: "Comprovante atualizado com sucesso!",
            comprovante: req.file.filename,
         });
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

         if (!mesa_id) {
            return res.status(400).json({ error: "ID da mesa é obrigatório" });
         }

         const mesa = await Mesa.findById(mesa_id, userId);
         if (!mesa) {
            return res
               .status(403)
               .json({ error: "Você não tem acesso a esta mesa" });
         }

         const comprovante = await Despesa.getComprovante(id, mesa_id);
         if (!comprovante) {
            return res
               .status(404)
               .json({ error: "Comprovante não encontrado" });
         }

         const caminhoArquivo = path.join("uploads", comprovante);
         if (!fs.existsSync(caminhoArquivo)) {
            return res.status(404).json({ error: "Arquivo não encontrado" });
         }

         res.sendFile(path.resolve(caminhoArquivo));
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar comprovante" });
      }
   }

   static async deleteComprovante(req, res) {
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

         const comprovante = await Despesa.getComprovante(id, mesa_id);
         if (comprovante) {
            const caminhoArquivo = path.join("uploads", comprovante);
            if (fs.existsSync(caminhoArquivo)) fs.unlinkSync(caminhoArquivo);
            await Despesa.removerComprovante(id, mesa_id);
         }

         res.json({ message: "Comprovante excluído com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao excluir comprovante" });
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

         const despesa = await Despesa.findById(id, mesa_id);
         if (!despesa) {
            return res.status(404).json({ error: "Despesa não encontrada" });
         }

         const comprovante = await Despesa.getComprovante(id, mesa_id);
         if (comprovante) {
            const caminhoArquivo = path.join("uploads", comprovante);
            if (fs.existsSync(caminhoArquivo)) fs.unlinkSync(caminhoArquivo);
         }

         await Despesa.delete(id, mesa_id);
         res.json({ message: "Despesa deletada com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao deletar despesa" });
      }
   }
}

module.exports = DespesaController;
