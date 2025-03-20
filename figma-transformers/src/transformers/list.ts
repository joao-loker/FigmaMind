import { FigmaNode, ListTemplate, ComponentTransformer } from '../core/types';
import { hasIdentifier, hasChildWithName } from '../core/utils';

/**
 * Transformador para componentes de lista (list-item)
 */
export const listTransformer: ComponentTransformer = {
  canTransform(node: FigmaNode): boolean {
    return hasIdentifier(node, 'list-item');
  },
  
  transform(node: FigmaNode): ListTemplate {
    // Verificar se tem separador/divider
    const hasDivider = hasChildWithName(node, 'divider');
    
    // Criar a estrutura padronizada para lista
    const listTemplate: ListTemplate = {
      ID: "list0001",
      Name: "mobile-list-item",
      spacing: 8,
      padding: {
        left: 16,
        right: 16,
        top: 12,
        bottom: 12
      },
      backgroundColor: "#FFFFFF",
      dsColor: "neutral0",
      itemHeight: 56,
      divider: hasDivider
    };
    
    // Adicionar cor do divider se ele existir
    if (hasDivider) {
      listTemplate.dividerColor = "#E0E0E0";
    }
    
    return listTemplate;
  }
}; 