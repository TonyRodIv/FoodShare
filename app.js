const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Middleware global: disponibiliza res.locals.user para todas as views EJS
app.use((req, res, next) => {
  const token = req.cookies?.token;
  if (token) {
    try {
      res.locals.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});

// Routes
const authRoutes = require('./routes/auth');
const doacoesRoutes = require('./routes/doacoes');
const solicitacoesRoutes = require('./routes/solicitacoes');

// Home route
app.get('/', (req, res) => {
  res.render('index', { title: 'FoodShare' });
});

app.use('/auth', authRoutes);
app.use('/doacoes', doacoesRoutes);
app.use('/solicitacoes', solicitacoesRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { message: 'Erro no servidor', error: err });
});

module.exports = app;
