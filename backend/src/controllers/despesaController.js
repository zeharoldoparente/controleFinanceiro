const Despesa = require("../models/Despesa");
const Mesa = require("../models/Mesa");
const TipoPagamento = require("../models/TipoPagamento");
const Categoria = require("../models/Categoria");
const Cartao = require("../models/Cartao");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

class DespesaController {
   static async create(req, res) {
      try {
         const {
            mesa_id,
            descricao,
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

            // Se for cartão, obrigar cartao_id
            if (
               ["Cartão de Crédito", "Cartão de Débito"].includes(
                  tipoPagamento.nome,
               )
            ) {
               if (!cartao_id) {
                  return res
                     .status(400)
                     .json({
                        error: "Cartão é obrigatório para este tipo de pagamento",
                     });
               }
            }
         }

         // Validar cartão (se fornecido)
         if (cartao_id) {
            const cartao = await Cartao.findById(cartao_id, userId);
            if (!cartao || !cartao.ativa) {
               return res
                  .status(400)
                  .json({ error: "Cartão inválido ou inativo" });
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
            if (categoria.tipo !== "despesa") {
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'despesa'" });
            }
         }

         // Lógica de parcelamento
         const totalParcelas = parcelas && parcelas > 1 ? parcelas : 1;

         if (totalParcelas > 1) {
            // Criar múltiplas despesas parceladas
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
                  valorProvisionado:
                     i === totalParcelas - 1
                        ? (
                             valor_provisionado -
                             valorParcela * (totalParcelas - 1)
                          ).toFixed(2) // Ajusta última parcela
                        : valorParcela,
                  dataVencimento: dataParc.toISOString().split("T")[0],
                  categoriaId: categoria_id,
                  tipoPagamentoId: tipo_pagamento_id,
                  cartaoId: cartao_id,
                  recorrente: false,
                  parcelas: totalParcelas,
                  parcelaAtual: i + 1,
                  parcelaGrupoId: parcelaGrupoId,
               });
            }

            await Despesa.createMultiple(despesasParceladas);

            res.status(201).json({
               message: `${totalParcelas} despesas parceladas criadas com sucesso!`,
               parcelas: totalParcelas,
               parcela_grupo_id: parcelaGrupoId,
            });
         } else {
            // Criar despesa única
            const despesaId = await Despesa.create(
               mesa_id,
               descricao,
               valor_provisionado,
               data_vencimento,
               categoria_id,
               tipo_pagamento_id,
               cartao_id,
               recorrente,
               1,
               1,
               uuidv4(),
            );

            res.status(201).json({
               message: "Despesa criada com sucesso!",
               despesaId,
            });
         }
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar despesa" });
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

         const despesas = await Despesa.findByMesaId(
            mesa_id,
            incluirInativas === "true",
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

            // Se for cartão, obrigar cartao_id
            if (
               ["Cartão de Crédito", "Cartão de Débito"].includes(
                  tipoPagamento.nome,
               )
            ) {
               if (!cartao_id) {
                  return res
                     .status(400)
                     .json({
                        error: "Cartão é obrigatório para este tipo de pagamento",
                     });
               }
            }
         }

         // Validar cartão (se fornecido)
         if (cartao_id) {
            const cartao = await Cartao.findById(cartao_id, userId);
            if (!cartao || !cartao.ativa) {
               return res
                  .status(400)
                  .json({ error: "Cartão inválido ou inativo" });
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
            if (categoria.tipo !== "despesa") {
               return res
                  .status(400)
                  .json({ error: "Categoria deve ser do tipo 'despesa'" });
            }
         }

         await Despesa.update(
            id,
            mesa_id,
            descricao,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            tipo_pagamento_id,
            cartao_id,
            recorrente,
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

         if (!mesa_id || !data_pagamento) {
            return res
               .status(400)
               .json({ error: "Mesa e data de pagamento são obrigatórios" });
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

         let valorFinal = valor_real;
         if (!valorFinal) {
            valorFinal = despesa.valor_provisionado;
         }

         const comprovante = req.file ? req.file.filename : null;

         await Despesa.marcarComoPaga(
            id,
            mesa_id,
            valorFinal,
            data_pagamento,
            comprovante,
         );

         res.json({
            message: "Despesa marcada como paga!",
            comprovante: comprovante,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao marcar despesa como paga" });
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
            if (fs.existsSync(caminhoAntigo)) {
               fs.unlinkSync(caminhoAntigo);
            }
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
            if (fs.existsSync(caminhoArquivo)) {
               fs.unlinkSync(caminhoArquivo);
            }

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
            if (fs.existsSync(caminhoArquivo)) {
               fs.unlinkSync(caminhoArquivo);
            }
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
