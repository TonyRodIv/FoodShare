const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Apenas beneficiários e admins podem criar solicitações
router.get('/nova', authenticate, authorize(['beneficiario', 'admin']), (req, res) => {
  res.render('solicitacoes/nova', { title: 'Nova Solicitação - FoodShare' });
});

router.post('/nova', authenticate, authorize(['beneficiario', 'admin']), (req, res) => {
  // TODO: implementar criação de solicitação
  res.redirect('/solicitacoes');
});

// Listagem pública de solicitações
router.get('/', (req, res) => {
  res.render('solicitacoes/index', { title: 'Solicitações - FoodShare' });
});

module.exports = router;
