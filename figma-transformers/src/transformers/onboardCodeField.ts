import { FigmaNode, OnboardCodeFieldTemplate, ComponentTransformer } from '../core/types';
import { hasIdentifier, countChildrenOfType } from '../core/utils';

/**
 * Transformador para componentes de campo de código de verificação (verification-code-fields)
 */
export const onboardCodeFieldTransformer: ComponentTransformer = {
  canTransform(node: FigmaNode): boolean {
    return hasIdentifier(node, 'verification-code-fields');
  },
  
  transform(node: FigmaNode): OnboardCodeFieldTemplate {
    // Contar campos de entrada no componente
    // Se não for possível determinar, usar 6 como padrão
    const fieldCount = countChildrenOfType(node, 'RECTANGLE') || 6;
    
    // Criar a estrutura padronizada para campo de código
    const codeFieldTemplate: OnboardCodeFieldTemplate = {
      ID: "code-field0001",
      Name: "verification-code-field",
      fieldCount: fieldCount,
      fieldWidth: 48,
      fieldHeight: 56,
      spacing: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: {
        default: "#BDBDBD",
        filled: "#424242",
        focused: "#1976D2",
        error: "#D32F2F"
      },
      dsColors: {
        border: {
          default: "neutral400",
          filled: "neutral800",
          focused: "primary500",
          error: "error500"
        }
      }
    };
    
    return codeFieldTemplate;
  }
}; 