const nodemailer = require("nodemailer");

// ─────────────────────────────────────────────────────────────
// Paleta ControlFin
// Verde escuro: #035E3D | Verde médio: #1E8449 | Verde claro: #27AE60
// ─────────────────────────────────────────────────────────────

const BASE_STYLES = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f0f4f0;
  color: #1a1a1a;
  -webkit-font-smoothing: antialiased;
}
.wrapper {
  max-width: 600px;
  margin: 40px auto;
  background: #ffffff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(3, 94, 61, 0.10);
}
.header {
  background: linear-gradient(135deg, #035E3D 0%, #1E8449 60%, #27AE60 100%);
  padding: 40px 48px 36px;
  text-align: center;
}
.header-logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}
.header-icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  line-height: 1;
}
.header-brand {
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
}
.header-brand span { color: rgba(255,255,255,0.65); font-weight: 400; }
.header-title {
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  letter-spacing: -0.5px;
}
.header-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.75);
  margin-top: 6px;
}
.body { padding: 40px 48px; }
.greeting { font-size: 17px; color: #1a1a1a; font-weight: 600; margin-bottom: 12px; }
.text { font-size: 15px; color: #4a5568; line-height: 1.7; margin-bottom: 14px; }
.highlight-box {
  background: linear-gradient(135deg, #f0faf5, #e8f5ee);
  border: 1px solid #b7e4cc;
  border-left: 4px solid #1E8449;
  border-radius: 10px;
  padding: 16px 20px;
  margin: 24px 0;
}
.highlight-box .label {
  font-size: 11px;
  font-weight: 700;
  color: #1E8449;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin-bottom: 4px;
}
.highlight-box .value { font-size: 16px; font-weight: 700; color: #035E3D; }
.btn-wrapper { text-align: center; margin: 32px 0 16px; }
.btn {
  display: inline-block;
  padding: 15px 36px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
  letter-spacing: 0.2px;
}
.btn-green { background: linear-gradient(135deg, #035E3D, #1E8449); color: #ffffff !important; }
.btn-blue  { background: linear-gradient(135deg, #1a56db, #2563eb); color: #ffffff !important; }
.btn-orange{ background: linear-gradient(135deg, #c2410c, #ea580c); color: #ffffff !important; }
.fallback-link {
  font-size: 12px;
  color: #9ca3af;
  word-break: break-all;
  margin-bottom: 24px;
  text-align: center;
}
.fallback-link a { color: #1E8449; }
.divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
.info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 10px;
  line-height: 1.5;
}
.info-icon {
  font-size: 14px;
  margin-top: 1px;
  flex-shrink: 0;
}
.warning-box {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-left: 4px solid #f59e0b;
  border-radius: 10px;
  padding: 14px 18px;
  margin: 20px 0;
  font-size: 13px;
  color: #92400e;
  line-height: 1.6;
}
.footer {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 28px 48px;
  text-align: center;
}
.footer-brand { font-size: 13px; font-weight: 700; color: #035E3D; margin-bottom: 6px; }
.footer-text { font-size: 12px; color: #9ca3af; line-height: 1.6; }
.footer-text a { color: #1E8449; text-decoration: none; }
.logo-img {
  height: 48px;
  width: auto;
  display: block;
  margin: 0 auto 20px;
}
.footer-nasam {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}
.footer-nasam-label {
  font-size: 11px;
  color: #9ca3af;
}
.footer-nasam img {
  height: 20px;
  width: auto;
}
`;

function baseTemplate({ headerTitle, headerSubtitle, body }) {
   const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
   const logoUrl = `${frontendUrl}/logo_nome_branco2.PNG`;
   const nasamUrl = `${frontendUrl}/NASAMDev.svg`;

   return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headerTitle}</title>
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="wrapper">

    <div class="header">
      <img src="${logoUrl}" alt="ControlFin" class="logo-img" />
      <div class="header-title">${headerTitle}</div>
      ${headerSubtitle ? `<div class="header-subtitle">${headerSubtitle}</div>` : ""}
    </div>

    <div class="body">
      ${body}
    </div>

    <div class="footer">
      <div class="footer-brand">ControlFin — Controle Financeiro</div>
      <div class="footer-text">
        Este é um email automático, por favor não responda.<br />
        Em caso de dúvidas, acesse o sistema e utilize o suporte.
      </div>
      <div class="footer-nasam">
        <span class="footer-nasam-label">Desenvolvido e mantido por</span>
        <img src="${nasamUrl}" alt="NASAM Dev" />
      </div>
    </div>

  </div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────

class EmailService {
   constructor() {
      this.transporter = nodemailer.createTransport({
         host: process.env.EMAIL_HOST,
         port: parseInt(process.env.EMAIL_PORT || "587"),
         secure: false,
         auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
         },
      });
   }

   // ── 1. Verificação de Email ──────────────────────────────
   async enviarEmailVerificacao(para, nome, token) {
      const link = `${process.env.APP_URL}/api/auth/verificar-email/${token}`;
      const primeiroNome = nome.split(" ")[0];

      const html = baseTemplate({
         headerTitle: "Confirme seu email",
         headerSubtitle: "Só mais um passo para começar",
         body: `
           <p class="greeting">Olá, ${primeiroNome}! 👋</p>
           <p class="text">
             Obrigado por criar sua conta no <strong>ControlFin</strong>. Para ativar seu acesso e começar a organizar suas finanças, confirme que este email pertence a você.
           </p>
           <div class="highlight-box">
             <div class="label">✅ Conta cadastrada com</div>
             <div class="value">${para}</div>
           </div>
           <div class="btn-wrapper">
             <a href="${link}" class="btn btn-green">Confirmar meu email</a>
           </div>
           <p class="fallback-link">Ou copie o link: <a href="${link}">${link}</a></p>
           <hr class="divider" />
           <div class="info-row"><span class="info-icon">⏱</span><span>Este link expira em <strong>24 horas</strong></span></div>
           <div class="info-row"><span class="info-icon">🔒</span><span>Se você não criou esta conta, ignore este email com segurança</span></div>
         `,
      });

      await this.transporter.sendMail({
         from: process.env.EMAIL_FROM,
         to: para,
         subject: "✉️ Confirme seu email — ControlFin",
         html,
      });
   }

   // ── 2. Convite para usuário SEM cadastro ─────────────────
   async enviarEmailConviteNovo(para, nomeQuemConvidou, nomeMesa, token) {
      const link = `${process.env.FRONTEND_URL}/cadastro?convite=${token}`;

      const html = baseTemplate({
         headerTitle: "Você foi convidado!",
         headerSubtitle: `Para participar da mesa "${nomeMesa}"`,
         body: `
           <p class="greeting">Olá! 👋</p>
           <p class="text">
             <strong>${nomeQuemConvidou}</strong> te convidou para participar de uma mesa de controle financeiro compartilhado:
           </p>
           <div class="highlight-box">
             <div class="label">📊 Mesa de controle financeiro</div>
             <div class="value">${nomeMesa}</div>
           </div>
           <p class="text">
             Para aceitar, crie sua conta gratuita no ControlFin. O convite será vinculado automaticamente após o cadastro.
           </p>
           <div class="btn-wrapper">
             <a href="${link}" class="btn btn-blue">Criar conta e aceitar convite</a>
           </div>
           <p class="fallback-link">Ou copie o link: <a href="${link}">${link}</a></p>
           <hr class="divider" />
           <div class="info-row"><span class="info-icon">⏱</span><span>Este convite expira em <strong>7 dias</strong></span></div>
           <div class="info-row"><span class="info-icon">🆓</span><span>O ControlFin é gratuito para começar</span></div>
           <div class="info-row"><span class="info-icon">🔒</span><span>Se não quiser participar, basta ignorar este email</span></div>
         `,
      });

      await this.transporter.sendMail({
         from: process.env.EMAIL_FROM,
         to: para,
         subject: `🤝 ${nomeQuemConvidou} te convidou para a mesa "${nomeMesa}" — ControlFin`,
         html,
      });
   }

   // ── 3. Convite para usuário JÁ cadastrado ────────────────
   async enviarEmailConviteExistente(
      para,
      nomeQuemConvidou,
      nomeMesa,
      nomeConvidado,
      token,
   ) {
      const link = `${process.env.FRONTEND_URL}/dashboard/mesas`;
      const primeiroNome = (nomeConvidado || "").split(" ")[0] || "você";

      const html = baseTemplate({
         headerTitle: "Novo convite de mesa",
         headerSubtitle: `${nomeQuemConvidou} quer compartilhar finanças com você`,
         body: `
           <p class="greeting">Olá, ${primeiroNome}! 👋</p>
           <p class="text">
             <strong>${nomeQuemConvidou}</strong> enviou um convite para você participar da seguinte mesa:
           </p>
           <div class="highlight-box">
             <div class="label">📊 Mesa de controle financeiro</div>
             <div class="value">${nomeMesa}</div>
           </div>
           <p class="text">
             O convite já está disponível nas suas notificações 🔔. Acesse o sistema para aceitar ou recusar diretamente pelo painel.
           </p>
           <div class="btn-wrapper">
             <a href="${link}" class="btn btn-blue">Abrir notificações no sistema</a>
           </div>
           <p class="fallback-link">Ou acesse: <a href="${link}">${link}</a></p>
           <div class="warning-box">
             ⚠️ <strong>Importante:</strong> ao aceitar, você terá acesso às receitas e despesas compartilhadas desta mesa. Seus cartões pessoais permanecem privados.
           </div>
           <hr class="divider" />
           <div class="info-row"><span class="info-icon">⏱</span><span>Este convite expira em <strong>7 dias</strong></span></div>
           <div class="info-row"><span class="info-icon">🔒</span><span>Se não quiser participar, recuse pelo sistema ou ignore este email</span></div>
         `,
      });

      await this.transporter.sendMail({
         from: process.env.EMAIL_FROM,
         to: para,
         subject: `🤝 ${nomeQuemConvidou} te convidou para a mesa "${nomeMesa}" — ControlFin`,
         html,
      });
   }

   // ── 4. Recuperação de Senha ──────────────────────────────
   async enviarEmailRecuperacaoSenha(para, nome, token) {
      const link = `${process.env.FRONTEND_URL}/resetar-senha/${token}`;
      const primeiroNome = nome.split(" ")[0];

      const html = baseTemplate({
         headerTitle: "Redefinir senha",
         headerSubtitle: "Recebemos sua solicitação de redefinição",
         body: `
           <p class="greeting">Olá, ${primeiroNome}!</p>
           <p class="text">
             Recebemos uma solicitação para redefinir a senha da sua conta no ControlFin. Clique abaixo para criar uma nova senha segura.
           </p>
           <div class="btn-wrapper">
             <a href="${link}" class="btn btn-orange">Redefinir minha senha</a>
           </div>
           <p class="fallback-link">Ou copie o link: <a href="${link}">${link}</a></p>
           <div class="warning-box">
             ⚠️ <strong>Este link expira em 1 hora.</strong> Após esse prazo, será necessário solicitar um novo link pelo sistema.
           </div>
           <hr class="divider" />
           <div class="info-row"><span class="info-icon">🔒</span><span>Se você <strong>não</strong> fez esta solicitação, ignore este email — sua senha permanece inalterada</span></div>
           <div class="info-row"><span class="info-icon">⚠️</span><span>Nunca compartilhe este link com ninguém</span></div>
           <div class="info-row"><span class="info-icon">📧</span><span>Se suspeitar de acesso não autorizado, troque sua senha imediatamente</span></div>
         `,
      });

      await this.transporter.sendMail({
         from: process.env.EMAIL_FROM,
         to: para,
         subject: "🔐 Redefinição de senha — ControlFin",
         html,
      });
   }

   // ── Email: Solicitação de troca de senha (feita pelo próprio usuário logado) ──
   async enviarEmailAlteracaoSenha(para, nome, token) {
      const link = `${process.env.FRONTEND_URL}/resetar-senha/${token}`;
      const primeiroNome = nome.split(" ")[0];

      const html = baseTemplate({
         headerTitle: "Alteração de senha",
         headerSubtitle: "Confirme para continuar",
         body: `
           <p class="greeting">Olá, ${primeiroNome}!</p>
           <p class="text">
             Você solicitou a <strong>alteração da sua senha</strong> no ControlFin.
             Clique no botão abaixo para criar uma nova senha segura.
           </p>
           <div class="btn-wrapper">
             <a href="${link}" class="btn btn-orange">Criar nova senha</a>
           </div>
           <p class="fallback-link">Ou copie o link: <a href="${link}">${link}</a></p>
           <div class="warning-box">
             ⚠️ <strong>Este link expira em 1 hora.</strong> Se você não realizou essa solicitação, ignore este email — sua senha permanece inalterada.
           </div>
           <hr class="divider" />
           <div class="info-row"><span class="info-icon">🔒</span><span>Nunca compartilhe este link com ninguém, nem com o suporte</span></div>
           <div class="info-row"><span class="info-icon">🛡️</span><span>O ControlFin nunca solicita sua senha por email ou telefone</span></div>
         `,
      });

      await this.transporter.sendMail({
         from: process.env.EMAIL_FROM,
         to: para,
         subject: "🔐 Confirmação de alteração de senha — ControlFin",
         html,
      });
   }

   // ── Email: Mensagem de suporte recebida (vai para o SAC) ──
   async enviarEmailSuporte({
      nomeUsuario,
      emailUsuario,
      tipo,
      assunto,
      mensagem,
   }) {
      const tipoLabel =
         {
            sugestao: "💡 Sugestão",
            problema: "🐛 Problema/Bug",
            solicitacao: "📋 Solicitação",
            reclamacao: "😠 Reclamação",
            duvida: "❓ Dúvida",
         }[tipo] || tipo;

      const html = baseTemplate({
         headerTitle: "Nova mensagem de suporte",
         headerSubtitle: `${tipoLabel} — ${assunto}`,
         body: `
           <p class="greeting">Nova mensagem recebida via ControlFin</p>
           <div class="highlight-box">
             <div style="display:flex;gap:8px;margin-bottom:6px;">
               <span style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Remetente</span>
             </div>
             <div style="font-size:15px;font-weight:700;color:#111827;">${nomeUsuario}</div>
             <div style="font-size:13px;color:#6b7280;margin-top:2px;">${emailUsuario}</div>
           </div>
           <div class="highlight-box" style="margin-top:12px;">
             <div style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Tipo</div>
             <div style="font-size:14px;font-weight:600;color:#111827;">${tipoLabel}</div>
           </div>
           <div class="highlight-box" style="margin-top:12px;">
             <div style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;">Assunto</div>
             <div style="font-size:14px;font-weight:600;color:#111827;">${assunto}</div>
           </div>
           <div class="highlight-box" style="margin-top:12px;">
             <div style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">Mensagem</div>
             <div style="font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${mensagem}</div>
           </div>
           <hr class="divider" />
           <div class="info-row"><span class="info-icon">📧</span><span>Para responder, envie um email diretamente para <strong>${emailUsuario}</strong></span></div>
         `,
      });

      await this.transporter.sendMail({
         from: process.env.EMAIL_FROM,
         to: "sac.controlfin@gmail.com",
         replyTo: emailUsuario,
         subject: `[SAC ControlFin] ${tipoLabel}: ${assunto}`,
         html,
      });
   }

   // ── Email: Confirmação de suporte para o usuário ──
   async enviarEmailConfirmacaoSuporte(para, nome, tipo, assunto) {
      const primeiroNome = nome.split(" ")[0];
      const tipoLabel =
         {
            sugestao: "sugestão",
            problema: "relato de problema",
            solicitacao: "solicitação",
            reclamacao: "reclamação",
            duvida: "dúvida",
         }[tipo] || "mensagem";

      const html = baseTemplate({
         headerTitle: "Mensagem recebida!",
         headerSubtitle: "Entraremos em contato em breve",
         body: `
           <p class="greeting">Olá, ${primeiroNome}! 👋</p>
           <p class="text">
             Recebemos sua <strong>${tipoLabel}</strong> e nossa equipe irá analisá-la em breve.
             Agradecemos o contato — seu feedback é fundamental para melhorarmos o ControlFin.
           </p>
           <div class="highlight-box">
             <div style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Assunto registrado</div>
             <div style="font-size:15px;font-weight:700;color:#111827;">${assunto}</div>
           </div>
           <hr class="divider" />
           <div class="info-row"><span class="info-icon">⏱️</span><span>Prazo de resposta: <strong>até 3 dias úteis</strong></span></div>
           <div class="info-row"><span class="info-icon">📧</span><span>Respondemos pelo email cadastrado na sua conta</span></div>
           <div class="info-row"><span class="info-icon">💚</span><span>Obrigado por usar o ControlFin!</span></div>
         `,
      });

      await this.transporter.sendMail({
         from: process.env.EMAIL_FROM,
         to: para,
         subject: "✅ Sua mensagem foi recebida — ControlFin",
         html,
      });
   }

   // ── Email: Confirmação de troca de email (enviado para o NOVO email) ──
   async enviarEmailConfirmacaoTrocaEmail(novoEmail, nome, token, emailAtual) {
      const link = `${process.env.FRONTEND_URL || "http://localhost:3000"}/api/conta/confirmar-troca-email?token=${token}`;
      // Usar a URL da API do backend, não do frontend
      const linkBackend = `${process.env.BACKEND_URL || "http://localhost:3001"}/api/conta/confirmar-troca-email?token=${token}`;
      const primeiroNome = nome.split(" ")[0];

      const html = baseTemplate({
         headerTitle: "Confirme seu novo email",
         headerSubtitle: "Um clique para finalizar a alteração",
         body: `
           <p class="greeting">Olá, ${primeiroNome}!</p>
           <p class="text">
             Recebemos uma solicitação para alterar o email da sua conta no ControlFin.
             Clique no botão abaixo para <strong>confirmar seu novo endereço de email</strong>.
           </p>
           <div class="highlight-box" style="margin-bottom:16px;">
             <div style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Email atual</div>
             <div style="font-size:14px;color:#374151;">${emailAtual}</div>
             <div style="font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-top:10px;margin-bottom:4px;">Novo email</div>
             <div style="font-size:14px;font-weight:700;color:#059669;">${novoEmail}</div>
           </div>
           <div class="btn-wrapper">
             <a href="${linkBackend}" class="btn btn-orange">Confirmar novo email</a>
           </div>
           <p class="fallback-link">Ou copie o link: <a href="${linkBackend}">${linkBackend}</a></p>
           <div class="warning-box">
             ⚠️ <strong>Este link expira em 1 hora.</strong> Se você não fez esta solicitação, ignore este email — seu email permanece inalterado.
           </div>
           <hr class="divider" />
           <div class="info-row"><span class="info-icon">🔒</span><span>Após confirmar, você deverá usar o novo email para fazer login</span></div>
           <div class="info-row"><span class="info-icon">⚠️</span><span>Nunca compartilhe este link com ninguém</span></div>
         `,
      });

      await this.transporter.sendMail({
         from: process.env.EMAIL_FROM,
         to: novoEmail,
         subject: "📧 Confirme seu novo email — ControlFin",
         html,
      });
   }
}

module.exports = new EmailService();
