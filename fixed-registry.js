/**
 * Sistema de Registro de Transformadores Corrigido
 * 
 * Esta versão modificada não utiliza console.log, garantindo compatibilidade com MCP STDIO
 */

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
  // Não usar console.log para não interferir com o protocolo STDIO
  process.stderr.write(`[INFO] Transformador registrado para: ${componentType}\n`);
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