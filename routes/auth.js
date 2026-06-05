const express = require('express');
const router = express.Router();
const {
  showWelcome,
  showRegister,
  register,
  showLogin,
  login,
  refresh,
  logout,
} = require('../controllers/authController');

router.get('/', showWelcome);
router.get('/welcome', showWelcome);

router.get('/register', showRegister);
router.post('/register', register);

router.get('/login', showLogin);
router.post('/login', login);

router.post('/refresh', refresh);
router.post('/logout', logout);

module.exports = router;
