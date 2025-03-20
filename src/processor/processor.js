/**
 * Processor de dados do Figma
 * Responsável por processar os dados brutos do Figma e extrair componentes
 */

const { removeVariableNodes, formatObject } = require('../utils/utils');
const transformers = require('../transformers');
const figmaService = require('../services/figmaService');
const path = require('path');
const fs = require('fs-extra');
const { applyTransformers, identifyComponentType } = require('../transformers');

// Diretórios de saída
const OUTPUT_DIR = path.resolve('examples/output');
const ASSETS_DIR = path.resolve('examples/output/assets');

/**
 * Processa dados do Figma e extrai componentes
 * @param {Object} figmaData - Dados brutos do Figma
 * @param {string} fileKey - Chave do arquivo Figma
 * @returns {Object} Dados processados
 */
async function processData(figmaData, fileKey) {
  try {
    // Garantir que os diretórios existam
    await fs.ensureDir(OUTPUT_DIR);
    await fs.ensureDir(ASSETS_DIR);

    // Extrair metadados básicos
    const metadata = {
      source: figmaData.name,
      lastModified: figmaData.lastModified,
      version: figmaData.version,
      componentsCount: 0
    };

    // Processa a estrutura da resposta do Figma
    let documentToProcess = null;
    
    // Verificar se temos uma estrutura de nós específicos
    if (figmaData.nodes) {
      // Encontrar o primeiro nó válido
      const nodeId = Object.keys(figmaData.nodes)[0];
      if (nodeId && figmaData.nodes[nodeId] && figmaData.nodes[nodeId].document) {
        console.log(`Processando nó específico: ${nodeId}`);
        documentToProcess = figmaData.nodes[nodeId].document;
      }
    } else if (figmaData.document) {
      // Ou usar o documento completo
      documentToProcess = figmaData.document;
    }

    if (!documentToProcess) {
      console.warn('Nenhum documento válido encontrado na resposta do Figma');
      return {
        ...metadata,
        screen: {
          name: figmaData.name,
          size: { width: 390, height: 844 }, // Tamanho padrão para iPhone
          elements: []
        }
      };
    }

    // Extrair componentes do documento
    const extractedComponents = extractComponents(documentToProcess);
    
    // Filtrar componentes duplicados ou aninhados
    const uniqueComponents = filterDuplicateComponents(extractedComponents);
    
    metadata.componentsCount = uniqueComponents.length;
    console.log(`Extraídos ${uniqueComponents.length} componentes únicos do documento (de ${extractedComponents.length} totais)`);

    // Processar cada componente extraído
    const processedComponents = await Promise.all(uniqueComponents.map(component => 
      processComponent(component, fileKey)
    ));

    // Obter dimensões da tela
    const screenBounds = documentToProcess.absoluteBoundingBox || { width: 390, height: 844, x: 0, y: 0 };
    
    // Normalizar coordenadas em relação ao canto superior esquerdo da tela
    const normalizedComponents = normalizeComponentPositions(processedComponents, screenBounds);
    
    // Ordenar componentes do topo para o fundo da tela (importante para renderização)
    const orderedComponents = normalizedComponents.sort((a, b) => a.position.y - b.position.y);

    // Criar nova estrutura de tela otimizada para IA
    const result = {
      ...metadata,
      screen: {
        name: documentToProcess.name || figmaData.name,
        size: {
          width: Math.round(screenBounds.width) || 390,
          height: Math.round(screenBounds.height) || 844
        },
        // Interface organizada por camadas e seções
        layout: {
          // Componentes agrupados por seções na ordem vertical
          sections: groupComponentsIntoSections(orderedComponents),
          // Todos os componentes em ordem do topo para o fim (para fácil reconstrução)
          orderedElements: orderedComponents
        },
        // Mantém a categorização por tipo para facilitar acesso específico
        elements: categorizeElementsByType(normalizedComponents)
      }
    };

    return result;
  } catch (error) {
    console.error(`Erro ao processar dados: ${error.message}`);
    throw error;
  }
}

/**
 * Normaliza as posições dos componentes em relação à tela
 * @param {Array} components - Lista de componentes
 * @param {Object} screenBounds - Dimensões da tela
 * @returns {Array} Componentes com posições normalizadas
 */
function normalizeComponentPositions(components, screenBounds) {
  // Encontrar os limites da tela
  const screenX = screenBounds.x || 0;
  const screenY = screenBounds.y || 0;
  
  return components.map(component => {
    // Criar uma cópia do componente
    const normalizedComponent = { ...component };
    
    // Normalizar a posição relativa ao canto superior esquerdo da tela
    normalizedComponent.position = {
      x: component.position.x - screenX,
      y: component.position.y - screenY,
      // Adicionar posição relativa como porcentagem para facilitar o layout responsivo
      relativeX: Math.round((component.position.x - screenX) / screenBounds.width * 100) / 100,
      relativeY: Math.round((component.position.y - screenY) / screenBounds.height * 100) / 100
    };
    
    // Adicionar informação sobre o alinhamento (útil para reconstrução)
    normalizedComponent.alignment = determineAlignment(normalizedComponent, screenBounds);
    
    return normalizedComponent;
  });
}

/**
 * Determina o alinhamento de um componente na tela
 * @param {Object} component - Componente processado
 * @param {Object} screenBounds - Dimensões da tela
 * @returns {Object} Informações de alinhamento
 */
function determineAlignment(component, screenBounds) {
  const screenWidth = screenBounds.width;
  const position = component.position;
  const width = component.size.width;
  
  // Calcular margens
  const leftMargin = position.x;
  const rightMargin = screenWidth - (position.x + width);
  const centerOffset = Math.abs((leftMargin - rightMargin) / 2);
  
  // Determinar alinhamento horizontal
  let horizontal = 'left';
  if (Math.abs(leftMargin - rightMargin) < 10) {
    horizontal = 'center';
  } else if (leftMargin > rightMargin) {
    horizontal = 'right';
  }
  
  return {
    horizontal,
    margins: {
      left: Math.round(leftMargin),
      right: Math.round(rightMargin)
    }
  };
}

/**
 * Agrupa componentes em seções lógicas baseadas na posição vertical
 * @param {Array} components - Componentes ordenados verticalmente
 * @returns {Array} Array de seções com componentes agrupados
 */
function groupComponentsIntoSections(components) {
  if (!components.length) return [];
  
  const sections = [];
  let currentSection = { title: 'Header', components: [] };
  
  // Valores iniciais
  let lastY = components[0].position.y;
  let lastHeight = components[0].size.height;
  
  // Define o limite de espaço vertical que indica uma nova seção
  const NEW_SECTION_THRESHOLD = 40;
  
  // Rastrear componentes já adicionados a alguma seção (para evitar duplicatas)
  const addedComponentIds = new Set();
  
  components.forEach((component, index) => {
    // Evitar duplicação de componentes entre seções
    if (addedComponentIds.has(component.id)) {
      return;
    }
    
    const verticalGap = component.position.y - (lastY + lastHeight);
    
    // Decidir se é uma nova seção baseada no espaço vertical
    if (index > 0 && verticalGap > NEW_SECTION_THRESHOLD) {
      // Adicionar a seção atual apenas se tiver componentes
      if (currentSection.components.length > 0) {
        sections.push(currentSection);
      }
      
      // Determinar o nome da nova seção
      let sectionTitle = 'Content';
      
      if (component.type === 'keyboard') {
        sectionTitle = 'Keyboard';
      } else if (component.type === 'input' || component.type === 'onboardingInput') {
        sectionTitle = 'Input';
      } else if (component.type === 'button') {
        sectionTitle = 'Button';
      } else if (component.name.toLowerCase().includes('button')) {
        sectionTitle = 'Button Area';
      }
      
      currentSection = { title: sectionTitle, components: [] };
    }
    
    // Verificar se é um componente individual do teclado
    const isKeyboardKey = component.name && component.name.toLowerCase().includes('key') && 
                       index > 0 && components[index-1].type === 'keyboard';
    
    // Não adicionar componentes individuais do teclado
    if (!isKeyboardKey) {
      // Adicionar o componente à seção atual
      currentSection.components.push(component);
      addedComponentIds.add(component.id);
    }
    
    // Atualizar valores para a próxima iteração
    lastY = component.position.y;
    lastHeight = component.size.height;
  });
  
  // Adicionar a última seção apenas se tiver componentes
  if (currentSection.components.length > 0) {
    sections.push(currentSection);
  }
  
  // Adicionar uma propriedade 'id' única para cada seção
  sections.forEach((section, index) => {
    section.id = `section-${index + 1}`;
  });
  
  return sections;
}

/**
 * Extrai todos os componentes do documento
 * @param {Object} document - Documento do Figma
 * @returns {Array} Array de componentes extraídos
 */
function extractComponents(document) {
  const components = [];

  // Função recursiva para percorrer o documento
  function traverse(node) {
    // Se o nó for nulo ou indefinido, retorna
    if (!node) return;
    
    // Ignorar se o nó estiver oculto, a menos que seja um componente
    if (node.visible === false && node.type !== 'COMPONENT') {
      return;
    }

    // Verificar se é um nó de interesse
    if (
      node.type === 'INSTANCE' ||          // Instância de componente
      (node.type === 'FRAME' && node.name.toLowerCase().includes('keyboard')) ||  // Frames de teclado
      (node.name && node.name.toLowerCase().includes('button')) ||  // Botões
      (node.name && node.name.toLowerCase().includes('header')) ||  // Headers
      (node.name && node.name.toLowerCase().includes('input'))      // Inputs
    ) {
      components.push(node);
      console.log(`Componente encontrado: ${node.name} (tipo: ${node.type})`);
    }

    // Percorrer filhos se existirem
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(child => {
        if (child) traverse(child);
      });
    }
  }

  // Iniciar travessia a partir do documento
  if (document) {
    traverse(document);
  } else {
    console.warn('Documento Figma inválido ou vazio');
  }
  
  return components;
}

/**
 * Processa um componente individual
 * @param {Object} component - Componente do Figma
 * @param {string} fileKey - Chave do arquivo Figma
 * @returns {Object} Componente processado
 */
async function processComponent(component, fileKey) {
  // Determinar o tipo do componente
  const componentType = identifyComponentType(component);

  // Criar objeto base com propriedades comuns
  const processed = {
    id: component.id,
    name: component.name,
    type: componentType,
    size: {
      width: Math.round(component.absoluteBoundingBox?.width || 0),
      height: Math.round(component.absoluteBoundingBox?.height || 0)
    },
    position: {
      x: Math.round(component.absoluteBoundingBox?.x || 0),
      y: Math.round(component.absoluteBoundingBox?.y || 0)
    }
  };

  // Aplicar transformadores específicos para cada tipo
  const transformedProps = applyTransformers(component, componentType, fileKey);
  
  // Adicionar propriedades transformadas
  if (transformedProps) {
    processed.properties = transformedProps;
  }
  
  // Extrair e adicionar assets (imagens, ícones)
  const assets = await figmaService.extractComponentAssets(fileKey, component);
  if (assets && Object.keys(assets).length > 0) {
    processed.assets = assets;
  }
  
  // Adicionar identificação de cor principal se disponível
  if (component.fills && Array.isArray(component.fills) && component.fills.length > 0) {
    const mainFill = component.fills.find(fill => fill.visible !== false);
    if (mainFill && mainFill.type === 'SOLID') {
      const color = {
        r: Math.round(mainFill.color.r * 255),
        g: Math.round(mainFill.color.g * 255),
        b: Math.round(mainFill.color.b * 255),
        a: mainFill.opacity || 1
      };
      processed.mainColor = color;
    }
  }
  
  // Adicionar informações de estilo visual
  processed.visual = {};
  
  // Extrair informações de borda arredondada
  if (component.cornerRadius !== undefined && component.cornerRadius > 0) {
    processed.visual.cornerRadius = component.cornerRadius;
  }
  
  // Extrair opacidade
  if (component.opacity !== undefined && component.opacity < 1) {
    processed.visual.opacity = component.opacity;
  }
  
  // Extrair bordas
  if (component.strokes && component.strokes.length > 0) {
    const stroke = component.strokes[0];
    processed.visual.border = {
      width: component.strokeWeight || 1,
      color: stroke.type === 'SOLID' ? {
        r: Math.round(stroke.color.r * 255),
        g: Math.round(stroke.color.g * 255),
        b: Math.round(stroke.color.b * 255),
        a: stroke.opacity || 1
      } : 'variable'
    };
  }
  
  // Remover seção visual se vazia
  if (Object.keys(processed.visual).length === 0) {
    delete processed.visual;
  }

  return processed;
}

/**
 * Simplifica IDs do Figma para uso em desenvolvimento
 * @param {string} id - ID original do Figma
 * @returns {string} ID simplificado
 */
function simplifyId(id) {
  // Remove complex prefixes and nested IDs
  if (id.includes(';')) {
    // Use the last part of the ID if it's complex
    return id.split(';').pop();
  }
  
  // Remove any non-alphanumeric characters
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

/**
 * Extrai assets (imagens e ícones) de um componente
 * @param {Object} node - Nó do componente
 * @param {string} figmaFileKey - Chave do arquivo do Figma
 * @returns {Object} Mapeamento de ids para caminhos de assets
 */
async function extractAssets(node, figmaFileKey) {
  const assets = {};
  
  // Função recursiva para encontrar nós com imagens
  async function findImageNodes(node) {
    // Verificar se o nó é uma imagem
    if (node.type === 'IMAGE' || 
        (node.type === 'VECTOR' && node.name.toLowerCase().includes('icon')) ||
        (node.fills && node.fills.some(fill => fill.type === 'IMAGE'))) {
      
      try {
        // Solicita download da imagem via API do Figma
        const imagePath = await figmaService.downloadImage(node.id, figmaFileKey);
        if (imagePath) {
          assets[node.id] = imagePath;
        }
      } catch (error) {
        console.error(`Erro ao baixar asset ${node.id}:`, error.message);
      }
    }
    
    // Procura em nós filhos
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        await findImageNodes(child);
      }
    }
  }
  
  // Inicia a busca por imagens no nó
  await findImageNodes(node);
  
  return assets;
}

/**
 * Filtra componentes duplicados ou aninhados
 * @param {Array} components - Lista de componentes extraídos
 * @returns {Array} Lista filtrada de componentes
 */
function filterDuplicateComponents(components) {
  // Mapa para rastrear componentes por ID
  const componentMap = new Map();
  // Mapa para rastrear relações de aninhamento
  const childrenMap = new Map();
  
  // Primeiro passo: registrar todos os componentes e suas relações
  components.forEach(component => {
    componentMap.set(component.id, component);
    
    // Registrar relações pai-filho
    if (component.children && Array.isArray(component.children)) {
      component.children.forEach(child => {
        if (child.id) {
          childrenMap.set(child.id, component.id);
        }
      });
    }
  });
  
  // Segundo passo: filtrar componentes aninhados e duplicados
  const result = components.filter(component => {
    // Ignorar componentes que são filhos diretos de outros componentes que já processamos
    if (childrenMap.has(component.id)) {
      const parentId = childrenMap.get(component.id);
      // Se o pai já está na lista, podemos ignorar este
      if (componentMap.has(parentId)) {
        return false;
      }
    }
    
    // Ignorar componentes individuais de teclado (muitos e redundantes)
    if (component.name && component.name.toLowerCase().includes('key') && 
        component.parent && component.parent.name && 
        component.parent.name.toLowerCase().includes('keyboard')) {
      return false;
    }
    
    // Manter outros componentes
    return true;
  });
  
  return result;
}

/**
 * Categoriza elementos por tipo, evitando redundância
 * @param {Array} components - Lista de componentes normalizados
 * @returns {Object} Elementos categorizados por tipo
 */
function categorizeElementsByType(components) {
  // Inicializar categorias
  const categories = {
    header: null,
    inputs: [],
    buttons: [],
    keyboard: null,
    icons: [],
    texts: [],
    other: []
  };
  
  // Mapa para rastrear se um componente já foi categorizado
  const categorizedMap = new Map();
  
  // Primeiro, categorizar os componentes específicos
  components.forEach(component => {
    // Evitar duplicação
    if (categorizedMap.has(component.id)) return;
    
    switch (component.type) {
      case 'header':
        // Usar apenas o header principal/de mais alto nível
        if (!categories.header || 
            (component.position.y <= categories.header.position.y && 
             component.size.width >= categories.header.size.width)) {
          categories.header = component;
        }
        break;
        
      case 'input':
      case 'onboardingInput':
        categories.inputs.push(component);
        break;
        
      case 'button':
        categories.buttons.push(component);
        break;
        
      case 'keyboard':
        // Usar o teclado mais abrangente
        if (!categories.keyboard || 
            component.size.width > categories.keyboard.size.width) {
          categories.keyboard = component;
        }
        break;
        
      case 'icon':
        categories.icons.push(component);
        break;
        
      case 'text':
        categories.texts.push(component);
        break;
        
      default:
        // Verificar se é parte de outro componente antes de adicionar
        const isSubComponent = components.some(other => 
          other.id !== component.id && 
          other.children && 
          other.children.some(child => child.id === component.id)
        );
        
        if (!isSubComponent) {
          categories.other.push(component);
        }
        break;
    }
    
    categorizedMap.set(component.id, true);
  });
  
  // Limpar categorias vazias
  Object.keys(categories).forEach(key => {
    if (Array.isArray(categories[key]) && categories[key].length === 0) {
      delete categories[key];
    } else if (!Array.isArray(categories[key]) && categories[key] === null) {
      delete categories[key];
    }
  });
  
  return categories;
}

module.exports = {
  processData,
  extractComponents,
  processComponent
}; 