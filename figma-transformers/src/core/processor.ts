import { FigmaNode } from './types';
import { removeVariableNodes } from './utils';
import { findMappingForNode } from '../config/mappings';
import * as transformers from '../transformers';
import { FigmaFileResponse, FigmaNodesResponse } from '../services/figmaService';

/**
 * Interface para dados processados
 */
export interface ProcessedFigmaData {
  components: any[];
  metadata: {
    timestamp: string;
    source: string;
    version: string;
    error?: string;
  };
  [key: string]: any;
}

/**
 * Processa JSON do Figma em uma estrutura padronizada
 * 
 * @param figmaData Dados brutos do Figma
 * @returns Dados processados
 */
export function processFigmaJson(figmaData: FigmaFileResponse | FigmaNodesResponse): ProcessedFigmaData {
  try {
    // Inicializar o objeto de resultado
    const result: ProcessedFigmaData = {
      components: [],
      metadata: {
        timestamp: new Date().toISOString(),
        source: figmaData.name || 'Figma API',
        version: figmaData.version || '1.0'
      }
    };
    
    // Se for uma resposta de arquivo completo
    if ('document' in figmaData) {
      // Extrair componentes do documento raiz
      extractComponentsFromNode(figmaData.document, result.components);
    } 
    // Se for uma resposta de nós específicos
    else if ('nodes' in figmaData) {
      // Para cada nó na resposta
      Object.values(figmaData.nodes).forEach(node => {
        if (node && node.document) {
          extractComponentsFromNode(node.document, result.components);
        }
      });
    }
    
    console.log(`Processados ${result.components.length} componentes`);
    return result;
  } catch (error) {
    console.error('Erro ao processar JSON do Figma:', error);
    // Retornar uma estrutura mínima em caso de erro
    return {
      components: [],
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'Error',
        version: '1.0',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
}

/**
 * Extrai componentes recursivamente de um nó do Figma
 * 
 * @param node Nó do Figma
 * @param components Array para armazenar componentes
 */
function extractComponentsFromNode(node: any, components: any[]): void {
  // Ignorar status-bar e home-indicator (componentes ilustrativos)
  if (node.name === '1. status-bar' || node.name === '2. home-indicator') {
    return;
  }
  
  // Processar teclado alphabetic - sem verificar visibilidade aqui
  if (node.name === '4. alphabetic-keyboard') {
    components.push({
      id: node.id,
      name: node.name,
      type: 'keyboard',
      keyboardType: 'alphabetic',
      isVisible: node.visible !== false
    });
    return; // Não processar os filhos para não incluir detalhes do teclado
  }
  
  // Processar teclado numeric - sem verificar visibilidade aqui
  if (node.name === '5. numeric-keyboard') {
    components.push({
      id: node.id,
      name: node.name,
      type: 'keyboard',
      keyboardType: 'numeric',
      isVisible: node.visible !== false
    });
    return; // Não processar os filhos para não incluir detalhes do teclado
  }
  
  // Se o nó for um componente
  if ((node.type === 'COMPONENT' || node.type === 'INSTANCE') && shouldIncludeComponent(node)) {
    // Adicionar à lista de componentes
    components.push({
      id: node.id,
      name: node.name,
      type: node.type,
      properties: extractProperties(node)
    });
  }
  
  // Processar recursivamente os filhos do nó
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child: any) => {
      extractComponentsFromNode(child, components);
    });
  }
}

/**
 * Verifica se um componente deve ser incluído com base em sua visibilidade
 * 
 * @param node Nó do Figma
 * @returns true se o componente deve ser incluído
 */
function shouldIncludeComponent(node: any): boolean {
  // Verificar se o componente não está explicitamente oculto
  if (node.visible === false) {
    return false;
  }
  
  // Verificar propriedades que indicam status "false"
  if (node.componentPropertyReferences && 
      Object.values(node.componentPropertyReferences).some(
        (value: any) => typeof value === 'string' && value.toLowerCase() === 'false'
      )) {
    return false;
  }
  
  return true;
}

/**
 * Extrai propriedades relevantes de um nó
 * 
 * @param node Nó do Figma
 * @returns Propriedades do nó
 */
function extractProperties(node: any): any {
  // Extrair propriedades básicas
  const properties: any = {
    size: {
      width: node.absoluteBoundingBox?.width,
      height: node.absoluteBoundingBox?.height
    },
    position: {
      x: node.absoluteBoundingBox?.x,
      y: node.absoluteBoundingBox?.y
    }
  };
  
  // Extrair estilos se existirem
  if (node.styles) {
    properties.styles = { ...node.styles };
  }
  
  // Extrair propriedades do componente se existirem
  if (node.componentProperties) {
    properties.componentProperties = { ...node.componentProperties };
  }
  
  return properties;
}

/**
 * Processa um JSON do Figma, aplicando as transformações nos componentes identificados
 */
export function processFigmaJsonOld(figmaJson: any): any {
  // Primeiro, remover todos os nós relacionados a "variable"
  const cleanedJson = removeVariableNodes(figmaJson);
  
  // Em seguida, processar os nós para aplicar as transformações
  return processNode(cleanedJson);
}

/**
 * Processa um nó recursivamente, aplicando transformadores quando apropriado
 */
function processNode(node: any): any {
  if (!node || typeof node !== 'object') return node;
  
  // Se for um array, processamos cada item
  if (Array.isArray(node)) {
    return node.map(item => processNode(item));
  }
  
  // Verificar se este nó deve ser transformado
  const mapping = findMappingForNode(node);
  if (mapping && mapping.transformer) {
    const transformer = (transformers as any)[`${mapping.transformer}Transformer`];
    if (transformer && transformer.canTransform(node)) {
      return transformer.transform(node, mapping.options);
    }
  }
  
  // Processar recursivamente todos os campos
  const result = { ...node };
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key)) {
      result[key] = processNode(result[key]);
    }
  }
  
  return result;
} 