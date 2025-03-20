# Figma Component Transformer

Um sistema para extrair componentes do Figma e transformá-los em formato JSON padronizado que facilita a reconstrução de interfaces por IA.

**[NOVO]**: Agora disponível como servidor MCP (Model Context Protocol) para integração direta com LLMs!

## Sobre o Projeto

Este projeto permite extrair componentes do Figma através da API oficial e transformá-los em um formato JSON padronizado que pode ser facilmente consumido por aplicações e sistemas de IA para reconstrução de interfaces. O sistema é composto por um extrator, um processador, transformadores específicos para cada tipo de componente e uma API REST para acesso aos serviços.

**Novidades**: 
- **Suporte MCP**: Agora compatível com o Model Context Protocol para integração direta com LLMs
- Novo formato de JSON com componentes organizados em seções e posicionamento normalizado
- Suporte para dimensões relativas e alinhamento de componentes
- Identificação automática de áreas lógicas da interface

## Uso como servidor MCP

O Model Context Protocol (MCP) permite que o Figma Component Transformer seja facilmente integrado a modelos de linguagem grandes (LLMs) como uma ferramenta que fornece contexto estruturado.

```bash
# Iniciar como servidor MCP
node mcp-server.js
```

Para mais detalhes sobre o MCP, consulte [README-MCP.md](README-MCP.md) e [smithery.md](smithery.md).

## Estrutura do Projeto

```
figma-transformers/
├── examples/
│   ├── input/                      # Exemplos de entrada para testes
│   │   └── example-figma-data.json
│   └── output/                     # Exemplos processados e assets
│       ├── assets/                 # Diretório para assets extraídos
│       ├── figma-raw.json          # Dados brutos do Figma (última extração)
│       ├── figma-processed.json    # Dados processados (última extração)
│       ├── button-example.json     # Exemplo de botão processado
│       └── list-example.json       # Exemplo de lista processada
├── scripts/
│   ├── fetch-figma.js              # Script para buscar e processar dados do Figma
│   └── process.js
├── src/
│   ├── app.js                      # Configuração da aplicação Express
│   ├── index.js                    # Ponto de entrada do servidor
│   ├── processor/                  # Lógica de processamento
│   │   └── processor.js            # Processador principal de componentes
│   ├── services/                   # Serviços externos
│   │   └── figmaService.js         # Serviço de acesso à API do Figma
│   ├── transformers/               # Transformadores específicos
│   │   └── index.js                # Registro e aplicação de transformadores
│   └── utils/                      # Utilitários
│       ├── mappings.js             # Mapeamentos de propriedades
│       └── utils.js                # Funções auxiliares
├── docs/                           # Documentação detalhada
│   ├── assets-extraction.md        # Documentação sobre extração de assets
│   ├── technical-details.md        # Detalhes técnicos (consolidado)
│   ├── component-types.md          # Documentação de tipos de componentes
│   └── figma-api-limitations.md    # Limitações da API Figma e soluções
├── mcp-server.js                   # Servidor MCP (Model Context Protocol)
├── mcp.json                        # Configuração do protocolo MCP
├── README-MCP.md                   # Documentação específica do MCP
├── smithery.md                     # Informações para publicação no Smithery
├── .env.example                    # Exemplo de configuração de variáveis de ambiente
├── package.json
└── guia-rapido.md                  # Guia rápido para iniciantes
```

## Pré-requisitos

- Node.js v18.x ou superior
- Token de API do Figma

## Instalação

1. Clone o repositório:
   ```
   git clone https://github.com/joao-loker/DS-json-organize.git
   cd DS-json-organize
   ```

2. Instale as dependências:
   ```
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```
   cp .env.example .env
   ```
   
   Abra o arquivo `.env` e adicione seu token da API do Figma:
   ```
   FIGMA_TOKEN=seu_token_figma_aqui
   ```
   
   > **IMPORTANTE**: Nunca compartilhe ou cometa seu token do Figma no repositório. O arquivo `.env` está incluído no `.gitignore` para evitar que informações sensíveis sejam adicionadas ao repositório.

## Como obter um Token do Figma

1. Acesse o site do Figma e faça login na sua conta
2. Vá em `Help & Settings` > `Account Settings`
3. Na aba `Personal Access Tokens`, clique em `Create a new token`
4. Dê um nome ao seu token e clique em `Create token`
5. Copie o token gerado (você não poderá vê-lo novamente)
6. Cole o token no seu arquivo `.env` conforme explicado acima

## Uso

### Como API REST

```bash
# Iniciar o servidor API
node src/index.js
```

O servidor API será iniciado na porta 3000 por padrão. Você pode acessar a API em `http://localhost:3000/api`.

### Como Servidor MCP

```bash
# Iniciar como servidor MCP
node mcp-server.js
```

O servidor MCP estará disponível em `http://localhost:3000`. Para mais detalhes, consulte [README-MCP.md](README-MCP.md).

### Extraindo Componentes do Figma

```bash
node scripts/fetch-figma.js https://www.figma.com/design/seu_arquivo_figma
```

Este comando extrai os componentes do arquivo do Figma especificado e salva tanto os dados brutos quanto os processados em `examples/output/`. O sistema agora organiza automaticamente os componentes em seções lógicas e normaliza suas posições para facilitar a reconstrução por IA.

### Endpoints da API REST

- `GET /api`: Retorna informações sobre a API
- `POST /api/transform`: Transforma componentes do Figma
  - Corpo da requisição: `{ "figmaUrl": "https://www.figma.com/design/seu_arquivo_figma" }`
- `GET /api/assets/:filename`: Acessa assets extraídos (imagens e ícones)

### Endpoints MCP

- `GET /`: Informações sobre o servidor MCP
- `GET /health`: Verifica o status do servidor
- `POST /transform`: Transforma componentes do Figma (endpoint principal)
- `GET /assets/:filename`: Acessa assets extraídos

## Publicação no Smithery

O [Smithery](https://smithery.ai/) é uma plataforma para descobrir, compartilhar e executar servidores MCP. Você pode publicar este servidor no Smithery para que outras pessoas possam utilizá-lo com seus agentes de IA.

Para mais detalhes sobre como publicar este projeto no Smithery, consulte o arquivo [smithery.md](smithery.md).

## Novo Formato JSON

O novo formato JSON foi aprimorado para facilitar a reconstrução de interfaces por sistemas de IA:

```json
{
  "source": "Nome do Projeto",
  "lastModified": "2025-03-20T16:16:30Z",
  "version": "2197630462658933318",
  "componentsCount": 75,
  "screen": {
    "name": "Home",
    "size": {
      "width": 390,
      "height": 844
    },
    "layout": {
      "sections": [
        {
          "title": "Header",
          "components": [...]
        },
        {
          "title": "Content",
          "components": [...]
        }
      ],
      "orderedElements": [...]
    },
    "elements": {
      "header": {...},
      "inputs": [...],
      "buttons": [...],
      "keyboard": {...},
      "other": [...]
    }
  }
}
```

## Documentação

A documentação do projeto foi reorganizada para maior clareza:

- **guia-rapido.md**: Guia essencial para iniciantes
- **docs/technical-details.md**: Documentação técnica detalhada (consolidada a partir de arquivos anteriores)
- **docs/component-types.md**: Documentação específica para cada tipo de componente
- **docs/assets-extraction.md**: Guia para extração e uso de assets
- **README-MCP.md**: Documentação específica para uso como servidor MCP
- **smithery.md**: Instruções para publicação no Smithery

## Componentes Suportados

O sistema suporta atualmente os seguintes tipos de componentes:

- Button
- Header
- Input
- OnboardingInput
- Keyboard
- List
- Text
- RadioButton
- OnboardCodeField

## Informações para Desenvolvedores

Para contribuir com o projeto, consulte o arquivo `docs/technical-details.md` que contém a documentação técnica consolidada sobre o funcionamento interno do sistema.

Para dúvidas rápidas e exemplos de uso, consulte o `guia-rapido.md`.

## Exemplos

### Exemplo de Saída para um Botão com Asset

```json
{
  "id": "2139:96740",
  "name": "Main-Primary",
  "type": "INSTANCE",
  "properties": {
    "size": {
      "width": 358,
      "height": 56
    },
    "position": {
      "x": -10142,
      "y": 6710
    },
    "componentProperties": {
      "Show icon end#343:8": {
        "value": false,
        "type": "BOOLEAN"
      },
      "Label#343:5": {
        "value": "Next",
        "type": "TEXT"
      },
      "Type": {
        "value": "Text",
        "type": "VARIANT",
        "boundVariables": {}
      }
    },
    "assets": {
      "2139:96741": "examples/output/assets/2139-96741.png"
    }
  }
}
```

## Contribuição

Contribuições são bem-vindas! Para contribuir, por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo LICENSE para detalhes.

## Autor

João Pereira - [@joao-loker](https://github.com/joao-loker) 