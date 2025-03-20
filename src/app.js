/**
 * Aplicação principal do servidor
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const figmaService = require('./figmaService');
const { processData } = require('./processor');
const { registerComponentTransformer, getRegisteredComponentTypes } = require('./transformers');
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
    name: 'FigmaMind API',
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

// Endpoint para buscar dados do Figma
app.post('/api/fetch-figma', async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ error: 'URL do arquivo Figma é necessária' });
    }
    
    console.log(`Buscando dados do Figma para: ${fileUrl}`);
    
    const figmaData = await figmaService.fetchFigmaFile(fileUrl);
    
    if (!figmaData) {
      return res.status(500).json({ error: 'Falha ao obter dados do Figma' });
    }
    
    return res.json({ success: true, data: figmaData });
  } catch (error) {
    console.error('Erro ao buscar dados do Figma:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

// Endpoint para processar dados do Figma
app.post('/api/process-figma', async (req, res) => {
  try {
    const { figmaData, options } = req.body;
    
    if (!figmaData) {
      return res.status(400).json({ error: 'Dados do Figma são necessários' });
    }
    
    console.log('Processando dados do Figma recebidos');
    
    const processedData = processData(figmaData, options || {});
    
    return res.json({ success: true, data: processedData });
  } catch (error) {
    console.error('Erro ao processar dados do Figma:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

// Endpoint para buscar e processar dados do Figma em uma única requisição
app.post('/api/fetch-and-process', async (req, res) => {
  try {
    const { fileUrl, options } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ error: 'URL do arquivo Figma é necessária' });
    }
    
    console.log(`Buscando e processando dados do Figma para: ${fileUrl}`);
    
    const figmaData = await figmaService.fetchFigmaFile(fileUrl);
    
    if (!figmaData) {
      return res.status(500).json({ error: 'Falha ao obter dados do Figma' });
    }
    
    const processedData = processData(figmaData, options || {});
    
    return res.json({ success: true, data: processedData });
  } catch (error) {
    console.error('Erro ao buscar e processar dados do Figma:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

// Endpoint para registrar um transformador personalizado
app.post('/api/register-transformer', (req, res) => {
  try {
    const { type, transformer } = req.body;
    
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ error: 'Tipo de componente é necessário' });
    }
    
    if (!transformer || typeof transformer !== 'string') {
      return res.status(400).json({ error: 'Código do transformador é necessário como string' });
    }
    
    // Converter a string de código para função usando Function constructor
    // Isso permite que o cliente envie o código do transformador como string
    try {
      const transformerFunction = new Function('component', 'options', transformer);
      
      // Registrar o transformador
      registerComponentTransformer(type, transformerFunction);
      
      console.log(`Transformador personalizado registrado para o tipo: ${type}`);
      
      return res.json({ 
        success: true, 
        message: `Transformador registrado para o tipo: ${type}`,
        registeredTypes: getRegisteredComponentTypes()
      });
    } catch (evalError) {
      console.error('Erro ao avaliar código do transformador:', evalError);
      return res.status(400).json({ error: `Código de transformador inválido: ${evalError.message}` });
    }
  } catch (error) {
    console.error('Erro ao registrar transformador:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

// Endpoint para obter tipos de componentes registrados
app.get('/api/component-types', (req, res) => {
  try {
    const registeredTypes = getRegisteredComponentTypes();
    return res.json({ success: true, types: registeredTypes });
  } catch (error) {
    console.error('Erro ao obter tipos de componentes:', error);
    return res.status(500).json({ error: error.message || 'Erro interno do servidor' });
  }
});

module.exports = app; 