import { FigmaNode, ButtonTemplate, ComponentTransformer } from '../core/types';
import { extractIconName, hasIdentifier } from '../core/utils';

/**
 * Transformador para componentes de botão (Main-Primary)
 */
export const buttonTransformer: ComponentTransformer = {
  canTransform(node: FigmaNode): boolean {
    return hasIdentifier(node, 'Main-Primary');
  },
  
  transform(node: FigmaNode): ButtonTemplate {
    // Extrair nome do ícone se existir
    const iconName = extractIconName(node);
    
    // Criar a estrutura padronizada
    const buttonTemplate: ButtonTemplate = {
      ID: "buttom0001",
      Name: "button-mobile",
      hex: "#000000",
      dsColor: "neutral1000",
      width: "filled",
      height: 48,
      padding: {
        left: 24,
        right: 24,
        top: 0,
        bottom: 0
      },
      borderRadius: 100000
    };
    
    // Adicionar ícone se existir
    if (iconName) {
      buttonTemplate.children = [
        {
          type: "Icon Start",
          icon: iconName,
          tone: "#F5F5F5",
          dsColor: "tone100",
          properties: {
            width: 16,
            height: 16
          }
        }
      ];
    }
    
    return buttonTemplate;
  }
}; 