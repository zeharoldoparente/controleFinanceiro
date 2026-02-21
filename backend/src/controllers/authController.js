const User = require("../models/User");
const TokenVerificacao = require("../models/TokenVerificacao");
const EmailService = require("../services/emailService");
const jwt = require("jsonwebtoken");

class AuthController {
   static async register(req, res) {
      try {
         const { nome, email, senha } = req.body;

         if (!nome || !email || !senha) {
            return res
               .status(400)
               .json({ error: "Todos os campos são obrigatórios" });
         }
         const usuarioExiste = await User.findByEmail(email);
         if (usuarioExiste) {
            return res.status(400).json({ error: "Email já cadastrado" });
         }
         const userId = await User.create(nome, email, senha);
         const token = await TokenVerificacao.create(
            userId,
            "verificacao_email",
            24,
         );

         try {
            await EmailService.enviarEmailVerificacao(email, nome, token);
         } catch (emailError) {
            console.error("Erro ao enviar email:", emailError);
         }

         res.status(201).json({
            message:
               "Usuário criado com sucesso! Verifique seu email para ativar a conta.",
            userId,
            emailEnviado: true,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar usuário" });
      }
   }

   static async verificarEmail(req, res) {
      try {
         const { token } = req.params;
         const tokenData = await TokenVerificacao.validar(
            token,
            "verificacao_email",
         );
         await User.verificarEmail(tokenData.user_id);
         await TokenVerificacao.marcarComoUsado(token);

         res.json({
            message: "Email verificado com sucesso! Você já pode fazer login.",
         });
      } catch (error) {
         console.error(error);

         if (
            error.message === "Token inválido" ||
            error.message === "Token já foi usado" ||
            error.message === "Token expirado"
         ) {
            return res.status(400).json({ error: error.message });
         }

         res.status(500).json({ error: "Erro ao verificar email" });
      }
   }

   static async reenviarEmailVerificacao(req, res) {
      try {
         const { email } = req.body;

         if (!email) {
            return res.status(400).json({ error: "Email é obrigatório" });
         }

         const user = await User.findByEmail(email);
         if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
         }

         if (user.email_verificado) {
            return res.status(400).json({ error: "Email já está verificado" });
         }

         await TokenVerificacao.invalidarTokensAntigos(
            user.id,
            "verificacao_email",
         );

         const token = await TokenVerificacao.create(
            user.id,
            "verificacao_email",
            24,
         );

         await EmailService.enviarEmailVerificacao(email, user.nome, token);

         res.json({ message: "Email de verificação reenviado com sucesso!" });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao reenviar email" });
      }
   }

   static async login(req, res) {
      try {
         const { email, senha } = req.body;

         if (!email || !senha) {
            return res
               .status(400)
               .json({ error: "Email e senha são obrigatórios" });
         }

         const user = await User.findByEmail(email);
         if (!user) {
            return res.status(401).json({ error: "Email ou senha inválidos" });
         }

         const senhaValida = await User.verificarSenha(senha, user.senha);
         if (!senhaValida) {
            return res.status(401).json({ error: "Email ou senha inválidos" });
         }

         if (!user.email_verificado) {
            return res.status(401).json({
               error: "Email não verificado. Por favor, verifique seu email antes de fazer login.",
               emailNaoVerificado: true,
            });
         }

         const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
         );

         res.json({
            message: "Login realizado com sucesso!",
            token,
            user: {
               id: user.id,
               nome: user.nome,
               email: user.email,
               emailVerificado: user.email_verificado,
            },
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao fazer login" });
      }
   }

   static async solicitarRecuperacaoSenha(req, res) {
      try {
         const { email } = req.body;

         if (!email) {
            return res.status(400).json({ error: "Email é obrigatório" });
         }

         const user = await User.findByEmail(email);

         if (!user) {
            return res.json({
               message:
                  "Se o email existir em nossa base, você receberá instruções para recuperar sua senha.",
            });
         }

         await TokenVerificacao.invalidarTokensAntigos(
            user.id,
            "recuperacao_senha",
         );

         const token = await TokenVerificacao.create(
            user.id,
            "recuperacao_senha",
            1,
         );

         try {
            await EmailService.enviarEmailRecuperacaoSenha(
               email,
               user.nome,
               token,
            );
         } catch (emailError) {
            console.error("Erro ao enviar email:", emailError);
         }

         res.json({
            message:
               "Se o email existir em nossa base, você receberá instruções para recuperar sua senha.",
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao processar solicitação" });
      }
   }

   static async resetarSenha(req, res) {
      try {
         const { token } = req.params;
         const { novaSenha } = req.body;

         if (!novaSenha) {
            return res.status(400).json({ error: "Nova senha é obrigatória" });
         }

         if (novaSenha.length < 6) {
            return res
               .status(400)
               .json({ error: "A senha deve ter no mínimo 6 caracteres" });
         }

         const tokenData = await TokenVerificacao.validar(
            token,
            "recuperacao_senha",
         );

         await User.atualizarSenha(tokenData.user_id, novaSenha);
         await TokenVerificacao.marcarComoUsado(token);
         await TokenVerificacao.invalidarTokensAntigos(
            tokenData.user_id,
            "recuperacao_senha",
         );

         res.json({
            message:
               "Senha alterada com sucesso! Você já pode fazer login com a nova senha.",
         });
      } catch (error) {
         console.error(error);

         if (
            error.message === "Token inválido" ||
            error.message === "Token já foi usado" ||
            error.message === "Token expirado"
         ) {
            return res.status(400).json({ error: error.message });
         }

         res.status(500).json({ error: "Erro ao resetar senha" });
      }
   }
}

module.exports = AuthController;
