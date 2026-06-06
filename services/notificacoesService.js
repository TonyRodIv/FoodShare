const prisma = require('../config/database');

function isDoador(usuario) {
  return usuario.role === 'doador' || usuario.role === 'admin';
}

async function getReadSolicitacaoIds(usuarioId) {
  const rows = await prisma.notificacaoLida.findMany({
    where: { usuarioId },
    select: { solicitacaoId: true },
  });
  return new Set(rows.map((r) => r.solicitacaoId));
}

function mapSolicitacaoToNotification(s, readIds, { isDoadorView }) {
  const item = s.doacao.itens[0]?.nome || 'Doação';
  let title;
  let statusKey = s.status;

  if (isDoadorView) {
    if (s.status === 'pendente') title = `Nova solicitação: ${item}`;
    else if (s.status === 'aprovado') title = `Pedido aceito: ${item}`;
    else if (s.status === 'recusado') title = `Pedido recusado: ${item}`;
    else if (s.status === 'cancelado') title = `Pedido cancelado: ${item}`;
    else title = `Solicitação de ${item}`;

    return {
      id: s.id,
      title,
      meta: `${s.usuario.nome} · ${s.quantidade} un`,
      createdAt: s.createdAt,
      statusKey,
      unread: s.status === 'pendente' && !readIds.has(s.id),
      href: '/solicitacoes/recebidas',
    };
  }

  if (s.status === 'pendente') title = `Aguardando resposta: ${item}`;
  else if (s.status === 'aprovado') title = `Solicitação aprovada: ${item}`;
  else if (s.status === 'recusado') title = `Solicitação recusada: ${item}`;
  else if (s.status === 'cancelado') title = `Solicitação cancelada: ${item}`;
  else title = `Solicitação: ${item}`;

  return {
    id: s.id,
    title,
    meta: `Doador: ${s.doacao.usuario.nome}`,
    createdAt: s.createdAt,
    statusKey,
    unread: s.status === 'pendente' && !readIds.has(s.id),
    href: '/solicitacoes/minhas',
  };
}

async function fetchSolicitacoesForUser(usuario, limit) {
  const userId = usuario.id;

  if (isDoador(usuario)) {
    return prisma.solicitacao.findMany({
      where: { doacao: { usuarioId: userId } },
      include: {
        doacao: { include: { itens: { take: 1, orderBy: { validade: 'asc' } } } },
        usuario: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  return prisma.solicitacao.findMany({
    where: { usuarioId: userId },
    include: {
      doacao: {
        include: {
          itens: { take: 1, orderBy: { validade: 'asc' } },
          usuario: { select: { nome: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

async function getRecentNotifications(usuario, limit = 8) {
  const [solicitacoes, readIds] = await Promise.all([
    fetchSolicitacoesForUser(usuario, limit),
    getReadSolicitacaoIds(usuario.id),
  ]);

  return solicitacoes.map((s) =>
    mapSolicitacaoToNotification(s, readIds, { isDoadorView: isDoador(usuario) })
  );
}

async function assertSolicitacaoAccess(usuario, solicitacaoId) {
  const where = isDoador(usuario)
    ? { id: solicitacaoId, doacao: { usuarioId: usuario.id } }
    : { id: solicitacaoId, usuarioId: usuario.id };

  const solicitacao = await prisma.solicitacao.findFirst({ where });
  if (!solicitacao) {
    const err = new Error('Solicitação não encontrada');
    err.status = 404;
    throw err;
  }
  return solicitacao;
}

async function markAsRead(usuario, solicitacaoId) {
  await assertSolicitacaoAccess(usuario, solicitacaoId);
  await prisma.notificacaoLida.upsert({
    where: {
      usuarioId_solicitacaoId: {
        usuarioId: usuario.id,
        solicitacaoId,
      },
    },
    create: {
      usuarioId: usuario.id,
      solicitacaoId,
    },
    update: {},
  });
}

async function markAllAsRead(usuario) {
  const solicitacoes = await fetchSolicitacoesForUser(usuario, 100);
  const readIds = await getReadSolicitacaoIds(usuario.id);
  const unreadIds = solicitacoes
    .filter((s) => s.status === 'pendente' && !readIds.has(s.id))
    .map((s) => s.id);

  if (unreadIds.length === 0) return;

  await prisma.notificacaoLida.createMany({
    data: unreadIds.map((solicitacaoId) => ({
      usuarioId: usuario.id,
      solicitacaoId,
    })),
    skipDuplicates: true,
  });
}

module.exports = {
  getRecentNotifications,
  markAsRead,
  markAllAsRead,
  isDoador,
};
