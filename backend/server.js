const app = require('./app');
const http = require('http');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido. Encerrando servidor gracefully...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});
