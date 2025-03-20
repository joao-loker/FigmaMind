/**
 * Tipos para processamento de componentes do Figma
 */

// Interface básica para um nó do Figma
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  children?: FigmaNode[];
  [key: string]: any;
}

// Interface para transformadores de componentes
export interface ComponentTransformer {
  transform: (node: FigmaNode) => any;
  canTransform: (node: FigmaNode) => boolean;
}

// Interface para configuração de mapeamento
export interface ComponentMapping {
  identifier: string;  // Nome do componente no Figma
  transformer: string; // Nome do transformador a ser usado
  options?: any;       // Opções específicas do transformador
}

// Interface base para templates de componentes padronizados
export interface BaseComponentTemplate {
  ID: string;
  Name: string;
  [key: string]: any;
}

// Templates específicos para cada tipo de componente
export interface ButtonTemplate extends BaseComponentTemplate {
  hex: string;
  dsColor: string;
  width: string;
  height: number;
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  borderRadius: number;
  children?: any[];
}

export interface ListTemplate extends BaseComponentTemplate {
  spacing: number;
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
  backgroundColor: string;
  dsColor: string;
  itemHeight: number;
  divider: boolean;
  dividerColor?: string;
}

export interface HeadTemplate extends BaseComponentTemplate {
  fontSize: number;
  lineHeight: number;
  fontWeight: string;
  color: string;
  dsColor: string;
  marginBottom: number;
}

export interface OnboardInputFieldTemplate extends BaseComponentTemplate {
  height: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: {
    default: string;
    focused: string;
    error: string;
  };
  dsColors: {
    border: {
      default: string;
      focused: string;
      error: string;
    };
  };
  padding: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export interface RadioButtonTemplate extends BaseComponentTemplate {
  size: number;
  borderWidth: number;
  borderColor: {
    default: string;
    selected: string;
  };
  fillColor: {
    default: string;
    selected: string;
  };
  dsColors: {
    border: {
      default: string;
      selected: string;
    };
    fill: {
      default: string;
      selected: string;
    };
  };
}

export interface OnboardCodeFieldTemplate extends BaseComponentTemplate {
  fieldCount: number;
  fieldWidth: number;
  fieldHeight: number;
  spacing: number;
  borderRadius: number;
  borderWidth: number;
  borderColor: {
    default: string;
    filled: string;
    focused: string;
    error: string;
  };
  dsColors: {
    border: {
      default: string;
      filled: string;
      focused: string;
      error: string;
    };
  };
} 