const prisma = require('../config/database');
const { mesAtual, donationDisplayStatus } = require('../utils/formatTime');
const {
  buildDoacoesDetalheMap,
  buildSolicitacoesDetalheMap,
} = require('../utils/detailSerializers');

async function showHome(req, res) {
  const usuario = res.locals.usuario;
  if (!usuario) return res.redirect('/auth');

  const isDoador = usuario.role === 'doador' || usuario.role === 'admin';
  if (!isDoador && usuario.role === 'receptor') {
    return res.redirect('/doacoes');
  }

  const userId = usuario.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let stats = {
    familiasAjudadas: 0,
    totalDoacoes: 0,
    doacoesAtivas: 0,
    solicitacoesPendentes: 0,
  };
  let doacoesAtivas = [];
  let solicitacoesRecebidas = [];
  let doacoesDetalhe = {};
  let solicitacoesDetalhe = {};

  try {
    if (isDoador) {
      const [totalDoacoes, doacoesAtivasCount, pendentes, familiasAjudadas, itens] = await Promise.all([
        prisma.doacao.count({ where: { usuarioId: userId } }),
        prisma.doacao.count({
          where: {
            usuarioId: userId,
            status: { in: ['disponivel', 'reservado'] },
          },
        }),
        prisma.solicitacao.count({
          where: {
            status: 'pendente',
            doacao: { usuarioId: userId },
          },
        }),
        prisma.solicitacao.count({
          where: {
            status: 'aprovado',
            doacao: { usuarioId: userId },
            updatedAt: { gte: startOfMonth },
          },
        }),
        prisma.itemDoacao.findMany({
          where: {
            doacao: {
              usuarioId: userId,
              status: { in: ['disponivel', 'reservado'] },
            },
          },
          include: { doacao: { select: { status: true } } },
          orderBy: { validade: 'asc' },
          take: 5,
        }),
      ]);

      const solicitacoes = await prisma.solicitacao.findMany({
        where: {
          status: 'pendente',
          doacao: { usuarioId: userId },
        },
        include: {
          doacao: {
            include: {
              itens: { orderBy: { validade: 'asc' } },
              usuario: { select: { nome: true } },
            },
          },
          usuario: { select: { id: true, nome: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      stats = {
        familiasAjudadas,
        totalDoacoes,
        doacoesAtivas: doacoesAtivasCount,
        solicitacoesPendentes: pendentes,
      };
      doacoesAtivas = itens.map((item) => ({
        id: item.id,
        doacaoId: item.doacaoId,
        nome: item.nome,
        quantidade: item.quantidade,
        validade: item.validade,
        displayStatus: donationDisplayStatus({
          status: item.doacao.status,
          validade: item.validade,
        }),
      }));
      doacoesDetalhe = {};
      if (itens.length > 0) {
        const doacaoIds = [...new Set(itens.map((item) => item.doacaoId))];
        const doacoesForDetail = await prisma.doacao.findMany({
          where: { id: { in: doacaoIds } },
          include: { itens: { orderBy: { validade: 'asc' } } },
        });
        doacoesDetalhe = buildDoacoesDetalheMap(doacoesForDetail, { viewerRole: 'doador' });
      }
      solicitacoesRecebidas = solicitacoes.map((s) => ({
        ...s,
        itemLabel: s.doacao.itens[0]?.nome || 'Doação',
      }));
      solicitacoesDetalhe = buildSolicitacoesDetalheMap(solicitacoes);
    } else {
      const [minhasSolicitacoes, pendentes] = await Promise.all([
        prisma.solicitacao.count({ where: { usuarioId: userId } }),
        prisma.solicitacao.count({
          where: { usuarioId: userId, status: 'pendente' },
        }),
      ]);

      stats = {
        familiasAjudadas: 0,
        totalDoacoes: 0,
        doacoesAtivas: minhasSolicitacoes,
        solicitacoesPendentes: pendentes,
      };
    }
  } catch (err) {
    console.error('[home] Erro ao carregar dashboard:', err.message);
  }

  res.render('index', {
    title: 'FoodShare',
    activeNav: 'home',
    headerVariant: 'home',
    mesAtual: mesAtual(),
    stats,
    doacoesAtivas,
    solicitacoesRecebidas,
    doacoesDetalhe,
    solicitacoesDetalhe,
    isDoador,
  });
}

module.exports = { showHome };