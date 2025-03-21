/**
 * FigmaMind MCP - Versão minimalista para Cursor
 * Implementação simplificada do MCP para garantir compatibilidade com Cursor
 */

const readline = require('readline');
const figmaService = require('./src/services/figmaService');
const { processData } = require('./src/processor');
require('dotenv').config();

// Configuração do token Figma
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

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

// Função para depuração sem interferir no STDIO
function debug(message) {
  process.stderr.write(`[DEBUG] ${message}\n`);
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
  
  if (!FIGMA_TOKEN) {
    throw new Error("FIGMA_TOKEN não configurado");
  }
  
  try {
    debug(`Iniciando processamento de ${figmaUrl}`);
    const figmaResult = await figmaService.fetchFigmaFromUrl(figmaUrl);
    const processed = await processData(figmaResult.data, figmaResult.fileKey);
    
    return {
      success: true,
      message: `Processados ${processed.componentsCount || processed.meta?.totalComponents || 0} componentes`,
      source: figmaUrl,
      data: processed
    };
  } catch (error) {
    throw new Error(error.message || "Erro no processamento do Figma");
  }
}

// Função para manipular solicitações JSON-RPC
async function handleJsonRpcRequest(request) {
  const { id, method, params } = request;
  
  try {
    let result;
    
    switch (method) {
      case 'initialize':
        // Responder ao método initialize com informações básicas
        result = {
          name: "figmamind",
          version: "1.0.0",
          description: "MCP server que transforma componentes do Figma em formato JSON padronizado",
          protocol_version: params?.protocol_version || "0.3",
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
    
  } catch (error) {
    return {
      jsonrpc: "2.0",
      error: { 
        code: -32603, 
        message: error.message || "Internal error" 
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
  } catch (error) {
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
  debug('Conexão STDIO encerrada');
  process.exit(0);
});

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  debug(`Erro não tratado: ${error.message}`);
  process.exit(1);
});

// Inicialização concluída
debug("FigmaMind MCP iniciado no modo STDIO"); 