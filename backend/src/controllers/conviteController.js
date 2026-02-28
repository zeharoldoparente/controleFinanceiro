const Convite = require("../models/Convite");
const Notificacao = require("../models/Notificacao");
const User = require("../models/User");
const Mesa = require("../models/Mesa");
const db = require("../config/database");
const emailService = require("../services/emailService"); // ← import no topo, uma vez só

class ConviteController {
   static async create(req, res) {
      try {
         const { mesa_id, email_convidado } = req.body;
         const userId = req.userId;
         const userEmail = req.userEmail;

         if (!mesa_id || !email_convidado) {
            return res
               .status(400)
               .json({ error: "Mesa e email do convidado são obrigatórios" });
         }

         if (email_convidado === userEmail) {
            return res
               .status(400)
               .json({ error: "Você não pode convidar a si mesmo" });
         }

         const [mesa] = await db.query(
            "SELECT criador_id, nome FROM mesas WHERE id = ?",
            [mesa_id],
         );
         if (!mesa[0] || parseInt(mesa[0].criador_id) !== parseInt(userId)) {
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
               error: "Já existe um convite pendente para este email nesta mesa",
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
               .json({ error: "Este usuário já faz parte da mesa" });
         }

         const { conviteId, token } = await Convite.create(
            mesa_id,
            email_convidado,
            userId,
         );

         const usuarioConvidado = await User.findByEmail(email_convidado);
         const userInfo = await User.findById(userId);
         const nomeMesa = mesa[0].nome;

         if (usuarioConvidado) {
            // ── Usuário já tem conta ────────────────────────────────────
            await Notificacao.create(
               usuarioConvidado.id,
               "convite_mesa",
               "Novo convite de mesa",
               `${userInfo.nome} convidou você para participar da mesa "${nomeMesa}"`,
               `/convites/${token}`,
               { convite_id: conviteId, mesa_id, token },
            );

            try {
               await emailService.enviarEmailConviteExistente(
                  email_convidado, // ← era "email" (undefined)
                  userInfo.nome, // ← era "nomeQuemConvidou" (undefined)
                  nomeMesa,
                  usuarioConvidado.nome, // ← era "nomeConvidado" (undefined)
                  token,
               );
            } catch (emailError) {
               console.error("Erro ao enviar email:", emailError);
            }

            res.status(201).json({
               message:
                  "Convite enviado! O usuário receberá uma notificação e um email.",
               conviteId,
               usuarioCadastrado: true,
            });
         } else {
            // ── Usuário ainda não tem conta ─────────────────────────────
            try {
               await emailService.enviarEmailConviteNovo(
                  // ← era "EmailService" (undefined)
                  email_convidado,
                  userInfo.nome,
                  nomeMesa,
                  token,
               );
            } catch (emailError) {
               console.error("Erro ao enviar email:", emailError);
            }

            res.status(201).json({
               message:
                  "Convite criado! Um email foi enviado para o convidado se cadastrar.",
               conviteId,
               token,
               usuarioCadastrado: false,
            });
         }
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar convite" });
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
            return res.status(404).json({ error: "Convite não encontrado" });
         }
         if (convite.status !== "pendente") {
            return res
               .status(400)
               .json({ error: "Este convite já foi processado" });
         }
         if (new Date(convite.expira_em) < new Date()) {
            return res.status(400).json({ error: "Este convite expirou" });
         }
         if (convite.email_convidado !== userEmail) {
            return res
               .status(403)
               .json({ error: "Este convite não foi enviado para você" });
         }

         const [mesasCompartilhadas] = await db.query(
            'SELECT COUNT(*) as total FROM mesa_usuarios WHERE user_id = ? AND papel = "convidado"',
            [userId],
         );

         const user = await User.findById(userId);
         if (user.tipo_plano === "free" && mesasCompartilhadas[0].total >= 2) {
            return res.status(400).json({
               error: "Você atingiu o limite de 2 mesas compartilhadas no plano gratuito",
            });
         }

         await db.query(
            'INSERT INTO mesa_usuarios (mesa_id, user_id, papel) VALUES (?, ?, "convidado")',
            [convite.mesa_id, userId],
         );

         await Convite.aceitar(convite.id, token);

         res.json({ message: "Convite aceito com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao aceitar convite" });
      }
   }

   static async recusar(req, res) {
      try {
         const { token } = req.params;
         const userEmail = req.userEmail;

         const convite = await Convite.findByToken(token);

         if (!convite) {
            return res.status(404).json({ error: "Convite não encontrado" });
         }
         if (convite.status !== "pendente") {
            return res
               .status(400)
               .json({ error: "Este convite já foi processado" });
         }
         if (convite.email_convidado !== userEmail) {
            return res
               .status(403)
               .json({ error: "Este convite não foi enviado para você" });
         }

         await Convite.recusar(convite.id, token);

         res.json({ message: "Convite recusado" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao recusar convite" });
      }
   }
}

module.exports = ConviteController;
