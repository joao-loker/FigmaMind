/**
 * FigmaMind MCP - Versão ultra minimalista para Cursor
 * Sem dependências externas e sem logs no stdout
 */

const readline = require('readline');

// Função para depuração - usa stderr
function debug(message) {
  process.stderr.write(`[DEBUG] ${message}\n`);
}

// Definições de ferramentas
const tools = [
  {
    name: "figmamind_transform",
    description: "Transforma componentes do Figma em formato JSON padronizado",
    schema: {
      type: "object",
      required: ["figmaUrl"],
      properties: {
        figmaUrl: {
          type: "string",
          description: "URL do arquivo ou frame do Figma para processar"
        }
      }
    }
  }
];

// Mock simples do processador Figma para testes
async function mockFigmaProcessor(figmaUrl) {
  // Simula processamento sem dependências externas
  return {
    success: true,
    message: "Processados 10 componentes (simulação)",
    source: figmaUrl,
    data: {
      components: [
        { id: "mock-button-1", type: "button", name: "Primary Button" },
        { id: "mock-button-2", type: "button", name: "Secondary Button" }
      ],
      meta: {
        totalComponents: 10,
        processedAt: new Date().toISOString()
      }
    }
  };
}

// Função para executar a ferramenta
async function callTool(name, params) {
  if (name !== 'figmamind_transform') {
    throw new Error(`Ferramenta '${name}' não encontrada`);
  }
  
  const { figmaUrl } = params || {};
  
  if (!figmaUrl) {
    throw new Error("Missing figmaUrl parameter");
  }
  
  try {
    debug(`Processando URL: ${figmaUrl}`);
    // Usar mock em vez de chamadas reais
    return await mockFigmaProcessor(figmaUrl);
  } catch (err) {
    debug(`Erro: ${err.message}`);
    throw new Error(err.message || "Erro no processamento");
  }
}

// Função para manipular solicitações JSON-RPC
async function handleJsonRpcRequest(request) {
  const { id, method, params } = request;
  
  try {
    let result;
    
    debug(`Método: ${method}, ID: ${id}`);
    
    switch (method) {
      case 'initialize':
        // Responder ao método initialize com informações básicas
        result = {
          name: "figmamind",
          version: "1.0.0",
          description: "MCP server que transforma componentes do Figma em formato JSON padronizado",
          protocol_version: params?.protocolVersion || "2024-11-05",
          capabilities: {
            tools: true
          }
        };
        break;
        
      case 'tools/list':
        // Listar ferramentas disponíveis
        result = { tools };
        break;
        
      case 'tools/call':
        // Executar uma ferramenta
        if (!params || !params.name) {
          throw new Error("Missing tool name");
        }
        
        result = await callTool(params.name, params.params);
        break;
        
      default:
        return {
          jsonrpc: "2.0",
          error: { 
            code: -32601, 
            message: `Method '${method}' not found` 
          },
          id
        };
    }
    
    return {
      jsonrpc: "2.0",
      result,
      id
    };
    
  } catch (err) {
    debug(`Erro na requisição: ${err.message}`);
    return {
      jsonrpc: "2.0",
      error: { 
        code: -32603, 
        message: err.message || "Internal error" 
      },
      id
    };
  }
}

// Configurar STDIO
const rl = readline.createInterface({
  input: process.stdin,
  output: null, // Não usar stdout para evitar interferência
  terminal: false
});

// Processar linhas de entrada
rl.on('line', async (line) => {
  if (!line || !line.trim()) return;
  
  try {
    const request = JSON.parse(line);
    const response = await handleJsonRpcRequest(request);
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (err) {
    debug(`Erro na linha: ${err.message}`);
    // Em caso de erro de parsing, enviar resposta de erro
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error" },
      id: null
    }) + '\n');
  }
});

// Gerenciar encerramento
rl.on('close', () => {
  debug('Conexão encerrada');
  process.exit(0);
});

// Capturar erros não tratados
process.on('uncaughtException', (err) => {
  debug(`Erro não tratado: ${err.message}`);
  process.exit(1);
});

// Inicialização concluída
debug("MCP minimalista iniciado"); 