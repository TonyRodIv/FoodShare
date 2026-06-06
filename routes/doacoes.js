const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { donationDisplayStatus, isExpired, mesAtual, categoryFilterKey } = require('../utils/formatTime');
const { buildDoacoesDetalheMap } = require('../utils/detailSerializers');
const { getReceptorMonthStats } = require('../utils/receptorStats');

function isApiRequest(req) {
  const contentType = req.headers['content-type'] || '';
  const accept = req.headers['accept'] || '';
  return contentType.includes('application/json') || accept.includes('application/json');
}

function isDoador(usuario) {
  return usuario.role === 'doador' || usuario.role === 'admin';
}

function normalizeItens(body) {
  let itens = body.itens;
  if (!itens && body.nome) itens = [body];
  if (itens && !Array.isArray(itens)) {
    itens = Object.keys(itens)
      .sort((a, b) => Number(a) - Number(b))
      .map((key) => itens[key]);
  }
  return itens || [];
}

function validateDoacao(body) {
  const errors = [];
  const itens = normalizeItens(body);

  if (itens.length === 0) {
    errors.push({ field: 'itens', message: 'Adicione pelo menos um item.' });
    return { errors, itens };
  }

  itens.forEach((item, i) => {
    if (!item.nome || !String(item.nome).trim()) {
      errors.push({ field: `itens.${i}.nome`, message: 'Informe o nome do alimento.' });
    }
    if (!item.categoria) {
      errors.push({ field: `itens.${i}.categoria`, message: 'Selecione uma categoria.' });
    }
    const qty = parseInt(item.quantidade, 10);
    if (!item.quantidade || Number.isNaN(qty) || qty < 1) {
      errors.push({ field: `itens.${i}.quantidade`, message: 'Informe uma quantidade válida.' });
    }
    if (!item.validade) {
      errors.push({ field: `itens.${i}.validade`, message: 'Informe a validade.' });
    }
  });

  return { errors, itens };
}

async function getDoadorIndexData(userId) {
  const doacoes = await prisma.doacao.findMany({
    where: { usuarioId: userId },
    include: { itens: { orderBy: { validade: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });

  const itens = doacoes.flatMap((doacao) =>
    doacao.itens.map((item) => ({
      id: item.id,
      doacaoId: doacao.id,
      nome: item.nome,
      quantidade: item.quantidade,
      categoria: item.categoria,
      validade: item.validade,
      displayStatus: donationDisplayStatus({
        status: doacao.status,
        validade: item.validade,
      }),
    }))
  );

  return {
    isDoador: true,
    itens,
    doacoes,
    doacoesDetalhe: buildDoacoesDetalheMap(doacoes, { viewerRole: 'doador' }),
  };
}

async function getReceptorIndexData(userId) {
  const [doacoesRaw, solicitacoes, statsMonth] = await Promise.all([
    prisma.doacao.findMany({
      where: { status: 'disponivel' },
      include: {
        usuario: { select: { nome: true } },
        itens: { orderBy: { validade: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.solicitacao.findMany({
      where: { usuarioId: userId },
      include: {
        doacao: {
          include: {
            usuario: { select: { nome: true } },
            itens: { take: 1, orderBy: { validade: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    getReceptorMonthStats(userId),
  ]);

  const doacoes = doacoesRaw.flatMap((doacao) =>
    doacao.itens
      .filter((item) => !isExpired(item.validade))
      .map((item) => ({
        id: item.id,
        doacaoId: doacao.id,
        nome: item.nome,
        quantidade: item.quantidade,
        categoria: item.categoria,
        categoriaKey: categoryFilterKey(item.categoria),
        validade: item.validade,
        doadorNome: doacao.usuario.nome,
        localizacao: 'Local a combinar',
        availabilityPill: item.quantidade <= 3 ? 'ultimas' : 'disponivel',
      }))
  );

  const minhasSolicitacoes = solicitacoes.map((solic) => ({
    id: solic.id,
    status: solic.status,
    createdAt: solic.createdAt,
    itemLabel: solic.doacao.itens[0]?.nome || 'Doação',
    doadorNome: solic.doacao.usuario.nome,
  }));

  const { totalSolicitadas, totalRecebidas, totalPendentes } = statsMonth;

  return {
    isDoador: false,
    itens: [],
    doacoes,
    doacoesDetalhe: buildDoacoesDetalheMap(doacoesRaw, { viewerRole: 'receptor' }),
    minhasSolicitacoes,
    totalSolicitadas,
    totalRecebidas,
    totalPendentes,
    mesAtual: mesAtual(),
  };
}

/**
 * @swagger
 * tags:
 *   name: Doacoes
 *   description: Gerenciamento de doações de alimentos
 */

router.get('/', authenticate, async (req, res) => {
  try {
    const usuario = req.usuario;

    if (isDoador(usuario)) {
      const data = await getDoadorIndexData(usuario.id);
      if (isApiRequest(req)) {
        const doacoes = await prisma.doacao.findMany({
          where: { usuarioId: usuario.id },
          include: { itens: true },
          orderBy: { createdAt: 'desc' },
        });
        return res.status(200).json(doacoes);
      }
      return res.render('doacoes/index', {
        title: 'Doações - FoodShare',
        activeNav: 'doacoes',
        pageHeadingPrefix: 'Aqui ficam suas',
        pageHeadingHighlight: 'doações',
        pageSubtitle: 'Gerencie os itens que você publicou e acompanhe validade e status.',
        headerActionLabel: 'Nova doação',
        headerActionModal: true,
        openDoacaoModal: req.query.nova === '1',
        ...data,
      });
    }

    const doacoes = await prisma.doacao.findMany({
      where: { status: 'disponivel' },
      include: {
        usuario: { select: { nome: true, email: true } },
        itens: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (isApiRequest(req)) return res.status(200).json(doacoes);

    const data = await getReceptorIndexData(usuario.id);
    return res.render('doacoes/index', {
      title: 'Doações - FoodShare',
      activeNav: 'doacoes',
      headerVariant: 'home',
      query: req.query,
      ...data,
    });
  } catch (err) {
    console.error('[doacoes] Erro ao listar doações:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno' });
    res.status(500).render('error', { statusCode: 500, context: 'doacoes_list', error: err });
  }
});

router.get('/nova', authenticate, authorize(['doador', 'admin']), (req, res) => {
  res.redirect('/doacoes?nova=1');
});

router.post('/nova', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  try {
    const { errors, itens } = validateDoacao(req.body);

    if (errors.length > 0) {
      if (isApiRequest(req)) return res.status(400).json({ errors });
      const data = await getDoadorIndexData(req.usuario.id);
      return res.status(400).render('doacoes/index', {
        title: 'Doações - FoodShare',
        activeNav: 'doacoes',
        pageHeadingPrefix: 'Aqui ficam suas',
        pageHeadingHighlight: 'doações',
        pageSubtitle: 'Gerencie os itens que você publicou e acompanhe validade e status.',
        headerActionLabel: 'Nova doação',
        headerActionModal: true,
        openDoacaoModal: true,
        doacaoErrors: errors,
        doacaoOld: req.body,
        ...data,
      });
    }

    await prisma.doacao.create({
      data: {
        observacoes: req.body.observacoes || null,
        usuarioId: req.usuario.id,
        status: 'disponivel',
        itens: {
          create: itens.map((item) => ({
            nome: String(item.nome).trim(),
            quantidade: parseInt(item.quantidade, 10),
            categoria: item.categoria,
            validade: new Date(item.validade),
          })),
        },
      },
    });

    if (isApiRequest(req)) return res.status(201).json({ message: 'Doações criadas com sucesso' });
    return res.redirect('/doacoes');
  } catch (err) {
    console.error('[doacoes] Erro ao criar doações:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao criar doação' });
    res.status(500).render('error', { statusCode: 500, context: 'doacoes_create', error: err });
  }
});

/**
 * @swagger
 * /doacoes/{id}/editar:
 *   get:
 *     summary: Renderiza o formulário de edição de uma doação
 *     tags: [Doacoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID da doação a ser editada"
 *     responses:
 *       200:
 *         description: Formulário de edição renderizado com sucesso
 *       403:
 *         description: Acesso negado (não é o dono da doação)
 *       404:
 *         description: Doação não encontrada
 */
router.get('/:id/editar', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  try {
    const doacao = await prisma.doacao.findUnique({
      where: { id: req.params.id },
      include: { itens: { orderBy: { validade: 'asc' } } },
    });

    if (!doacao) {
      return res.status(404).render('error', { statusCode: 404, context: 'doacoes_edit', error: { status: 404 } });
    }

    if (doacao.usuarioId !== req.usuario.id && req.usuario.role !== 'admin') {
      return res.status(403).render('error', { statusCode: 403, context: 'doacoes_edit', error: { status: 403 } });
    }

    if (isApiRequest(req)) return res.status(200).json(doacao);
    return res.render('doacoes/editar', {
      title: 'Editar Doação - FoodShare',
      activeNav: 'doacoes',
      pageHeadingPrefix: 'Editar',
      pageHeadingHighlight: 'doação',
      pageSubtitle: 'Atualize os itens, observações e status do pacote publicado.',
      doacao,
      errors: [],
    });
  } catch (err) {
    console.error('[doacoes] Erro ao carregar edição:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno' });
    res.status(500).render('error', { statusCode: 500, context: 'doacoes_edit', error: err });
  }
});

/**
 * @swagger
 * /doacoes/{id}/editar:
 *   post:
 *     summary: Atualiza os dados de uma doação existente
 *     tags: [Doacoes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: "ID da doação a ser atualizada"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               quantidade:
 *                 type: integer
 *               categoria:
 *                 type: string
 *               validade:
 *                 type: string
 *                 format: date
 *               observacoes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [disponivel, reservado, entregue]
 *     responses:
 *       200:
 *         description: Doação atualizada com sucesso
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: Doação não encontrada
 */
router.post('/:id/editar', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  try {
    const doacao = await prisma.doacao.findUnique({
      where: { id: req.params.id },
      include: { itens: { orderBy: { validade: 'asc' } } },
    });

    if (!doacao) {
      if (isApiRequest(req)) return res.status(404).json({ message: 'Doação não encontrada' });
      return res.status(404).render('error', { statusCode: 404, context: 'doacoes_edit', error: { status: 404 } });
    }

    if (doacao.usuarioId !== req.usuario.id && req.usuario.role !== 'admin') {
      if (isApiRequest(req)) return res.status(403).json({ message: 'Acesso negado' });
      return res.status(403).render('error', { statusCode: 403, context: 'doacoes_edit', error: { status: 403 } });
    }

    const { errors, itens } = validateDoacao(req.body);
    const { observacoes, status } = req.body;
    const statusValidos = ['disponivel', 'reservado', 'entregue'];

    if (errors.length > 0) {
      if (isApiRequest(req)) return res.status(400).json({ errors });
      return res.status(400).render('doacoes/editar', {
        title: 'Editar Doação - FoodShare',
        activeNav: 'doacoes',
        pageHeadingPrefix: 'Editar',
        pageHeadingHighlight: 'doação',
        pageSubtitle: 'Atualize os itens, observações e status do pacote publicado.',
        doacao: {
          ...doacao,
          observacoes: observacoes ?? doacao.observacoes,
          status: statusValidos.includes(status) ? status : doacao.status,
          itens: itens.map((item, index) => ({
            ...doacao.itens[index],
            ...item,
          })),
        },
        doacaoOld: req.body,
        errors,
      });
    }

    const doacaoAtualizada = await prisma.$transaction(async (tx) => {
      const updated = await tx.doacao.update({
        where: { id: req.params.id },
        data: {
          observacoes: observacoes?.trim() || null,
          status: statusValidos.includes(status) ? status : doacao.status,
        },
      });

      await tx.itemDoacao.deleteMany({ where: { doacaoId: req.params.id } });
      await tx.itemDoacao.createMany({
        data: itens.map((item) => ({
          doacaoId: req.params.id,
          nome: String(item.nome).trim(),
          quantidade: parseInt(item.quantidade, 10),
          categoria: item.categoria,
          validade: new Date(item.validade),
        })),
      });

      return updated;
    });

    if (isApiRequest(req)) {
      return res.status(200).json({ message: 'Doação atualizada com sucesso', doacao: doacaoAtualizada });
    }
    return res.redirect('/doacoes');
  } catch (err) {
    console.error('[doacoes] Erro ao atualizar doação:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao atualizar doação' });
    res.status(500).render('error', { statusCode: 500, context: 'doacoes_edit', error: err });
  }
});

module.exports = router;