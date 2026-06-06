const { getRecentNotifications } = require('../services/notificacoesService');

async function attachAppData(req, res, next) {
  if (!res.locals.usuario) return next();

  const skipPaths = ['/auth', '/api-docs'];
  if (skipPaths.some((p) => req.path.startsWith(p))) return next();

  try {
    const notificacoes = await getRecentNotifications(res.locals.usuario, 8);
    res.locals.notificacoesRecentes = notificacoes;
    res.locals.notificacoesCount = notificacoes.filter((n) => n.unread).length;
  } catch (err) {
    console.error('[appData] Erro ao carregar notificações:', err.message);
    res.locals.notificacoesRecentes = [];
    res.locals.notificacoesCount = 0;
  }

  next();
}

module.exports = { attachAppData };
