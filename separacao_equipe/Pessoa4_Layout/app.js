const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { buildAuthFeedback } = require('./utils/feedbackErrors');
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.locals.buildAuthFeedback = buildAuthFeedback;

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware global: disponibiliza res.locals.usuario para todas as views EJS
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

const swaggerJsdoc = require('swagger-jsdoc');

// Swagger Configuration
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

// Servir o JSON do Swagger
app.get('/api-docs/swagger.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Servir a página customizada do Swagger
app.get('/api-docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'api-docs.html'));
});

// Routes
const authRoutes = require('./routes/auth');
const doacoesRoutes = require('./routes/doacoes');
const solicitacoesRoutes = require('./routes/solicitacoes');

// Home route
app.get('/', (req, res) => {
  if (res.locals.usuario) {
    return res.render('index', { title: 'FoodShare' });
  }
  res.redirect('/auth');
});

app.use('/auth', authRoutes);
app.use('/doacoes', doacoesRoutes);
app.use('/solicitacoes', solicitacoesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Erro no servidor', error: err.message });
});

module.exports = app;
