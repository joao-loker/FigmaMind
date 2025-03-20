/**
 * API REST para Figma Component Transformer
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const figmaService = require('./services/figmaService');
const { processData } = require('./processor/processor');
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

// Rota raiz da API
app.get('/api', (req, res) => {
  res.json({
    name: 'MCP - Figma Component Transformer API',
    version: '1.0.0',
    endpoints: {
      '/api': 'GET - Informações da API',
      '/api/transform': 'POST - Transforma componentes do Figma',
      '/api/assets/:filename': 'GET - Acessa assets extraídos'
    }
  });
});

// Rota para transformar componentes do Figma
app.post('/api/transform', async (req, res) => {
  try {
    const { figmaUrl } = req.body;
    
    if (!figmaUrl) {
      return res.status(400).json({
        error: 'Missing figmaUrl parameter'
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

// Rota para acessar assets extraídos
app.get('/api/assets/:filename', (req, res) => {
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

module.exports = app; 