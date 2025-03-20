# Documentação de Tipos de Componentes

Este documento descreve em detalhes cada tipo de componente suportado pelo Figma Component Transformer, incluindo suas propriedades específicas e exemplos de uso.

## Componentes Suportados

O sistema atualmente suporta os seguintes tipos de componentes:

1. [Button](#button)
2. [Header](#header)
3. [Input](#input)
4. [OnboardingInput](#onboardinginput)
5. [Keyboard](#keyboard)
6. [List](#list)
7. [Text](#text)
8. [RadioButton](#radiobutton)
9. [OnboardCodeField](#onboardcodefield)

---

## Button

Componentes de botão são identificados pelo nome contendo "button" ou por propriedades específicas.

### Propriedades Extraídas

| Propriedade | Tipo    | Descrição                                                  |
|-------------|---------|-------------------------------------------------------------|
| text        | String  | Texto exibido no botão                                      |
| style       | String  | Estilo do botão (primary, secondary, tertiary, etc.)        |
| states      | Object  | Estados do botão (disabled, hover, pressed, etc.)           |
| icon        | Object  | Informações sobre ícones associados ao botão                |

### Exemplo de Saída

```json
{
  "id": "2139:96739",
  "name": "bottom-button",
  "type": "button",
  "size": {
    "width": 390,
    "height": 88
  },
  "position": {
    "x": 0,
    "y": 412,
    "relativeX": 0,
    "relativeY": 0.49
  },
  "properties": {
    "text": "Next",
    "style": "primary",
    "states": {}
  },
  "alignment": {
    "horizontal": "center",
    "margins": {
      "left": 0,
      "right": 0
    }
  }
}
```

---

## Header

Componentes de cabeçalho são identificados pelo nome contendo "header" ou por sua posição no topo da tela.

### Propriedades Extraídas

| Propriedade   | Tipo    | Descrição                                             |
|---------------|---------|-------------------------------------------------------|
| title         | String  | Título exibido no cabeçalho                           |
| hasBackButton | Boolean | Indica se o cabeçalho possui botão de voltar          |
| hasCloseButton| Boolean | Indica se o cabeçalho possui botão de fechar          |

### Exemplo de Saída

```json
{
  "id": "2045:33565",
  "name": "header",
  "type": "header",
  "size": {
    "width": 390,
    "height": 102
  },
  "position": {
    "x": 0,
    "y": 0,
    "relativeX": 0,
    "relativeY": 0
  },
  "properties": {
    "title": "9:41",
    "hasBackButton": false,
    "hasCloseButton": false
  },
  "alignment": {
    "horizontal": "center",
    "margins": {
      "left": 0,
      "right": 0
    }
  }
}
```

---

## Input

Componentes de entrada identificados pelo nome contendo "input" ou pela estrutura do frame.

### Propriedades Extraídas

| Propriedade | Tipo    | Descrição                                                |
|-------------|---------|----------------------------------------------------------|
| placeholder | String  | Texto de placeholder exibido quando o campo está vazio    |
| type        | String  | Tipo de entrada (text, number, email, password, etc.)     |
| states      | Object  | Estados do campo (focused, filled, error, etc.)           |

### Exemplo de Saída

```json
{
  "id": "I2045:33566;338:7141",
  "name": "input",
  "type": "input",
  "size": {
    "width": 342,
    "height": 35
  },
  "position": {
    "x": 24,
    "y": 188,
    "relativeX": 0.06,
    "relativeY": 0.22
  },
  "properties": {
    "placeholder": "Enter your business name",
    "type": "text",
    "states": {}
  },
  "alignment": {
    "horizontal": "center",
    "margins": {
      "left": 24,
      "right": 24
    }
  }
}
```

---

## OnboardingInput

Versão avançada do componente de entrada, específico para fluxos de onboarding, com suporte para validação e rótulos.

### Propriedades Extraídas

| Propriedade | Tipo    | Descrição                                                  |
|-------------|---------|-------------------------------------------------------------|
| placeholder | String  | Texto de placeholder                                        |
| label       | String  | Rótulo descritivo do campo                                  |
| type        | String  | Tipo de entrada (text, number, email, password, etc.)       |
| validation  | Object  | Regras de validação (opcional)                              |
| states      | Object  | Estados do campo (focused, filled, error, etc.)             |

### Exemplo de Saída

```json
{
  "id": "2045:33566",
  "name": "Onboarding/default",
  "type": "onboardingInput",
  "size": {
    "width": 342,
    "height": 111
  },
  "position": {
    "x": 24,
    "y": 112,
    "relativeX": 0.06,
    "relativeY": 0.13
  },
  "properties": {
    "placeholder": "Enter your business name",
    "label": "",
    "type": "text",
    "validation": null,
    "states": {}
  },
  "alignment": {
    "horizontal": "center",
    "margins": {
      "left": 24,
      "right": 24
    }
  }
}
```

---

## Keyboard

Componentes de teclado virtual identificados pelo nome contendo "keyboard".

### Propriedades Extraídas

| Propriedade    | Tipo    | Descrição                                            |
|----------------|---------|------------------------------------------------------|
| keyboardType   | String  | Tipo de teclado (alphabetic, numeric, etc.)          |
| hasSpecialKeys | Boolean | Indica se o teclado possui teclas especiais          |

### Exemplo de Saída

```json
{
  "id": "2139:96790",
  "name": "4. alphabetic-keyboard",
  "type": "keyboard",
  "size": {
    "width": 390,
    "height": 310
  },
  "position": {
    "x": 0,
    "y": 500,
    "relativeX": 0,
    "relativeY": 0.59
  },
  "properties": {
    "keyboardType": "alphabetic",
    "hasSpecialKeys": true
  },
  "alignment": {
    "horizontal": "center",
    "margins": {
      "left": 0,
      "right": 0
    }
  }
}
```

---

## List

Componentes de lista identificados pelo nome contendo "list" ou pela estrutura do frame com itens repetidos.

### Propriedades Extraídas

| Propriedade | Tipo    | Descrição                                            |
|-------------|---------|------------------------------------------------------|
| items       | Array   | Array de itens na lista                              |
| style       | String  | Estilo da lista (bullets, numbered, etc.)            |
| separator   | Boolean | Indica se há separadores entre os itens              |

### Exemplo de Saída

```json
{
  "id": "list123",
  "name": "list-example",
  "type": "list",
  "size": {
    "width": 342,
    "height": 200
  },
  "position": {
    "x": 24,
    "y": 250,
    "relativeX": 0.06,
    "relativeY": 0.3
  },
  "properties": {
    "items": [
      { "text": "Item 1", "icon": "check" },
      { "text": "Item 2", "icon": "check" },
      { "text": "Item 3", "icon": "check" }
    ],
    "style": "bullets",
    "separator": true
  },
  "alignment": {
    "horizontal": "center",
    "margins": {
      "left": 24,
      "right": 24
    }
  }
}
```

---

## Text

Componentes de texto simples.

### Propriedades Extraídas

| Propriedade | Tipo    | Descrição                                            |
|-------------|---------|------------------------------------------------------|
| text        | String  | Conteúdo do texto                                    |
| style       | String  | Estilo do texto (heading, body, caption, etc.)       |
| formatting  | Object  | Informações de formatação (bold, italic, etc.)       |

### Exemplo de Saída

```json
{
  "id": "text456",
  "name": "text-paragraph",
  "type": "text",
  "size": {
    "width": 342,
    "height": 60
  },
  "position": {
    "x": 24,
    "y": 200,
    "relativeX": 0.06,
    "relativeY": 0.24
  },
  "properties": {
    "text": "This is a sample text paragraph.",
    "style": "body",
    "formatting": {
      "align": "left",
      "fontSize": 16
    }
  },
  "alignment": {
    "horizontal": "center",
    "margins": {
      "left": 24,
      "right": 24
    }
  }
}
```

---

## RadioButton

Componentes de botão de rádio ou opção.

### Propriedades Extraídas

| Propriedade | Tipo    | Descrição                                            |
|-------------|---------|------------------------------------------------------|
| label       | String  | Texto da etiqueta do botão de opção                  |
| selected    | Boolean | Estado de seleção do botão                           |
| group       | String  | Identificador do grupo de botões de opção            |

### Exemplo de Saída

```json
{
  "id": "radio789",
  "name": "radio-option",
  "type": "radioButton",
  "size": {
    "width": 300,
    "height": 24
  },
  "position": {
    "x": 45,
    "y": 300,
    "relativeX": 0.12,
    "relativeY": 0.36
  },
  "properties": {
    "label": "Option A",
    "selected": true,
    "group": "optionsGroup"
  },
  "alignment": {
    "horizontal": "left",
    "margins": {
      "left": 45,
      "right": 45
    }
  }
}
```

---

## OnboardCodeField

Componentes especializados para entrada de códigos de verificação.

### Propriedades Extraídas

| Propriedade | Tipo    | Descrição                                            |
|-------------|---------|------------------------------------------------------|
| label       | String  | Texto descritivo do campo                            |
| digitCount  | Number  | Número de dígitos do código                          |
| separator   | Boolean | Indica se há separadores entre os dígitos            |
| states      | Object  | Estados do campo (filled, error, success)            |

### Exemplo de Saída

```json
{
  "id": "code123",
  "name": "verification-code",
  "type": "onboardCodeField",
  "size": {
    "width": 342,
    "height": 80
  },
  "position": {
    "x": 24,
    "y": 350,
    "relativeX": 0.06,
    "relativeY": 0.41
  },
  "properties": {
    "label": "Verification Code",
    "digitCount": 6,
    "separator": true,
    "states": {}
  },
  "alignment": {
    "horizontal": "center",
    "margins": {
      "left": 24,
      "right": 24
    }
  }
}
```

## Como Adicionar Suporte a Novos Componentes

Para adicionar suporte a um novo tipo de componente:

1. Crie uma função transformadora em `src/transformers/index.js`:
   ```javascript
   function transformNewComponent(component) {
     // Extrair propriedades relevantes
     return {
       // Propriedades específicas deste componente
     };
   }
   ```

2. Atualize a função `identifyComponentType` para reconhecer o novo componente:
   ```javascript
   function identifyComponentType(component) {
     // ... código existente ...
     
     if (component.name.toLowerCase().includes('newtype')) {
       return 'newType';
     }
     
     // ... código existente ...
   }
   ```

3. Adicione a função ao mapeamento de transformadores:
   ```javascript
   const transformerMap = {
     // ... transformadores existentes ...
     'newType': transformNewComponent
   };
   ```

4. Atualize a documentação para incluir o novo tipo de componente 