const Convite = require("../models/Convite");
const Notificacao = require("../models/Notificacao");
const User = require("../models/User");
const db = require("../config/database");
const emailService = require("../services/emailService");

class ConviteController {
   static async marcarNotificacaoConviteProcessada(userId, token, mensagem) {
      const link = `/convites/${token}`;

      try {
         await db.query(
            `UPDATE notificacoes
             SET mensagem = ?
             WHERE user_id = ?
               AND tipo = 'convite_mesa'
               AND link = ?`,
            [mensagem, userId, link],
         );

         await db.query(
            `UPDATE notificacoes
             SET dados_extras = JSON_SET(
                  COALESCE(dados_extras, JSON_OBJECT()),
                  '$.processado',
                  CAST('true' AS JSON)
               )
             WHERE user_id = ?
               AND tipo = 'convite_mesa'
               AND link = ?`,
            [userId, link],
         );
      } catch (error) {
         console.error("Erro ao atualizar notificacao de convite:", error);
      }
   }

   static async create(req, res) {
      try {
         const { mesa_id, email_convidado } = req.body;
         const userId = req.userId;
         const userEmail = req.userEmail;

         if (!mesa_id || !email_convidado) {
            return res
               .status(400)
               .json({ error: "Mesa e email do convidado sao obrigatorios" });
         }

         if (email_convidado === userEmail) {
            return res
               .status(400)
               .json({ error: "Voce nao pode convidar a si mesmo" });
         }

         const [mesaRows] = await db.query(
            "SELECT criador_id, nome FROM mesas WHERE id = ?",
            [mesa_id],
         );

         const mesa = mesaRows[0];

         if (!mesa || parseInt(mesa.criador_id) !== parseInt(userId)) {
            return res.status(403).json({
               error: "Apenas o criador da mesa pode enviar convites",
            });
         }

         const conviteExistente = await Convite.verificarConviteExistente(
            mesa_id,
            email_convidado,
         );

         if (conviteExistente) {
            return res.status(400).json({
               error: "Ja existe um convite pendente para este email nesta mesa",
            });
         }

         const [jaParticipa] = await db.query(
            `SELECT mu.id FROM mesa_usuarios mu
             INNER JOIN users u ON mu.user_id = u.id
             WHERE mu.mesa_id = ? AND u.email = ?`,
            [mesa_id, email_convidado],
         );

         if (jaParticipa.length > 0) {
            return res
               .status(400)
               .json({ error: "Este usuario ja faz parte da mesa" });
         }

         const { conviteId, token } = await Convite.create(
            mesa_id,
            email_convidado,
            userId,
         );

         const usuarioConvidado = await User.findByEmail(email_convidado);
         const userInfo = await User.findById(userId);
         const nomeMesa = mesa.nome;
         const nomeQuemConvida = userInfo?.nome || "Um usuario";

         if (usuarioConvidado) {
            let notificacaoCriada = false;
            let emailEnviado = false;

            // O convite ja foi criado. Notificacao e email sao best effort.
            try {
               await Notificacao.create(
                  usuarioConvidado.id,
                  "convite_mesa",
                  "Novo convite de mesa",
                  `${nomeQuemConvida} convidou voce para participar da mesa "${nomeMesa}"`,
                  `/convites/${token}`,
                  { convite_id: conviteId, mesa_id, token },
               );
               notificacaoCriada = true;
            } catch (notificacaoError) {
               console.error(
                  "Erro ao criar notificacao de convite:",
                  notificacaoError,
               );
            }

            try {
               await emailService.enviarEmailConviteExistente(
                  email_convidado,
                  nomeQuemConvida,
                  nomeMesa,
                  usuarioConvidado.nome,
                  token,
               );
               emailEnviado = true;
            } catch (emailError) {
               console.error("Erro ao enviar email:", emailError);
            }

            let message =
               "Convite enviado com sucesso para usuario cadastrado.";

            if (notificacaoCriada && emailEnviado) {
               message =
                  "Convite enviado! O usuario recebera uma notificacao e um email.";
            } else if (notificacaoCriada && !emailEnviado) {
               message =
                  "Convite enviado! O usuario recebera notificacao no app.";
            } else if (!notificacaoCriada && emailEnviado) {
               message =
                  "Convite enviado! O usuario recebera o email, mas a notificacao no app nao foi criada.";
            }

            return res.status(201).json({
               message,
               conviteId,
               usuarioCadastrado: true,
            });
         }

         try {
            await emailService.enviarEmailConviteNovo(
               email_convidado,
               nomeQuemConvida,
               nomeMesa,
               token,
            );
         } catch (emailError) {
            console.error("Erro ao enviar email:", emailError);
         }

         return res.status(201).json({
            message:
               "Convite criado! Um email foi enviado para o convidado se cadastrar.",
            conviteId,
            token,
            usuarioCadastrado: false,
         });
      } catch (error) {
         console.error("Erro ao criar convite:", error);
         const errorCode = error?.code ? ` (${error.code})` : "";
         const errorSql =
            error?.code === "ER_BAD_FIELD_ERROR" && error?.sqlMessage
               ? `: ${error.sqlMessage}`
               : "";
         const errorDetail =
            !error?.code && error?.message ? `: ${error.message}` : "";
         res.status(500).json({
            error: `Erro ao criar convite${errorCode}${errorSql}${errorDetail}`,
         });
      }
   }

   static async listPendentes(req, res) {
      try {
         const userEmail = req.userEmail;
         const convites = await Convite.findPendentesByEmail(userEmail);
         res.json({ convites });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar convites" });
      }
   }

   static async listEnviados(req, res) {
      try {
         const userId = req.userId;
         const convites = await Convite.findEnviadosByUserId(userId);
         res.json({ convites });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao listar convites enviados" });
      }
   }

   static async aceitar(req, res) {
      try {
         const { token } = req.params;
         const userId = req.userId;
         const userEmail = req.userEmail;

         const convite = await Convite.findByToken(token);

         if (!convite) {
            return res.status(404).json({ error: "Convite nao encontrado" });
         }

         if (convite.status && convite.status !== "pendente") {
            return res
               .status(400)
               .json({ error: "Este convite ja foi processado" });
         }

         if (convite.expira_em && new Date(convite.expira_em) < new Date()) {
            return res.status(400).json({ error: "Este convite expirou" });
         }

         if (convite.email_convidado !== userEmail) {
            return res
               .status(403)
               .json({ error: "Este convite nao foi enviado para voce" });
         }

         const [mesasCompartilhadas] = await db.query(
            `SELECT COUNT(*) as total FROM mesa_usuarios WHERE user_id = ? AND papel = 'convidado'`,
            [userId],
         );

         const totalCompartilhadas = mesasCompartilhadas?.[0]?.total || 0;
         const user = await User.findById(userId);

         if (user?.tipo_plano === "free" && totalCompartilhadas >= 2) {
            return res.status(400).json({
               error: "Voce atingiu o limite de 2 mesas compartilhadas no plano gratuito",
            });
         }

         await db.query(
            `INSERT INTO mesa_usuarios (mesa_id, user_id, papel) VALUES (?, ?, 'convidado')`,
            [convite.mesa_id, userId],
         );

         await Convite.aceitar(convite.id, token);
         await ConviteController.marcarNotificacaoConviteProcessada(
            userId,
            token,
            "Convite aceito com sucesso. Marque como lida quando quiser.",
         );

         res.json({
            message: "Convite aceito com sucesso!",
            mesa_id: convite.mesa_id,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao aceitar convite" });
      }
   }

   static async recusar(req, res) {
      try {
         const { token } = req.params;
         const userEmail = req.userEmail;
         const userId = req.userId;

         const convite = await Convite.findByToken(token);

         if (!convite) {
            return res.status(404).json({ error: "Convite nao encontrado" });
         }

         if (convite.status && convite.status !== "pendente") {
            return res
               .status(400)
               .json({ error: "Este convite ja foi processado" });
         }

         if (convite.email_convidado !== userEmail) {
            return res
               .status(403)
               .json({ error: "Este convite nao foi enviado para voce" });
         }

         await Convite.recusar(convite.id, token);
         await ConviteController.marcarNotificacaoConviteProcessada(
            userId,
            token,
            "Convite recusado. Marque como lida quando quiser.",
         );

         res.json({ message: "Convite recusado" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao recusar convite" });
      }
   }
}

module.exports = ConviteController;

