const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { registerSchema, loginSchema } = require('../validators/authValidator');

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
  res.render('auth/login', { title: 'Entrar - FoodShare', errors: [], old: {}, registered });
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

module.exports = { showWelcome, showRegister, register, showLogin, login, refresh, logout };
