/**
 * MCP Server para FigmaMind
 * Este arquivo implementa o Model Context Protocol para o FigmaMind
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const readline = require('readline');
const figmaService = require('./src/services/figmaService');
const { processData } = require('./src/processor');
require('dotenv').config();

// Configuração de logging
const SUPPRESS_LOGS = process.env.MCP_SUPPRESS_LOGS === 'true';
const USE_STDIO = process.env.MCP_USE_STDIO === 'true';
const DEBUG = process.env.MCP_DEBUG === 'true';

// Verificar se o modo de teste foi solicitado
const TEST_MODE = process.argv.includes('--test');

// Modo de compatibilidade para Smithery
const SMITHERY_COMPAT = process.env.SMITHERY_COMPAT === 'true';

// Função para logs de debugging
function debug(...args) {
  if (DEBUG) {
    process.stderr.write(`[DEBUG] ${args.join(' ')}\n`);
  }
}

// Função de log personalizada para evitar logs no stdout quando necessário
const logger = {
  log: (...args) => {
    // Nunca usar console.log no modo STDIO, mesmo se SUPPRESS_LOGS for false
    if (!SUPPRESS_LOGS && !USE_STDIO) {
      console.log(...args);
    } else if (DEBUG) {
      // No modo STDIO ou com supressão ativa, usar stderr para debug
      process.stderr.write(`[INFO] ${args.join(' ')}\n`);
    }
  },
  error: (...args) => {
    if (!SUPPRESS_LOGS && !USE_STDIO) {
      console.error(...args);
    } else {
      // Sempre registrar erros, mas usar stderr para não interferir no protocolo
      process.stderr.write(`[ERROR] ${args.join(' ')}\n`);
    }
  },
  warn: (...args) => {
    if (!SUPPRESS_LOGS && !USE_STDIO) {
      console.warn(...args);
    } else if (DEBUG) {
      process.stderr.write(`[WARN] ${args.join(' ')}\n`);
    }
  },
  info: (...args) => {
    if (!SUPPRESS_LOGS && !USE_STDIO) {
      console.info(...args);
    } else if (DEBUG) {
      process.stderr.write(`[INFO] ${args.join(' ')}\n`);
    }
  }
};

// Constantes
const ASSETS_DIR = path.resolve('examples/output/assets');
const OUTPUT_DIR = path.resolve('examples/output');

// Criar diretórios necessários
fs.ensureDirSync(OUTPUT_DIR);
fs.ensureDirSync(ASSETS_DIR);

// Verificar modo de execução (HTTP ou stdio)
// const USE_STDIO = process.env.MCP_USE_STDIO === 'true'; // Já definido acima

// Carregar informações do MCP
function loadMcpConfig() {
  try {
    return fs.readJsonSync(path.resolve('mcp.json'));
  } catch (error) {
    logger.error('Erro ao carregar mcp.json:', error);
    return {
      name: "figmamind",
      version: "1.0.0",
      description: "MCP server que transforma componentes do Figma em formato JSON padronizado",
      protocol_version: "0.3"
    };
  }
}

// Lista de ferramentas/endpoints disponíveis
function getAvailableTools() {
  const mcpConfig = loadMcpConfig();
  const tools = [];
  
  if (mcpConfig.tools && Array.isArray(mcpConfig.tools)) {
    mcpConfig.tools.forEach(tool => {
      tools.push({
        name: tool.name,
        description: tool.description || '',
        schema: tool.schema || {}
      });
    });
  }
  
  return tools;
}

// Executa uma ferramenta específica
async function callTool(name, params) {
  debug(`Chamando ferramenta: ${name} com parâmetros: ${JSON.stringify(params)}`);
  
  switch (name) {
    case 'figmamind_transform':
      const { figmaUrl } = params || {};
      
      if (!figmaUrl) {
        throw new Error("Missing figmaUrl parameter");
      }
      
      // Verificar token do Figma
      if (!process.env.FIGMA_TOKEN) {
        throw new Error("FIGMA_TOKEN não configurado");
      }
      
      try {
        // Buscar dados do Figma
        debug(`Iniciando processamento de ${figmaUrl}`);
        const figmaResult = await figmaService.fetchFigmaFromUrl(figmaUrl);
        
        // Processar dados
        const processed = await processData(figmaResult.data, figmaResult.fileKey);
        
        return {
          success: true,
          message: `Processados ${processed.componentsCount || processed.meta?.totalComponents || 0} componentes`,
          source: figmaUrl,
          data: processed
        };
      } catch (error) {
        debug(`Erro ao executar transformação: ${error.message}`);
        throw new Error(error.message || "Erro no processamento do Figma");
      }
    
    default:
      throw new Error(`Ferramenta '${name}' não encontrada`);
  }
}

// Adicionar esta função antes do bloco de código STDIO para processar as requisições
async function processRequest(request) {
  try {
    debug(`Processando requisição: ${request.method}, ID: ${request.id}`);
    
    // Validar requisição JSON-RPC básica
    if (!request || typeof request !== 'object' || typeof request.method !== 'string') {
      return {
        jsonrpc: "2.0",
        error: { code: -32600, message: "Invalid Request" },
        id: request?.id || null
      };
    }
    
    // Implementar os métodos padrão do MCP
    switch (request.method) {
      case 'listTools':
        debug('Listando ferramentas disponíveis');
        return {
          jsonrpc: "2.0",
          result: {
            tools: getAvailableTools()
          },
          id: request.id
        };
        
      case 'invokeToolByName':
        if (!request.params || !request.params.name || !request.params.parameters) {
          return {
            jsonrpc: "2.0",
            error: { code: -32602, message: "Parâmetros inválidos para invokeToolByName" },
            id: request.id
          };
        }
        
        debug(`Invocando ferramenta: ${request.params.name}`);
        const result = await callTool(
          request.params.name,
          request.params.parameters
        );
        
        return {
          jsonrpc: "2.0",
          result,
          id: request.id
        };
        
      default:
        return {
          jsonrpc: "2.0",
          error: {
            code: -32601,
            message: `Método não encontrado: ${request.method}`
          },
          id: request.id
        };
    }
  } catch (error) {
    logger.error(`Erro processando requisição ${request?.method}:`, error);
    return {
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: `Erro interno do servidor: ${error.message || 'Erro desconhecido'}`
      },
      id: request?.id || null
    };
  }
}

// Manipulador de solicitações JSON-RPC
async function handleJsonRpcRequest(request) {
  try {
    const { id, method, params } = request;
    
    // Log para debug
    debug(`Recebido JSON-RPC: ${JSON.stringify(request)}`);
    
    if (!id) {
      debug('ID ausente na requisição, usando ID nulo');
    }
    
    if (!method) {
      debug('Método ausente na requisição');
      return { 
        jsonrpc: "2.0", 
        error: { code: -32600, message: "Invalid Request - Missing method" }, 
        id: id || null 
      };
    }

    let result;
    
    // Manipular diferentes métodos
    switch (method) {
      case 'initialize':
        try {
          // Verificar se estamos usando a versão mais recente do MCP que usa initialParams 
          // e adaptar para compatibilidade
          const mcpConfig = loadMcpConfig();
          
          debug(`Initialize chamado com params: ${JSON.stringify(params)}`);
          
          // Garantir que estamos retornando os campos obrigatórios de acordo com o MCP
          result = {
            name: mcpConfig.name || "figmamind",
            version: mcpConfig.version || "1.0.0",
            description: mcpConfig.description || "MCP server que transforma componentes do Figma em formato JSON padronizado",
            protocol_version: params?.protocol_version || mcpConfig.protocol_version || "0.3",
            capabilities: {
              supports_stdio: true,
              supports_http: true
            }
          };
          
          // Log específico para debugging do initialize
          debug(`Initialize response: ${JSON.stringify({jsonrpc: "2.0", result, id: id})}`);
        } catch (error) {
          logger.error('Erro ao inicializar MCP:', error);
          return {
            jsonrpc: "2.0",
            error: { code: -32603, message: "Erro ao inicializar servidor MCP" },
            id
          };
        }
        break;
        
      case 'info':
        try {
          const mcpConfig = loadMcpConfig();
          result = {
            name: mcpConfig.name,
            version: mcpConfig.version,
            description: mcpConfig.description,
            protocol_version: mcpConfig.protocol_version,
            endpoints: Object.keys(mcpConfig.endpoints || {}).map(key => {
              const endpoint = mcpConfig.endpoints[key];
              return {
                name: key,
                path: endpoint.path,
                method: endpoint.method,
                description: endpoint.description
              };
            })
          };
        } catch (error) {
          logger.error('Erro ao obter informações MCP:', error);
          return {
            jsonrpc: "2.0",
            error: { code: -32603, message: "Erro ao obter informações do servidor MCP" },
            id
          };
        }
        break;
        
      case 'health':
        // Verificar se o token do Figma está configurado
        const token = process.env.FIGMA_TOKEN;
        
        if (!token) {
          return {
            jsonrpc: "2.0",
            error: { code: -32603, message: "FIGMA_TOKEN não configurado" },
            id
          };
        }
        
        result = {
          status: 'ok',
          message: 'FigmaMind MCP operacional'
        };
        break;
        
      case 'transform':
        const { figmaUrl } = params || {};
        
        if (!figmaUrl) {
          return {
            jsonrpc: "2.0",
            error: { code: -32602, message: "Missing figmaUrl parameter" },
            id
          };
        }
        
        // Verificar token do Figma
        if (!process.env.FIGMA_TOKEN) {
          return {
            jsonrpc: "2.0",
            error: { code: -32603, message: "FIGMA_TOKEN não configurado" },
            id
          };
        }
        
        try {
          // Buscar dados do Figma
          logger.log(`Iniciando processamento de ${figmaUrl}`);
          const figmaResult = await figmaService.fetchFigmaFromUrl(figmaUrl);
          
          // Processar dados
          const processed = await processData(figmaResult.data, figmaResult.fileKey);
          
          // Salvar dados brutos e processados
          await fs.writeJson(
            path.join(OUTPUT_DIR, 'figma-raw.json'), 
            figmaResult.data, 
            { spaces: 2 }
          );
          
          await fs.writeJson(
            path.join(OUTPUT_DIR, 'figma-processed.json'), 
            processed, 
            { spaces: 2 }
          );
          
          result = {
            success: true,
            message: `Processados ${processed.componentsCount || processed.meta?.totalComponents || 0} componentes`,
            source: figmaUrl,
            data: processed
          };
        } catch (error) {
          logger.error('Erro ao processar transformação:', error);
          return {
            jsonrpc: "2.0",
            error: { code: -32603, message: error.message || "Internal server error" },
            id
          };
        }
        break;
        
      default:
        return {
          jsonrpc: "2.0",
          error: { code: -32601, message: `Method '${method}' not found` },
          id
        };
    }
    
    return {
      jsonrpc: "2.0",
      result,
      id
    };
  } catch (error) {
    logger.error('Erro ao processar solicitação JSON-RPC:', error);
    return {
      jsonrpc: "2.0",
      error: { code: -32603, message: "Internal JSON-RPC error" },
      id: request?.id || null
    };
  }
}

// Adicionar no início do código principal, antes da inicialização do servidor
if (TEST_MODE) {
  logger.log('Iniciando teste de diagnóstico do servidor MCP...');
  
  // Testar se os módulos necessários estão disponíveis
  try {
    logger.log('1. Verificando carregamento de módulos essenciais...');
    const modules = [
      'express', 'cors', 'fs-extra', 'axios'
    ];
    
    let allModulesOk = true;
    for (const moduleName of modules) {
      try {
        require(moduleName);
        logger.log(`✓ Módulo ${moduleName}: OK`);
      } catch (err) {
        logger.error(`✗ Módulo ${moduleName}: FALHA - ${err.message}`);
        allModulesOk = false;
      }
    }
    
    if (!allModulesOk) {
      logger.error('Alguns módulos estão faltando. Execute: npm install');
    }
    
    // Verificar token do Figma
    logger.log('\n2. Verificando configuração...');
    const figmaToken = process.env.FIGMA_TOKEN;
    if (figmaToken) {
      logger.log('✓ Token do Figma: CONFIGURADO');
    } else {
      logger.error('✗ Token do Figma: NÃO CONFIGURADO');
      logger.log('  Defina em .env ou como variável de ambiente: FIGMA_TOKEN=seu-token');
    }
    
    // Verificar ferramentas disponíveis
    logger.log('\n3. Verificando ferramentas disponíveis...');
    const tools = getAvailableTools();
    if (tools && tools.length > 0) {
      logger.log(`✓ Ferramentas disponíveis: ${tools.length}`);
      tools.forEach(tool => {
        logger.log(`  - ${tool.name}: ${tool.description}`);
      });
    } else {
      logger.error('✗ Nenhuma ferramenta disponível');
    }
    
    logger.log('\nDiagnóstico concluído. O servidor parece estar configurado corretamente.');
  } catch (error) {
    logger.error('Erro durante o diagnóstico:', error);
  }
  
  // Não iniciar o servidor após o diagnóstico
  process.exit(0);
}

// Iniciar modo stdio se necessário
if (USE_STDIO) {
  logger.log('Iniciando protocolo MCP em modo STDIO...');
  debug('MCP_USE_STDIO=true, usando protocolo JSON-RPC via STDIO');
  
  // Garantir que o buffer seja recebido corretamente
  process.stdin.setEncoding('utf8');
  
  // Aumentar o buffer para mensagens grandes
  if (process.stdin.setRawMode) {
    try {
      process.stdin.setRawMode(true);
    } catch (e) {
      debug('Aviso: Não foi possível definir o modo raw para stdin:', e.message);
    }
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });
  
  // Log de inicialização do servidor para debug
  debug('Servidor STDIO inicializado e aguardando comandos...');
  
  rl.on('line', async (line) => {
    if (!line.trim()) {
      // Ignorar linhas vazias
      return;
    }
    
    try {
      debug(`Recebido comando STDIO: ${line.substr(0, 100)}${line.length > 100 ? '...' : ''}`);
      const request = JSON.parse(line);
      
      if (!request.id) {
        debug('Aviso: Requisição sem ID recebida');
        return;
      }
      
      // Processar a requisição
      const response = await processRequest(request);
      
      // Enviar a resposta
      const responseText = JSON.stringify(response);
      debug(`Enviando resposta STDIO: ${responseText.substr(0, 100)}${responseText.length > 100 ? '...' : ''}`);
      
      process.stdout.write(responseText + '\n');
    } catch (error) {
      logger.error('Erro processando comando STDIO:', error);
      
      // Tentar responder com erro se tiver um ID
      try {
        const errorId = (line && JSON.parse(line).id) || 'unknown-id';
        const errorResponse = {
          jsonrpc: '2.0',
          id: errorId,
          error: {
            code: -32000,
            message: `Erro interno do servidor: ${error.message || 'Erro desconhecido'}`
          }
        };
        
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      } catch (respondError) {
        logger.error('Não foi possível enviar resposta de erro:', respondError);
      }
    }
  });
  
  // Tratar encerramento
  rl.on('close', () => {
    debug('Conexão STDIO encerrada');
    process.exit(0);
  });
  
  // Capturar erros de processo para evitar crashes
  process.on('uncaughtException', (error) => {
    debug(`Erro não tratado: ${error.message}`);
    debug(error.stack);
  });
  
  // Enviar um erro para saídas que não sejam STDIO
  process.stderr.write('[INFO] FigmaMind MCP iniciado em modo STDIO\n');
} else {
  // Inicializar app
  const app = express();

  // Middlewares
  app.use(express.json());
  app.use(cors());

  // Usar morgan apenas se não estiver suprimindo logs
  if (!SUPPRESS_LOGS) {
    app.use(morgan('dev'));
  }

  // MCP Info Endpoint
  app.get('/', (req, res) => {
    try {
      const mcpConfig = loadMcpConfig();
      return res.json({
        name: mcpConfig.name,
        version: mcpConfig.version,
        description: mcpConfig.description,
        protocol_version: mcpConfig.protocol_version,
        endpoints: Object.keys(mcpConfig.endpoints || {}).map(key => {
          const endpoint = mcpConfig.endpoints[key];
          return {
            name: key,
            path: endpoint.path,
            method: endpoint.method,
            description: endpoint.description
          };
        })
      });
    } catch (error) {
      logger.error('Erro ao obter informações MCP:', error);
      return res.status(500).json({
        error: 'Erro ao obter informações do servidor MCP'
      });
    }
  });

  // MCP Health Check Endpoint
  app.get('/health', (req, res) => {
    // Verificar se o token do Figma está configurado
    const token = process.env.FIGMA_TOKEN;
    
    if (!token) {
      return res.status(503).json({
        status: 'error',
        message: 'FIGMA_TOKEN não configurado'
      });
    }
    
    return res.json({
      status: 'ok',
      message: 'FigmaMind MCP operacional'
    });
  });

  // JSON-RPC Endpoint
  app.post('/jsonrpc', async (req, res) => {
    try {
      // Garantir que o corpo é uma solicitação JSON-RPC
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({
          jsonrpc: "2.0",
          error: { code: -32600, message: "Invalid Request" },
          id: null
        });
      }

      // Processar a solicitação
      const response = await handleJsonRpcRequest(req.body);
      
      // Enviar a resposta
      return res.json(response);
    } catch (error) {
      logger.error('Erro ao processar solicitação JSON-RPC:', error);
      return res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal JSON-RPC error" },
        id: req.body?.id || null
      });
    }
  });

  // MCP Transform Endpoint
  app.post('/transform', async (req, res) => {
    try {
      const { figmaUrl } = req.body;
      
      if (!figmaUrl) {
        return res.status(400).json({
          error: 'Missing figmaUrl parameter'
        });
      }
      
      // Verificar token do Figma
      if (!process.env.FIGMA_TOKEN) {
        return res.status(401).json({
          error: 'FIGMA_TOKEN não configurado. Configure o token do Figma nas variáveis de ambiente.'
        });
      }
      
      // Buscar dados do Figma
      logger.log(`Iniciando processamento de ${figmaUrl}`);
      const figmaResult = await figmaService.fetchFigmaFromUrl(figmaUrl);
      
      // Processar dados
      const processed = await processData(figmaResult.data, figmaResult.fileKey);
      
      // Salvar dados brutos e processados
      await fs.writeJson(
        path.join(OUTPUT_DIR, 'figma-raw.json'), 
        figmaResult.data, 
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(OUTPUT_DIR, 'figma-processed.json'), 
        processed, 
        { spaces: 2 }
      );
      
      // Responder com os dados processados
      res.json({
        success: true,
        message: `Processados ${processed.componentsCount || processed.meta?.totalComponents || 0} componentes`,
        source: figmaUrl,
        data: processed
      });
    } catch (error) {
      logger.error('Erro ao processar transformação:', error);
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  });

  // MCP Assets Endpoint
  app.get('/assets/:filename', (req, res) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(ASSETS_DIR, filename);
      
      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          error: 'Asset not found'
        });
      }
      
      // Determinar tipo de conteúdo com base na extensão
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
      else if (ext === '.svg') contentType = 'image/svg+xml';
      
      // Enviar o arquivo
      res.setHeader('Content-Type', contentType);
      res.sendFile(filePath);
    } catch (error) {
      logger.error('Erro ao acessar asset:', error);
      res.status(500).json({
        error: error.message || 'Internal server error'
      });
    }
  });

  // Aceitar solicitações WebSocket para JSON-RPC
  app.get('/ws', (req, res) => {
    res.setHeader('Upgrade', 'websocket');
    res.status(426).json({
      error: 'WebSocket upgrade requerido. Faça um upgrade de conexão para WebSocket para comunicação JSON-RPC.'
    });
  });

  // Iniciar servidor
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.log(`FigmaMind MCP iniciado na porta ${PORT}`);
    logger.log(`Servidor disponível em http://localhost:${PORT}`);
    logger.log(`Endpoints MCP: / (info), /health, /transform, /assets/:filename, /jsonrpc (JSON-RPC)`);
  });
} 