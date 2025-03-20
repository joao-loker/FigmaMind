/**
 * Serviço para interação com a API do Figma
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { safeFileName } = require('./utils/utils');

// Token de acesso ao Figma
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

/**
 * Extrai o ID do arquivo da URL do Figma
 * @param {string} url - URL do Figma
 * @returns {string|null} - ID do arquivo ou null se inválido
 */
function extractFileId(url) {
  if (!url) return null;
  
  // Tentar extrair o ID do arquivo da URL
  const match = url.match(/file\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Obtém dados de um arquivo do Figma
 * @param {string} fileUrl - URL do arquivo do Figma
 * @returns {Promise<Object>} - Dados do arquivo
 */
async function fetchFigmaFile(fileUrl) {
  const fileId = extractFileId(fileUrl);
  
  if (!fileId) {
    throw new Error('URL do Figma inválida');
  }
  
  if (!FIGMA_TOKEN) {
    throw new Error('Token do Figma não configurado');
  }
  
  console.log(`Buscando arquivo do Figma: ${fileId}`);
  
  try {
    const response = await axios.get(`https://api.figma.com/v1/files/${fileId}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar arquivo do Figma:', error.message);
    throw new Error(`Erro ao buscar arquivo do Figma: ${error.message}`);
  }
}

/**
 * Baixa imagens de componentes do Figma
 * @param {string} fileId - ID do arquivo Figma
 * @param {Array<string>} nodeIds - IDs dos nós para baixar
 * @returns {Promise<Object>} - URLs das imagens
 */
async function fetchFigmaImages(fileId, nodeIds) {
  if (!fileId || !nodeIds || nodeIds.length === 0) {
    throw new Error('FileId e nodeIds são necessários');
  }
  
  if (!FIGMA_TOKEN) {
    throw new Error('Token do Figma não configurado');
  }
  
  try {
    const response = await axios.get(
      `https://api.figma.com/v1/images/${fileId}?ids=${nodeIds.join(',')}&format=png`,
      {
        headers: {
          'X-Figma-Token': FIGMA_TOKEN
        }
      }
    );
    
    return response.data.images || {};
  } catch (error) {
    console.error('Erro ao buscar imagens do Figma:', error.message);
    throw new Error(`Erro ao buscar imagens do Figma: ${error.message}`);
  }
}

/**
 * Baixa um asset do Figma a partir da URL
 * @param {string} url - URL do asset
 * @param {string} fileName - Nome do arquivo para salvar
 * @param {string} outputDir - Diretório de saída
 * @returns {Promise<string>} - Caminho do arquivo salvo
 */
async function downloadAsset(url, fileName, outputDir = 'examples/output/assets') {
  try {
    // Garantir que o diretório existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const safeName = safeFileName(fileName);
    const filePath = path.join(outputDir, `${safeName}.png`);
    
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    });
    
    const writer = fs.createWriteStream(filePath);
    
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      
      writer.on('finish', () => resolve(filePath));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Erro ao baixar asset:', error.message);
    throw new Error(`Erro ao baixar asset: ${error.message}`);
  }
}

module.exports = {
  fetchFigmaFile,
  fetchFigmaImages,
  downloadAsset,
  extractFileId
}; 