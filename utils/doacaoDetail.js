const {
  donationDisplayStatus,
  formatCategoryLabel,
  formatValidade,
  timeAgo,
} = require('./formatTime');

function doacaoStatusLabel(status) {
  const labels = {
    disponivel: 'Disponível',
    reservado: 'Reservado',
    entregue: 'Entregue',
  };
  return labels[status] || status;
}

function serializeDoacaoForDetail(doacao, { viewerRole = 'receptor' } = {}) {
  const isReceptor = viewerRole === 'receptor';
  const itens = (doacao.itens || []).map((item) => ({
    id: item.id,
    nome: item.nome,
    quantidade: item.quantidade,
    categoria: item.categoria,
    categoriaLabel: formatCategoryLabel(item.categoria),
    validadeLabel: formatValidade(item.validade),
    displayStatus: donationDisplayStatus({
      status: doacao.status,
      validade: item.validade,
    }),
  }));

  const title = itens.length === 1 ? itens[0].nome : `Doação com ${itens.length} itens`;

  return {
    id: doacao.id,
    title,
    status: doacao.status,
    statusLabel: doacaoStatusLabel(doacao.status),
    observacoes: doacao.observacoes || null,
    doadorNome: doacao.usuario?.nome || null,
    publicadoLabel: doacao.createdAt ? timeAgo(doacao.createdAt) : null,
    itens,
    canSolicitar: isReceptor && doacao.status === 'disponivel',
    editarUrl: !isReceptor ? `/doacoes/${doacao.id}/editar` : null,
  };
}

function buildDoacoesDetalheMap(doacoes, options = {}) {
  const map = {};
  for (const doacao of doacoes) {
    map[doacao.id] = serializeDoacaoForDetail(doacao, options);
  }
  return map;
}

module.exports = {
  serializeDoacaoForDetail,
  buildDoacoesDetalheMap,
};