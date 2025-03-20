/**
 * Transformador específico para componentes do tipo input
 */

const { 
  extractColorInfo, 
  extractTextStyle, 
  extractDimensions, 
  extractText 
} = require('../common');

/**
 * Transforma um componente Figma do tipo input para um formato padronizado
 * 
 * @param {Object} component - Componente do Figma
 * @param {Object} options - Opções adicionais para a transformação
 * @returns {Object} - Componente transformado
 */
function transformInput(component, options = {}) {
  if (!component) {
    throw new Error('Componente não fornecido para transformação');
  }

  // Extrair dados básicos
  const id = component.id || `input-${Date.now()}`;
  const name = component.name || 'Unnamed Input';
  
  // Extrair dimensões e posição
  const dimensions = extractDimensions(component);
  
  // Extrair placeholder ou valor do input
  const placeholder = extractInputPlaceholder(component);
  
  // Extrair label do input
  const label = extractInputLabel(component);
  
  // Extrair informações de cor
  const colorInfo = extractColorInfo(component);
  
  // Extrair propriedades do input
  const { inputType, variant, state } = determineInputProperties(component);
  
  // Criar a estrutura padronizada do input
  return {
    id,
    type: 'input',
    inputType, // text, email, password, etc.
    name,
    label,
    placeholder,
    variant,
    state,
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
      borderColor: extractBorderColor(component),
      borderWidth: component.strokeWeight || 0,
      // Extrair padding interno
      padding: {
        top: component.paddingTop || 0,
        right: component.paddingRight || 0,
        bottom: component.paddingBottom || 0,
        left: component.paddingLeft || 0
      },
      // Incluir propriedades de estilo de texto
      ...extractTextStyle(component)
    },
    // Verificar se tem ícone
    hasIcon: component.children && component.children.some(child => 
      child.name?.toLowerCase().includes('icon')
    ),
    // Extrair mensagem de erro se estiver em estado de erro
    errorMessage: state === 'error' ? extractErrorMessage(component) : null,
    // Adicionar opções que foram passadas para o transformador
    ...options
  };
}

/**
 * Extrai o placeholder do input
 * 
 * @param {Object} component - Componente do input
 * @returns {string} - Texto do placeholder
 */
function extractInputPlaceholder(component) {
  if (!component) return '';
  
  // Procurar por um texto explícito de placeholder nos filhos
  if (component.children && Array.isArray(component.children)) {
    const placeholderChild = component.children.find(child => 
      child.name?.toLowerCase().includes('placeholder') || 
      child.type === 'TEXT' && child.characters?.trim() !== ''
    );
    
    if (placeholderChild) {
      return extractText(placeholderChild);
    }
  }
  
  // Se não encontrar, tentar extrair de um style guide ou propriedade
  if (component.componentProperties && component.componentProperties.placeholder) {
    return component.componentProperties.placeholder.value || '';
  }
  
  return '';
}

/**
 * Extrai o label do input
 * 
 * @param {Object} component - Componente do input
 * @returns {string} - Texto do label
 */
function extractInputLabel(component) {
  if (!component) return '';
  
  // Procurar por um label nos filhos ou nós vizinhos
  if (component.children && Array.isArray(component.children)) {
    const labelChild = component.children.find(child => 
      child.name?.toLowerCase().includes('label') || 
      (child.type === 'TEXT' && 
       child.name?.toLowerCase() !== 'placeholder' && 
       child.y < component.y)
    );
    
    if (labelChild) {
      return extractText(labelChild);
    }
  }
  
  // Se não encontrar, tentar extrair de um style guide ou propriedade
  if (component.componentProperties && component.componentProperties.label) {
    return component.componentProperties.label.value || '';
  }
  
  return '';
}

/**
 * Extrai a mensagem de erro do input, se houver
 * 
 * @param {Object} component - Componente do input
 * @returns {string} - Mensagem de erro ou string vazia
 */
function extractErrorMessage(component) {
  if (!component) return '';
  
  // Procurar por uma mensagem de erro nos filhos
  if (component.children && Array.isArray(component.children)) {
    const errorChild = component.children.find(child => 
      child.name?.toLowerCase().includes('error') || 
      (child.type === 'TEXT' && 
       child.y > component.y + component.height)
    );
    
    if (errorChild) {
      return extractText(errorChild);
    }
  }
  
  // Se não encontrar, tentar extrair de um style guide ou propriedade
  if (component.componentProperties && component.componentProperties.errorMessage) {
    return component.componentProperties.errorMessage.value || '';
  }
  
  return '';
}

/**
 * Determina as propriedades principais do input
 * 
 * @param {Object} component - Componente do input
 * @returns {Object} - Propriedades do input
 */
function determineInputProperties(component) {
  if (!component) {
    return { 
      inputType: 'text', 
      variant: 'default', 
      state: 'default' 
    };
  }
  
  const name = component.name?.toLowerCase() || '';
  
  // Determinar tipo de input
  let inputType = 'text';
  
  if (name.includes('email')) inputType = 'email';
  else if (name.includes('password')) inputType = 'password';
  else if (name.includes('number')) inputType = 'number';
  else if (name.includes('tel') || name.includes('phone')) inputType = 'tel';
  else if (name.includes('search')) inputType = 'search';
  else if (name.includes('url')) inputType = 'url';
  else if (name.includes('date')) inputType = 'date';
  
  // Determinar variante do input
  let variant = 'default';
  
  if (name.includes('outlined')) variant = 'outlined';
  else if (name.includes('filled')) variant = 'filled';
  else if (name.includes('underlined')) variant = 'underlined';
  
  // Determinar estado do input
  let state = 'default';
  
  if (name.includes('focus') || name.includes('active')) state = 'focus';
  else if (name.includes('error')) state = 'error';
  else if (name.includes('disabled')) state = 'disabled';
  
  return { inputType, variant, state };
}

/**
 * Extrai a cor da borda do input
 * 
 * @param {Object} component - Componente do input
 * @returns {Object|null} - Cor da borda em formato RGBA ou null
 */
function extractBorderColor(component) {
  if (!component || !component.strokes || !Array.isArray(component.strokes)) {
    return null;
  }
  
  const stroke = component.strokes.find(s => s.visible !== false);
  
  if (stroke && stroke.type === 'SOLID') {
    return {
      r: stroke.color.r,
      g: stroke.color.g,
      b: stroke.color.b,
      a: stroke.opacity || 1
    };
  }
  
  return null;
}

module.exports = transformInput; 