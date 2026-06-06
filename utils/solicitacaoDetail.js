const {
  timeAgo,
  formatDateShort,
  formatCategoryLabel,
  formatValidade,
  solicitationPillKey,
  solicitationPillLabel,
} = require('./formatTime');

const STATUS_SORT_ORDER = {
  pendente: 0,
  aprovado: 1,
  recusado: 2,
  cancelado: 3,
};

function sortSolicitacoesRecebidas(solicitacoes) {
  return [...solicitacoes].sort((a, b) => {
    const orderA = STATUS_SORT_ORDER[a.status] ?? 99;
    const orderB = STATUS_SORT_ORDER[b.status] ?? 99;
    if (orderA !== orderB) return orderA - orderB;

    const dateA = a.status === 'pendente' ? a.createdAt : a.updatedAt;
    const dateB = b.status === 'pendente' ? b.createdAt : b.updatedAt;
    return new Date(dateB) - new Date(dateA);
  });
}

function serializeSolicitacaoForDetail(solic, { viewerRole = 'doador' } = {}) {
  const isReceptor = viewerRole === 'receptor';
  const itens = solic.doacao?.itens || [];
  const itemLabel = itens[0]?.nome || 'Doação';
  const title = itens.length === 1
    ? `${itemLabel} · ${solic.quantidade} un`
    : `${itemLabel} (+${itens.length - 1} itens) · ${solic.quantidade} un`;

  return {
    id: solic.id,
    title,
    itemLabel,
    quantidade: solic.quantidade,
    status: solic.status,
    statusKey: solicitationPillKey(solic.status),
    statusLabel: solicitationPillLabel(solic.status),
    observacoes: solic.observacoes || null,
    receptorNome: !isReceptor ? solic.usuario?.nome || null : null,
    receptorEmail: !isReceptor ? solic.usuario?.email || null : null,
    doadorNome: isReceptor ? solic.doacao?.usuario?.nome || null : null,
    doacaoId: solic.doacaoId,
    doacaoStatus: solic.doacao?.status || null,
    criadoLabel: timeAgo(solic.createdAt),
    criadoEm: formatDateShort(solic.createdAt),
    atualizadoEm: formatDateShort(solic.updatedAt),
    isPendente: solic.status === 'pendente',
    viewerRole,
    itens: itens.map((item) => ({
      nome: item.nome,
      quantidade: item.quantidade,
      categoriaLabel: formatCategoryLabel(item.categoria),
      validadeLabel: formatValidade(item.validade),
    })),
  };
}

function buildSolicitacoesDetalheMap(solicitacoes, options = {}) {
  const map = {};
  for (const solic of solicitacoes) {
    map[solic.id] = serializeSolicitacaoForDetail(solic, options);
  }
  return map;
}

module.exports = {
  sortSolicitacoesRecebidas,
  serializeSolicitacaoForDetail,
  buildSolicitacoesDetalheMap,
};
