const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/authMiddleware');

// Rotas protegidas para doações
// Apenas doadores e admins podem criar doações
router.get('/nova', authenticate, authorize(['doador', 'admin']), (req, res) => {
  res.render('doacoes/nova', { title: 'Nova Doação - FoodShare' });
});

router.post('/nova', authenticate, authorize(['doador', 'admin']), (req, res) => {
  // TODO: implementar criação de doação
  res.redirect('/doacoes');
});

// Listagem pública de doações
router.get('/', (req, res) => {
  res.render('doacoes/index', { title: 'Doações - FoodShare' });
});

module.exports = router;
