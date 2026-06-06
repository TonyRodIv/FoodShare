const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  marcarComoLida,
  marcarTodasComoLidas,
} = require('../controllers/notificacoesController');

const router = express.Router();

router.post('/marcar-todas', authenticate, marcarTodasComoLidas);
router.post('/:id/lida', authenticate, marcarComoLida);

module.exports = router;
