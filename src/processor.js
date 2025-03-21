const { extractComponents } = require('./utils/utils');
const { 
  applyTransformer, 
  isProcessableComponent 
} = require('./transformers');

// Verificar se devemos suprimir logs
const SUPPRESS_LOGS = process.env.MCP_SUPPRESS_LOGS === 'true';

// Funções de log condicionais
const logger = {
  log: (message) => {
    if (!SUPPRESS_LOGS) {
      console.log(message);
    }
  },
  error: (message, error) => {
    if (!SUPPRESS_LOGS) {
      console.error(message, error);
    } else {
      // Sempre registrar erros, mas usar stderr para não interferir no protocolo
      process.stderr.write(`ERROR: ${message} ${error ? error.toString() : ''}\n`);
    }
  }
};

/**
 * Processa os dados do Figma e extrai os componentes
 * 
 * @param {Object} figmaData - Dados brutos do Figma
 * @param {Object} options - Opções de processamento
 * @returns {Object} - Dados processados
 */
function processData(figmaData, options = {}) {
  if (!figmaData || !figmaData.document) {
    throw new Error('Dados do Figma inválidos');
  }
  
  logger.log('Processando dados do Figma...');
  
  // Extrair componentes do documento
  const components = extractComponents(figmaData.document);
  
  logger.log(`Encontrados ${components.length} componentes`);
  
  // Processar cada componente
  const processedComponents = components
    .filter(component => isProcessableComponent(component))
    .map(component => {
      try {
        return applyTransformer(component, {
          includeOriginal: options.includeOriginalData || false
        });
      } catch (error) {
        logger.error(`Erro ao processar componente ${component.id || 'desconhecido'}:`, error);
        return {
          id: component.id || `error-${Date.now()}`,
          type: 'error',
          name: component.name || 'Error Component',
          error: error.message
        };
      }
    });
  
  // Organizar por tipos
  const organizedComponents = {};
  
  processedComponents.forEach(component => {
    const type = component.type || 'unknown';
    
    if (!organizedComponents[type]) {
      organizedComponents[type] = [];
    }
    
    organizedComponents[type].push(component);
  });
  
  // Montar objeto de resultado
  const result = {
    meta: {
      version: '1.0.0',
      timestamp: Date.now(),
      fileKey: figmaData.fileKey || null,
      fileName: figmaData.name || null,
      totalComponents: processedComponents.length,
      componentTypeCount: Object.keys(organizedComponents).reduce((acc, type) => {
        acc[type] = organizedComponents[type].length;
        return acc;
      }, {})
    },
    components: organizedComponents
  };
  
  return result;
}

module.exports = {
  processData
}; 