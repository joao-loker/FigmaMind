/**
 * MCP Server para FigmaMind
 * Este arquivo implementa o Model Context Protocol para o FigmaMind
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const figmaService = require('./src/services/figmaService');
const { processData } = require('./src/processor/processor');
require('dotenv').config();

// Constantes
const ASSETS_DIR = path.resolve('examples/output/assets');
const OUTPUT_DIR = path.resolve('examples/output');

// Criar diretórios necessários
fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(ASSETS_DIR);

// Inicializar app
const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// MCP Info Endpoint
app.get('/', (req, res) => {
  try {
    const mcpConfig = fs.readJsonSync(path.resolve('mcp.json'));
    return res.json({
      name: mcpConfig.name,
      version: mcpConfig.version,
      description: mcpConfig.description,
      protocol_version: mcpConfig.protocol_version,
      endpoints: Object.keys(mcpConfig.endpoints).map(key => {
        const endpoint = mcpConfig.endpoints[key];
        return {
          name: key,
          path: endpoint.path,
          method: endpoint.method,
          description: endpoint.description
        };
      })
    });
  } catch (error) {
    console.error('Erro ao obter informações MCP:', error);
    return res.status(500).json({
      error: 'Erro ao obter informações do servidor MCP'
    });
  }
});

// MCP Health Check Endpoint
app.get('/health', (req, res) => {
  // Verificar se o token do Figma está configurado
  const token = process.env.FIGMA_TOKEN;
  
  if (!token) {
    return res.status(503).json({
      status: 'error',
      message: 'FIGMA_TOKEN não configurado'
    });
  }
  
  return res.json({
    status: 'ok',
    message: 'FigmaMind MCP operacional'
  });
});

// MCP Transform Endpoint
app.post('/transform', async (req, res) => {
  try {
    const { figmaUrl } = req.body;
    
    if (!figmaUrl) {
      return res.status(400).json({
        error: 'Missing figmaUrl parameter'
      });
    }
    
    // Verificar token do Figma
    if (!process.env.FIGMA_TOKEN) {
      return res.status(401).json({
        error: 'FIGMA_TOKEN não configurado. Configure o token do Figma nas variáveis de ambiente.'
      });
    }
    
    // Buscar dados do Figma
    console.log(`Iniciando processamento de ${figmaUrl}`);
    const figmaResult = await figmaService.fetchFigmaFromUrl(figmaUrl);
    
    // Processar dados
    const processed = await processData(figmaResult.data, figmaResult.fileKey);
    
    // Salvar dados brutos e processados
    await fs.writeJson(
      path.join(OUTPUT_DIR, 'figma-raw.json'), 
      figmaResult.data, 
      { spaces: 2 }
    );
    
    await fs.writeJson(
      path.join(OUTPUT_DIR, 'figma-processed.json'), 
      processed, 
      { spaces: 2 }
    );
    
    // Responder com os dados processados
    res.json({
      success: true,
      message: `Processados ${processed.componentsCount} componentes`,
      source: figmaUrl,
      data: processed
    });
  } catch (error) {
    console.error('Erro ao processar transformação:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// MCP Assets Endpoint
app.get('/assets/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(ASSETS_DIR, filename);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Asset not found'
      });
    }
    
    // Determinar tipo de conteúdo com base na extensão
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    
    // Enviar o arquivo
    res.setHeader('Content-Type', contentType);
    res.sendFile(filePath);
  } catch (error) {
    console.error('Erro ao acessar asset:', error);
    res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`FigmaMind MCP iniciado na porta ${PORT}`);
  console.log(`Servidor disponível em http://localhost:${PORT}`);
  console.log(`Endpoints MCP: / (info), /health, /transform, /assets/:filename`);
}); 