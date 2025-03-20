/**
 * Índice centralizado dos transformadores
 * 
 * Este módulo registra todos os transformadores disponíveis e fornece
 * uma interface unificada para aplicá-los.
 */

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

const { 
  registerTransformer, 
  getTransformer,
  hasTransformer,
  getRegisteredComponentTypes 
} = require('./registry');

const { identifyComponentType } = require('./common');

// Importar transformadores específicos
const transformButton = require('./components/buttonTransformer');
const transformText = require('./components/textTransformer');
const transformIcon = require('./components/iconTransformer');
const transformInput = require('./components/inputTransformer');
const transformDefault = require('./components/defaultTransformer');

// Registrar transformadores
registerTransformer('button', transformButton);
registerTransformer('text', transformText);
registerTransformer('icon', transformIcon);
registerTransformer('input', transformInput);
registerTransformer('default', transformDefault);

/**
 * Aplica o transformador apropriado a um componente
 * 
 * @param {Object} component - Componente para transformar
 * @param {Object} options - Opções adicionais para a transformação
 * @returns {Object} - Componente transformado
 */
function applyTransformer(component, options = {}) {
  if (!component) {
    throw new Error('Componente não fornecido para transformação');
  }
  
  // Identificar o tipo de componente
  const componentType = options.type || identifyComponentType(component);
  
  // Obter o transformador para este tipo
  let transformer = getTransformer(componentType);
  
  // Se não houver um transformador específico, usar o padrão
  if (!transformer) {
    logger.log(`Nenhum transformador encontrado para o tipo '${componentType}', usando o padrão`);
    transformer = getTransformer('default');
  }
  
  // Aplica o transformador com o contexto e opções fornecidas
  try {
    return transformer(component, {
      ...options,
      detectedType: componentType
    });
  } catch (error) {
    logger.error(`Erro ao transformar componente '${component.name || 'sem nome'}' do tipo '${componentType}':`, error);
    
    // Em caso de erro, tentar usar o transformador padrão como fallback
    try {
      return transformDefault(component, {
        ...options,
        detectedType: componentType,
        transformationError: error.message
      });
    } catch (fallbackError) {
      logger.error('Erro ao aplicar transformador de fallback:', fallbackError);
      
      // Retornar um objeto mínimo como último recurso
      return {
        id: component.id || `error-${Date.now()}`,
        type: 'error',
        name: component.name || 'Error Component',
        error: error.message,
        originalType: componentType
      };
    }
  }
}

/**
 * Verifica se um componente é processável
 * 
 * @param {Object} component - Componente para verificar
 * @returns {boolean} - true se o componente for processável
 */
function isProcessableComponent(component) {
  // Verificar se o componente é válido
  if (!component || typeof component !== 'object') {
    return false;
  }
  
  // Verificar se tem propriedades mínimas
  if (!component.id || !component.type) {
    return false;
  }
  
  // Ignorar componentes invisíveis
  if (component.visible === false) {
    return false;
  }
  
  return true;
}

/**
 * Registra um novo transformador
 * 
 * @param {string} type - Tipo do componente 
 * @param {Function} transformer - Função transformadora
 */
function registerComponentTransformer(type, transformer) {
  registerTransformer(type, transformer);
}

module.exports = {
  applyTransformer,
  isProcessableComponent,
  registerComponentTransformer,
  getRegisteredComponentTypes,
  identifyComponentType,
  hasTransformer
}; 