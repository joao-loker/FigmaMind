import { FigmaNode } from '../core/types';

/**
 * Interface para mapeamento de um componente
 */
export interface ComponentMapping {
  // Nome do transformador a ser usado
  transformer: string;
  // Opções para o transformador
  options?: Record<string, any>;
}

/**
 * Interface para a configuração dos mapeamentos
 */
export interface MappingsConfig {
  // Mapeamentos por tipo de nó
  byType: Record<string, ComponentMapping>;
  // Mapeamentos por nome (regex)
  byName: Array<{
    pattern: RegExp;
    mapping: ComponentMapping;
  }>;
  // Mapeamentos por ID
  byId: Record<string, ComponentMapping>;
}

// Exemplo de configuração
const mappingsConfig: MappingsConfig = {
  byType: {
    // Mapeia todos os componentes de texto
    TEXT: { transformer: 'text' },
    // Mapeia todos os componentes de retângulo
    RECTANGLE: { transformer: 'shape' }
  },
  byName: [
    // Mapeia componentes com nomes contendo "button"
    {
      pattern: /button/i,
      mapping: { transformer: 'button' }
    },
    // Mapeia componentes com nomes contendo "card"
    {
      pattern: /card/i,
      mapping: { transformer: 'card' }
    }
  ],
  byId: {
    // Exemplo de mapeamento por ID específico
    '12:345': { transformer: 'custom', options: { template: 'special' } }
  }
};

/**
 * Encontra o mapeamento apropriado para um nó
 */
export function findMappingForNode(node: FigmaNode): ComponentMapping | null {
  // Verificar se o nó tem um ID que está mapeado explicitamente
  if (node.id && mappingsConfig.byId[node.id]) {
    return mappingsConfig.byId[node.id];
  }
  
  // Verificar se o tipo do nó está mapeado
  if (node.type && mappingsConfig.byType[node.type]) {
    return mappingsConfig.byType[node.type];
  }
  
  // Verificar se o nome do nó corresponde a algum padrão
  if (node.name) {
    for (const { pattern, mapping } of mappingsConfig.byName) {
      if (pattern.test(node.name)) {
        return mapping;
      }
    }
  }
  
  // Nenhum mapeamento encontrado
  return null;
}

export default mappingsConfig; 