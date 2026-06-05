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

module.exports = router;
