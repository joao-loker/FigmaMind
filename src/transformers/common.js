/**
 * Funções comuns para transformadores de componentes
 */

/**
 * Extrai informações de cor quando disponíveis
 * 
 * @param {Object} component - Componente do Figma
 * @returns {Object|null} Informações de cor ou null se não encontradas
 */
function extractColorInfo(component) {
  if (!component) return null;
  
  // Tentar extrair de fills
  if (component.fills && Array.isArray(component.fills) && component.fills.length > 0) {
    const fill = component.fills.find(f => f.visible !== false);
    if (fill) {
      if (fill.type === 'SOLID') {
        return {
          type: 'solid',
          color: {
            r: fill.color.r,
            g: fill.color.g,
            b: fill.color.b,
            a: fill.opacity || 1
          }
        };
      } else if (fill.type === 'GRADIENT_LINEAR') {
        return {
          type: 'gradient',
          gradientType: 'linear',
          stops: fill.gradientStops
        };
      }
    }
  }
  
  // Tentar extrair de strokes
  if (component.strokes && Array.isArray(component.strokes) && component.strokes.length > 0) {
    const stroke = component.strokes.find(s => s.visible !== false);
    if (stroke && stroke.type === 'SOLID') {
      return {
        type: 'border',
        color: {
          r: stroke.color.r,
          g: stroke.color.g,
          b: stroke.color.b,
          a: stroke.opacity || 1
        },
        width: component.strokeWeight || 1
      };
    }
  }
  
  return null;
}

/**
 * Extrai informações de fonte e estilo de texto
 * 
 * @param {Object} component - Componente do Figma
 * @returns {Object|null} Informações de texto ou null se não for texto
 */
function extractTextStyle(component) {
  if (!component) return null;
  
  // Verificar se é um componente de texto
  if (component.type !== 'TEXT' && !(component.children && component.children.some(c => c.type === 'TEXT'))) {
    return null;
  }
  
  // Tentar extrair estilo do próprio componente
  if (component.style) {
    return {
      fontFamily: component.style.fontFamily || 'default',
      fontSize: component.style.fontSize || 16,
      fontWeight: component.style.fontWeight || 'regular',
      textAlign: component.style.textAlignHorizontal || 'left',
      lineHeight: component.style.lineHeightPx || 'normal'
    };
  }
  
  // Tentar extrair de filhos de texto
  if (component.children) {
    const textChild = component.children.find(c => c.type === 'TEXT');
    if (textChild && textChild.style) {
      return {
        fontFamily: textChild.style.fontFamily || 'default',
        fontSize: textChild.style.fontSize || 16,
        fontWeight: textChild.style.fontWeight || 'regular',
        textAlign: textChild.style.textAlignHorizontal || 'left',
        lineHeight: textChild.style.lineHeightPx || 'normal'
      };
    }
  }
  
  return null;
}

/**
 * Extrai informações de dimensão e posição
 * 
 * @param {Object} component - Componente do Figma
 * @returns {Object} - Informações de dimensão
 */
function extractDimensions(component) {
  if (!component) {
    return { width: 0, height: 0, x: 0, y: 0 };
  }
  
  // Tentar obter de absoluteBoundingBox (preferido)
  if (component.absoluteBoundingBox) {
    return {
      width: component.absoluteBoundingBox.width || 0,
      height: component.absoluteBoundingBox.height || 0,
      x: component.absoluteBoundingBox.x || 0,
      y: component.absoluteBoundingBox.y || 0
    };
  }
  
  // Fallback para size e position individuais
  return {
    width: component.size?.width || 0,
    height: component.size?.height || 0,
    x: component.x || 0,
    y: component.y || 0
  };
}

/**
 * Extrai texto de um componente ou seus filhos
 * 
 * @param {Object} component - Componente do Figma
 * @returns {string|null} - Texto extraído ou null se não houver
 */
function extractText(component) {
  if (!component) return null;
  
  // Verificar se o próprio componente tem texto
  if (component.type === 'TEXT' && component.characters) {
    return component.characters;
  }
  
  // Verificar filhos para texto
  if (component.children && Array.isArray(component.children)) {
    const textComponents = component.children.filter(child => 
      child.type === 'TEXT' && child.characters && child.visible !== false
    );
    
    if (textComponents.length > 0) {
      return textComponents.map(child => child.characters).join(' ');
    }
    
    // Procurar recursivamente em filhos mais profundos
    let text = '';
    for (const child of component.children) {
      const childText = extractText(child);
      if (childText) {
        text += childText + ' ';
      }
    }
    
    return text.trim() || null;
  }
  
  return null;
}

/**
 * Identifica o tipo de componente com base no nome e características
 * 
 * @param {Object} component - Componente do Figma
 * @returns {string} - Tipo do componente
 */
function identifyComponentType(component) {
  if (!component || !component.name) return 'unknown';
  
  const name = component.name.toLowerCase();
  
  // Verificar por padrões de nomenclatura comuns
  if (name.includes('button') || name.includes('btn')) return 'button';
  if (name.includes('header') || name.includes('status-bar')) return 'header';
  if (name.includes('input') || name.includes('field') || name.includes('textfield')) return 'input';
  if (name.includes('icon') || name.includes('ícone')) return 'icon';
  if (name.includes('card')) return 'card';
  if (name.includes('menu')) return 'menu';
  if (name.includes('tab')) return 'tab';
  if (name.includes('modal') || name.includes('dialog')) return 'modal';
  if (name.includes('alert')) return 'alert';
  if (name.includes('toast')) return 'toast';
  
  // Verificar tipo do componente
  if (component.type === 'TEXT') return 'text';
  
  // Verificações adicionais baseadas em características
  if (component.type === 'FRAME' || component.type === 'COMPONENT') {
    // Verificar se tem uma proporção típica de botão 
    const dims = extractDimensions(component);
    const ratio = dims.width / dims.height;
    
    if (ratio > 2 && dims.height < 60) return 'button'; // Provavelmente um botão
    if (ratio > 8) return 'divider'; // Provavelmente um divisor
    
    // Verificar se tem texto dentro e é pequeno (possível label)
    const hasText = extractText(component) !== null;
    if (hasText && dims.height < 40 && dims.width < 200) return 'label';
  }
  
  // Padrão para quando não consegue identificar
  return 'unknown';
}

module.exports = {
  extractColorInfo,
  extractTextStyle,
  extractDimensions,
  extractText,
  identifyComponentType
}; 