const User = require("../models/User");
const TokenVerificacao = require("../models/TokenVerificacao");
const EmailService = require("../services/emailService");
const jwt = require("jsonwebtoken");

function getFrontendUrl() {
   return process.env.FRONTEND_URL || "http://localhost:3000";
}

function wantsHtmlResponse(req) {
   return req.accepts(["html", "json"]) === "html";
}

function escapeHtml(value) {
   return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
}

function buildVerificationPage({
   title,
   message,
   buttonLabel,
   buttonUrl,
   autoRedirectSeconds = 0,
   isSuccess = false,
}) {
   const safeTitle = escapeHtml(title);
   const safeMessage = escapeHtml(message);
   const safeButtonLabel = escapeHtml(buttonLabel);
   const safeButtonUrl = escapeHtml(buttonUrl);
   const redirectText =
      autoRedirectSeconds > 0
         ? `<p class="countdown">Voce sera redirecionado em <strong><span id="countdown">${autoRedirectSeconds}</span>s</strong>.</p>`
         : "";
   const statusClass = isSuccess ? "status success" : "status error";
   const statusText = isSuccess ? "Conta confirmada" : "Nao foi possivel confirmar";
   const autoRedirectMeta =
      autoRedirectSeconds > 0
         ? `<meta http-equiv="refresh" content="${autoRedirectSeconds};url=${safeButtonUrl}" />`
         : "";
   const autoRedirectScript =
      autoRedirectSeconds > 0
         ? `
      <script>
        (function () {
          var remaining = ${autoRedirectSeconds};
          var countdown = document.getElementById("countdown");
          var interval = setInterval(function () {
            remaining -= 1;
            if (countdown) countdown.textContent = String(Math.max(remaining, 0));
            if (remaining <= 0) clearInterval(interval);
          }, 1000);
        })();
      </script>
      `
         : "";

   return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  ${autoRedirectMeta}
  <title>${safeTitle}</title>
  <style>
    :root {
      --bg-1: #032218;
      --bg-2: #0a4a34;
      --card: #ffffff;
      --muted: #4a5568;
      --text: #13231c;
      --ok: #0f9f6e;
      --ok-soft: #dcfce7;
      --error: #dc2626;
      --error-soft: #fee2e2;
      --btn: #0b6b4b;
      --btn-hover: #0a5a40;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 20px;
      font-family: "Segoe UI", Roboto, sans-serif;
      background:
        radial-gradient(circle at top left, rgba(255,255,255,0.09), transparent 35%),
        radial-gradient(circle at bottom right, rgba(163,230,53,0.17), transparent 45%),
        linear-gradient(130deg, var(--bg-1), var(--bg-2));
    }
    .card {
      width: min(92vw, 480px);
      background: var(--card);
      border-radius: 22px;
      padding: 28px 24px;
      box-shadow: 0 26px 60px rgba(0, 0, 0, 0.28);
      text-align: center;
    }
    .badge {
      width: 78px;
      height: 78px;
      border-radius: 999px;
      margin: 4px auto 16px;
      display: grid;
      place-items: center;
      font-size: 30px;
      font-weight: 700;
      color: #0f5132;
      background: var(--ok-soft);
    }
    .status {
      display: inline-flex;
      align-items: center;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.04em;
      padding: 6px 10px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .status.success {
      background: var(--ok-soft);
      color: var(--ok);
    }
    .status.error {
      background: var(--error-soft);
      color: var(--error);
    }
    h1 {
      color: var(--text);
      font-size: 26px;
      line-height: 1.25;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }
    p {
      color: var(--muted);
      font-size: 16px;
      line-height: 1.6;
    }
    .countdown {
      margin-top: 16px;
      font-size: 14px;
      color: #2f3d37;
    }
    .button {
      display: inline-block;
      margin-top: 22px;
      text-decoration: none;
      border-radius: 12px;
      padding: 12px 20px;
      font-weight: 700;
      font-size: 15px;
      background: var(--btn);
      color: #fff;
      transition: background 0.2s ease;
    }
    .button:hover {
      background: var(--btn-hover);
    }
    .small {
      margin-top: 14px;
      font-size: 12px;
      color: #6b7280;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="badge">${isSuccess ? "OK" : "!"}</div>
    <div class="${statusClass}">${statusText}</div>
    <h1>${safeTitle}</h1>
    <p>${safeMessage}</p>
    ${redirectText}
    <a class="button" href="${safeButtonUrl}">${safeButtonLabel}</a>
    <p class="small">Se o redirecionamento nao ocorrer, use o botao acima.</p>
  </main>
  ${autoRedirectScript}
</body>
</html>`;
}

function isTokenValidationError(error) {
   const message = String(error?.message || "").toLowerCase();

   if (!message.includes("token")) return false;

   return (
      message.includes("inv") ||
      message.includes("expir") ||
      message.includes("usado")
   );
}

class AuthController {
   static async register(req, res) {
      try {
         const { nome, email, senha } = req.body;

         if (!nome || !email || !senha) {
            return res
               .status(400)
               .json({ error: "Todos os campos sao obrigatorios" });
         }

         const usuarioExiste = await User.findByEmail(email);
         if (usuarioExiste) {
            return res.status(400).json({ error: "Email ja cadastrado" });
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
               "Usuario criado com sucesso! Verifique seu email para ativar a conta.",
            userId,
            emailEnviado: true,
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao criar usuario" });
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

         const loginUrl = `${getFrontendUrl()}/login?email_verificado=1`;
         const successPayload = {
            message: "Email verificado com sucesso! Voce ja pode fazer login.",
         };

         if (wantsHtmlResponse(req)) {
            return res.status(200).type("html").send(
               buildVerificationPage({
                  title: "Conta confirmada com sucesso",
                  message:
                     "Seu email foi validado e seu acesso ao ControlFin ja esta liberado.",
                  buttonLabel: "Ir para login",
                  buttonUrl: loginUrl,
                  autoRedirectSeconds: 5,
                  isSuccess: true,
               }),
            );
         }

         res.json(successPayload);
      } catch (error) {
         console.error(error);

         const tokenError = isTokenValidationError(error);
         const status = tokenError ? 400 : 500;
         const errorMessage = tokenError
            ? "Link de confirmacao invalido, expirado ou ja utilizado."
            : "Erro ao verificar email.";

         if (wantsHtmlResponse(req)) {
            return res.status(status).type("html").send(
               buildVerificationPage({
                  title: "Nao conseguimos confirmar sua conta",
                  message: errorMessage,
                  buttonLabel: "Ir para login",
                  buttonUrl: `${getFrontendUrl()}/login`,
                  isSuccess: false,
               }),
            );
         }

         if (tokenError) {
            return res.status(400).json({ error: error.message });
         }

         res.status(500).json({ error: "Erro ao verificar email" });
      }
   }

   static async reenviarEmailVerificacao(req, res) {
      try {
         const { email } = req.body;

         if (!email) {
            return res.status(400).json({ error: "Email e obrigatorio" });
         }

         const user = await User.findByEmail(email);
         if (!user) {
            return res.status(404).json({ error: "Usuario nao encontrado" });
         }

         if (user.email_verificado) {
            return res.status(400).json({ error: "Email ja esta verificado" });
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

         res.json({ message: "Email de verificacao reenviado com sucesso!" });
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
               .json({ error: "Email e senha sao obrigatorios" });
         }

         const user = await User.findByEmail(email);
         if (!user) {
            return res.status(401).json({ error: "Email ou senha invalidos" });
         }

         const senhaValida = await User.verificarSenha(senha, user.senha);
         if (!senhaValida) {
            return res.status(401).json({ error: "Email ou senha invalidos" });
         }

         if (!user.email_verificado) {
            return res.status(401).json({
               error: "Email nao verificado. Verifique seu email antes de fazer login.",
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
            return res.status(400).json({ error: "Email e obrigatorio" });
         }

         const user = await User.findByEmail(email);

         if (!user) {
            return res.json({
               message:
                  "Se o email existir em nossa base, voce recebera instrucoes para recuperar sua senha.",
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
               "Se o email existir em nossa base, voce recebera instrucoes para recuperar sua senha.",
         });
      } catch (error) {
         console.error(error);
         res.status(500).json({ error: "Erro ao processar solicitacao" });
      }
   }

   static async resetarSenha(req, res) {
      try {
         const { token } = req.params;
         const { novaSenha } = req.body;

         if (!novaSenha) {
            return res.status(400).json({ error: "Nova senha e obrigatoria" });
         }

         if (novaSenha.length < 6) {
            return res
               .status(400)
               .json({ error: "A senha deve ter no minimo 6 caracteres" });
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
               "Senha alterada com sucesso! Voce ja pode fazer login com a nova senha.",
         });
      } catch (error) {
         console.error(error);

         if (isTokenValidationError(error)) {
            return res.status(400).json({ error: error.message });
         }

         res.status(500).json({ error: "Erro ao resetar senha" });
      }
   }
}

module.exports = AuthController;
