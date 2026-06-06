const {
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
  isDoador,
} = require('../services/notificacoesService');

async function showNotificacoes(req, res) {
  const usuario = res.locals.usuario;
  if (!usuario) return res.redirect('/auth');

  let notificacoes = [];
  try {
    notificacoes = await getRecentNotifications(usuario, 30);
  } catch (err) {
    console.error('[notificacoes] Erro:', err.message);
  }

  const unreadCount = notificacoes.filter((n) => n.unread).length;

  res.render('notificacoes/index', {
    title: 'Notificações - FoodShare',
    activeNav: '',
    pageHeadingPrefix: 'Esse é sua',
    pageHeadingHighlight: 'caixa de entrada',
    pageSubtitle: 'Solicitações recentes e atualizações de status.',
    isDoador: isDoador(usuario),
    notificacoes,
    unreadCount,
    headerActionLabel: unreadCount > 0 ? 'Marcar todas como lidas' : undefined,
    headerActionForm: unreadCount > 0 ? '/notificacoes/marcar-todas' : undefined,
    headerActionSecondary: true,
  });
}

async function marcarComoLida(req, res) {
  const usuario = res.locals.usuario;
  if (!usuario) return res.redirect('/auth');

  try {
    await markAsRead(usuario, req.params.id);
  } catch (err) {
    console.error('[notificacoes] Erro ao marcar como lida:', err.message);
    if (err.status === 404) return res.status(404).render('error', { statusCode: 404 });
  }

  return res.redirect('/notificacoes');
}

async function marcarTodasComoLidas(req, res) {
  const usuario = res.locals.usuario;
  if (!usuario) return res.redirect('/auth');

  try {
    await markAllAsRead(usuario);
  } catch (err) {
    console.error('[notificacoes] Erro ao marcar todas:', err.message);
  }

  return res.redirect('/notificacoes');
}

module.exports = { showNotificacoes, marcarComoLida, marcarTodasComoLidas };
