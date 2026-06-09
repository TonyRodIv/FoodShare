require('dotenv').config();
const prisma = require('./config/database');
const { sendPasswordResetEmail } = require('./services/emailService');
const crypto = require('crypto');

async function test() {
  try {
    console.log('Testando criação do token no banco...');
    // Pega o primeiro usuario do banco
    const usuario = await prisma.usuario.findFirst();
    if (!usuario) {
      console.log('Nenhum usuario no banco.');
      return;
    }
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        token,
        usuarioId: usuario.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    console.log('Token criado com sucesso.');

    console.log('Testando envio do email Ethereal...');
    const info = await sendPasswordResetEmail(usuario.email, token);
    console.log('Email enviado:', info.messageId);
    
    // Limpar o token criado
    await prisma.passwordResetToken.delete({ where: { token } });
    
  } catch (err) {
    console.error('ERRO:', err);
  } finally {
    process.exit(0);
  }
}

test();
