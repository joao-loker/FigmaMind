import { FigmaNode, OnboardInputFieldTemplate, ComponentTransformer } from '../core/types';
import { hasIdentifier, extractIconName } from '../core/utils';

/**
 * Transformador para componentes de campo de entrada do onboarding (Onboarding/default)
 */
export const onboardInputFieldTransformer: ComponentTransformer = {
  canTransform(node: FigmaNode): boolean {
    return hasIdentifier(node, 'Onboarding/default');
  },
  
  transform(node: FigmaNode): OnboardInputFieldTemplate {
    // Extrair nome do ícone (se existir)
    const iconName = extractIconName(node);
    
    // Criar a estrutura padronizada para campo de entrada
    const inputFieldTemplate: OnboardInputFieldTemplate = {
      ID: "onboard-input0001",
      Name: "onboarding-input-field",
      height: 56,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: {
        default: "#BDBDBD",
        focused: "#1976D2",
        error: "#D32F2F"
      },
      dsColors: {
        border: {
          default: "neutral400",
          focused: "primary500",
          error: "error500"
        }
      },
      padding: {
        left: 16,
        right: 16,
        top: 16,
        bottom: 16
      }
    };
    
    // Adicionar ícone se existir
    if (iconName) {
      inputFieldTemplate.icon = {
        name: iconName,
        position: "right",
        size: 24
      };
    }
    
    return inputFieldTemplate;
  }
}; 