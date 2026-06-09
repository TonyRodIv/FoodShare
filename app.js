const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { buildAuthFeedback } = require('./utils/feedbackErrors');
const { resolveErrorPage } = require('./utils/errorPageContent');
const {
  formatValidade,
  timeAgo,
  solicitationDisplayStatus,
  solicitationPillKey,
  solicitationPillLabel,
  RECEPTOR_CATEGORY_FILTERS,
  categoryFilterKey,
  categoryIconVariant,
  formatCategoryLabel,
  formatDateShort,
  donationDisplayStatus,
  donationStatusLabel,
  isExpired,
} = require('./utils/formatTime');
const { showHome } = require('./controllers/homeController');
const { showHistorico } = require('./controllers/historicoController');
const { showNotificacoes } = require('./controllers/notificacoesController');
const { showConfiguracoes } = require('./controllers/configuracoesController');
const { authenticate } = require('./middlewares/authMiddleware');
const { attachAppData } = require('./middlewares/appDataMiddleware');
const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.buildAuthFeedback = buildAuthFeedback;
app.locals.resolveErrorPage = resolveErrorPage;
app.locals.formatValidade = formatValidade;
app.locals.timeAgo = timeAgo;
app.locals.solicitationDisplayStatus = solicitationDisplayStatus;
app.locals.solicitationPillKey = solicitationPillKey;
app.locals.solicitationPillLabel = solicitationPillLabel;
app.locals.RECEPTOR_CATEGORY_FILTERS = RECEPTOR_CATEGORY_FILTERS;
app.locals.categoryFilterKey = categoryFilterKey;
app.locals.categoryIconVariant = categoryIconVariant;
app.locals.formatCategoryLabel = formatCategoryLabel;
app.locals.formatDateShort = formatDateShort;
app.locals.donationDisplayStatus = donationDisplayStatus;
app.locals.donationStatusLabel = donationStatusLabel;
app.locals.isExpired = isExpired;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      res.locals.usuario = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      res.locals.usuario = null;
    }
  } else {
    res.locals.usuario = null;
  }
  next();
});

app.use(attachAppData);

const swaggerJsdoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FoodShare API',
      version: '1.0.0',
      description: 'Documentação da API do FoodShare',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor Local',
      },
    ],
  },
  apis: ['./routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

const authRoutes = require('./routes/auth');
const doacoesRoutes = require('./routes/doacoes');
const solicitacoesRoutes = require('./routes/solicitacoes');
const notificacoesRoutes = require('./routes/notificacoes');
const perfilRoutes = require('./routes/perfil');
const errortestRoutes = require('./routes/errortest');

app.get('/', showHome);
app.get('/historico', authenticate, showHistorico);
app.get('/notificacoes', authenticate, showNotificacoes);
app.get('/configuracoes', authenticate, showConfiguracoes);

app.use('/auth', authRoutes);
app.use('/doacoes', doacoesRoutes);
app.use('/solicitacoes', solicitacoesRoutes);
app.use('/notificacoes', notificacoesRoutes);
app.use('/perfil', perfilRoutes);

if (process.env.NODE_ENV !== 'production') {
  app.use('/errortest', errortestRoutes);
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).render('error', {
    statusCode,
    error: err,
  });
});

app.use((req, res) => {
  res.status(404).render('error', {
    statusCode: 404,
  });
});

module.exports = app;
