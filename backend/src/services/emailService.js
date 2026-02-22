const nodemailer = require("nodemailer");

class EmailService {
   constructor() {
      this.transporter = nodemailer.createTransport({
         host: process.env.EMAIL_HOST,
         port: process.env.EMAIL_PORT,
         secure: false,
         auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
         },
      });
   }

   async enviarEmailVerificacao(para, nome, token) {
      const linkVerificacao = `${process.env.APP_URL}/api/auth/verificar-email/${token}`;

      const mailOptions = {
         from: process.env.EMAIL_FROM,
         to: para,
         subject: "Verificação de Email - Controle Financeiro",
         html: `
        <h1>Bem-vindo ao Controle Financeiro, ${nome}!</h1>
        <p>Por favor, clique no link abaixo para verificar seu email:</p>
        <a href="${linkVerificacao}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          Verificar Email
        </a>
        <p>Ou copie e cole este link no navegador:</p>
        <p>${linkVerificacao}</p>
        <p>Este link expira em 24 horas.</p>
        <p>Se você não criou esta conta, ignore este email.</p>
      `,
      };

      await this.transporter.sendMail(mailOptions);
   }

   async enviarEmailConviteNovo(para, nomeQuemConvidou, nomeMesa, token) {
      const linkCadastro = `${process.env.APP_URL}/api/auth/register?convite=${token}`;

      const mailOptions = {
         from: process.env.EMAIL_FROM,
         to: para,
         subject: `Você foi convidado para participar da mesa "${nomeMesa}"`,
         html: `
        <h1>Você recebeu um convite!</h1>
        <p><strong>${nomeQuemConvidou}</strong> convidou você para participar da mesa de controle financeiro <strong>"${nomeMesa}"</strong>.</p>
        <p>Para aceitar o convite, primeiro você precisa criar uma conta:</p>
        <a href="${linkCadastro}" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">
          Criar Conta e Aceitar Convite
        </a>
        <p>Ou copie e cole este link no navegador:</p>
        <p>${linkCadastro}</p>
        <p>Este convite expira em 7 dias.</p>
      `,
      };

      await this.transporter.sendMail(mailOptions);
   }

   async enviarEmailConviteExistente(para, nomeQuemConvidou, nomeMesa, token) {
      const linkAceitar = `${process.env.APP_URL}/api/convites/${token}/aceitar`;

      const mailOptions = {
         from: process.env.EMAIL_FROM,
         to: para,
         subject: `Você foi convidado para participar da mesa "${nomeMesa}"`,
         html: `
        <h1>Você recebeu um convite!</h1>
        <p><strong>${nomeQuemConvidou}</strong> convidou você para participar da mesa de controle financeiro <strong>"${nomeMesa}"</strong>.</p>
        <p>Para aceitar o convite, clique no link abaixo:</p>
        <a href="${linkAceitar}" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">
          Aceitar Convite
        </a>
        <p>Ou copie e cole este link no navegador:</p>
        <p>${linkAceitar}</p>
        <p>Você também pode aceitar o convite através das notificações no sistema.</p>
        <p>Este convite expira em 7 dias.</p>
      `,
      };

      await this.transporter.sendMail(mailOptions);
   }

   async enviarEmailRecuperacaoSenha(para, nome, token) {
      const linkRecuperacao = `${process.env.FRONTEND_URL}/resetar-senha/${token}`;

      const mailOptions = {
         from: process.env.EMAIL_FROM,
         to: para,
         subject: "Recuperação de Senha - Controle Financeiro",
         html: `
      <h1>Olá, ${nome}!</h1>
      <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
      <p>Clique no link abaixo para criar uma nova senha:</p>
      <a href="${linkRecuperacao}" style="display: inline-block; padding: 10px 20px; background-color: #FF5722; color: white; text-decoration: none; border-radius: 5px;">
        Redefinir Senha
      </a>
      <p>Ou copie e cole este link no navegador:</p>
      <p>${linkRecuperacao}</p>
      <p><strong>Este link expira em 1 hora.</strong></p>
      <p>Se você não solicitou a recuperação de senha, ignore este email. Sua senha permanecerá inalterada.</p>
    `,
      };

      await this.transporter.sendMail(mailOptions);
   }
}

module.exports = new EmailService();
