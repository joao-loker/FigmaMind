/**
 * Utilitários para processamento do Figma
 */

/**
 * Remove nós relacionados a variáveis do JSON do Figma
 * 
 * @param {object} json - JSON do Figma
 * @returns {object} - JSON limpo sem nós de variáveis
 */
function removeVariableNodes(json) {
  if (!json || typeof json !== 'object') {
    return json;
  }
  
  // Caso seja um array, processa cada item
  if (Array.isArray(json)) {
    return json
      .filter(item => !isVariableNode(item))
      .map(item => removeVariableNodes(item));
  }
  
  // Criar um novo objeto para a saída
  const result = {};
  
  // Processar cada chave
  for (const key in json) {
    if (Object.prototype.hasOwnProperty.call(json, key)) {
      // Pular nós que contenham "variable" no nome da chave
      if (key.toLowerCase().includes('variable')) {
        continue;
      }
      
      const value = json[key];
      
      // Se for um objeto ou array, processar recursivamente
      if (typeof value === 'object' && value !== null) {
        result[key] = removeVariableNodes(value);
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

/**
 * Verifica se um nó está relacionado a variáveis
 * 
 * @param {object} node - Nó a ser verificado
 * @returns {boolean} - true se for um nó de variável
 */
function isVariableNode(node) {
  if (!node || typeof node !== 'object') {
    return false;
  }
  
  // Verificar se o nome ou tipo contém "variable"
  if (node.name && typeof node.name === 'string' && node.name.toLowerCase().includes('variable')) {
    return true;
  }
  
  if (node.type && typeof node.type === 'string' && node.type.toLowerCase().includes('variable')) {
    return true;
  }
  
  return false;
}

/**
 * Funções utilitárias para processamento de dados do Figma
 */

/**
 * Cria um nome de arquivo seguro, removendo caracteres inválidos
 * @param {string} name - Nome do arquivo
 * @returns {string} Nome do arquivo seguro
 */
function safeFileName(name) {
  if (!name) return 'unnamed';
  
  // Remover caracteres inválidos
  return name
    .replace(/[/\\?%*:|"<>]/g, '_') // Remover caracteres inválidos em sistemas de arquivos
    .replace(/\s+/g, '_')           // Substituir espaços por underscores
    .toLowerCase();                 // Converter para minúsculas para evitar problemas em sistemas case-sensitive
}

/**
 * Simplifica um ID para torná-lo mais legível em logs e mensagens
 * @param {string} id - ID original
 * @returns {string} ID simplificado
 */
function simplifyId(id) {
  // Se não for uma string ou for muito curta, retornar o valor original
  if (typeof id !== 'string' || id.length < 8) {
    return id;
  }
  
  // Remover caracteres especiais e manter apenas uma parte do ID para maior legibilidade
  return id.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 8);
}

/**
 * Extrai texto de um componente ou seus filhos
 * @param {Object} component - Componente do Figma
 * @returns {string|null} Texto encontrado ou null
 */
function extractText(component) {
  // Verificar se o componente tem texto diretamente
  if (component.type === 'TEXT' && component.characters) {
    return component.characters;
  }
  
  // Buscar em filhos recursivamente
  if (component.children && Array.isArray(component.children)) {
    for (const child of component.children) {
      const text = extractText(child);
      if (text) {
        return text;
      }
    }
  }
  
  return null;
}

/**
 * Verifica se um componente tem uma propriedade específica
 * @param {Object} component - Componente do Figma
 * @param {string} propertyName - Nome da propriedade a verificar
 * @returns {boolean} Verdadeiro se a propriedade existir
 */
function hasProperty(component, propertyName) {
  if (!component.componentProperties) {
    return false;
  }
  
  // Verifica se existe alguma propriedade que contenha o nome especificado
  return Object.keys(component.componentProperties).some(key => {
    // Remover parte técnica do nome da propriedade (ex: "Color#123:456")
    const cleanKey = key.split('#')[0].toLowerCase();
    return cleanKey.includes(propertyName.toLowerCase());
  });
}

/**
 * Obtém o valor de uma propriedade específica
 * @param {Object} component - Componente do Figma
 * @param {string} propertyName - Nome da propriedade
 * @returns {string|null} Valor da propriedade ou null se não encontrada
 */
function getPropertyValue(component, propertyName) {
  if (!component.componentProperties) {
    return null;
  }
  
  // Encontrar a chave correspondente
  const matchingKey = Object.keys(component.componentProperties).find(key => {
    const cleanKey = key.split('#')[0].toLowerCase();
    return cleanKey.includes(propertyName.toLowerCase());
  });
  
  // Retornar o valor se encontrou a propriedade
  if (matchingKey && component.componentProperties[matchingKey].value) {
    return component.componentProperties[matchingKey].value;
  }
  
  return null;
}

/**
 * Extrai o ID de um componente a partir de seu nome completo
 * 
 * @param {string} fullName - Nome completo do componente (pode incluir variantes)
 * @returns {string} - ID do componente
 */
function extractComponentId(fullName) {
  if (!fullName) return '';
  
  // Componentes frequentemente têm formato "NomeBase/Variante"
  const parts = fullName.split('/');
  return parts[0].trim();
}

/**
 * Extrai a variante de um componente a partir de seu nome completo
 * 
 * @param {string} fullName - Nome completo do componente
 * @returns {string} - Variante do componente ou string vazia
 */
function extractComponentVariant(fullName) {
  if (!fullName) return '';
  
  const parts = fullName.split('/');
  return parts.length > 1 ? parts[1].trim() : '';
}

/**
 * Formata um objeto para uso em console.log
 * 
 * @param {object} obj - Objeto a ser formatado
 * @returns {string} - Representação formatada do objeto
 */
function formatObject(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Converte uma cor no formato RGBA do Figma para string CSS
 * @param {Object} color - Objeto de cor do Figma
 * @param {number} opacity - Opacidade (0-1)
 * @returns {string} String CSS para a cor
 */
function figmaColorToCss(color, opacity = 1) {
  if (!color) return 'rgba(0, 0, 0, 0)';
  
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  const a = (color.a !== undefined ? color.a : 1) * opacity;
  
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Extrai componentes recursivamente de um documento do Figma
 * 
 * @param {Object} node - Nó do documento Figma
 * @param {Array} result - Array de componentes encontrados
 * @returns {Array} - Array de componentes encontrados
 */
function extractComponents(node, result = []) {
  if (!node) return result;
  
  // Adicionar o nó atual se for um componente visível
  if (isValidComponent(node) && node.visible !== false) {
    // Verificar se é um componente de alto nível importante
    // Buscar componentes de maior importância (COMPONENT, INSTANCE, FRAME nomeado)
    const isHighLevelComponent = 
      node.type === 'COMPONENT' || 
      node.type === 'INSTANCE' || 
      (node.type === 'FRAME' && node.name && node.name.match(/button|header|card|input|icon|modal|menu|nav|footer/i));
    
    if (isHighLevelComponent) {
      result.push(node);
      
      // Para componentes de alto nível, podemos pular a análise dos filhos para evitar duplicações
      // mas ainda processar filhos para componentes específicos que podem ter sub-componentes importantes
      if (shouldProcessChildren(node)) {
        if (node.children && Array.isArray(node.children)) {
          for (const child of node.children) {
            extractComponents(child, result);
          }
        }
      }
    } else {
      // Para outros tipos, verificar se são de interesse individual
      if (node.type === 'TEXT' || node.type === 'VECTOR') {
        result.push(node);
      }
      
      // Continuar processando filhos para encontrar componentes importantes
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          extractComponents(child, result);
        }
      }
    }
  } else {
    // Mesmo que o nó atual não seja válido, processar filhos
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        extractComponents(child, result);
      }
    }
  }
  
  return result;
}

/**
 * Determina se devemos processar os filhos de um componente
 * 
 * @param {Object} node - Componente a verificar
 * @returns {boolean} - true se deve processar filhos
 */
function shouldProcessChildren(node) {
  if (!node || !node.name) return true;
  
  // Pular processamento de filhos para certos componentes para evitar duplicações
  if ((node.type === 'COMPONENT' || node.type === 'INSTANCE') && 
      node.name.match(/button|icon|input/i)) {
    return false;
  }
  
  // Para frames e grupos maiores, sempre processar filhos
  if (node.type === 'FRAME' || node.type === 'GROUP') {
    return true;
  }
  
  // Para instances, verificar se é um container que pode ter componentes importantes dentro
  if (node.type === 'INSTANCE' && node.name.match(/container|section|layout|grid/i)) {
    return true;
  }
  
  return false;
}

/**
 * Verifica se um nó é um componente válido para processamento
 * 
 * @param {Object} node - Nó a ser verificado
 * @returns {boolean} - true se for um componente válido
 */
function isValidComponent(node) {
  if (!node || typeof node !== 'object') {
    return false;
  }
  
  // Verificar se tem propriedades mínimas
  if (!node.id || !node.type) {
    return false;
  }
  
  // Ignorar nós ocultos
  if (node.visible === false) {
    return false;
  }
  
  // Verificar tipos válidos para componentes
  const validTypes = ['COMPONENT', 'INSTANCE', 'FRAME', 'GROUP', 'TEXT', 'VECTOR'];
  if (!validTypes.includes(node.type)) {
    return false;
  }
  
  // Verificar tamanho mínimo (ignorar componentes muito pequenos)
  if (node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    if (width < 1 || height < 1) {
      return false;
    }
  }
  
  return true;
}

module.exports = {
  removeVariableNodes,
  safeFileName,
  simplifyId,
  extractText,
  hasProperty,
  getPropertyValue,
  extractComponentId,
  extractComponentVariant,
  formatObject,
  figmaColorToCss,
  extractComponents,
  isValidComponent,
  shouldProcessChildren
}; 