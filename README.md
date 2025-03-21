# FigmaMind

Conectando o design do Figma com a mente dos LLMs - Um sistema para extrair componentes do Figma e transformá-los em formato JSON padronizado que facilita a reconstrução de interfaces por IA.

**[NOVO]**: Agora disponível como servidor MCP (Model Context Protocol) para integração direta com LLMs!

## Sobre o Projeto

O FigmaMind permite extrair componentes do Figma através da API oficial e transformá-los em um formato JSON padronizado que pode ser facilmente consumido por aplicações e sistemas de IA para reconstrução de interfaces. O sistema é composto por um extrator, um processador, transformadores específicos para cada tipo de componente e uma API REST para acesso aos serviços.

**Novidades**: 
- **Suporte MCP**: Agora compatível com o Model Context Protocol para integração direta com LLMs
- Novo formato de JSON com componentes organizados em seções e posicionamento normalizado
- Suporte para dimensões relativas e alinhamento de componentes
- Identificação automática de áreas lógicas da interface

## Uso como servidor MCP

O Model Context Protocol (MCP) permite que o FigmaMind seja facilmente integrado a modelos de linguagem grandes (LLMs) como uma ferramenta que fornece contexto estruturado.

```bash
# Iniciar como servidor MCP
node mcp-server.js
```

Para mais detalhes sobre o MCP, consulte [README-MCP.md](README-MCP.md) e [smithery.md](smithery.md).

## Integração com o Cursor

O FigmaMind agora pode ser usado como uma extensão do Cursor (IDE baseada em IA) através do protocolo MCP. Isso permite que você transforme componentes do Figma diretamente nas suas conversas com a IA.

Para configurar a integração com o Cursor:

```bash
# Iniciar a versão minimalista recomendada para o Cursor
./start-mcp.sh --minimal
```

Ou edite o arquivo de configuração do Cursor:
```json
"FigmaMind": {
  "type": "stdio",
  "command": "node",
  "args": [
    "/caminho/completo/para/minimal-mcp.js"
  ],
  "env": {
    "FIGMA_TOKEN": "seu-token-do-figma"
  }
}
```

Para mais detalhes sobre a integração com Cursor, consulte [README-CURSOR.md](README-CURSOR.md).

## Estrutura do Projeto

```
figmamind/
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
   git clone https://github.com/joao-loker/FigmaMind.git
   cd FigmaMind
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
- **docs/technical-details.md**: Documentação técnica detalhada (consolidado a partir de arquivos anteriores)
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

## Troubleshooting

Aqui estão soluções para problemas comuns que você pode encontrar:

### Erro "Client Closed" no Cursor/Claude Desktop

Se você estiver encontrando o erro "Client Closed" no Cursor quando tenta utilizar o FigmaMind, pode ser devido a um dos seguintes motivos:

1. **Versão do Node.js incompatível**
   - O FigmaMind funciona melhor com Node.js versão 18.x
   - Verifique sua versão atual: `node --version`
   - A versão 23.x pode causar problemas com o protocolo STDIO

2. **Token do Figma inválido ou ausente**
   - Verifique se o token do Figma está configurado corretamente em todos os lugares necessários:
     - No arquivo `.env` para execução direta
     - Na configuração do Smithery quando executado via Smithery
     - Nas opções de configuração quando executado via Cursor

3. **Problemas de comunicação via STDIO**
   - Execute o servidor com modo de debug ativado: `node mcp-server.js --debug`
   - Verifique os logs para identificar onde a comunicação está falhando

4. **Timeout da API do Figma**
   - Algumas vezes a API do Figma pode levar muito tempo para responder ou ficar temporariamente indisponível
   - Tente novamente mais tarde ou com um arquivo Figma menos complexo

### Comandos de diagnóstico

Execute estes comandos para diagnosticar problemas:

```bash
# Testar configuração local do servidor
node mcp-server.js --test

# Testar comunicação com STDIO
node mcp-server.js --debug < test-request.json

# Verificar instalação no Smithery
npx @smithery/cli@latest list
```

Lembre-se de reiniciar o Cursor após fazer alterações nas configurações para que elas entrem em vigor. 

# FigmaMind MCP Server

Servidor MCP (Model Context Protocol) para extrair componentes do Figma e convertê-los para um formato JSON padronizado, ideal para consumo em modelos de IA e outras ferramentas.

## Requisitos

- Node.js 18.x ou superior (recomendado 20.x)
- Token de acesso à API do Figma

## Instalação

### Via Smithery (recomendado)

```bash
# Instalação no Claude Desktop
npx -y @smithery/cli@latest install @joao-loker/figmamind --client claude --config "{\"figmaToken\":\"seu_token_aqui\"}"

# Instalação no Cursor
npx -y @smithery/cli@latest install @joao-loker/figmamind --client cursor --config "{\"figmaToken\":\"seu_token_aqui\"}"
```

### Instalação manual

1. Clone o repositório e instale as dependências:

```bash
git clone https://github.com/joao-loker/figmamind.git
cd figmamind
npm install
```

2. Defina seu token do Figma:

```bash
# Linux/macOS
export FIGMA_TOKEN="seu_token_aqui"

# Windows (cmd)
set FIGMA_TOKEN=seu_token_aqui

# Windows (PowerShell)
$env:FIGMA_TOKEN="seu_token_aqui"
```

3. Inicie o servidor MCP:

```bash
# Para Node.js 20.x (recomendado)
./start-with-node20.sh

# Ou diretamente
node mcp-server.js
```

## Configuração para Cursor

Se você quiser usar o FigmaMind diretamente no Cursor sem usar o Smithery, você pode configurar manualmente o arquivo de configuração MCP:

```json
{
  "mcpServers": {
    "figmamind": {
      "command": "node",
      "args": ["/caminho/para/FigmaMind/mcp-server.js"],
      "env": {
        "FIGMA_TOKEN": "seu_token_aqui",
        "MCP_DEBUG": "true",
        "MCP_USE_STDIO": "true",
        "NODE_OPTIONS": "--no-experimental-fetch"
      }
    }
  }
}
```

O arquivo está localizado em:
- macOS: `~/Library/Application Support/Cursor/User/globalStorage/anysphere.claude-mcp/cline_mcp_settings.json`
- Windows: `%APPDATA%\Cursor\User\globalStorage\anysphere.claude-mcp\cline_mcp_settings.json`
- Linux: `~/.config/Cursor/User/globalStorage/anysphere.claude-mcp/cline_mcp_settings.json`

## Uso

Uma vez configurado, o serviço ficará disponível no Claude Desktop ou Cursor como uma ferramenta chamada "figmamind_transform".

Exemplo de uso via Claude:

```
Quero transformar este design do Figma em componentes: https://www.figma.com/file/seu_arquivo_aqui
```

## Parâmetros

A ferramenta aceita os seguintes parâmetros:

- `figmaUrl`: URL ou ID do arquivo do Figma (obrigatório)
- `components`: Lista de IDs de componentes específicos para processar (opcional)
- `options`: Opções de processamento (opcional)
  - `includeStyles`: Incluir informações detalhadas de estilo
  - `includeConstraints`: Incluir informações de constraints
  - `flattenNestedComponents`: Achatar componentes aninhados em uma estrutura plana

## Troubleshooting

### Erro "Failed to create client"

Este erro pode ocorrer por diversos motivos:

1. **Versão incompatível do Node.js**:
   - Certifique-se de estar usando Node.js versão 18.x ou 20.x
   - O Node.js 23.x pode causar problemas de compatibilidade com o Cursor

2. **Problema com o Figma Token**:
   - Verifique se o token começa com `figd_`
   - Confirme que o token tem permissões de acesso aos arquivos do Figma
   - Tente gerar um novo token na interface do Figma

3. **Erro "Client closed"**:
   - **Problema**: Este erro ocorre quando o Cursor não consegue manter uma conexão estável com o servidor MCP
   - **Solução 1**: Adicione a variável de ambiente `NODE_OPTIONS="--no-experimental-fetch"` nas configurações do MCP no Cursor
   - **Solução 2**: Verifique se você está usando um comando direto (e não NPX) para iniciar o servidor
   - **Solução 3**: Reinicie o Cursor após modificar as configurações
   - **Solução 4**: Use o script `start-with-node20.sh` para garantir a compatibilidade de versão

4. **Script de diagnóstico**:
   
   Para verificar se o servidor está configurado corretamente:
   
   ```bash
   node mcp-server.js --test
   ```

### Comandos úteis para diagnóstico

```bash
# Verificar versão do Node.js
node --version

# Testar servidor MCP
node mcp-server.js --test

# Verificar se o token do Figma é válido
curl -H "X-Figma-Token: seu_token_aqui" https://api.figma.com/v1/me
```

## Desenvolvimento

Para contribuir com o desenvolvimento:

1. Clone o repositório
2. Instale as dependências com `npm install`
3. Faça suas alterações
4. Execute os testes com `npm test`
5. Envie um pull request 