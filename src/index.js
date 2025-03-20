/**
 * Ponto de entrada da aplicação
 * Inicia o servidor API
 */

const app = require('./app');
require('dotenv').config();

// Porta do servidor
const PORT = process.env.PORT || 3000;

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado na porta ${PORT}`);
  console.log(`API disponível em http://localhost:${PORT}/api`);
}); 