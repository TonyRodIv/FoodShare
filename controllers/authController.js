const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../config/database');
const { createSupabaseClient } = require('../config/supabase');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const { sendPasswordResetEmail } = require('../services/emailService');

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function setCookies(res, accessToken, refreshToken) {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
  };
  res.cookie('token', accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_EXPIRY_MS });
}

async function showWelcome(req, res) {
  if (res.locals.usuario) {
    return res.redirect('/');
  }
  res.render('auth/welcome', { title: 'FoodShare' });
}

async function showRegister(req, res) {
  res.render('auth/register', { title: 'Criar Conta - FoodShare', errors: [], old: {} });
}

async function register(req, res) {
  const result = registerSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({ field: e.path[0], message: e.message }));
    return res.status(400).render('auth/register', {
      title: 'Criar Conta - FoodShare',
      errors,
      old: req.body,
    });
  }

  const { nome, email, senha, telefone, role } = result.data;

  try {
    const existingUser = await prisma.usuario.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).render('auth/register', {
        title: 'Criar Conta - FoodShare',
        errors: [{ field: 'email', message: 'Este e-mail já está em uso. Faça login ou use outro endereço.' }],
        old: req.body,
      });
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, telefone, role },
    });

    res.redirect('/auth/login?registered=1');
  } catch (err) {
    console.error('[register] Erro:', err);
    res.status(500).render('auth/register', {
      title: 'Criar Conta - FoodShare',
      errors: [{ field: null, message: 'Não conseguimos concluir agora. Tente novamente em instantes.' }],
      old: req.body,
    });
  }
}

async function showLogin(req, res) {
  const registered = req.query.registered === '1';
  const reset = req.query.reset === '1';
  res.render('auth/login', { title: 'Entrar - FoodShare', errors: [], old: {}, registered, reset });
}

async function login(req, res) {
  const result = loginSchema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.issues.map((e) => ({ field: e.path[0], message: e.message }));
    return res.status(400).render('auth/login', {
      title: 'Entrar - FoodShare',
      errors,
      old: req.body,
      registered: false,
      reset: false,
    });
  }

  const { email, senha } = result.data;

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      return res.status(401).render('auth/login', {
        title: 'Entrar - FoodShare',
        errors: [
          { field: 'email', message: 'E-mail ou senha incorretos. Confira os dados e tente novamente.' },
          { field: 'senha', message: 'E-mail ou senha incorretos. Confira os dados e tente novamente.' },
        ],
        old: req.body,
        registered: false,
        reset: false,
      });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).render('auth/login', {
        title: 'Entrar - FoodShare',
        errors: [
          { field: 'email', message: 'E-mail ou senha incorretos. Confira os dados e tente novamente.' },
          { field: 'senha', message: 'E-mail ou senha incorretos. Confira os dados e tente novamente.' },
        ],
        old: req.body,
        registered: false,
        reset: false,
      });
    }

    const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: usuario.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        usuarioId: usuario.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    setCookies(res, accessToken, refreshToken);
    res.redirect('/');
  } catch (err) {
    console.error('[login] Erro:', err);
    res.status(500).render('auth/login', {
      title: 'Entrar - FoodShare',
      errors: [{ field: null, message: 'Não conseguimos concluir agora. Tente novamente em instantes.' }],
      old: req.body,
      registered: false,
      reset: false,
    });
  }
}

async function refresh(req, res) {
  const refreshTokenCookie = req.cookies?.refreshToken;

  if (!refreshTokenCookie) {
    return res.status(401).json({ message: 'Refresh token ausente' });
  }

  try {
    const decoded = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH_SECRET);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenCookie },
      include: { usuario: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.clearCookie('token');
      res.clearCookie('refreshToken');
      return res.status(401).json({ message: 'Refresh token inválido ou expirado' });
    }

    const { usuario } = storedToken;
    const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };
    const newAccessToken = generateAccessToken(payload);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    return res.status(200).json({ message: 'Token renovado com sucesso' });
  } catch (err) {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    return res.status(401).json({ message: 'Refresh token inválido' });
  }
}

async function logout(req, res) {
  const refreshTokenCookie = req.cookies?.refreshToken;

  try {
    if (refreshTokenCookie) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshTokenCookie } });
    }
  } catch (err) {
    console.error('[logout] Erro ao deletar refresh token:', err);
  }

  res.clearCookie('token');
  res.clearCookie('refreshToken');
  res.redirect('/');
}

// GET /auth/google
async function loginGoogle(req, res) {
  const supabase = createSupabaseClient(req, res);
  if (!supabase) {
    return res.status(500).send('Supabase não configurado');
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${req.protocol}://${req.get('host')}/auth/callback`,
    },
  });
  if (error) {
    console.error('[loginGoogle] Erro:', error);
    return res.status(500).send('Erro ao conectar com Google');
  }
  res.redirect(data.url);
}

// GET /auth/callback
async function googleCallback(req, res) {
  const { code } = req.query;
  if (!code) {
    return res.redirect('/auth/login?error=Nenhum código recebido do Google');
  }

  const supabase = createSupabaseClient(req, res);
  if (!supabase) {
    return res.status(500).send('Supabase não configurado');
  }

  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;

    const user = data.user;
    const email = user.email;
    const nome = user.user_metadata?.full_name || 'Usuário do Google';

    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (usuario) {
      const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };
      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken({ id: usuario.id });

      await prisma.refreshToken.create({
        data: {
          token: refreshToken,
          usuarioId: usuario.id,
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
        },
      });

      setCookies(res, accessToken, refreshToken);
      return res.redirect('/');
    } else {
      const tempToken = jwt.sign({ email, nome }, process.env.JWT_SECRET, { expiresIn: '15m' });
      res.cookie('tempGoogleAuth', tempToken, { httpOnly: true, maxAge: 15 * 60 * 1000 });
      return res.redirect('/auth/google/complete');
    }
  } catch (err) {
    console.error('[googleCallback] Erro:', err);
    res.redirect('/auth/login?error=Falha na autenticação com o Google');
  }
}

// GET /auth/google/complete
async function showCompleteGoogle(req, res) {
  const tempToken = req.cookies?.tempGoogleAuth;
  if (!tempToken) {
    return res.redirect('/auth/login');
  }

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    res.render('auth/complete-google', { title: 'Completar Cadastro - FoodShare', email: decoded.email, nome: decoded.nome, errors: [] });
  } catch (err) {
    return res.redirect('/auth/login');
  }
}

// POST /auth/google/complete
async function completeGoogle(req, res) {
  const tempToken = req.cookies?.tempGoogleAuth;
  if (!tempToken) {
    return res.redirect('/auth/login');
  }

  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const { email, nome } = decoded;
    const { telefone, role } = req.body;

    if (!telefone || !role || !['doador', 'receptor'].includes(role)) {
      return res.render('auth/complete-google', { 
        title: 'Completar Cadastro - FoodShare', 
        email, 
        nome, 
        errors: [{ message: 'Preencha todos os campos corretamente.' }] 
      });
    }

    const randomPassword = crypto.randomUUID();
    const senhaHash = await bcrypt.hash(randomPassword, SALT_ROUNDS);

    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, telefone, role },
    });

    res.clearCookie('tempGoogleAuth');

    const payload = { id: novoUsuario.id, nome: novoUsuario.nome, email: novoUsuario.email, role: novoUsuario.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: novoUsuario.id });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        usuarioId: novoUsuario.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS),
      },
    });

    setCookies(res, accessToken, refreshToken);
    res.redirect('/');
  } catch (err) {
    console.error('[completeGoogle] Erro:', err);
    res.redirect('/auth/login');
  }
}

// GET /auth/forgot-password
async function showForgotPassword(req, res) {
  res.render('auth/forgot-password', { title: 'Esqueci Minha Senha - FoodShare', error: null, success: null });
}

// POST /auth/forgot-password
async function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.render('auth/forgot-password', { title: 'Esqueci Minha Senha - FoodShare', error: 'Por favor, informe seu e-mail.', success: null });
  }

  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) {
      // Retorna sucesso de qualquer forma para não vazar emails
      return res.render('auth/forgot-password', { title: 'Esqueci Minha Senha - FoodShare', error: null, success: 'Se o e-mail existir em nossa base, um link de recuperação foi enviado.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await prisma.passwordResetToken.create({
      data: {
        token,
        usuarioId: usuario.id,
        expiresAt,
      },
    });

    await sendPasswordResetEmail(usuario.email, token);

    res.render('auth/forgot-password', { title: 'Esqueci Minha Senha - FoodShare', error: null, success: 'Se o e-mail existir em nossa base, um link de recuperação foi enviado.' });
  } catch (err) {
    console.error('[forgotPassword] Erro:', err);
    res.render('auth/forgot-password', { title: 'Esqueci Minha Senha - FoodShare', error: 'Ocorreu um erro ao processar sua solicitação.', success: null });
  }
}

// GET /auth/reset-password
async function showResetPassword(req, res) {
  const { token } = req.query;
  if (!token) {
    return res.redirect('/auth/login');
  }
  
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.render('auth/login', { title: 'Entrar - FoodShare', errors: [{field: null, message: 'O link de recuperação de senha é inválido ou expirou.'}], old: {}, registered: false, reset: false });
    }
    
    res.render('auth/reset-password', { title: 'Redefinir Senha - FoodShare', token, error: null });
  } catch(err) {
    return res.redirect('/auth/login');
  }
}

// POST /auth/reset-password
async function resetPassword(req, res) {
  const { token, senha, confirmacaoSenha } = req.body;
  
  if (!token || !senha || senha !== confirmacaoSenha) {
    return res.render('auth/reset-password', { title: 'Redefinir Senha - FoodShare', token, error: 'As senhas não coincidem ou são inválidas.' });
  }
  
  try {
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.render('auth/login', { title: 'Entrar - FoodShare', errors: [{field: null, message: 'O link de recuperação de senha é inválido ou expirou.'}], old: {}, registered: false, reset: false });
    }
    
    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);
    
    await prisma.usuario.update({
      where: { id: resetToken.usuarioId },
      data: { senha: senhaHash }
    });
    
    await prisma.passwordResetToken.deleteMany({
      where: { usuarioId: resetToken.usuarioId }
    });
    
    res.redirect('/auth/login?reset=1');
  } catch (err) {
    console.error('[resetPassword] Erro:', err);
    res.render('auth/reset-password', { title: 'Redefinir Senha - FoodShare', token, error: 'Erro ao redefinir a senha. Tente novamente.' });
  }
}

module.exports = { 
  showWelcome, 
  showRegister, 
  register, 
  showLogin, 
  login, 
  refresh, 
  logout,
  loginGoogle,
  googleCallback,
  showCompleteGoogle,
  completeGoogle,
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword
};
