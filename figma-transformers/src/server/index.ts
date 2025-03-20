import app from './app';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Porta do servidor
const PORT = process.env.PORT || 3000;

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
}); 