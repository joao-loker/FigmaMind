/**
 * Transformadores de componentes
 * 
 * Este módulo contém funções que transformam componentes do Figma
 * em estruturas mais úteis para o desenvolvimento.
 */

const { extractText, hasProperty, getPropertyValue } = require('../utils/utils');

/**
 * Identifica o tipo de componente com base no nome
 * @param {Object} component - Componente do Figma
 * @returns {string} Tipo do componente
 */
function identifyComponentType(component) {
  if (!component || !component.name) return 'unknown';
  
  const name = component.name.toLowerCase();
  
  if (name.includes('button')) return 'button';
  if (name.includes('header') || name.includes('status-bar')) return 'header';
  if (name.includes('input')) return 'input';
  if (name.includes('onboarding/default')) return 'onboardingInput';
  if (name.includes('keyboard')) return 'keyboard';
  if (name.includes('icon') || name.includes('ícone')) return 'icon';
  if (name.includes('text') || component.type === 'TEXT') return 'text';
  
  return 'other';
}

/**
 * Extrai informações de cor quando disponíveis
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
 * Extrai informações sobre effects (sombras, blur)
 * @param {Object} component - Componente do Figma
 * @returns {Array|null} Array de efeitos ou null se não houver
 */
function extractEffects(component) {
  if (!component || !component.effects || !Array.isArray(component.effects) || component.effects.length === 0) {
    return null;
  }
  
  const effects = [];
  
  component.effects.forEach(effect => {
    if (effect.visible === false) return;
    
    if (effect.type === 'DROP_SHADOW') {
      effects.push({
        type: 'shadow',
        color: effect.color,
        offset: {
          x: effect.offset.x,
          y: effect.offset.y
        },
        radius: effect.radius,
        spread: effect.spread || 0
      });
    } else if (effect.type === 'INNER_SHADOW') {
      effects.push({
        type: 'innerShadow',
        color: effect.color,
        offset: {
          x: effect.offset.x,
          y: effect.offset.y
        },
        radius: effect.radius,
        spread: effect.spread || 0
      });
    } else if (effect.type === 'LAYER_BLUR') {
      effects.push({
        type: 'blur',
        radius: effect.radius
      });
    }
  });
  
  return effects.length > 0 ? effects : null;
}

/**
 * Extrai informações sobre bordas arredondadas
 * @param {Object} component - Componente do Figma
 * @returns {Object|null} Informações de borda arredondada ou null
 */
function extractCornerRadius(component) {
  if (!component) return null;
  
  // Verificar se tem cornerRadius
  if (component.cornerRadius !== undefined) {
    return {
      radius: component.cornerRadius
    };
  }
  
  // Verificar se tem cornerRadius individualizado
  if (component.topLeftRadius !== undefined || 
      component.topRightRadius !== undefined || 
      component.bottomLeftRadius !== undefined || 
      component.bottomRightRadius !== undefined) {
    return {
      topLeft: component.topLeftRadius || 0,
      topRight: component.topRightRadius || 0,
      bottomLeft: component.bottomLeftRadius || 0,
      bottomRight: component.bottomRightRadius || 0
    };
  }
  
  return null;
}

/**
 * Aplica o transformador apropriado com base no tipo do componente
 * @param {Object} component - Componente do Figma
 * @param {string} type - Tipo do componente
 * @param {string} fileKey - Chave do arquivo Figma
 * @returns {Object} Propriedades transformadas
 */
function applyTransformers(component, type, fileKey) {
  // Obter propriedades de estilo comuns
  const styles = {
    colors: extractColorInfo(component),
    textStyle: extractTextStyle(component),
    effects: extractEffects(component),
    cornerRadius: extractCornerRadius(component)
  };
  
  // Remover propriedades nulas
  Object.keys(styles).forEach(key => {
    if (styles[key] === null) {
      delete styles[key];
    }
  });
  
  // Seleciona o transformador com base no tipo
  let specificProps;
  switch (type) {
    case 'button':
      specificProps = buttonTransformer(component);
      break;
    case 'header':
      specificProps = headerTransformer(component);
      break;
    case 'input':
      specificProps = inputTransformer(component);
      break;
    case 'onboardingInput':
      specificProps = onboardInputTransformer(component);
      break;
    case 'keyboard':
      specificProps = keyboardTransformer(component);
      break;
    case 'text':
      specificProps = textTransformer(component);
      break;
    case 'icon':
      specificProps = iconTransformer(component);
      break;
    default:
      specificProps = defaultTransformer(component);
      break;
  }
  
  // Mesclar propriedades específicas com estilos
  return { ...specificProps, style: Object.keys(styles).length > 0 ? styles : undefined };
}

/**
 * Transformador para botões
 * @param {Object} component - Componente do Figma
 * @returns {Object} Propriedades transformadas
 */
function buttonTransformer(component) {
  // Extrair texto do botão, estados e variantes
  const props = {
    text: extractText(component),
    style: 'primary', // default style
    states: {}
  };
  
  // Extrair propriedades de componente (variantes)
  if (component.componentProperties) {
    // Verificar estilo do botão
    const style = getPropertyValue(component, 'style');
    if (style) {
      props.style = style.toLowerCase();
    }
    
    // Verificar estado disabled
    if (hasProperty(component, 'disabled') && getPropertyValue(component, 'disabled') === 'True') {
      props.states.disabled = true;
    }
    
    // Verificar outros estados
    const state = getPropertyValue(component, 'state');
    if (state) {
      props.states[state.toLowerCase()] = true;
    }
    
    // Verificar se tem ícone
    if (hasProperty(component, 'hasIcon') && getPropertyValue(component, 'hasIcon') === 'True') {
      props.hasIcon = true;
    }
  }
  
  return props;
}

/**
 * Transformador para headers
 * @param {Object} component - Componente do Figma
 * @returns {Object} Propriedades transformadas
 */
function headerTransformer(component) {
  const props = {
    title: extractText(component) || component.name,
    hasBackButton: false,
    hasCloseButton: false
  };
  
  // Verificar se tem botão de voltar ou fechar nos filhos
  if (component.children) {
    component.children.forEach(child => {
      const childName = (child.name || '').toLowerCase();
      
      if (childName.includes('back') || childName.includes('voltar')) {
        props.hasBackButton = true;
      }
      
      if (childName.includes('close') || childName.includes('fechar')) {
        props.hasCloseButton = true;
      }
      
      // Procurar título se não encontrado antes
      if (!props.title && childName.includes('title')) {
        props.title = extractText(child) || child.name;
      }
    });
  }
  
  return props;
}

/**
 * Transformador para inputs padrão
 * @param {Object} component - Componente do Figma
 * @returns {Object} Propriedades transformadas
 */
function inputTransformer(component) {
  const props = {
    placeholder: extractText(component) || 'Digite aqui',
    type: 'text',
    states: {}
  };
  
  // Extrair propriedades de componente (variantes)
  if (component.componentProperties) {
    // Verificar tipo do input
    const inputType = getPropertyValue(component, 'type');
    if (inputType) {
      props.type = inputType.toLowerCase() === 'password' ? 'password' : 'text';
    }
    
    // Verificar estados
    if (hasProperty(component, 'disabled') && getPropertyValue(component, 'disabled') === 'True') {
      props.states.disabled = true;
    }
    
    if (hasProperty(component, 'focus') && getPropertyValue(component, 'focus') === 'True') {
      props.states.focused = true;
    }
    
    if (hasProperty(component, 'error') && getPropertyValue(component, 'error') === 'True') {
      props.states.error = true;
    }
  }
  
  return props;
}

/**
 * Transformador para inputs de onboarding
 * @param {Object} component - Componente do Figma
 * @returns {Object} Propriedades transformadas
 */
function onboardInputTransformer(component) {
  const props = {
    placeholder: 'Digite aqui',
    label: '',
    type: 'text',
    validation: null,
    states: {}
  };
  
  // Procurar label e placeholder nos filhos
  if (component.children) {
    component.children.forEach(child => {
      const childName = (child.name || '').toLowerCase();
      
      if (childName.includes('label') || childName.includes('title')) {
        props.label = extractText(child) || child.name;
      }
      
      if (childName.includes('placeholder') || childName.includes('input')) {
        props.placeholder = extractText(child) || 'Digite aqui';
      }
    });
  }
  
  // Extrair propriedades de componente (variantes)
  if (component.componentProperties) {
    // Verificar tipo do input
    const inputType = getPropertyValue(component, 'type');
    if (inputType) {
      const type = inputType.toLowerCase();
      if (type === 'email') {
        props.type = 'email';
        props.validation = 'email';
      } else if (type === 'password') {
        props.type = 'password';
      } else if (type === 'number') {
        props.type = 'number';
      } else if (type === 'phone') {
        props.type = 'tel';
        props.validation = 'phone';
      }
    }
    
    // Verificar estados
    const state = getPropertyValue(component, 'state');
    if (state) {
      const stateValue = state.toLowerCase();
      if (stateValue === 'error') {
        props.states.error = true;
      } else if (stateValue === 'disabled') {
        props.states.disabled = true;
      } else if (stateValue === 'focus') {
        props.states.focused = true;
      }
    }
  }
  
  return props;
}

/**
 * Transformador para teclados
 * @param {Object} component - Componente do Figma
 * @returns {Object} Propriedades transformadas
 */
function keyboardTransformer(component) {
  const props = {
    keyboardType: component.name.toLowerCase().includes('numeric') ? 'numeric' : 'alphabetic',
    hasSpecialKeys: false
  };
  
  // Verificar teclas especiais
  if (component.children) {
    component.children.forEach(child => {
      const childName = (child.name || '').toLowerCase();
      
      if (childName.includes('special') || 
          childName.includes('emoji') || 
          childName.includes('symbol')) {
        props.hasSpecialKeys = true;
      }
    });
  }
  
  return props;
}

/**
 * Transformador para textos
 * @param {Object} component - Componente do Figma
 * @returns {Object} Propriedades transformadas
 */
function textTransformer(component) {
  const props = {
    text: extractText(component),
    truncate: false
  };
  
  // Verificar propriedades específicas de texto
  if (component.style) {
    if (component.style.textTruncation === 'ENDING') {
      props.truncate = true;
    }
  }
  
  return props;
}

/**
 * Transformador para ícones
 * @param {Object} component - Componente do Figma
 * @returns {Object} Propriedades transformadas
 */
function iconTransformer(component) {
  return {
    name: component.name.replace(/icon|ícone/gi, '').trim(),
    isVector: component.type === 'VECTOR'
  };
}

/**
 * Transformador padrão para componentes não específicos
 * @param {Object} component - Componente do Figma
 * @returns {Object} Propriedades transformadas
 */
function defaultTransformer(component) {
  const props = {};
  
  // Extrair texto, se houver
  const text = extractText(component);
  if (text) {
    props.text = text;
  }
  
  return props;
}

module.exports = {
  identifyComponentType,
  applyTransformers
}; 