const { getRecentNotifications, isDoador } = require('../services/notificacoesService');

async function showNotificacoes(req, res) {
  const usuario = res.locals.usuario;
  if (!usuario) return res.redirect('/auth');

  let notificacoes = [];
  try {
    notificacoes = await getRecentNotifications(usuario, 30);
  } catch (err) {
    console.error('[notificacoes] Erro:', err.message);
  }

  res.render('notificacoes/index', {
    title: 'Notificações - FoodShare',
    activeNav: '',
    pageHeadingPrefix: 'Esse é sua',
    pageHeadingHighlight: 'caixa de entrada',
    pageSubtitle: 'Solicitações recentes e atualizações de status.',
    featurePreview: true,
    isDoador: isDoador(usuario),
    notificacoes,
  });
}

module.exports = { showNotificacoes };
