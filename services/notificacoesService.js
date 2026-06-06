const prisma = require('../config/database');

function isDoador(usuario) {
  return usuario.role === 'doador' || usuario.role === 'admin';
}

async function getRecentNotifications(usuario, limit = 8) {
  const userId = usuario.id;

  if (isDoador(usuario)) {
    const solicitacoes = await prisma.solicitacao.findMany({
      where: { doacao: { usuarioId: userId } },
      include: {
        doacao: { include: { itens: { take: 1, orderBy: { validade: 'asc' } } } },
        usuario: { select: { nome: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return solicitacoes.map((s) => {
      const item = s.doacao.itens[0]?.nome || 'Doação';
      let title = `Solicitação de ${item}`;
      if (s.status === 'pendente') title = `Nova solicitação: ${item}`;
      else if (s.status === 'aprovado') title = `Pedido aceito: ${item}`;
      else if (s.status === 'recusado') title = `Pedido recusado: ${item}`;
      else if (s.status === 'cancelado') title = `Pedido cancelado: ${item}`;

      return {
        id: s.id,
        title,
        meta: `${s.usuario.nome} · ${s.quantidade} un`,
        createdAt: s.createdAt,
        unread: s.status === 'pendente',
        href: '/solicitacoes/recebidas',
      };
    });
  }

  const solicitacoes = await prisma.solicitacao.findMany({
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

  return solicitacoes.map((s) => {
    const item = s.doacao.itens[0]?.nome || 'Doação';
    let title = `Solicitação: ${item}`;
    if (s.status === 'pendente') title = `Aguardando resposta: ${item}`;
    else if (s.status === 'aprovado') title = `Solicitação aprovada: ${item}`;
    else if (s.status === 'recusado') title = `Solicitação recusada: ${item}`;
    else if (s.status === 'cancelado') title = `Solicitação cancelada: ${item}`;

    return {
      id: s.id,
      title,
      meta: `Doador: ${s.doacao.usuario.nome}`,
      createdAt: s.createdAt,
      unread: s.status === 'pendente',
      href: '/solicitacoes/minhas',
    };
  });
}

module.exports = { getRecentNotifications, isDoador };
