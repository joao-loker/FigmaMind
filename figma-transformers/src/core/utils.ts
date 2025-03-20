import { FigmaNode } from './types';

/**
 * Remove todos os nós relacionados a "variable" do JSON do Figma
 * 
 * @param node Nó do Figma ou objeto JSON
 * @returns Nó limpo sem os nós de variáveis
 */
export function removeVariableNodes(node: any): any {
  if (!node || typeof node !== 'object') return node;
  
  // Se for um array, filtramos e processamos cada item
  if (Array.isArray(node)) {
    return node
      .filter(item => !(item && typeof item === 'object' && 
                        (item.type === 'VARIABLE' || 
                         item.type === 'VARIABLE_INSTANCE' ||
                         item.name?.toLowerCase().includes('variable'))))
      .map(item => removeVariableNodes(item));
  }
  
  // Se for um nó com tipo "VARIABLE" ou "VARIABLE_INSTANCE", retorna null
  if (node.type === 'VARIABLE' || node.type === 'VARIABLE_INSTANCE' || 
      node.name?.toLowerCase().includes('variable')) {
    return null;
  }
  
  // Processar recursivamente todos os campos
  const result: any = { ...node };
  
  // Limpar o array de children se existir
  if (Array.isArray(result.children)) {
    result.children = result.children
      .filter((child: any) => !(child && typeof child === 'object' && 
                              (child.type === 'VARIABLE' || 
                               child.type === 'VARIABLE_INSTANCE' ||
                               child.name?.toLowerCase().includes('variable'))))
      .map((child: any) => removeVariableNodes(child));
  }
  
  // Processar outros campos
  for (const key in result) {
    if (Object.prototype.hasOwnProperty.call(result, key) && key !== 'children') {
      result[key] = removeVariableNodes(result[key]);
    }
  }
  
  return result;
}

/**
 * Extrai o nome do ícone de um nó, se existir
 */
export function extractIconName(node: FigmaNode): string | undefined {
  if (!node.children) return undefined;
  
  const iconNode = node.children.find(child => 
    child.name && (
      child.name.startsWith('icon-') || 
      child.name.toLowerCase().includes('icon')
    )
  );
  
  return iconNode?.name;
}

/**
 * Verifica se um nó tem o identificador específico
 */
export function hasIdentifier(node: FigmaNode, identifier: string): boolean {
  if (!node.name) return false;
  return node.name === identifier || node.name.includes(identifier);
}

/**
 * Extrai um valor de texto de um nó filho, se existir
 */
export function extractTextContent(node: FigmaNode, childNamePattern?: string): string | undefined {
  if (!node.children) return undefined;
  
  const textNode = node.children.find(child => 
    child.type === 'TEXT' && 
    (!childNamePattern || (child.name && child.name.includes(childNamePattern)))
  );
  
  return textNode?.characters;
}

/**
 * Verifica se um nó contém um filho com o nome especificado
 */
export function hasChildWithName(node: FigmaNode, childNamePattern: string): boolean {
  if (!node.children) return false;
  
  return node.children.some(child => 
    child.name && child.name.includes(childNamePattern)
  );
}

/**
 * Conta o número de filhos de um determinado tipo
 */
export function countChildrenOfType(node: FigmaNode, type: string): number {
  if (!node.children) return 0;
  
  return node.children.filter(child => child.type === type).length;
} 