import { FigmaNode, HeadTemplate, ComponentTransformer } from '../core/types';
import { hasIdentifier, extractTextContent } from '../core/utils';

/**
 * Transformador para componentes de cabeçalho (Head)
 */
export const headTransformer: ComponentTransformer = {
  canTransform(node: FigmaNode): boolean {
    return hasIdentifier(node, 'Head');
  },
  
  transform(node: FigmaNode): HeadTemplate {
    // Extrair texto do cabeçalho, se existir
    const headText = extractTextContent(node);
    
    // Criar a estrutura padronizada para cabeçalho
    const headTemplate: HeadTemplate = {
      ID: "head0001",
      Name: "mobile-header",
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "700",
      color: "#212121",
      dsColor: "neutral900",
      marginBottom: 16
    };
    
    // Adicionar o texto original como propriedade, se existir
    if (headText) {
      headTemplate.text = headText;
    }
    
    return headTemplate;
  }
}; 