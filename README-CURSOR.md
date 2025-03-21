# FigmaMind - Guia de integração com o Cursor

Este guia descreve como configurar o FigmaMind como um serviço MCP (Multi-processing Communication Protocol) para integração com o Cursor.

## Problema e Solução

Durante a integração com o Cursor, foram identificados vários desafios:

1. **Mensagens de log interferindo no protocolo JSON-RPC**
   - O Cursor espera que todas as mensagens enviadas via stdout sigam rigorosamente o formato JSON-RPC
   - Logs no console padrão interferem na comunicação

2. **Dependências complexas e incompatibilidade**
   - A estrutura original do projeto possui dependências que podem causar problemas

3. **Configuração do MCP**
   - A configuração precisa ser específica para suportar o protocolo do Cursor

## Solução implementada

Para resolver esses problemas, criamos uma versão minimalista do MCP com as seguintes características:

- Sem dependências externas
- Logs redirecionados para stderr em vez de stdout
- Interface STDIO completa para JSON-RPC
- Mock simplificado do processador Figma para testes

## Arquivos disponíveis

- `minimal-mcp.js`: Versão minimalista do servidor MCP
- `test-minimal.js`: Script de teste para verificar a integração
- `mcp-server.js`: Versão original do servidor (não recomendada para uso com Cursor)

## Como configurar no Cursor

1. Abra o arquivo de configuração do Cursor:
   ```
   ~/.cursor/mcp.json
   ```

2. Adicione ou atualize a configuração do FigmaMind:
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

3. Substitua "/caminho/completo/para/" pelo caminho real para o diretório do projeto
4. Substitua "seu-token-do-figma" pelo seu token de acesso da API do Figma

## Testando a configuração

Execute o script de teste para verificar se o MCP está funcionando corretamente:

```
node test-minimal.js
```

Se tudo estiver configurado corretamente, você verá mensagens indicando:
- Servidor MCP iniciado
- Respostas JSON válidas para as requisições de inicialização, lista de ferramentas e execução de ferramenta

## Ferramenta disponível

`figmamind_transform`: Transforma componentes do Figma em formato JSON padronizado

### Parâmetros
- `figmaUrl`: URL do arquivo ou frame do Figma para processar

## Solução de problemas

- **Erro "Socket closed unexpectedly"**: Verifique se não há mensagens de log interferindo na comunicação
- **Erro "[object Object]"**: Provavelmente existe um problema na configuração do MCP
- **Conexão recusada**: Verifique se o caminho para o script está correto

## Desenvolvimento

Para implementar novas funcionalidades:

1. Modifique o `minimal-mcp.js` para incluir a lógica real em vez do mock
2. Mantenha os logs apenas no stderr usando a função `debug()`
3. Teste com o script `test-minimal.js` para garantir compatibilidade

---

Desenvolvido por João Pereira 