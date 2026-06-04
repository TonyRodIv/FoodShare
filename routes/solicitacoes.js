const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// GET /solicitacoes/nova — formulário para solicitar uma doação
router.get('/nova', authenticate, authorize(['receptor', 'admin']), async (req, res) => {
  const doacoes = await prisma.doacao.findMany({ where: { status: 'disponivel' } });
  res.render('solicitacoes/nova', { title: 'Nova Solicitação', doacoes });
});

// POST /solicitacoes/nova — salva a solicitação no banco
router.post('/nova', authenticate, authorize(['receptor', 'admin']), async (req, res) => {
  const { doacaoId, quantidade, observacoes } = req.body;
  await prisma.solicitacao.create({
    data: {
      doacaoId,
      quantidade: parseInt(quantidade),
      observacoes,
      usuarioId: req.usuario.id,
      status: 'pendente'
    }
  });
  res.redirect('/solicitacoes/minhas');
});

// GET /solicitacoes/minhas — solicitações feitas pelo usuário logado
router.get('/minhas', authenticate, async (req, res) => {
  const solicitacoes = await prisma.solicitacao.findMany({
    where: { usuarioId: req.usuario.id },
    include: { doacao: true }
  });
  res.render('solicitacoes/minhas', { title: 'Minhas Solicitações', solicitacoes });
});

// GET /solicitacoes/recebidas — solicitações nas doações do usuário logado
router.get('/recebidas', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  const solicitacoes = await prisma.solicitacao.findMany({
    where: { doacao: { usuarioId: req.usuario.id } },
    include: { doacao: true, usuario: true }
  });
  res.render('solicitacoes/recebidas', { title: 'Solicitações Recebidas', solicitacoes });
});

// POST /solicitacoes/:id/aceitar
router.post('/:id/aceitar', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  await prisma.solicitacao.update({
    where: { id: req.params.id },
    data: { status: 'aprovado' }
  });
  res.redirect('/solicitacoes/recebidas');
});

// POST /solicitacoes/:id/recusar
router.post('/:id/recusar', authenticate, authorize(['doador', 'admin']), async (req, res) => {
  await prisma.solicitacao.update({
    where: { id: req.params.id },
    data: { status: 'recusado' }
  });
  res.redirect('/solicitacoes/recebidas');
});

// POST /solicitacoes/:id/cancelar — receptor cancela sua própria solicitação
router.post('/:id/cancelar', authenticate, async (req, res) => {
  await prisma.solicitacao.update({
    where: { id: req.params.id },
    data: { status: 'cancelado' }
  });
  res.redirect('/solicitacoes/minhas');
});

module.exports = router;