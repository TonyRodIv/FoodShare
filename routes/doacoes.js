const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

function isApiRequest(req) {
  const contentType = req.headers['content-type'] || '';
  const accept = req.headers['accept'] || '';
  return contentType.includes('application/json') || accept.includes('application/json');
}

/**
 * @swagger
 * tags:
 *   name: Doacoes
 *   description: Gerenciamento de doações de alimentos
 */

/**
 * @swagger
 * /doacoes:
 *   get:
 *     summary: Lista as doações disponíveis
 *     tags: [Doacoes]
 *     responses:
 *       200:
 *         description: Lista de doações retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   nome:
 *                     type: string
 *                   quantidade:
 *                     type: integer
 *                   categoria:
 *                     type: string
 *                   status:
 *                     type: string
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const doacoes = await prisma.doacao.findMany({
      where: { status: 'disponivel' },
      include: { usuario: { select: { nome: true, email: true } } },
      orderBy: { createdAt: 'desc' }
    });
    
    if (isApiRequest(req)) return res.status(200).json(doacoes);
    res.render('doacoes/index', { title: 'Doações - FoodShare', doacoes });
  } catch (err) {
    console.error('[doacoes] Erro ao listar doações:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno' });
    res.status(500).render('error', { message: 'Erro ao listar doações', error: err });
  }
});

/**
 * @swagger
 * /doacoes/nova:
 *   get:
 *     summary: Renderiza o formulário de nova doação (Apenas HTML)
 *     tags: [Doacoes]
 */
router.get('/nova', authenticate, authorize(['doador', 'admin']), (req, res) => {
  res.render('doacoes/nova', { title: 'Nova Doação - FoodShare' });
});

/**
 * @swagger
 * /doacoes/nova:
 *   post:
 *     summary: Cria uma ou múltiplas doações
 *     tags: [Doacoes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               itens:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - nome
 *                     - quantidade
 *                     - categoria
 *                     - validade
 *                   properties:
 *                     nome:
 *                       type: string
 *                     quantidade:
 *                       type: integer
 *                     categoria:
 *                       type: string
 *                     validade:
 *                       type: string
 *                       format: date
 *                     observacoes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Doações criadas com sucesso
 *       500:
 *         description: Erro interno do servidor
 */
router.post('/nova', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  try {
    let itens = req.body.itens;
    
    // Suporte caso a API mande um objeto único sem array
    if (!itens && req.body.nome) {
      itens = [req.body];
    }

    if (Array.isArray(itens) && itens.length > 0) {
      const doacoes = itens.map(item => ({
        nome: item.nome,
        quantidade: parseInt(item.quantidade),
        categoria: item.categoria,
        validade: new Date(item.validade),
        observacoes: item.observacoes || null,
        usuarioId: req.usuario.id,
        status: 'disponivel'
      }));
      
      await prisma.doacao.createMany({
        data: doacoes
      });
    }

    if (isApiRequest(req)) return res.status(201).json({ message: 'Doações criadas com sucesso' });
    res.redirect('/doacoes');
  } catch (err) {
    console.error('[doacoes] Erro ao criar doações:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao criar doação' });
    res.status(500).render('error', { message: 'Erro ao criar doação', error: err });
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
      where: { id: req.params.id }
    });

    if (!doacao) {
      return res.status(404).render('error', { message: 'Doação não encontrada', error: { status: 404 } });
    }

    // Apenas o dono ou admin pode editar
    if (doacao.usuarioId !== req.usuario.id && req.usuario.role !== 'admin') {
      return res.status(403).render('error', { message: 'Você não tem permissão para editar esta doação.', error: { status: 403 } });
    }

    if (isApiRequest(req)) return res.status(200).json(doacao);
    res.render('doacoes/editar', { title: 'Editar Doação - FoodShare', doacao, errors: [] });
  } catch (err) {
    console.error('[doacoes] Erro ao carregar edição:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno' });
    res.status(500).render('error', { message: 'Erro ao carregar doação', error: err });
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
      where: { id: req.params.id }
    });

    if (!doacao) {
      if (isApiRequest(req)) return res.status(404).json({ message: 'Doação não encontrada' });
      return res.status(404).render('error', { message: 'Doação não encontrada', error: { status: 404 } });
    }

    // Apenas o dono ou admin pode editar
    if (doacao.usuarioId !== req.usuario.id && req.usuario.role !== 'admin') {
      if (isApiRequest(req)) return res.status(403).json({ message: 'Acesso negado' });
      return res.status(403).render('error', { message: 'Você não tem permissão para editar esta doação.', error: { status: 403 } });
    }

    const { nome, quantidade, categoria, validade, observacoes, status } = req.body;

    // Validação simples
    const erros = [];
    if (!nome || nome.trim() === '') erros.push({ field: 'nome', message: 'O nome do alimento é obrigatório.' });
    if (!quantidade || isNaN(parseInt(quantidade)) || parseInt(quantidade) < 1) erros.push({ field: 'quantidade', message: 'Informe uma quantidade válida (mínimo 1).' });
    if (!categoria || categoria.trim() === '') erros.push({ field: 'categoria', message: 'Selecione uma categoria.' });
    if (!validade) erros.push({ field: 'validade', message: 'A data de validade é obrigatória.' });

    if (erros.length > 0) {
      if (isApiRequest(req)) return res.status(400).json({ errors: erros });
      return res.status(400).render('doacoes/editar', {
        title: 'Editar Doação - FoodShare',
        doacao: { ...doacao, ...req.body },
        errors: erros
      });
    }

    const statusValidos = ['disponivel', 'reservado', 'entregue'];
    const doacaoAtualizada = await prisma.doacao.update({
      where: { id: req.params.id },
      data: {
        nome: nome.trim(),
        quantidade: parseInt(quantidade),
        categoria: categoria.trim(),
        validade: new Date(validade),
        observacoes: observacoes?.trim() || null,
        status: statusValidos.includes(status) ? status : doacao.status
      }
    });

    if (isApiRequest(req)) return res.status(200).json({ message: 'Doação atualizada com sucesso', doacao: doacaoAtualizada });
    res.redirect('/doacoes');
  } catch (err) {
    console.error('[doacoes] Erro ao atualizar doação:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao atualizar doação' });
    res.status(500).render('error', { message: 'Erro ao atualizar doação', error: err });
  }
});

module.exports = router;

