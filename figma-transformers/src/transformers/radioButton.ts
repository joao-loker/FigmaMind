import { FigmaNode, RadioButtonTemplate, ComponentTransformer } from '../core/types';
import { hasIdentifier, extractTextContent } from '../core/utils';

/**
 * Transformador para componentes de botão de rádio (radio button)
 */
export const radioButtonTransformer: ComponentTransformer = {
  canTransform(node: FigmaNode): boolean {
    return hasIdentifier(node, 'radio button');
  },
  
  transform(node: FigmaNode): RadioButtonTemplate {
    // Extrair texto do label, se existir
    const labelText = extractTextContent(node, 'label');
    
    // Criar a estrutura padronizada para botão de rádio
    const radioButtonTemplate: RadioButtonTemplate = {
      ID: "radio0001",
      Name: "mobile-radio-button",
      size: 20,
      borderWidth: 2,
      borderColor: {
        default: "#757575",
        selected: "#1976D2"
      },
      fillColor: {
        default: "transparent",
        selected: "#1976D2"
      },
      dsColors: {
        border: {
          default: "neutral500",
          selected: "primary500"
        },
        fill: {
          default: "transparent",
          selected: "primary500"
        }
      }
    };
    
    // Adicionar o texto do label, se existir
    if (labelText) {
      radioButtonTemplate.label = {
        text: labelText,
        fontSize: 16,
        lineHeight: 24,
        color: "#212121",
        dsColor: "neutral900"
      };
    }
    
    return radioButtonTemplate;
  }
}; 