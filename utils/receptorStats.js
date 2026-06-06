const prisma = require('../config/database');

async function getReceptorMonthStats(userId) {
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const [totalSolicitadas, totalRecebidas, totalPendentes] = await Promise.all([
    prisma.solicitacao.count({
      where: { usuarioId: userId, createdAt: { gte: startOfMonth } },
    }),
    prisma.solicitacao.count({
      where: {
        usuarioId: userId,
        status: 'aprovado',
        updatedAt: { gte: startOfMonth },
      },
    }),
    prisma.solicitacao.count({
      where: { usuarioId: userId, status: 'pendente' },
    }),
  ]);

  return { totalSolicitadas, totalRecebidas, totalPendentes };
}

module.exports = { getReceptorMonthStats };
