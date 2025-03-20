/**
 * Transformador específico para componentes do tipo botão
 */

const { 
  extractColorInfo, 
  extractTextStyle, 
  extractDimensions, 
  extractText 
} = require('../common');

/**
 * Transforma um componente Figma do tipo botão para um formato padronizado
 * 
 * @param {Object} component - Componente do Figma
 * @param {Object} options - Opções adicionais para a transformação
 * @returns {Object} - Componente transformado
 */
function transformButton(component, options = {}) {
  if (!component) {
    throw new Error('Componente não fornecido para transformação');
  }

  // Extrair dados básicos
  const id = component.id || `button-${Date.now()}`;
  const name = component.name || 'Unnamed Button';
  
  // Extrair dimensões e posição
  const dimensions = extractDimensions(component);
  
  // Extrair texto do botão
  const buttonText = extractText(component);
  
  // Extrair informações de cor
  const colorInfo = extractColorInfo(component);
  
  // Determinar tipo/variante do botão baseado no nome ou estilo
  const variant = determineButtonVariant(component);
  
  // Extrair informações de estilo adicional
  const style = {
    ...extractTextStyle(component),
    borderRadius: component.cornerRadius || 0,
    padding: extractPadding(component)
  };

  // Verificar se o botão possui ícone
  const hasIcon = component.children && component.children.some(child => 
    child.name?.toLowerCase().includes('icon')
  );
  
  // Criar a estrutura padronizada do botão
  return {
    id,
    type: 'button',
    name,
    variant,
    text: buttonText,
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
      borderRadius: style.borderRadius,
      padding: style.padding,
      ...style
    },
    hasIcon,
    // Adicionar opções que foram passadas para o transformador
    ...options
  };
}

/**
 * Determina a variante do botão com base em seu nome e características
 * 
 * @param {Object} component - Componente do botão
 * @returns {string} - Variante do botão (primary, secondary, tertiary, etc)
 */
function determineButtonVariant(component) {
  if (!component) return 'primary';
  
  const name = component.name?.toLowerCase() || '';
  
  // Verificar variante explícita no nome
  if (name.includes('primary')) return 'primary';
  if (name.includes('secondary')) return 'secondary';
  if (name.includes('tertiary')) return 'tertiary';
  if (name.includes('ghost')) return 'ghost';
  if (name.includes('danger')) return 'danger';
  if (name.includes('warning')) return 'warning';
  if (name.includes('success')) return 'success';
  
  // Verificar características do componente para determinar a variante
  const fills = component.fills || [];
  const hasFill = fills.some(fill => fill.visible !== false);
  
  const strokes = component.strokes || [];
  const hasStroke = strokes.some(stroke => stroke.visible !== false);
  
  if (hasFill && !hasStroke) return 'primary';
  if (!hasFill && hasStroke) return 'secondary';
  if (!hasFill && !hasStroke) return 'tertiary';
  
  // Padrão
  return 'primary';
}

/**
 * Extrai informações de padding do componente
 * 
 * @param {Object} component - Componente do botão
 * @returns {Object} - Objeto com informações de padding
 */
function extractPadding(component) {
  if (!component || !component.paddingLeft) {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }
  
  return {
    top: component.paddingTop || 0,
    right: component.paddingRight || 0,
    bottom: component.paddingBottom || 0,
    left: component.paddingLeft || 0
  };
}

module.exports = transformButton; 