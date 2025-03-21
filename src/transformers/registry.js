/**
 * Sistema de Registro de Transformadores
 * 
 * Este módulo fornece um mecanismo para registrar e recuperar transformadores
 * para diferentes tipos de componentes sem modificar o código central.
 */

// Verificar se devemos suprimir logs
const SUPPRESS_LOGS = process.env.MCP_SUPPRESS_LOGS === 'true';
const USE_STDIO = process.env.MCP_USE_STDIO === 'true';
const DEBUG = process.env.MCP_DEBUG === 'true';

// Função de log condicional
const log = (message) => {
  if (!SUPPRESS_LOGS && !USE_STDIO) {
    // Modo normal: usar console.log apenas se não estiver em STDIO e não estiver suprimindo logs
    console.log(message);
  } else if (DEBUG) {
    // Modo debug: usar stderr para não interferir com o protocolo STDIO
    process.stderr.write(`[DEBUG] ${message}\n`);
  }
};

// Registro central de transformadores por tipo de componente
const transformerRegistry = new Map();

/**
 * Registra um transformador para um tipo específico de componente
 * 
 * @param {string} componentType - Tipo do componente (ex: 'button', 'input', 'header')
 * @param {Function} transformer - Função transformadora para o componente
 */
function registerTransformer(componentType, transformer) {
  if (typeof componentType !== 'string' || !componentType) {
    throw new Error('O tipo de componente deve ser uma string não vazia');
  }
  
  if (typeof transformer !== 'function') {
    throw new Error('O transformador deve ser uma função');
  }
  
  transformerRegistry.set(componentType.toLowerCase(), transformer);
  log(`Transformador registrado para: ${componentType}`);
}

/**
 * Recupera o transformador para um tipo específico de componente
 * 
 * @param {string} componentType - Tipo do componente
 * @returns {Function} - Função transformadora para o componente ou transformador padrão
 */
function getTransformer(componentType) {
  if (!componentType) return null;
  
  const type = componentType.toLowerCase();
  return transformerRegistry.get(type) || null;
}

/**
 * Verifica se um transformador está registrado para um tipo específico
 * 
 * @param {string} componentType - Tipo do componente
 * @returns {boolean} - Verdadeiro se estiver registrado
 */
function hasTransformer(componentType) {
  if (!componentType) return false;
  return transformerRegistry.has(componentType.toLowerCase());
}

/**
 * Retorna todos os tipos de componentes registrados
 * 
 * @returns {Array<string>} - Lista de tipos registrados
 */
function getRegisteredComponentTypes() {
  return Array.from(transformerRegistry.keys());
}

module.exports = {
  registerTransformer,
  getTransformer,
  hasTransformer,
  getRegisteredComponentTypes
}; 