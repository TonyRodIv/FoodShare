/**
 * Conteúdo da página de erro — variantes por código HTTP e contexto da app.
 */

const HTTP_VARIANTS = {
  400: {
    title: 'Requisição inválida',
    subtitle: 'Os dados enviados não puderam ser processados. Revise as informações e tente outra vez.',
    retryLabel: 'Voltar',
    retryAction: 'back',
    icon: 'warning',
    variant: 'warning',
  },
  401: {
    title: 'Sessão expirada',
    subtitle: 'Sua sessão não está mais ativa. Entre novamente para continuar no FoodShare.',
    retryLabel: 'Ir para o login',
    retryAction: 'login',
    icon: 'lock',
    variant: 'auth',
  },
  403: {
    title: 'Acesso negado',
    subtitle: 'Esta área não está disponível para o seu perfil. Volte ao início ou use uma conta com permissão.',
    retryLabel: 'Voltar ao início',
    retryAction: 'home',
    icon: 'lock',
    variant: 'forbidden',
  },
  404: {
    title: 'Página não encontrada',
    subtitle: 'O endereço pode estar incorreto ou o conteúdo foi removido. Confira o link ou retome do início.',
    retryLabel: 'Voltar ao início',
    retryAction: 'home',
    icon: 'search_off',
    variant: 'not-found',
  },
  408: {
    title: 'Tempo esgotado',
    subtitle: 'A operação demorou mais do que o esperado. Verifique sua conexão e tente novamente.',
    retryLabel: 'Tentar novamente',
    retryAction: 'reload',
    icon: 'schedule',
    variant: 'warning',
  },
  429: {
    title: 'Muitas tentativas',
    subtitle: 'Você fez várias requisições seguidas. Aguarde um instante antes de tentar de novo.',
    retryLabel: 'Tentar novamente',
    retryAction: 'reload',
    icon: 'hourglass_top',
    variant: 'warning',
  },
  500: {
    title: 'Erro no servidor',
    subtitle: 'Não se preocupe — a culpa não é sua. Estamos cuidando disso; tente novamente em instantes.',
    retryLabel: 'Tentar novamente',
    retryAction: 'reload',
    icon: 'warning',
    variant: 'server',
  },
  502: {
    title: 'Serviço indisponível',
    subtitle: 'Nossos servidores estão temporariamente indisponíveis. Aguarde um momento e tente de novo.',
    retryLabel: 'Tentar novamente',
    retryAction: 'reload',
    icon: 'cloud_off',
    variant: 'server',
  },
  503: {
    title: 'Manutenção em andamento',
    subtitle: 'O FoodShare está passando por uma atualização rápida. Volte daqui a pouco.',
    retryLabel: 'Tentar novamente',
    retryAction: 'reload',
    icon: 'construction',
    variant: 'server',
  },
};

/** Overrides por fluxo (500 contextual) */
const CONTEXT_VARIANTS = {
  doacoes_list: {
    title: 'Não foi possível carregar suas doações',
    subtitle: 'Houve um problema ao buscar os itens publicados. Atualize a página ou tente de novo em breve.',
  },
  doacoes_create: {
    title: 'Não foi possível publicar a doação',
    subtitle: 'Sua doação não foi salva. Confira os itens preenchidos e tente enviar novamente.',
  },
  solicitacoes_list: {
    title: 'Não foi possível carregar suas solicitações',
    subtitle: 'Algo falhou ao buscar seus pedidos. Tente novamente em instantes.',
  },
  solicitacoes_recebidas: {
    title: 'Não foi possível carregar os pedidos recebidos',
    subtitle: 'Não conseguimos listar as solicitações das suas doações. Atualize a página ou volte mais tarde.',
  },
  solicitacoes_nova: {
    title: 'Não foi possível abrir nova solicitação',
    subtitle: 'As doações disponíveis não puderam ser carregadas. Tente novamente em instantes.',
  },
  historico: {
    title: 'Não foi possível carregar o histórico',
    subtitle: 'Seu histórico de movimentações não pôde ser exibido agora. Tente de novo em breve.',
  },
  notificacoes: {
    title: 'Não foi possível carregar as notificações',
    subtitle: 'Suas notificações não puderam ser listadas. Atualize a página ou volte mais tarde.',
  },
  home: {
    title: 'Não foi possível carregar o painel',
    subtitle: 'Algo deu errado ao montar sua página inicial. Tente novamente em instantes.',
  },
};

function resolveErrorPage(options = {}) {
  const code = Number(options.statusCode) || 500;
  const base = HTTP_VARIANTS[code] || HTTP_VARIANTS[500];
  const contextPatch = options.context ? CONTEXT_VARIANTS[options.context] : null;

  const title =
    options.title ||
    options.message ||
    (contextPatch && contextPatch.title) ||
    base.title;

  const subtitle =
    options.subtitle ||
    (contextPatch && contextPatch.subtitle) ||
    base.subtitle;

  const retryLabel =
    options.retryLabel ||
    (contextPatch && contextPatch.retryLabel) ||
    base.retryLabel;

  const retryAction =
    options.retryAction ||
    (contextPatch && contextPatch.retryAction) ||
    base.retryAction;

  const usuario = options.usuario || null;
  const homeHref = usuario ? '/' : '/auth/login';

  let retryHref = null;
  if (retryAction === 'home') retryHref = homeHref;
  if (retryAction === 'login') retryHref = '/auth/login';

  return {
    code,
    title,
    subtitle,
    retryLabel,
    retryAction,
    retryHref,
    icon: base.icon,
    variant: base.variant,
    pageTitle: options.pageTitle || `Erro ${code} — FoodShare`,
  };
}

module.exports = { resolveErrorPage, HTTP_VARIANTS, CONTEXT_VARIANTS };
