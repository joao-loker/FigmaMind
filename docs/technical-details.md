# Documentação Técnica - Figma Component Transformer

Este documento técnico consolida informações detalhadas sobre o funcionamento interno do Figma Component Transformer, combinando as informações anteriormente distribuídas em múltiplos arquivos.

## Arquitetura do Sistema

O sistema é composto pelos seguintes componentes principais:

1. **Extrator de Dados do Figma**: Responsável por buscar dados da API do Figma
2. **Processador de Componentes**: Analisa e transforma os componentes encontrados
3. **Transformadores**: Conjunto de regras específicas para cada tipo de componente
4. **API REST**: Interface para acesso aos serviços de transformação
5. **Utilitários**: Funções auxiliares para manipulação de dados

```
┌─────────────────┐     ┌───────────────────┐     ┌────────────────┐
│                 │     │                   │     │                │
│  Figma API      │────▶│  Extrator         │────▶│  Processador   │
│                 │     │                   │     │                │
└─────────────────┘     └───────────────────┘     └────────┬───────┘
                                                           │
                                                           ▼
┌─────────────────┐     ┌───────────────────┐     ┌────────────────┐
│                 │     │                   │     │                │
│  Cliente        │◀────│  API REST         │◀────│ Transformadores│
│                 │     │                   │     │                │
└─────────────────┘     └───────────────────┘     └────────────────┘
```

## Fluxo de Processamento de Dados

### 1. Extração de Dados do Figma

O processo começa com a extração de dados do Figma através da sua API oficial.

#### 1.1 Parâmetros de Entrada
- **URL do Figma**: URL do arquivo ou design do Figma (ex: `https://www.figma.com/design/ID/Name?node-id=X`)
- **Token de API**: Token de acesso pessoal para a API do Figma

#### 1.2 Processo de Extração
1. **Análise da URL**: O sistema extrai o file key e node ID (se presente) da URL
2. **Requisição à API**: Usando o Axios para fazer requisições HTTP à API do Figma
3. **Tratamento de Resposta**: Processamento da resposta da API e extração dos nós relevantes

### 2. Processamento dos Componentes

O processador analisa a árvore de nós retornada pela API do Figma, identifica componentes e aplica transformadores específicos.

#### 2.1 Identificação de Componentes

Durante a travessia da árvore de nós, o sistema identifica componentes relevantes baseados em critérios como:
- Tipo de nó (`INSTANCE`, `FRAME`, etc.)
- Nome do componente (contendo termos como "button", "header", etc.)
- Propriedades específicas do componente

#### 2.2 Normalização de Posicionamento

Para facilitar a reconstrução precisa da interface, o sistema normaliza as posições dos componentes:
- Converte coordenadas absolutas para relativas à tela
- Calcula posições relativas como porcentagens da largura/altura da tela
- Determina alinhamento horizontal (esquerda, centro, direita)
- Calcula margens em relação às bordas da tela

#### 2.3 Organização em Seções Lógicas

O sistema agrupa componentes em seções lógicas baseadas em:
- Posicionamento vertical
- Espaçamento entre componentes
- Tipo de componente
- Relações hierárquicas

### 3. Aplicação de Transformadores

Para cada componente identificado, o sistema aplica transformadores específicos baseados no tipo do componente.

#### 3.1 Transformadores Disponíveis
- **Button**: Extrai texto, estilo e estados do botão
- **Header**: Processa título, botões de navegação e outros elementos
- **Input**: Extrai placeholder, tipo e estados do campo
- **Keyboard**: Identifica tipo de teclado e teclas especiais
- **List**: Processa itens da lista e suas propriedades
- **OnboardingInput**: Versão avançada para campos de entrada com rótulos e validação
- **RadioButton**: Extrai estados de seleção e etiquetas
- **OnboardCodeField**: Para campos de entrada de código com formatação especial

### 4. Formatação de Saída

O resultado final é um JSON estruturado com:
- Metadados do arquivo Figma (nome, versão, etc.)
- Dimensões da tela
- Componentes organizados por tipo e seção
- Propriedades específicas para cada componente
- Informações de posicionamento normalizado

## Detalhes de Implementação

### Processador Principal (processor.js)

O processador principal contém as seguintes funções-chave:

1. **processData**: Função principal que orquestra todo o processamento
2. **extractComponents**: Identifica componentes na árvore do Figma
3. **processComponent**: Processa um componente individual
4. **normalizeComponentPositions**: Normaliza coordenadas dos componentes
5. **determineAlignment**: Calcula alinhamento dos componentes
6. **groupComponentsIntoSections**: Agrupa componentes em seções lógicas

### Sistema de Transformadores

Os transformadores são implementados como funções que recebem um componente e retornam propriedades transformadas:

```javascript
function transformButton(component) {
  // Extrair propriedades relevantes do botão
  const buttonText = extractTextFromComponent(component);
  const buttonStyle = determineButtonStyle(component);
  
  return {
    text: buttonText,
    style: buttonStyle,
    states: extractComponentStates(component)
  };
}
```

### Utilitários Reutilizáveis

O sistema inclui várias funções utilitárias para tarefas comuns:
- **extractText**: Extrai texto de nós de texto
- **hasProperty**: Verifica se um componente tem determinada propriedade
- **getPropertyValue**: Obtém valor de uma propriedade
- **formatObject**: Remove propriedades nulas/vazias de objetos

## API REST

A API REST expõe os seguintes endpoints:

### GET /api
Retorna informações sobre a API, incluindo versão e endpoints disponíveis.

### POST /api/transform
Transforma componentes do Figma a partir de uma URL.

#### Parâmetros de Requisição:
```json
{
  "figmaUrl": "https://www.figma.com/design/ID/Name?node-id=X"
}
```

#### Resposta de Sucesso:
```json
{
  "success": true,
  "message": "Processados X componentes",
  "source": "URL do Figma",
  "data": {
    // Dados processados
  }
}
```

### GET /api/assets/:filename
Retorna um asset específico.

## Extração de Assets

O sistema suporta a extração automática de imagens e ícones dos componentes.

### Identificação de Assets
Durante o processamento, o sistema identifica nós que contêm imagens ou elementos visuais.

### Download e Armazenamento
Para cada asset identificado, o sistema:
1. Solicita a URL de exportação à API do Figma
2. Baixa a imagem e a salva em `examples/output/assets/`
3. Adiciona referências aos assets no JSON de saída

### Acesso aos Assets
Os assets podem ser acessados via API através do endpoint `/api/assets/:filename`.

## Técnicas de Otimização

Para melhorar a performance do sistema, são utilizadas várias técnicas:

1. **Processamento Seletivo**: Usando node-id para processar apenas partes específicas
2. **Travessia Eficiente**: Ignorando nós ocultos (quando apropriado)
3. **Caching de Requisições**: Evitando requisições repetidas à API do Figma
4. **Processamento Assíncrono**: Usando promises para operações paralelas

## Considerações sobre Segurança

- Tokens de API são armazenados em variáveis de ambiente
- Validação de entrada para evitar injeção de código
- Sanitização de caminhos de arquivos para evitar travessia de diretórios

## Extensibilidade

O sistema foi projetado para ser facilmente extensível:

### Adicionando Novos Transformadores
Para adicionar suporte a um novo tipo de componente:

1. Crie uma função transformadora no arquivo de transformadores
2. Adicione a função ao mapeamento de tipos de componentes
3. Atualize a função de identificação de tipo para reconhecer o novo componente

### Suporte a Novos Formatos de Saída
É possível estender o sistema para suportar outros formatos além de JSON:

1. Crie um novo serializador no módulo de utilitários
2. Adicione um parâmetro de formato à API
3. Implemente a lógica para converter o objeto processado para o formato desejado

## Testes e Validação

Para garantir o funcionamento correto do sistema, foram realizados testes com vários componentes reais do Figma.

Os resultados dos testes confirmaram que o sistema:
- Extrai corretamente os componentes do Figma
- Processa todos os tipos de componentes suportados
- Gera JSON válido e bem estruturado
- Mantém a fidelidade dos componentes originais

## Melhores Práticas para Uso

Para obter os melhores resultados com o sistema:

1. Organize seus componentes no Figma usando nomes descritivos
2. Use convenções consistentes para tipos de componentes
3. Agrupe componentes relacionados em frames
4. Utilize node-id para processar apenas partes específicas
5. Verifique o JSON resultante para garantir que todas as propriedades necessárias foram extraídas 