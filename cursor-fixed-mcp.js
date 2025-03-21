/**
 * FigmaMind MCP - Versão minimalista para Cursor (CORRIGIDA)
 * Implementação simplificada sem qualquer stdout além do protocolo
 */

const readline = require('readline');
const figmaService = require('./src/services/figmaService');
const { processData } = require('./src/processor');
require('dotenv').config();

// Configuração e inicialização
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

// Função para depuração
function debug(message) {
  process.stderr.write(`[DEBUG] ${message}\n`);
}

// Função para erro
function error(message) {
  process.stderr.write(`[ERROR] ${message}\n`);
}

// ============= SISTEMA DE REGISTRO DE TRANSFORMADORES EMBUTIDO =============
// Registro central de transformadores - implementado diretamente para evitar imports que façam console.log
const transformerRegistry = new Map();

function registerTransformer(componentType, transformer) {
  if (typeof componentType !== 'string' || !componentType) {
    throw new Error('O tipo de componente deve ser uma string não vazia');
  }
  
  if (typeof transformer !== 'function') {
    throw new Error('O transformador deve ser uma função');
  }
  
  transformerRegistry.set(componentType.toLowerCase(), transformer);
  // Log enviado para stderr em vez de stdout
  debug(`Transformador registrado para: ${componentType}`);
}

function getTransformer(componentType) {
  if (!componentType) return null;
  
  const type = componentType.toLowerCase();
  return transformerRegistry.get(type) || null;
}

// ============= FERRAMENTAS MCP =============
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
  } catch (err) {
    error(`Erro no processamento: ${err.message}`);
    throw new Error(err.message || "Erro no processamento do Figma");
  }
}

// ============= MANIPULADOR DE REQUISIÇÕES JSON-RPC =============
async function handleJsonRpcRequest(request) {
  const { id, method, params } = request;
  
  try {
    let result;
    
    debug(`Processando método ${method} com ID ${id}`);
    
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
    error(`Erro ao processar requisição: ${err.message}`);
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

// ============= CONFIGURAÇÃO DO STDIO =============
const rl = readline.createInterface({
  input: process.stdin,
  output: null, // Não usar stdout para evitar interferência
  terminal: false
});

// Processar linhas de entrada
rl.on('line', async (line) => {
  if (!line || !line.trim()) return;
  
  try {
    debug(`Entrada recebida: ${line.substring(0, 100)}...`);
    const request = JSON.parse(line);
    const response = await handleJsonRpcRequest(request);
    
    debug(`Enviando resposta: ${JSON.stringify(response).substring(0, 100)}...`);
    process.stdout.write(JSON.stringify(response) + '\n');
  } catch (err) {
    error(`Erro ao processar linha: ${err.message}`);
    
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
process.on('uncaughtException', (err) => {
  error(`Erro não tratado: ${err.message}`);
  error(err.stack);
  process.exit(1);
});

// Inicialização do MCP
debug("FigmaMind MCP iniciado no modo STDIO"); 