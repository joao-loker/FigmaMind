# FigmaMind - MCP

O FigmaMind é um servidor MCP (Model Context Protocol) que transforma componentes do Figma em um formato JSON padronizado, facilitando a reconstrução de interfaces por sistemas de IA.

## O que é MCP?

O [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) é um protocolo aberto que padroniza como aplicações fornecem contexto para LLMs (Large Language Models). É semelhante a uma "porta USB-C para aplicações de IA", permitindo que modelos de linguagem se conectem a diferentes fontes de dados e ferramentas de forma padronizada.

## Funcionalidades

Este servidor MCP fornece:

- Extração de componentes do Figma através da API oficial
- Transformação dos componentes em formato JSON padronizado
- Organização dos componentes em seções lógicas
- Extração de assets (imagens, ícones) e suas propriedades visuais
- Endpoints MCP padronizados para integração com LLMs

## Pré-requisitos

- Node.js v18.x ou superior
- Token de API do Figma

## Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/joao-loker/FigmaMind.git
   cd FigmaMind
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   ```bash
   cp .env.example .env
   ```
   
   Abra o arquivo `.env` e adicione seu token da API do Figma:
   ```
   FIGMA_TOKEN=seu_token_figma_aqui
   PORT=3000
   ```

## Execução como Servidor MCP

Execute o servidor MCP com o seguinte comando:

```bash
node mcp-server.js
```

O servidor estará disponível em `http://localhost:3000` (ou na porta configurada no arquivo `.env`).

## Endpoints MCP

- **`GET /`**: Informações sobre o servidor MCP
- **`GET /health`**: Verifica o status do servidor
- **`POST /transform`**: Transforma componentes do Figma (endpoint principal)
  - Corpo da requisição: `{ "figmaUrl": "https://www.figma.com/design/seu_arquivo_figma" }`
- **`GET /assets/:filename`**: Acessa assets extraídos

## Exemplo de Uso com cURL

```bash
curl -X POST http://localhost:3000/transform \
  -H "Content-Type: application/json" \
  -d '{"figmaUrl": "https://www.figma.com/design/Mlgjf3cCMzOIwM27GLx81Y/New-Onboarding?node-id=2045-33564"}'
```

## Uso com Smithery

O [Smithery](https://smithery.ai/) é uma plataforma para descobrir, compartilhar e executar servidores MCP. Você pode publicar este servidor no Smithery para que outras pessoas possam utilizá-lo com seus agentes de IA.

### Publicação no Smithery

1. Certifique-se de que seu código esteja atualizado no GitHub.

2. Acesse [smithery.ai](https://smithery.ai/) e faça login.

3. Clique em "Add" e selecione "GitHub Repository".

4. Adicione a URL do seu repositório e siga as instruções.

5. O Smithery detectará automaticamente seu arquivo `smithery.yaml` e utilizará as informações nele para configurar o servidor.

### Uso direto via CLI do Smithery

Você pode usar o FigmaMind diretamente através da CLI do Smithery:

```bash
npx @smithery/cli@latest run @joao-loker/figmamind --config '{"figmaToken":"seu-token-do-figma"}'
```

### Integração com o Cursor

Para integrar o FigmaMind no Cursor via Smithery, adicione a seguinte configuração ao arquivo `~/.cursor/mcp.json`:

```json
"figmamind": {
  "command": "npx",
  "args": [
    "-y",
    "@smithery/cli@latest",
    "run",
    "@joao-loker/figmamind",
    "--config",
    "{\"figmaToken\":\"seu-token-do-figma\"}"
  ]
}
```

Para usar com uma API key do Smithery:

```json
"figmamind": {
  "command": "npx",
  "args": [
    "-y",
    "@smithery/cli@latest",
    "run",
    "@joao-loker/figmamind",
    "--api-key",
    "sua-api-key-do-smithery",
    "--config",
    "{\"figmaToken\":\"seu-token-do-figma\"}"
  ]
}
```

### Configuração de Segurança para o Smithery

No Smithery, você precisará configurar a variável de ambiente `FIGMA_TOKEN` como segredo. Isso permite que o servidor se comunique com o Figma API sem expor seu token.

Alternativamente, você pode obter uma API key do Smithery em seu perfil em [smithery.ai](https://smithery.ai/) e usá-la para autenticação.

## Modelo de Resposta

O endpoint `/transform` retorna dados neste formato:

```json
{
  "success": true,
  "message": "Processados 75 componentes",
  "source": "https://www.figma.com/design/Mlgjf3cCMzOIwM27GLx81Y/New-Onboarding?node-id=2045-33564",
  "data": {
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
        "sections": [...]
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
}
```

## Segurança

**IMPORTANTE**: Nunca compartilhe ou cometa seu token do Figma no repositório. O arquivo `.env` está incluído no `.gitignore` para evitar que informações sensíveis sejam adicionadas ao repositório.

## Solução de Problemas

- **Erro 401**: Verifique se o token do Figma está configurado corretamente no arquivo `.env`.
- **Erro ao processar transformação**: Verifique se a URL do Figma está correta e se você tem acesso ao arquivo.
- **Asset não encontrado**: Certifique-se de que o asset foi extraído corretamente durante o processamento.

## Contribuição

Contribuições são bem-vindas! Para contribuir, por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request 