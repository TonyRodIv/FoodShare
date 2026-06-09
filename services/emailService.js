const nodemailer = require('nodemailer');

// Singleton para garantir que a conta Ethereal seja gerada apenas uma vez durante a inicialização
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Se o usuário configurou SMTP no .env, usamos ele (tanto em dev quanto em prod)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Em produção sem SMTP configurado
  if (process.env.NODE_ENV === 'production') {
    console.error('[EmailService] ERRO: Credenciais SMTP não configuradas em produção!');
    return null;
  }

  // Em desenvolvimento, vamos criar uma conta de teste Ethereal
  // Isso gera uma caixa de entrada falsa na nuvem onde você pode ver o e-mail "real".
  console.log('[EmailService] Criando conta de teste no Ethereal (isso pode demorar alguns segundos)...');
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}

async function sendPasswordResetEmail(toEmail, resetToken) {
  const mailTransporter = await getTransporter();
  if (!mailTransporter) {
    console.error('[EmailService] Transporter não configurado. E-mail não enviado.');
    return null;
  }
  
  // Como estamos testando localmente, usamos localhost. Em produção, você pegaria o domínio do req.hostname
  const resetUrl = `http://localhost:3000/auth/reset-password?token=${resetToken}`;

  const info = await mailTransporter.sendMail({
    from: '"FoodShare Security" <noreply@foodshare.com>',
    to: toEmail,
    subject: 'Recuperação de Senha - FoodShare',
    text: `Você solicitou a recuperação de senha. Acesse o link para redefinir: ${resetUrl}`,
    html: `
      <h2>Recuperação de Senha</h2>
      <p>Você solicitou a redefinição da sua senha no FoodShare.</p>
      <p>Clique no botão abaixo para criar uma nova senha:</p>
      <a href="${resetUrl}" style="display:inline-block;padding:10px 20px;color:white;background-color:#16a34a;text-decoration:none;border-radius:5px;">Redefinir Minha Senha</a>
      <p>Se você não solicitou isso, pode ignorar este e-mail.</p>
      <br>
      <p>Ou copie e cole este link no seu navegador:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
    `,
  });

  console.log('[EmailService] E-mail de recuperação enviado para: %s', info.messageId);
  
  // Se estivermos usando Ethereal, mostrar o link para a caixa de entrada falsa
  if (info.messageId && !process.env.SMTP_HOST) {
    console.log('==================================================');
    console.log('[EmailService] 🔗 VISUALIZE O E-MAIL (CAIXA DE ENTRADA TESTE):');
    console.log(nodemailer.getTestMessageUrl(info));
    console.log('==================================================');
  }

  return info;
}

module.exports = {
  sendPasswordResetEmail,
};
