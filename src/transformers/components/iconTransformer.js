/**
 * Transformador específico para componentes do tipo ícone
 */

const { 
  extractColorInfo, 
  extractDimensions
} = require('../common');

/**
 * Transforma um componente Figma do tipo ícone para um formato padronizado
 * 
 * @param {Object} component - Componente do Figma
 * @param {Object} options - Opções adicionais para a transformação
 * @returns {Object} - Componente transformado
 */
function transformIcon(component, options = {}) {
  if (!component) {
    throw new Error('Componente não fornecido para transformação');
  }

  // Extrair dados básicos
  const id = component.id || `icon-${Date.now()}`;
  const name = component.name || 'Unnamed Icon';
  
  // Extrair dimensões e posição
  const dimensions = extractDimensions(component);
  
  // Extrair informações de cor
  const colorInfo = extractColorInfo(component);
  
  // Extrair nome do ícone
  const iconName = extractIconName(component);
  
  // Criar a estrutura padronizada do ícone
  return {
    id,
    type: 'icon',
    name,
    iconName, // Nome normalizado do ícone
    size: {
      width: dimensions.width,
      height: dimensions.height
    },
    position: {
      x: dimensions.x,
      y: dimensions.y
    },
    style: {
      color: colorInfo?.type === 'solid' ? colorInfo.color : null,
      // Verificar se é um ícone com preenchimento ou contorno
      variant: determineIconVariant(component)
    },
    // Adicionar URL da imagem, se disponível na instância
    imageUrl: component.imageUrl || options.imageUrl || null,
    // Adicionar opções que foram passadas para o transformador
    ...options
  };
}

/**
 * Extrai um nome normalizado para o ícone a partir do nome do componente
 * 
 * @param {Object} component - Componente do ícone
 * @returns {string} - Nome normalizado do ícone
 */
function extractIconName(component) {
  if (!component || !component.name) {
    return 'icon-default';
  }
  
  const name = component.name.toLowerCase();
  
  // Remover prefixos comuns
  let cleanName = name
    .replace(/^icon[\s-_]*/i, '')
    .replace(/^ic[\s-_]*/i, '')
    .replace(/^ícone[\s-_]*/i, '');
    
  // Converter para kebab-case para normalização
  cleanName = cleanName
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
    
  // Se o nome ficou vazio após a limpeza, usar um padrão
  if (!cleanName) {
    return 'icon-default';
  }
  
  // Garantir que tenha o prefixo "icon-"
  if (!cleanName.startsWith('icon-')) {
    return `icon-${cleanName}`;
  }
  
  return cleanName;
}

/**
 * Determina se o ícone é do tipo preenchido (filled) ou contorno (outline)
 * 
 * @param {Object} component - Componente do ícone
 * @returns {string} - Variante do ícone ('filled' ou 'outline')
 */
function determineIconVariant(component) {
  if (!component) return 'filled';
  
  const name = component.name?.toLowerCase() || '';
  
  // Verificar se há indicação explícita no nome
  if (name.includes('outline') || name.includes('contorno') || name.includes('line')) {
    return 'outline';
  }
  
  if (name.includes('filled') || name.includes('preenchido') || name.includes('solid')) {
    return 'filled';
  }
  
  // Verificar características do componente
  const fills = component.fills || [];
  const hasFill = fills.some(fill => fill.visible !== false);
  
  const strokes = component.strokes || [];
  const hasStroke = strokes.some(stroke => stroke.visible !== false);
  
  if (hasFill && !hasStroke) return 'filled';
  if (!hasFill && hasStroke) return 'outline';
  
  // Padrão
  return 'filled';
}

module.exports = transformIcon; 