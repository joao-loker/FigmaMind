/**
 * Transformador específico para componentes do tipo texto
 */

const { 
  extractColorInfo, 
  extractTextStyle, 
  extractDimensions, 
  extractText 
} = require('../common');

/**
 * Transforma um componente Figma do tipo texto para um formato padronizado
 * 
 * @param {Object} component - Componente do Figma
 * @param {Object} options - Opções adicionais para a transformação
 * @returns {Object} - Componente transformado
 */
function transformText(component, options = {}) {
  if (!component) {
    throw new Error('Componente não fornecido para transformação');
  }

  // Extrair dados básicos
  const id = component.id || `text-${Date.now()}`;
  const name = component.name || 'Unnamed Text';
  
  // Extrair dimensões e posição
  const dimensions = extractDimensions(component);
  
  // Extrair conteúdo de texto
  const content = extractText(component);
  
  // Extrair informações de cor
  const colorInfo = extractColorInfo(component);
  
  // Extrair estilo de texto
  const textStyle = extractTextStyle(component) || {};
  
  // Determinar tipo de texto com base no nome ou características
  const textType = determineTextType(component);
  
  // Criar a estrutura padronizada do texto
  return {
    id,
    type: 'text',
    subtype: textType,
    name,
    content,
    size: {
      width: dimensions.width,
      height: dimensions.height
    },
    position: {
      x: dimensions.x,
      y: dimensions.y
    },
    style: {
      // Converter a cor para formato mais amigável
      color: colorInfo?.type === 'solid' ? 
        rgbaToHex(colorInfo.color.r, colorInfo.color.g, colorInfo.color.b, colorInfo.color.a) : 
        null,
      // Incluir propriedades de estilo de texto
      ...textStyle
    },
    // Adicionar opções que foram passadas para o transformador
    ...options
  };
}

/**
 * Determina o tipo/categoria do texto com base em seu nome e características
 * 
 * @param {Object} component - Componente de texto
 * @returns {string} - Tipo do texto (heading, paragraph, label, etc)
 */
function determineTextType(component) {
  if (!component) return 'paragraph';
  
  const name = component.name?.toLowerCase() || '';
  const style = component.style || {};
  
  // Verificar tipo explícito no nome
  if (name.includes('heading') || name.includes('title') || name.includes('h1') || 
      name.includes('h2') || name.includes('h3') || name.includes('h4')) {
    return 'heading';
  }
  
  if (name.includes('paragraph') || name.includes('body')) {
    return 'paragraph';
  }
  
  if (name.includes('label') || name.includes('caption')) {
    return 'label';
  }
  
  // Verificar características do componente para determinar o tipo
  if (style.fontSize) {
    const fontSize = parseFloat(style.fontSize);
    
    if (fontSize >= 20) return 'heading';
    if (fontSize <= 12) return 'label';
  }
  
  if (style.fontWeight) {
    const fontWeight = parseInt(style.fontWeight);
    
    if (fontWeight >= 600) return 'heading';
  }
  
  // Padrão
  return 'paragraph';
}

/**
 * Converte cores RGBA para formato hexadecimal
 * 
 * @param {number} r - Valor de vermelho (0-1)
 * @param {number} g - Valor de verde (0-1)
 * @param {number} b - Valor de azul (0-1)
 * @param {number} a - Valor de alfa (0-1)
 * @returns {string} - Cor em formato hexadecimal (#RRGGBB ou #RRGGBBAA)
 */
function rgbaToHex(r, g, b, a = 1) {
  if (r === undefined || g === undefined || b === undefined) {
    return null;
  }
  
  // Converter valores de 0-1 para 0-255
  const rInt = Math.round(r * 255);
  const gInt = Math.round(g * 255);
  const bInt = Math.round(b * 255);
  const aInt = Math.round(a * 255);
  
  // Verificar se precisamos incluir o canal alfa
  if (a < 1) {
    return `#${rInt.toString(16).padStart(2, '0')}${gInt.toString(16).padStart(2, '0')}${bInt.toString(16).padStart(2, '0')}${aInt.toString(16).padStart(2, '0')}`;
  }
  
  return `#${rInt.toString(16).padStart(2, '0')}${gInt.toString(16).padStart(2, '0')}${bInt.toString(16).padStart(2, '0')}`;
}

module.exports = transformText; 