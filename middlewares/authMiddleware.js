const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Middleware de autenticação.
 * Lê o Access Token do cookie `token`, valida com JWT_SECRET.
 * Se expirado, tenta renovar silenciosamente usando o Refresh Token.
 * Popula `req.usuario` com os dados do usuário autenticado.
 */
async function authenticate(req, res, next) {
  const accessToken = req.cookies?.token;

  // Tenta validar o Access Token
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
      req.usuario = decoded;
      return next();
    } catch (err) {
      if (err.name !== 'TokenExpiredError') {
        return res.redirect('/auth/login');
      }
      // Access Token expirado — tenta renovar via Refresh Token
    }
  }

  // Tenta renovar com o Refresh Token
  const refreshTokenCookie = req.cookies?.refreshToken;
  if (!refreshTokenCookie) {
    return res.redirect('/auth/login');
  }

  try {
    const decodedRefresh = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH_SECRET);

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenCookie },
      include: { usuario: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      res.clearCookie('token');
      res.clearCookie('refreshToken');
      return res.redirect('/auth/login');
    }

    const { usuario } = storedToken;
    const payload = { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000,
    });

    req.usuario = payload;
    return next();
  } catch (err) {
    res.clearCookie('token');
    res.clearCookie('refreshToken');
    return res.redirect('/auth/login');
  }
}

/**
 * Middleware de autorização por roles.
 * @param {string[]} allowedRoles - Array de roles permitidas ex: ['admin', 'doador']
 */
function authorize(allowedRoles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.redirect('/auth/login');
    }
    if (!allowedRoles.includes(req.usuario.role)) {
      return res.status(403).render('error', {
        message: 'Acesso negado. Você não tem permissão para acessar este recurso.',
        error: { status: 403 },
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
