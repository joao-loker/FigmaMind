/**
 * Transformador padrão para componentes que não têm um transformador específico
 */

const { 
  extractColorInfo, 
  extractTextStyle, 
  extractDimensions, 
  extractText 
} = require('../common');

/**
 * Transforma um componente Figma genérico para um formato padronizado
 * 
 * @param {Object} component - Componente do Figma
 * @param {Object} options - Opções adicionais para a transformação
 * @returns {Object} - Componente transformado
 */
function transformDefault(component, options = {}) {
  if (!component) {
    throw new Error('Componente não fornecido para transformação');
  }

  // Extrair dados básicos
  const id = component.id || `component-${Date.now()}`;
  const name = component.name || 'Unnamed Component';
  
  // Extrair tipo provável
  const type = component.type || 'UNKNOWN';
  
  // Extrair dimensões e posição
  const dimensions = extractDimensions(component);
  
  // Extrair conteúdo de texto, se houver
  const content = extractText(component);
  
  // Extrair informações de cor
  const colorInfo = extractColorInfo(component);
  
  // Extrair estilo, se aplicável
  const textStyle = extractTextStyle(component) || {};
  
  // Extrair informações de crianças, se houver
  const children = extractChildrenInfo(component);
  
  // Criar a estrutura padronizada para componente genérico
  return {
    id,
    type: 'generic',
    figmaType: type, // Tipo original do Figma
    name,
    content: content || null,
    size: {
      width: dimensions.width,
      height: dimensions.height
    },
    position: {
      x: dimensions.x,
      y: dimensions.y
    },
    style: {
      backgroundColor: colorInfo?.type === 'solid' ? colorInfo.color : null,
      borderRadius: component.cornerRadius || 0,
      opacity: component.opacity || 1,
      ...extractBorderInfo(component),
      ...textStyle
    },
    children: children.length > 0 ? children : null,
    // Informações adicionais que podem ser úteis para debug
    originalData: options.includeOriginal ? {
      type: component.type,
      name: component.name,
      id: component.id
    } : null,
    // Adicionar opções que foram passadas para o transformador
    ...options
  };
}

/**
 * Extrai informações básicas dos componentes filhos
 * 
 * @param {Object} component - Componente do Figma
 * @returns {Array} - Lista de componentes filhos simplificados
 */
function extractChildrenInfo(component) {
  if (!component || !component.children || !Array.isArray(component.children)) {
    return [];
  }
  
  return component.children.map(child => {
    const dimensions = extractDimensions(child);
    return {
      id: child.id,
      name: child.name,
      type: child.type,
      content: extractText(child) || null,
      size: {
        width: dimensions.width,
        height: dimensions.height
      },
      position: {
        x: dimensions.x,
        y: dimensions.y
      }
    };
  });
}

/**
 * Extrai informações de borda do componente
 * 
 * @param {Object} component - Componente do Figma
 * @returns {Object} - Objeto com informações de borda
 */
function extractBorderInfo(component) {
  if (!component) return {};
  
  const borderInfo = {};
  
  // Extrair informações de stroke (borda)
  if (component.strokes && Array.isArray(component.strokes) && component.strokes.length > 0) {
    const stroke = component.strokes.find(s => s.visible !== false);
    
    if (stroke && stroke.type === 'SOLID') {
      borderInfo.borderColor = {
        r: stroke.color.r,
        g: stroke.color.g,
        b: stroke.color.b,
        a: stroke.opacity || 1
      };
      
      borderInfo.borderWidth = component.strokeWeight || 1;
      borderInfo.borderStyle = 'solid'; // Padrão do Figma
    }
  }
  
  // Extrair informações específicas de borda (se disponíveis)
  if (component.strokeAlign) {
    borderInfo.borderAlign = component.strokeAlign.toLowerCase();
  }
  
  if (component.strokeCap) {
    borderInfo.borderCap = component.strokeCap.toLowerCase();
  }
  
  if (component.strokeJoin) {
    borderInfo.borderJoin = component.strokeJoin.toLowerCase();
  }
  
  return borderInfo;
}

module.exports = transformDefault; 