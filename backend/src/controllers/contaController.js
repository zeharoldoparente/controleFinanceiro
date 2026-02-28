const db = require("../config/database");
const emailService = require("../services/emailService");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

class ContaController {
   static async getPerfil(req, res) {
      try {
         const [rows] = await db.query(
            `SELECT id, nome, email, telefone, foto_url, tipo_plano,
                    preferencia_moeda, preferencia_data, notificacoes_email, created_at
             FROM users WHERE id = ?`,
            [req.userId],
         );
         if (!rows[0])
            return res.status(404).json({ error: "Usuário não encontrado" });
         res.json(rows[0]);
      } catch (error) {
         console.error("[conta] getPerfil:", error);
         res.status(500).json({ error: "Erro ao buscar perfil" });
      }
   }

   static async atualizarPerfil(req, res) {
      try {
         const { nome, telefone } = req.body;
         if (!nome || nome.trim().length < 2)
            return res
               .status(400)
               .json({ error: "Nome deve ter pelo menos 2 caracteres" });

         await db.query(
            "UPDATE users SET nome = ?, telefone = ? WHERE id = ?",
            [nome.trim(), telefone?.trim() || null, req.userId],
         );

         const [updated] = await db.query(
            "SELECT id, nome, email, telefone, foto_url, tipo_plano FROM users WHERE id = ?",
            [req.userId],
         );
         res.json({
            message: "Perfil atualizado com sucesso!",
            usuario: updated[0],
         });
      } catch (error) {
         console.error("[conta] atualizarPerfil:", error);
         res.status(500).json({ error: "Erro ao atualizar perfil" });
      }
   }

   static async atualizarFoto(req, res) {
      try {
         const { foto_base64 } = req.body;
         if (!foto_base64)
            return res.status(400).json({ error: "Imagem não informada" });
         if (foto_base64.length > 2_800_000)
            return res
               .status(400)
               .json({ error: "Imagem muito grande. Máximo 2MB." });

         await db.query("UPDATE users SET foto_url = ? WHERE id = ?", [
            foto_base64,
            req.userId,
         ]);
         res.json({ message: "Foto atualizada!", foto_url: foto_base64 });
      } catch (error) {
         console.error("[conta] atualizarFoto:", error);
         res.status(500).json({ error: "Erro ao atualizar foto" });
      }
   }

   static async removerFoto(req, res) {
      try {
         await db.query("UPDATE users SET foto_url = NULL WHERE id = ?", [
            req.userId,
         ]);
         res.json({ message: "Foto removida" });
      } catch (error) {
         console.error("[conta] removerFoto:", error);
         res.status(500).json({ error: "Erro ao remover foto" });
      }
   }

   static async solicitarTrocaSenha(req, res) {
      try {
         const [rows] = await db.query(
            "SELECT nome, email FROM users WHERE id = ?",
            [req.userId],
         );
         if (!rows[0])
            return res.status(404).json({ error: "Usuário não encontrado" });

         const { nome, email } = rows[0];
         const token = crypto.randomBytes(32).toString("hex");
         const expira = new Date(Date.now() + 60 * 60 * 1000);

         await db.query(
            "UPDATE users SET reset_token = ?, reset_token_expira = ? WHERE id = ?",
            [token, expira, req.userId],
         );

         await emailService.enviarEmailAlteracaoSenha(email, nome, token);
         res.json({
            message:
               "Email de confirmação enviado! Verifique sua caixa de entrada.",
         });
      } catch (error) {
         console.error("[conta] solicitarTrocaSenha:", error);
         res.status(500).json({ error: "Erro ao solicitar troca de senha" });
      }
   }

   static async confirmarTrocaSenha(req, res) {
      try {
         const { token, nova_senha } = req.body;
         if (!token || !nova_senha)
            return res
               .status(400)
               .json({ error: "Token e nova senha são obrigatórios" });
         if (nova_senha.length < 8)
            return res
               .status(400)
               .json({ error: "A senha deve ter pelo menos 8 caracteres" });

         const [rows] = await db.query(
            "SELECT id, reset_token_expira FROM users WHERE reset_token = ?",
            [token],
         );
         if (!rows[0])
            return res
               .status(400)
               .json({ error: "Token inválido ou já utilizado" });
         if (new Date(rows[0].reset_token_expira) < new Date())
            return res
               .status(400)
               .json({ error: "Token expirado. Solicite um novo." });

         const hash = await bcrypt.hash(nova_senha, 10);
         await db.query(
            "UPDATE users SET password = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?",
            [hash, rows[0].id],
         );
         res.json({ message: "Senha alterada com sucesso!" });
      } catch (error) {
         console.error("[conta] confirmarTrocaSenha:", error);
         res.status(500).json({ error: "Erro ao alterar senha" });
      }
   }

   static async atualizarPreferencias(req, res) {
      try {
         const { moeda, formato_data, notificacoes_email } = req.body;
         await db.query(
            `UPDATE users SET preferencia_moeda = ?, preferencia_data = ?, notificacoes_email = ? WHERE id = ?`,
            [
               moeda || "BRL",
               formato_data || "DD/MM/YYYY",
               notificacoes_email ? 1 : 0,
               req.userId,
            ],
         );
         res.json({ message: "Preferências salvas!" });
      } catch (error) {
         console.error("[conta] atualizarPreferencias:", error);
         res.status(500).json({ error: "Erro ao salvar preferências" });
      }
   }

   static async enviarSuporte(req, res) {
      try {
         const { tipo, assunto, mensagem } = req.body;
         if (!tipo || !assunto || !mensagem)
            return res
               .status(400)
               .json({ error: "Tipo, assunto e mensagem são obrigatórios" });
         if (mensagem.trim().length < 20)
            return res
               .status(400)
               .json({ error: "A mensagem deve ter pelo menos 20 caracteres" });

         const [rows] = await db.query(
            "SELECT nome, email FROM users WHERE id = ?",
            [req.userId],
         );
         if (!rows[0])
            return res.status(404).json({ error: "Usuário não encontrado" });

         const { nome, email } = rows[0];
         await emailService.enviarEmailSuporte({
            nomeUsuario: nome,
            emailUsuario: email,
            tipo,
            assunto,
            mensagem,
         });
         await emailService.enviarEmailConfirmacaoSuporte(
            email,
            nome,
            tipo,
            assunto,
         );

         res.json({
            message: "Sua mensagem foi enviada! Responderemos em breve.",
         });
      } catch (error) {
         console.error("[conta] enviarSuporte:", error);
         res.status(500).json({ error: "Erro ao enviar mensagem de suporte" });
      }
   }
}

module.exports = ContaController;
