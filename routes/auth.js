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
  loginGoogle,
  googleCallback,
  showCompleteGoogle,
  completeGoogle,
  showForgotPassword,
  forgotPassword,
  showResetPassword,
  resetPassword,
} = require('../controllers/authController');

router.get('/', showWelcome);
router.get('/welcome', showWelcome);

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação de usuários
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra um novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nome
 *               - email
 *               - senha
 *               - telefone
 *               - role
 *             properties:
 *               nome:
 *                 type: string
 *                 description: "Nome completo do usuário (mínimo 3 caracteres)"
 *               email:
 *                 type: string
 *                 description: "Endereço de e-mail válido"
 *               senha:
 *                 type: string
 *                 description: "Senha de acesso (mínimo 6 caracteres)"
 *               telefone:
 *                 type: string
 *                 description: "Telefone no formato (11) 91234-5678"
 *               role:
 *                 type: string
 *                 enum: [doador, receptor]
 *                 description: "'doador' para quem quer doar, 'receptor' para quem precisa receber"
 *             example:
 *               nome: "João Silva"
 *               email: "joao@email.com"
 *               senha: "123456"
 *               telefone: "(11) 91234-5678"
 *               role: "doador"
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Usuário registrado com sucesso"
 *       400:
 *         description: Erro de validação ou e-mail já cadastrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 */
router.get('/register', showRegister);
router.post('/register', register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Faz login no sistema
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - senha
 *             properties:
 *               email:
 *                 type: string
 *                 description: "O e-mail cadastrado do usuário"
 *               senha:
 *                 type: string
 *                 description: "A senha de acesso do usuário"
 *             example:
 *               email: "joao@email.com"
 *               senha: "123456"
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login realizado com sucesso"
 *                 usuario:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     nome:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: "Token JWT para uso opcional no Swagger"
 *       400:
 *         description: Erro de validação
 *       401:
 *         description: E-mail ou senha incorretos
 */
router.get('/login', showLogin);
router.post('/login', login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Renova o Access Token usando o Refresh Token do cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token renovado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Token renovado com sucesso"
 *       401:
 *         description: Refresh token ausente, inválido ou expirado
 */
router.post('/refresh', refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Faz logout do sistema (limpa cookies e invalida refresh token)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout realizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout realizado com sucesso"
 */
router.post('/logout', logout);

// Rotas do Google OAuth
router.get('/google', loginGoogle);
router.get('/callback', googleCallback);
router.get('/google/complete', showCompleteGoogle);
router.post('/google/complete', completeGoogle);

// Rotas de Recuperação de Senha
router.get('/forgot-password', showForgotPassword);
router.post('/forgot-password', forgotPassword);
router.get('/reset-password', showResetPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
