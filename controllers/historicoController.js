const prisma = require('../config/database');
const { solicitationDisplayStatus, formatDateShort } = require('../utils/formatTime');

async function showHistorico(req, res) {
  const usuario = res.locals.usuario;
  if (!usuario) return res.redirect('/auth');

  const userId = usuario.id;
  const isDoador = usuario.role === 'doador' || usuario.role === 'admin';
  let eventos = [];

  try {
    if (isDoador) {
      const [doacoesEntregues, solicitacoesResolvidas] = await Promise.all([
        prisma.doacao.findMany({
          where: { usuarioId: userId, status: 'entregue' },
          include: { itens: { take: 1, orderBy: { validade: 'asc' } } },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.solicitacao.findMany({
          where: {
            doacao: { usuarioId: userId },
            status: { in: ['aprovado', 'recusado', 'cancelado'] },
          },
          include: {
            doacao: { include: { itens: { take: 1, orderBy: { validade: 'asc' } } } },
            usuario: { select: { nome: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
      ]);

      eventos = [
        ...doacoesEntregues.map((d) => ({
          tipo: 'doacao',
          titulo: d.itens[0]?.nome || 'Doação entregue',
          meta: `${d.itens.length} item(ns) · entregue`,
          status: 'entregue',
          data: d.updatedAt,
        })),
        ...solicitacoesResolvidas.map((s) => ({
          tipo: 'solicitacao',
          titulo: s.doacao.itens[0]?.nome || 'Solicitação',
          meta: `${s.usuario.nome} · ${s.quantidade} un`,
          status: solicitationDisplayStatus(s.status),
          data: s.updatedAt,
        })),
      ].sort((a, b) => new Date(b.data) - new Date(a.data));
    } else {
      const solicitacoes = await prisma.solicitacao.findMany({
        where: {
          usuarioId: userId,
          status: { in: ['aprovado', 'recusado', 'cancelado'] },
        },
        include: {
          doacao: {
            include: {
              itens: { take: 1, orderBy: { validade: 'asc' } },
              usuario: { select: { nome: true } },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      eventos = solicitacoes.map((s) => ({
        tipo: 'solicitacao',
        titulo: s.doacao.itens[0]?.nome || 'Solicitação',
        meta: `Doador: ${s.doacao.usuario.nome} · ${s.quantidade} un`,
        status: solicitationDisplayStatus(s.status),
        data: s.updatedAt,
      }));
    }
  } catch (err) {
    console.error('[historico] Erro ao carregar histórico:', err.message);
  }

  res.render('historico/index', {
    title: 'Histórico - FoodShare',
    activeNav: 'historico',
    pageHeadingPrefix: 'Esse é seu',
    pageHeadingHighlight: 'histórico',
    pageSubtitle: isDoador
      ? 'Doações entregues e solicitações já respondidas.'
      : 'Solicitações que você fez e que já foram finalizadas.',
    featurePreview: true,
    isDoador,
    eventos,
    formatDateShort,
  });
}

module.exports = { showHistorico };
