const Despesa = require("../models/Despesa");
const Mesa = require("../models/Mesa");
const path = require("path");
const fs = require("fs");

class DespesaController {
   static async create(req, res) {
      try {
         const {
            mesa_id,
            descricao,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            forma_pagamento_id,
            cartao_id,
            recorrente,
            parcelas,
            parcela_atual,
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

         const despesaId = await Despesa.create(
            mesa_id,
            descricao,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            forma_pagamento_id,
            cartao_id,
            recorrente || false,
            parcelas,
            parcela_atual,
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

         const despesas = await Despesa.findByMesaId(mesa_id);

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

   static async update(req, res) {
      try {
         const { id } = req.params;
         const {
            mesa_id,
            descricao,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            forma_pagamento_id,
            cartao_id,
            recorrente,
            parcelas,
            parcela_atual,
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

         await Despesa.update(
            id,
            mesa_id,
            descricao,
            valor_provisionado,
            data_vencimento,
            categoria_id,
            forma_pagamento_id,
            cartao_id,
            recorrente || false,
            parcelas,
            parcela_atual,
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

         let valorFinal = valor_real;
         if (!valorFinal) {
            const despesa = await Despesa.findById(id, mesa_id);
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
