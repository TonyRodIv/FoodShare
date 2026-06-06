function showConfiguracoes(req, res) {
  const usuario = res.locals.usuario;
  if (!usuario) return res.redirect('/auth');

  res.render('configuracoes/index', {
    title: 'Configurações - FoodShare',
    activeNav: 'configuracoes',
    pageHeadingPrefix: 'Esse é o seu',
    pageHeadingHighlight: 'painel de ajustes',
    pageSubtitle: 'Gerencie sua conta e preferências do FoodShare.',
    featurePreview: true,
  });
}

module.exports = { showConfiguracoes };
