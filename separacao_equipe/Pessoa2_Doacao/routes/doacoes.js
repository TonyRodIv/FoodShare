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
 *   description: Gerenciamento de doações
 */

/**
 * @swagger
 * /doacoes/nova:
 *   post:
 *     summary: Cria uma nova doação com um ou mais itens
 *     tags: [Doacoes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - itens
 *             properties:
 *               observacoes:
 *                 type: string
 *                 description: "Observações gerais da doação (opcional)"
 *               itens:
 *                 type: array
 *                 description: "Lista de itens da doação (mínimo 1)"
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
 *                       description: "Nome do alimento"
 *                     quantidade:
 *                       type: integer
 *                       description: "Quantidade disponível"
 *                     categoria:
 *                       type: string
 *                       description: "Categoria (ex: frutas, grãos, laticínios)"
 *                     validade:
 *                       type: string
 *                       format: date
 *                       description: "Data de validade (AAAA-MM-DD)"
 *             example:
 *               observacoes: "Tudo dentro da validade, embalagens fechadas"
 *               itens:
 *                 - nome: "Arroz Integral 5kg"
 *                   quantidade: 10
 *                   categoria: "grãos"
 *                   validade: "2026-12-31"
 *                 - nome: "Feijão Preto 1kg"
 *                   quantidade: 15
 *                   categoria: "grãos"
 *                   validade: "2026-11-30"
 *     responses:
 *       201:
 *         description: Doação criada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Doação criada com sucesso"
 *                 doacao:
 *                   type: object
 *       400:
 *         description: Campos obrigatórios faltando ou lista de itens vazia
 */
router.get('/nova', authenticate, authorize(['doador', 'admin']), (req, res) => {
  res.render('doacoes/nova', { title: 'Nova Doação - FoodShare', errors: [], old: {} });
});

router.post('/nova', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  const { observacoes, itens } = req.body;

  // Validação: precisa ter pelo menos 1 item
  if (!itens || !Array.isArray(itens) || itens.length === 0) {
    const errors = [{ field: 'itens', message: 'A doação precisa ter pelo menos 1 item' }];
    if (isApiRequest(req)) return res.status(400).json({ errors });
    return res.status(400).render('doacoes/nova', { title: 'Nova Doação - FoodShare', errors, old: req.body });
  }

  // Validação de cada item
  const erros = [];
  itens.forEach((item, index) => {
    if (!item.nome) erros.push({ field: `itens[${index}].nome`, message: `Item ${index + 1}: nome é obrigatório` });
    if (!item.quantidade) erros.push({ field: `itens[${index}].quantidade`, message: `Item ${index + 1}: quantidade é obrigatória` });
    if (!item.categoria) erros.push({ field: `itens[${index}].categoria`, message: `Item ${index + 1}: categoria é obrigatória` });
    if (!item.validade) erros.push({ field: `itens[${index}].validade`, message: `Item ${index + 1}: validade é obrigatória` });
  });

  if (erros.length > 0) {
    if (isApiRequest(req)) return res.status(400).json({ errors: erros });
    return res.status(400).render('doacoes/nova', { title: 'Nova Doação - FoodShare', errors: erros, old: req.body });
  }

  try {
    const doacao = await prisma.doacao.create({
      data: {
        observacoes: observacoes || null,
        usuarioId: req.usuario.id,
        status: 'disponivel',
        itens: {
          create: itens.map(item => ({
            nome: item.nome,
            quantidade: parseInt(item.quantidade),
            categoria: item.categoria,
            validade: new Date(item.validade),
          }))
        }
      },
      include: { itens: true }
    });

    if (isApiRequest(req)) return res.status(201).json({ message: 'Doação criada com sucesso', doacao });
    return res.redirect('/doacoes');
  } catch (err) {
    console.error('[doacoes] Erro ao criar doação:', err.message, err.code, err.meta);
    const errors = [{ field: null, message: 'Erro interno ao criar doação: ' + err.message }];
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao criar doação', detail: err.message });
    return res.status(500).render('doacoes/nova', { title: 'Nova Doação - FoodShare', errors, old: req.body });
  }
});

/**
 * @swagger
 * /doacoes:
 *   get:
 *     summary: Lista todas as doações com seus itens
 *     tags: [Doacoes]
 *     responses:
 *       200:
 *         description: Lista de doações em formato JSON
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   status:
 *                     type: string
 *                   observacoes:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   itens:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         nome:
 *                           type: string
 *                         quantidade:
 *                           type: integer
 *                         categoria:
 *                           type: string
 *                         validade:
 *                           type: string
 *                           format: date-time
 *                   usuario:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       nome:
 *                         type: string
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const doacoes = await prisma.doacao.findMany({
      include: {
        itens: true,
        usuario: { select: { id: true, nome: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    if (isApiRequest(req)) return res.status(200).json(doacoes);
    return res.render('doacoes/index', { title: 'Doações Disponíveis - FoodShare', doacoes });
  } catch (err) {
    console.error('[doacoes] Erro ao listar doações:', err);
    if (isApiRequest(req)) return res.status(500).json({ message: 'Erro interno ao listar doações' });
    return res.status(500).render('error', { message: 'Erro interno ao listar doações', error: err });
  }
});

module.exports = router;
