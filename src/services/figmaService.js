/**
 * Serviço para interação com a API do Figma
 * Responsável por buscar dados e baixar assets
 */

const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { safeFileName } = require('../utils/utils');
require('dotenv').config();

// Constantes e configurações
const FIGMA_API_BASE_URL = 'https://api.figma.com/v1';
const ASSETS_DIR = path.resolve('examples/output/assets');

// Configuração
const DEBUG = process.env.MCP_DEBUG === 'true' || false;
const FIGMA_API_TIMEOUT = 30000; // 30 segundos de timeout

/**
 * Função para logs de depuração
 */
function logDebug(message) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[DEBUG:FigmaService][${timestamp}] ${message}\n`);
  }
}

/**
 * Função para logs de erro
 */
function logError(message) {
  const timestamp = new Date().toISOString();
  process.stderr.write(`[ERROR:FigmaService][${timestamp}] ${message}\n`);
}

/**
 * Valida o token do Figma
 * @param {string} token - Token de acesso do Figma
 * @returns {boolean} - Se o token é válido
 */
function validateFigmaToken(token) {
  if (!token) {
    logError('Token do Figma não fornecido');
    return false;
  }

  // Validação básica do formato do token (começa com "figd_")
  if (!token.startsWith('figd_')) {
    logError(`O token do Figma não segue o padrão esperado (figd_...). Token fornecido: ${token.substring(0, 8)}...`);
    return false;
  }

  return true;
}

/**
 * Extrai o ID do arquivo a partir da URL do Figma
 * @param {string} figmaUrl - URL do arquivo ou frame do Figma
 * @returns {string} - ID do arquivo
 */
function extractFileId(figmaUrl) {
  // Verificar se é uma URL ou um ID direto
  if (figmaUrl.includes('figma.com/file/')) {
    const match = figmaUrl.match(/figma\.com\/file\/([^/]+)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Se não for uma URL padrão, verificar outros formatos ou retornar o valor como ID direto
  return figmaUrl;
}

/**
 * Extrai a chave do arquivo a partir da URL do Figma
 * @param {string} figmaUrl - URL do Figma
 * @returns {string} Chave do arquivo
 */
function extractFileKey(figmaUrl) {
  try {
    // Tentar usar URL parser primeiro
    const url = new URL(figmaUrl);
    
    // Verificar se é uma URL do Figma
    if (!url.hostname.includes('figma.com')) {
      throw new Error('URL não é do Figma');
    }
    
    // Extrair usando path parts
    const pathParts = url.pathname.split('/');
    
    if (pathParts.length >= 3 && (pathParts[1] === 'file' || pathParts[1] === 'design' || pathParts[1] === 'proto')) {
      return pathParts[2];
    }
    
    // Se não conseguir com URL parser, tentar com regex
    let match;
    
    // Tentar formato design/file/proto
    match = figmaUrl.match(/figma\.com\/(design|file|proto)\/([a-zA-Z0-9]+)/);
    if (match && match[2]) {
      return match[2];
    }
    
    throw new Error('Formato de URL do Figma não reconhecido');
  } catch (error) {
    throw new Error(`Erro ao extrair file key: ${error.message}`);
  }
}

/**
 * Extrai o ID do nó a partir da URL do Figma
 * @param {string} figmaUrl - URL do Figma
 * @returns {string|null} ID do nó ou null se não encontrado
 */
function extractNodeId(figmaUrl) {
  try {
    const url = new URL(figmaUrl);
    const nodeId = url.searchParams.get('node-id');
    
    if (nodeId) return nodeId;
    
    // Verificar formato alternativo
    const match = figmaUrl.match(/node-id=([^&]+)/);
    return match ? match[1] : null;
  } catch (error) {
    // Tentar com regex se URL parser falhar
    const match = figmaUrl.match(/node-id=([^&]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Busca dados de um arquivo do Figma
 * @param {string} fileId - ID do arquivo do Figma
 * @param {string} token - Token de acesso do Figma
 * @returns {Promise<Object>} - Dados do arquivo
 */
async function getFigmaFile(fileId, token) {
  logDebug(`Buscando arquivo ${fileId} na API do Figma`);
  
  // Validar token
  if (!validateFigmaToken(token)) {
    throw new Error('Token do Figma inválido ou não fornecido');
  }
  
  try {
    // Configurar cliente Axios com timeout
    const axiosInstance = axios.create({
      headers: {
        'X-Figma-Token': token
      },
      timeout: FIGMA_API_TIMEOUT
    });
    
    // Realizar requisição
    logDebug(`Enviando requisição para https://api.figma.com/v1/files/${fileId}`);
    const response = await axiosInstance.get(`https://api.figma.com/v1/files/${fileId}`);
    
    // Verificar resposta
    if (response.status !== 200) {
      logError(`API do Figma retornou status ${response.status}: ${response.statusText}`);
      throw new Error(`Erro na API do Figma: ${response.status} ${response.statusText}`);
    }
    
    if (!response.data) {
      logError('API do Figma retornou resposta vazia');
      throw new Error('API do Figma retornou resposta vazia');
    }
    
    logDebug(`Resposta da API do Figma recebida com sucesso (${Object.keys(response.data).length} campos)`);
    return response.data;
  } catch (error) {
    // Tratamento detalhado de erros
    if (error.response) {
      // A requisição foi feita e o servidor respondeu com status fora do intervalo 2xx
      const status = error.response.status;
      
      if (status === 403) {
        logError(`Acesso negado (403): Token do Figma inválido ou sem permissão para acessar o arquivo ${fileId}`);
        throw new Error('Token do Figma inválido ou sem permissão para acessar o arquivo');
      } else if (status === 404) {
        logError(`Arquivo não encontrado (404): O arquivo ${fileId} não existe ou não está acessível`);
        throw new Error('Arquivo do Figma não encontrado');
      } else if (status === 429) {
        logError(`Limite de requisições excedido (429): Aguarde um momento e tente novamente`);
        throw new Error('Limite de requisições à API do Figma excedido. Tente novamente mais tarde');
      } else {
        logError(`Erro na API do Figma (${status}): ${error.response.data?.message || error.message}`);
        throw new Error(`Erro na API do Figma: ${error.response.data?.message || error.message}`);
      }
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      logError(`Sem resposta da API do Figma: ${error.message}`);
      throw new Error('Sem resposta da API do Figma. Verifique sua conexão com a internet');
    } else if (error.code === 'ECONNABORTED') {
      // Timeout na requisição
      logError(`Timeout na requisição à API do Figma após ${FIGMA_API_TIMEOUT/1000} segundos`);
      throw new Error(`Timeout na requisição à API do Figma. O servidor está demorando para responder`);
    } else {
      // Erro genérico
      logError(`Erro inesperado ao acessar API do Figma: ${error.message}`);
      throw new Error(`Erro ao acessar API do Figma: ${error.message}`);
    }
  }
}

/**
 * Obtém URLs de imagens para nós específicos
 * @param {string} fileKey - Chave do arquivo Figma
 * @param {string[]} nodeIds - IDs dos nós para obter imagens
 * @param {Object} options - Opções para exportação de imagens
 * @returns {Promise<Object>} - Objeto com URLs das imagens
 */
async function getFigmaImagesUrls(fileKey, nodeIds, token, options = { format: 'png', scale: 2 }) {
  try {
    if (!token) {
      throw new Error('Token do Figma não configurado');
    }
    
    const response = await axios.get(`${FIGMA_API_BASE_URL}/images/${fileKey}`, {
      headers: {
        'X-Figma-Token': token
      },
      params: {
        ids: Array.isArray(nodeIds) ? nodeIds.join(',') : nodeIds,
        format: options.format,
        scale: options.scale
      }
    });
    
    return response.data.images || {};
  } catch (error) {
    console.error(`Erro ao buscar imagens: ${error.message}`);
    return {};
  }
}

/**
 * Verifica se um nó é uma imagem ou ícone
 * @param {Object} node - Nó para verificar
 * @returns {boolean} - Verdadeiro se for uma imagem ou ícone
 */
function isImageNode(node) {
  // Verificar tipos de nós que são imagens
  if (!node || !node.type) return false;
  
  return (
    // Imagem normal
    node.type === 'IMAGE' || 
    // Vetor que pode ser um ícone
    node.type === 'VECTOR' ||
    // Nó com preenchimento de imagem
    (node.fills && node.fills.some(fill => fill.type === 'IMAGE')) ||
    // Ícones frequentemente são nomeados como tal
    (node.name && (
      node.name.toLowerCase().includes('icon') || 
      node.name.toLowerCase().includes('ícone') ||
      node.name.toLowerCase().includes('icone')
    ))
  );
}

/**
 * Determina se um nó deve ser exportado como SVG 
 * @param {Object} node - Nó para verificar
 * @returns {boolean} - Verdadeiro se for adequado para SVG
 */
function shouldExportAsSvg(node) {
  if (!node) return false;
  
  // Vetores são melhores como SVG
  if (node.type === 'VECTOR') return true;
  
  // Ícones e elementos simples
  if (node.name && (
    node.name.toLowerCase().includes('icon') || 
    node.name.toLowerCase().includes('ícone') ||
    node.name.toLowerCase().includes('logo')
  )) {
    return true;
  }
  
  // Verificar se é um frame simples com poucos elementos
  if (node.type === 'FRAME' || node.type === 'GROUP') {
    if (node.children && node.children.length <= 5) {
      return true;
    }
  }
  
  return false;
}

/**
 * Encontra todos os nós que são imagens ou ícones em um componente
 * @param {Object} node - Nó para procurar imagens
 * @returns {Array} - Lista de nós de imagem encontrados
 */
function findImageNodes(node) {
  const imageNodes = [];
  
  // Função recursiva para percorrer a árvore de nós
  function traverse(currentNode) {
    // Verificar se o nó atual é uma imagem
    if (isImageNode(currentNode)) {
      imageNodes.push(currentNode);
    }
    
    // Percorrer filhos recursivamente
    if (currentNode.children && Array.isArray(currentNode.children)) {
      currentNode.children.forEach(child => traverse(child));
    }
  }
  
  traverse(node);
  return imageNodes;
}

/**
 * Baixa uma imagem a partir de uma URL
 * @param {string} url - URL da imagem
 * @param {string} outputPath - Caminho para salvar a imagem
 * @returns {Promise<string>} Caminho da imagem salva
 */
async function downloadFile(url, outputPath) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer'
    });
    
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, response.data);
    
    return outputPath;
  } catch (error) {
    console.error(`Erro ao baixar arquivo de ${url}:`, error.message);
    throw error;
  }
}

/**
 * Busca e baixa uma imagem de um nó do Figma
 * @param {string} nodeId - ID do nó
 * @param {string} fileKey - Chave do arquivo
 * @param {string} [format='png'] - Formato da imagem (png, jpg, svg)
 * @param {number} [scale=2] - Escala da imagem
 * @returns {Promise<string|null>} Caminho da imagem salva ou null se falhar
 */
async function downloadImage(nodeId, fileKey, format = 'png', scale = 2) {
  const token = process.env.FIGMA_TOKEN;
  
  if (!token) {
    console.warn('Token do Figma não encontrado em FIGMA_TOKEN');
    return null;
  }
  
  try {
    // Garantir que o diretório existe
    await fs.ensureDir(ASSETS_DIR);
    
    // Criar nome de arquivo seguro
    const fileName = safeFileName(`${nodeId.replace(':', '-')}.${format}`);
    const outputPath = path.join(ASSETS_DIR, fileName);
    
    // Verificar se já existe
    if (await fs.pathExists(outputPath)) {
      return outputPath;
    }
    
    // Buscar URL da imagem na API do Figma
    const imageUrls = await getFigmaImagesUrls(
      fileKey, 
      [nodeId], 
      token,
      { format, scale }
    );
    
    // Verificar se a imagem foi encontrada
    if (imageUrls[nodeId]) {
      // Baixar a imagem
      await downloadFile(imageUrls[nodeId], outputPath);
      return outputPath;
    }
    
    return null;
  } catch (error) {
    console.error(`Erro ao baixar imagem para o nó ${nodeId}:`, error.message);
    return null;
  }
}

/**
 * Extrai e salva assets (imagens e ícones) de um componente
 * @param {string} fileKey - Chave do arquivo Figma
 * @param {Object} component - Componente com nodes para extrair imagens
 * @returns {Promise<Object>} - Mapeamento de nodeIds para caminhos locais de arquivos
 */
async function extractComponentAssets(fileKey, component) {
  try {
    // Identificar todos os nodes que são imagens ou ícones
    const imageNodes = findImageNodes(component);
    
    if (imageNodes.length === 0) {
      return {};
    }
    
    // Baixar cada imagem no formato adequado
    const assetPaths = {};
    
    for (const node of imageNodes) {
      // Determinar o melhor formato para este nó
      const format = shouldExportAsSvg(node) ? 'svg' : 'png';
      // Determinar a escala adequada - SVG não precisa de escala, PNG precisa de alta qualidade
      const scale = format === 'svg' ? 1 : 3;
      
      const filepath = await downloadImage(node.id, fileKey, format, scale);
      if (filepath) {
        // Adicionar informações extras úteis para a interface
        assetPaths[node.id] = {
          path: filepath,
          format: format,
          name: node.name || '',
          type: node.type || 'UNKNOWN'
        };
      }
    }
    
    return assetPaths;
  } catch (error) {
    console.error(`Erro ao extrair assets: ${error.message}`);
    return {};
  }
}

/**
 * Busca os dados do Figma a partir de uma URL
 * @param {string} figmaUrl - URL do arquivo ou frame do Figma
 * @param {string} token - Token de acesso do Figma (opcional, usa env se não fornecido)
 * @returns {Promise<Object>} - Dados processados
 */
async function fetchFigmaFromUrl(figmaUrl, token = null) {
  // Usar token fornecido ou da variável de ambiente
  const figmaToken = token || process.env.FIGMA_TOKEN;
  
  if (!figmaToken) {
    throw new Error('Token do Figma não encontrado. Defina FIGMA_TOKEN no ambiente ou forneça como parâmetro');
  }
  
  // Extrair ID do arquivo da URL
  const fileId = extractFileId(figmaUrl);
  
  if (!fileId) {
    throw new Error(`URL do Figma inválida: ${figmaUrl}`);
  }
  
  // Buscar dados do arquivo
  const data = await getFigmaFile(fileId, figmaToken);
  
  return {
    data,
    fileKey: fileId,
    figmaUrl
  };
}

module.exports = {
  extractFileKey,
  extractNodeId,
  getFigmaFile,
  getFigmaImagesUrls,
  downloadImage,
  downloadFile,
  findImageNodes,
  isImageNode,
  extractComponentAssets,
  fetchFigmaFromUrl,
  validateFigmaToken,
  extractFileId
}; 