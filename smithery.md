# FigmaMind - Conectando o design à mente dos LLMs

![FigmaMind](https://placehold.co/600x400?text=FigmaMind&font=montserrat)

## Descrição

O FigmaMind é um MCP que transforma componentes do Figma em um formato JSON padronizado e otimizado para reconstrução de interfaces por Inteligência Artificial. Ele extrai layouts, componentes, estilos e propriedades visuais diretamente da API do Figma, organizando-os em uma estrutura consistente e fácil de consumir.

## Casos de Uso

- **Construção de UI por LLMs**: Forneça contexto estruturado para que modelos de linguagem possam reconstruir interfaces a partir de designs do Figma.
- **Desenvolvimento ágil**: Rapidamente converta designs do Figma em especificações técnicas para desenvolvedores.
- **Criação de protótipos automatizada**: Extraia componentes e propriedades para alimentar sistemas de prototipagem automática.
- **Análise de design systems**: Obtenha uma visão estruturada e padronizada de componentes em diversos arquivos Figma.

## Como usar

### Pré-requisitos

Para usar este MCP, você precisará:

1. Um token de API do Figma (configure como uma variável de ambiente segura no Smithery)
2. URLs do Figma para os arquivos que deseja processar

### Configuração

No Smithery, configure a variável de ambiente `FIGMA_TOKEN` com seu token de API do Figma.

### Exemplos

#### Transformando um arquivo do Figma

```javascript
// Exemplo de uso com o cliente Smithery
const response = await smithery.invoke("figmamind", {
  figmaUrl: "https://www.figma.com/design/Mlgjf3cCMzOIwM27GLx81Y/New-Onboarding?node-id=2045-33564"
});

// O resultado contém o JSON processado com os componentes
console.log(`Processados ${response.data.componentsCount} componentes`);
```

#### Exemplo de resposta

```json
{
  "success": true,
  "message": "Processados 75 componentes",
  "source": "https://www.figma.com/design/Mlgjf3cCMzOIwM27GLx81Y/New-Onboarding?node-id=2045-33564",
  "data": {
    "source": "New Onboarding",
    "lastModified": "2023-03-20T16:16:30Z",
    "version": "2197630462658933318",
    "componentsCount": 75,
    "screen": {
      "name": "Onboarding Screen",
      "size": {
        "width": 390,
        "height": 844
      },
      "layout": {
        "sections": [
          {
            "id": "section-1",
            "title": "Header",
            "components": [...]
          }
        ]
      },
      "elements": {
        "header": { ... },
        "inputs": [ ... ],
        "buttons": [ ... ]
      }
    }
  }
}
```

### Acessando assets extraídos

```javascript
// Para acessar imagens e ícones extraídos
const imageUrl = `${smithery.getBaseUrl("figmamind")}/assets/component-123.svg`;
```

## Detalhes Técnicos

### Formato JSON Otimizado

O formato JSON gerado por este MCP foi especialmente projetado para facilitar a reconstrução de interfaces por LLMs e sistemas de IA:

1. **Organização hierárquica**: Componentes agrupados em seções lógicas baseadas no layout
2. **Posicionamento normalizado**: Coordenadas absolutas e relativas para facilitar o posicionamento
3. **Propriedades visuais**: Cores, tipografia, cantos arredondados e outros atributos visuais importantes
4. **Identificação de relações**: Componentes relacionados são vinculados para preservar a hierarquia

### Tipos de Componentes Suportados

- Botões e controles de ação
- Campos de entrada e formulários
- Cabeçalhos e elementos de navegação
- Listas e coleções
- Teclados e componentes de entrada de dados
- Ícones e elementos visuais

## Segurança

Este MCP requer acesso à API do Figma através de um token pessoal. O token é armazenado como uma variável de ambiente segura no Smithery e nunca é exposto nas respostas da API.

## Manutenção e Suporte

Este MCP é mantido ativamente. Para relatar problemas ou solicitar novas funcionalidades, visite o [repositório GitHub](https://github.com/joao-loker/FigmaMind/issues). 