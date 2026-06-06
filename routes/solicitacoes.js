const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const {
  sortSolicitacoesRecebidas,
  buildSolicitacoesDetalheMap,
} = require('../utils/solicitacaoDetail');
const { getReceptorMonthStats } = require('../utils/receptorStats');
const { mesAtual } = require('../utils/formatTime');

function isApiRequest(req) {
  const contentType = req.headers['content-type'] || '';
  const accept = req.headers['accept'] || '';
  return contentType.includes('application/json') || accept.includes('application/json');
}

/**
 * @swagger
 * tags:
 *   name: Solicitacoes
 *   description: Gerenciamento de solicitações de doações
 */

/**
 * @swagger
 * /solicitacoes/nova:
 *   post:
 *     summary: Cria uma nova solicitação para uma doação
 *     tags: [Solicitacoes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - doacaoId
 *               - quantidade
 *             properties:
 *               doacaoId:
 *                 type: string
 *                 description: "O ID único (UUID) da doação que você está pedindo"
 *               quantidade:
 *                 type: integer
 *                 description: "A quantidade de itens que você precisa dessa doação"
 *               observacoes:
 *                 type: string
 *                 description: "Alguma mensagem opcional ou justificativa para o doador"
 *             example:
 *               doacaoId: "12345678-abcd-1234-efgh-1234567890ab"
 *               quantidade: 2
 *               observacoes: "Gostaria de receber esta doação."
 *     responses:
 *       201:
 *         description: Solicitação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Solicitação criada com sucesso"
 *                 solicitacao:
 *                   type: object
 *       400:
 *         description: Campos obrigatórios faltando
 */
// GET /solicitacoes/nova — redireciona para /doacoes (fluxo principal via modal)
router.get('/nova', authenticate, authorize(['receptor', 'admin']), (req, res) => {
  const doacaoId = req.query.doacaoId;
  if (doacaoId) {
    return res.redirect(`/doacoes?solicitar=${encodeURIComponent(doacaoId)}`);
  }
  return res.redirect('/doacoes');
});

// POST /solicitacoes/nova — salva a solicitação no banco
router.post('/nova', authenticate, authorize(['receptor', 'admin']), async (req, res) => {
  const { doacaoId, quantidade, observacoes } = req.body;

  // Validação dos campos obrigatórios
  const erros = [];
  if (!doacaoId) erros.push({ field: 'doacaoId', message: 'O ID da doação é obrigatório' });
  if (!quantidade) erros.push({ field: 'quantidade', message: 'A quantidade é obrigatória' });

  if (erros.length > 0) {
    if (isApiRequest(req)) return res.status(400).json({ errors: erros });
    // Se for EJS, busca doacoes novamente para renderizar a view com erro
    const doacoes = await prisma.doacao.findMany({ where: { status: 'disponivel' }, include: { itens: true } });
    return res.status(400).render('solicitacoes/nova', {
      title: 'Nova Solicitação - FoodShare',
      activeNav: 'solicitacoes',
      pageHeadingPrefix: 'Faça sua',
      pageHeadingHighlight: 'solicitação',
      pageSubtitle: 'Escolha um pacote de doação disponível e envie seu pedido.',
      doacoes,
      preSelectedDoacaoId: doacaoId,
      errors: erros,
      old: req.body,
    });
  }

  try {
    const solicitacao = await prisma.solicitacao.create({
      data: {
        doacaoId,
        quantidade: parseInt(quantidade),
        observacoes: observacoes || null,
        usuarioId: req.usuario.id,
        status: 'pendente'
      }
    });
    if (isApiRequest(req)) return res.status(201).json({ message: 'Solicitação criada com sucesso', solicitacao });
    return res.redirect('/doacoes?solicitacao=ok');
  } catch (err) {
    console.error('[solicitacoes] Erro ao criar solicitação:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao criar solicitação' });
    const doacoes = await prisma.doacao.findMany({ where: { status: 'disponivel' }, include: { itens: true } });
    return res.status(500).render('solicitacoes/nova', {
      title: 'Nova Solicitação - FoodShare',
      activeNav: 'solicitacoes',
      pageHeadingPrefix: 'Faça sua',
      pageHeadingHighlight: 'solicitação',
      pageSubtitle: 'Escolha um pacote de doação disponível e envie seu pedido.',
      doacoes,
      preSelectedDoacaoId: doacaoId,
      errors: [{ field: null, message: 'Erro interno.' }],
      old: req.body,
    });
  }
});

/**
 * @swagger
 * /solicitacoes/minhas:
 *   get:
 *     summary: Lista as solicitações do usuário logado
 *     tags: [Solicitacoes]
 *     responses:
 *       200:
 *         description: Lista de solicitações em formato JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   quantidade:
 *                     type: integer
 *                   status:
 *                     type: string
 *                     enum: [pendente, aprovado, recusado, cancelado]
 *                   observacoes:
 *                     type: string
 *                   doacao:
 *                     type: object
 */
router.get('/minhas', authenticate, async (req, res) => {
  try {
    const [solicitacoes, receptorStats] = await Promise.all([
      prisma.solicitacao.findMany({
        where: { usuarioId: req.usuario.id },
        include: {
          doacao: {
            include: {
              itens: { orderBy: { validade: 'asc' } },
              usuario: { select: { nome: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (req.usuario.role === 'receptor' || req.usuario.role === 'admin')
        ? getReceptorMonthStats(req.usuario.id)
        : Promise.resolve(null),
    ]);
    const solicitacoesDetalhe = buildSolicitacoesDetalheMap(solicitacoes, { viewerRole: 'receptor' });
    if (isApiRequest(req)) return res.status(200).json(solicitacoes);
    return res.render('solicitacoes/minhas_solicita', {
      title: 'Minhas Solicitações - FoodShare',
      activeNav: 'solicitacoes',
      pageHeadingPrefix: 'Esse é seu',
      pageHeadingHighlight: 'acompanhamento',
      pageSubtitle: 'Veja o status dos alimentos que você solicitou.',
      solicitacoes,
      solicitacoesDetalhe,
      totalSolicitadas: receptorStats?.totalSolicitadas ?? 0,
      totalRecebidas: receptorStats?.totalRecebidas ?? 0,
      totalPendentes: receptorStats?.totalPendentes ?? 0,
      mesAtual: mesAtual(),
      showReceptorHero: req.usuario.role === 'receptor' || req.usuario.role === 'admin',
    });
  } catch (err) {
    console.error('[solicitacoes] Erro ao listar minhas solicitações:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao listar solicitações' });
    return res.status(500).render('error', { statusCode: 500, context: 'solicitacoes_list', error: err });
  }
});

/**
 * @swagger
 * /solicitacoes/recebidas:
 *   get:
 *     summary: Lista as solicitações recebidas nas doações do usuário logado
 *     tags: [Solicitacoes]
 *     responses:
 *       200:
 *         description: Lista de solicitações recebidas em formato JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   quantidade:
 *                     type: integer
 *                   status:
 *                     type: string
 *                   doacao:
 *                     type: object
 *                   usuario:
 *                     type: object
 *                     description: "Dados do receptor que fez a solicitação"
 */
router.get('/recebidas', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  try {
    const solicitacoesRaw = await prisma.solicitacao.findMany({
      where: { doacao: { usuarioId: req.usuario.id } },
      include: {
        doacao: { include: { itens: { orderBy: { validade: 'asc' } } } },
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
    const solicitacoes = sortSolicitacoesRecebidas(solicitacoesRaw);
    const solicitacoesDetalhe = buildSolicitacoesDetalheMap(solicitacoesRaw);
    if (isApiRequest(req)) return res.status(200).json(solicitacoes);
    return res.render('solicitacoes/recebidas', {
      title: 'Solicitações Recebidas - FoodShare',
      activeNav: 'solicitacoes',
      pageHeadingPrefix: 'Esse é sua',
      pageHeadingHighlight: 'central de pedidos',
      pageSubtitle: 'Gerencie os pedidos feitos para os seus itens doados.',
      solicitacoes,
      solicitacoesDetalhe,
    });
  } catch (err) {
    console.error('[solicitacoes] Erro ao listar recebidas:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao listar recebidas' });
    return res.status(500).render('error', { statusCode: 500, context: 'solicitacoes_recebidas', error: err });
  }
});

/**
 * @swagger
 * /solicitacoes/{id}/aceitar:
 *   post:
 *     summary: Aceita uma solicitação recebida
 *     tags: [Solicitacoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID da solicitação a ser aceita"
 *     responses:
 *       200:
 *         description: Solicitação aceita com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Solicitação aceita com sucesso"
 *                 solicitacao:
 *                   type: object
 */
router.post('/:id/aceitar', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  try {
    const solicitacao = await prisma.solicitacao.update({
      where: { id: req.params.id },
      data: { status: 'aprovado' }
    });
    if (isApiRequest(req)) return res.status(200).json({ message: 'Solicitação aceita com sucesso', solicitacao });
    return res.redirect('back');
  } catch (err) {
    console.error('[solicitacoes] Erro ao aceitar:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao aceitar solicitação' });
    return res.redirect('back');
  }
});

/**
 * @swagger
 * /solicitacoes/{id}/recusar:
 *   post:
 *     summary: Recusa uma solicitação recebida
 *     tags: [Solicitacoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID da solicitação a ser recusada"
 *     responses:
 *       200:
 *         description: Solicitação recusada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Solicitação recusada"
 *                 solicitacao:
 *                   type: object
 */
router.post('/:id/recusar', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  try {
    const solicitacao = await prisma.solicitacao.update({
      where: { id: req.params.id },
      data: { status: 'recusado' }
    });
    if (isApiRequest(req)) return res.status(200).json({ message: 'Solicitação recusada', solicitacao });
    return res.redirect('back');
  } catch (err) {
    console.error('[solicitacoes] Erro ao recusar:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao recusar solicitação' });
    return res.redirect('back');
  }
});

/**
 * @swagger
 * /solicitacoes/{id}/cancelar:
 *   post:
 *     summary: Cancela uma solicitação própria
 *     tags: [Solicitacoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID da solicitação a ser cancelada"
 *     responses:
 *       200:
 *         description: Solicitação cancelada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Solicitação cancelada"
 *                 solicitacao:
 *                   type: object
 */
router.post('/:id/cancelar', authenticate, async (req, res) => {
  try {
    const solicitacao = await prisma.solicitacao.update({
      where: { id: req.params.id },
      data: { status: 'cancelado' }
    });
    if (isApiRequest(req)) return res.status(200).json({ message: 'Solicitação cancelada', solicitacao });
    return res.redirect('back');
  } catch (err) {
    console.error('[solicitacoes] Erro ao cancelar:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao cancelar solicitação' });
    return res.redirect('back');
  }
});

module.exports = router;