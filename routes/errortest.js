const express = require('express');
const { HTTP_VARIANTS, CONTEXT_VARIANTS } = require('../utils/errorPageContent');

const router = express.Router();

router.get('/', (req, res) => {
  const rawCode = Number(req.query.code);
  const statusCode = HTTP_VARIANTS[rawCode] ? rawCode : 500;
  const contextKey = req.query.context;
  const context = contextKey && CONTEXT_VARIANTS[contextKey] ? contextKey : undefined;

  res.render('errortest', {
    statusCode,
    context,
    httpCodes: Object.keys(HTTP_VARIANTS).map(Number).sort((a, b) => a - b),
    contextKeys: Object.keys(CONTEXT_VARIANTS),
  });
});

module.exports = router;
