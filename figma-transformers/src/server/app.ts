import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { getFigmaDataFromUrl } from '../services/figmaService';
import { processFigmaJson } from '../core/processor';

// Carregar variáveis de ambiente
dotenv.config();

// Criar aplicação Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, '../../public')));

// Rota raiz
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'MCP - Figma Component Transformer API',
    version: '1.0.0',
    endpoints: {
      '/transform': 'POST - Transforma componentes do Figma'
    }
  });
});

// Rota de transformação
app.post('/transform', function(req: Request, res: Response) {
  (async () => {
    try {
      const { figmaUrl } = req.body;
      
      if (!figmaUrl) {
        return res.status(400).json({
          error: 'URL do Figma é obrigatória'
        });
      }
      
      // Buscar dados do Figma
      const figmaData = await getFigmaDataFromUrl(figmaUrl);
      
      // Processar os dados
      const processedData = processFigmaJson(figmaData);
      
      // Retornar o resultado
      return res.json({
        original: figmaData,
        processed: processedData
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({
          error: error.message
        });
      }
      return res.status(500).json({
        error: 'Erro desconhecido'
      });
    }
  })();
});

// Rota para buscar apenas os dados brutos
app.post('/fetch', function(req: Request, res: Response) {
  (async () => {
    try {
      const { figmaUrl } = req.body;
      
      if (!figmaUrl) {
        return res.status(400).json({
          error: 'URL do Figma é obrigatória'
        });
      }
      
      // Buscar dados do Figma
      const figmaData = await getFigmaDataFromUrl(figmaUrl);
      
      // Retornar o resultado
      return res.json(figmaData);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({
          error: error.message
        });
      }
      return res.status(500).json({
        error: 'Erro desconhecido'
      });
    }
  })();
});

export default app; 