const TipoPagamento = require("../models/TipoPagamento");

class TipoPagamentoController {
   static async create(req, res) {
      try {
         const nomeNormalizado = TipoPagamento.normalizeNome(req.body?.nome);

         if (!nomeNormalizado || nomeNormalizado.length < 2) {
            return res
               .status(400)
               .json({ error: "Nome deve ter pelo menos 2 caracteres" });
         }

         const existente = await TipoPagamento.findByName(
            nomeNormalizado,
            req.userId,
         );

         if (existente && Number(existente.user_id) === Number(req.userId)) {
            if (!existente.ativa) {
               await TipoPagamento.reativar(existente.id, req.userId);
               return res.status(200).json({
                  message: "Tipo de pagamento reativado com sucesso!",
                  tipoPagamentoId: existente.id,
               });
            }

            return res
               .status(409)
               .json({ error: "Voc\u00ea j\u00e1 tem esse tipo de pagamento" });
         }

         if (existente && existente.user_id == null) {
            return res.status(409).json({
               error: "Esse tipo de pagamento j\u00e1 existe na lista padr\u00e3o",
            });
         }

         const tipoPagamentoId = await TipoPagamento.create(
            nomeNormalizado,
            req.userId,
         );

         res.status(201).json({
            message: "Tipo de pagamento personalizado criado com sucesso!",
            tipoPagamentoId,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar tipo de pagamento" });
      }
   }

   static async list(req, res) {
      try {
         const { incluirInativas } = req.query;
         const tiposPagamento = await TipoPagamento.findAll(
            incluirInativas === "true",
            req.userId,
         );

         const normalizados = tiposPagamento.map((tp) => ({
            ...tp,
            is_padrao: Boolean(tp.is_padrao),
            pertence_ao_usuario: Boolean(tp.pertence_ao_usuario),
         }));

         res.json({ tiposPagamento: normalizados });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar tipos de pagamento" });
      }
   }

   static async show(req, res) {
      try {
         const { id } = req.params;
         const tipoPagamento = await TipoPagamento.findById(id, req.userId);

         if (!tipoPagamento) {
            return res
               .status(404)
               .json({ error: "Tipo de pagamento n\u00e3o encontrado" });
         }

         res.json({
            tipoPagamento: {
               ...tipoPagamento,
               is_padrao: Boolean(tipoPagamento.is_padrao),
               pertence_ao_usuario: Boolean(tipoPagamento.pertence_ao_usuario),
            },
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao buscar tipo de pagamento" });
      }
   }

   static async update(req, res) {
      try {
         const { id } = req.params;
         const nomeNormalizado = TipoPagamento.normalizeNome(req.body?.nome);

         if (!nomeNormalizado || nomeNormalizado.length < 2) {
            return res
               .status(400)
               .json({ error: "Nome deve ter pelo menos 2 caracteres" });
         }

         const tipoPagamento = await TipoPagamento.findById(id, req.userId);
         if (!tipoPagamento) {
            return res
               .status(404)
               .json({ error: "Tipo de pagamento n\u00e3o encontrado" });
         }

         if (Number(tipoPagamento.user_id) !== Number(req.userId)) {
            return res.status(403).json({
               error: "Tipos padr\u00e3o n\u00e3o podem ser editados",
            });
         }

         const existente = await TipoPagamento.findByName(
            nomeNormalizado,
            req.userId,
         );
         if (existente && Number(existente.id) !== Number(id)) {
            return res.status(409).json({
               error: "J\u00e1 existe um tipo de pagamento com esse nome",
            });
         }

         await TipoPagamento.update(id, nomeNormalizado, req.userId);
         res.json({ message: "Tipo de pagamento atualizado com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao atualizar tipo de pagamento" });
      }
   }

   static async delete(req, res) {
      try {
         const { id } = req.params;

         const tipoPagamento = await TipoPagamento.findById(id, req.userId);
         if (!tipoPagamento) {
            return res
               .status(404)
               .json({ message: "Tipo de pagamento n\u00e3o encontrado" });
         }

         if (Number(tipoPagamento.user_id) !== Number(req.userId)) {
            return res.status(403).json({
               error: "Tipos padr\u00e3o n\u00e3o podem ser inativados",
            });
         }

         await TipoPagamento.inativar(id, req.userId);
         res.json({ message: "Tipo de pagamento inativado com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao inativar tipo de pagamento" });
      }
   }

   static async reativar(req, res) {
      try {
         const { id } = req.params;

         const tipoPagamento = await TipoPagamento.findById(id, req.userId);
         if (!tipoPagamento) {
            return res
               .status(404)
               .json({ message: "Tipo de pagamento n\u00e3o encontrado" });
         }

         if (Number(tipoPagamento.user_id) !== Number(req.userId)) {
            return res.status(403).json({
               error: "Tipos padr\u00e3o n\u00e3o podem ser reativados manualmente",
            });
         }

         await TipoPagamento.reativar(id, req.userId);
         res.json({ message: "Tipo de pagamento reativado com sucesso" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reativar tipo de pagamento" });
      }
   }
}

module.exports = TipoPagamentoController;
