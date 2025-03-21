#!/usr/bin/env node

/**
 * MCP Server - FigmaMind
 * Implementação de servidor MCP (Model Context Protocol) para 
 * extrair componentes do Figma e convertê-los para JSON padronizado.
 */

// Importações de módulos
const fs = require('fs');
const readline = require('readline');
const figmaService = require('./src/services/figmaService');
const componentProcessor = require('./src/services/componentProcessor');
const jsonTransformer = require('./src/services/jsonTransformer');

// Configuração e inicialização
const DEBUG = process.env.MCP_DEBUG === 'true' || false;
const SUPPRESS_LOGS = process.env.MCP_SUPPRESS_LOGS === 'true' || false;
const USE_STDIO = process.env.MCP_USE_STDIO === 'true' || false;
const TEST_MODE = process.argv.includes('--test');

// Buscando token do Figma da variável de ambiente ou argumentos
let FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';

// Processamento mais robusto de argumentos da linha de comando
process.argv.forEach((arg, index, array) => {
  // Verifica argumentos na forma --config={"figmaToken":"xyz"}
  if (arg.startsWith('--config=')) {
    try {
      const configStr = arg.replace('--config=', '');
      const config = JSON.parse(configStr);
      if (config.figmaToken) {
        FIGMA_TOKEN = config.figmaToken;
        logDebug(`Token do Figma encontrado nos argumentos (--config)`);
      }
    } catch (e) {
      logDebug(`Erro ao analisar argumento --config: ${e.message}`);
    }
  }
  
  // Verifica argumentos na forma --figmaToken=xyz
  if (arg.startsWith('--figmaToken=')) {
    FIGMA_TOKEN = arg.replace('--figmaToken=', '');
    logDebug(`Token do Figma encontrado nos argumentos (--figmaToken)`);
  }
  
  // Verifica argumentos na forma -c ou --config seguido por JSON
  if ((arg === '-c' || arg === '--config') && index < array.length - 1) {
    try {
      const config = JSON.parse(array[index + 1]);
      if (config.figmaToken) {
        FIGMA_TOKEN = config.figmaToken;
        logDebug(`Token do Figma encontrado nos argumentos (-c/--config)`);
      }
    } catch (e) {
      logDebug(`Erro ao analisar argumento de configuração: ${e.message}`);
    }
  }
});

// Função para depuração - usa stderr para não interferir com STDIO
function logDebug(message) {
  if (DEBUG && !SUPPRESS_LOGS) {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[DEBUG][${timestamp}] ${message}\n`);
  }
}

// Logs de erro - sempre exibidos a menos que SUPPRESS_LOGS seja true
function logError(message) {
  if (!SUPPRESS_LOGS) {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[ERROR][${timestamp}] ${message}\n`);
  }
}

// Logs de informação
function logInfo(message) {
  if (!SUPPRESS_LOGS) {
    const timestamp = new Date().toISOString();
    process.stderr.write(`[INFO][${timestamp}] ${message}\n`);
  }
}

// Validação inicial
if (!FIGMA_TOKEN && !TEST_MODE) {
  logError('Token do Figma não encontrado. Defina a variável de ambiente FIGMA_TOKEN ou passe via argumento --figmaToken=xyz');
  process.exit(1);
}

// Definições de ferramentas
const tools = [
  {
    name: "figmamind_transform",
    description: "Transforma componentes do Figma em formato JSON padronizado para consumo por modelos de IA",
    schema: {
      type: "object",
      required: ["figmaUrl"],
      properties: {
        figmaUrl: {
          type: "string",
          description: "URL do arquivo ou frame do Figma para processar"
        },
        components: {
          type: "array",
          description: "Lista opcional de IDs de componentes específicos para processar",
          items: {
            type: "string"
          }
        },
        options: {
          type: "object",
          description: "Opções de processamento",
          properties: {
            includeStyles: {
              type: "boolean",
              description: "Incluir informações de estilo detalhadas"
            },
            includeConstraints: {
              type: "boolean",
              description: "Incluir informações de constraints"
            },
            flattenNestedComponents: {
              type: "boolean",
              description: "Achatar componentes aninhados em uma estrutura plana"
            }
          }
        }
      }
    }
  }
];

// Função para processar componentes do Figma
async function processFigmaComponents(figmaUrl, options = {}) {
  logDebug(`Processando URL do Figma: ${figmaUrl}`);
  
  try {
    // Extrair o ID do arquivo do URL do Figma
    const fileId = figmaUrl.match(/file\/([^\/]+)/)?.[1] || figmaUrl;
    
    if (!fileId) {
      throw new Error(`URL do Figma inválido: ${figmaUrl}`);
    }
    
    logDebug(`ID do arquivo Figma: ${fileId}`);
    
    // Buscar dados do arquivo do Figma
    const figmaFileData = await figmaService.getFigmaFile(fileId, FIGMA_TOKEN);
    
    // Processar componentes
    const processedComponents = await componentProcessor.processComponents(
      figmaFileData, 
      options.components, 
      options.options
    );
    
    // Transformar para o formato JSON padronizado
    const jsonResult = jsonTransformer.transformToStandardJson(
      processedComponents, 
      fileId,
      figmaUrl
    );
    
    logDebug(`Processamento concluído. ${jsonResult.components?.length || 0} componentes extraídos.`);
    
    return {
      success: true,
      message: `Processados ${jsonResult.components?.length || 0} componentes`,
      source: figmaUrl,
      data: jsonResult
    };
    
  } catch (err) {
    logError(`Erro ao processar componentes: ${err.message}`);
    return {
      success: false,
      message: `Erro: ${err.message}`,
      source: figmaUrl,
      error: err.message
    };
  }
}

// Função para executar a ferramenta
async function callTool(name, params) {
  if (name !== 'figmamind_transform') {
    throw new Error(`Ferramenta '${name}' não encontrada`);
  }
  
  const { figmaUrl, components, options } = params || {};
  
  if (!figmaUrl) {
    throw new Error("Parâmetro figmaUrl é obrigatório");
  }
  
  try {
    return await processFigmaComponents(figmaUrl, { components, options });
  } catch (err) {
    logError(`Erro na execução da ferramenta: ${err.message}`);
    throw new Error(err.message || "Erro no processamento do Figma");
  }
}

// Função para manipular solicitações JSON-RPC
async function handleJsonRpcRequest(request) {
  const { id, method, params } = request;
  
  try {
    let result;
    
    logDebug(`Método recebido: ${method}, ID: ${id}`);
    
    switch (method) {
      case 'initialize':
        // Responder ao método initialize com informações do servidor
        result = {
          name: "figmamind",
          version: "1.0.0",
          description: "MCP server que transforma componentes do Figma em formato JSON padronizado para consumo por modelos de IA",
          protocol_version: params?.protocolVersion || "1.0",
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
          throw new Error("Nome da ferramenta não especificado");
        }
        
        result = await callTool(params.name, params.params);
        break;
        
      default:
        logDebug(`Método não encontrado: ${method}`);
        return {
          jsonrpc: "2.0",
          error: { 
            code: -32601, 
            message: `Método '${method}' não encontrado` 
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
    logError(`Erro ao processar requisição: ${err.message}`);
    return {
      jsonrpc: "2.0",
      error: { 
        code: -32603, 
        message: err.message || "Erro interno" 
      },
      id
    };
  }
}

// Função para configurar comunicação STDIO
function setupStdio() {
  logInfo('Iniciando servidor MCP via STDIO');
  
  // Keepalive para manter o processo ativo
  const keepAliveInterval = setInterval(() => {
    // No-op, apenas para manter o processo ativo
  }, 10000);
  
  // Usando interface readline para processamento linha a linha
  const rl = readline.createInterface({
    input: process.stdin,
    output: null, // Não usar stdout para readline
    terminal: false
  });

  // Tratamento de erros no stream de entrada
  process.stdin.on('error', (err) => {
    logError(`Erro no stream de entrada: ${err.message}`);
  });

  // Handler para cada linha recebida
  rl.on('line', async (line) => {
    if (!line || !line.trim()) return;
    
    try {
      logDebug(`Recebido: ${line}`);
      const request = JSON.parse(line);
      const response = await handleJsonRpcRequest(request);
      
      // Garantir que o stdout seja o único canal de comunicação com o cliente
      process.stdout.write(JSON.stringify(response) + '\n');
      logDebug(`Enviado: ${JSON.stringify(response)}`);
    } catch (err) {
      logError(`Erro ao processar linha: ${err.message}`);
      // Em caso de erro de parsing, enviar resposta de erro
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32700, message: "Erro de parsing" },
        id: null
      }) + '\n');
    }
  });

  // Gerenciar encerramento da conexão
  rl.on('close', () => {
    logInfo('Conexão STDIO encerrada');
    clearInterval(keepAliveInterval);
    // Não encerrar o processo automaticamente para permitir reconexões
    // process.exit(0);
  });
  
  // Manter o processo vivo mesmo se stdin for fechado
  process.stdin.resume();
}

// Verificação de módulos e dependências essenciais
async function runDiagnostics() {
  console.log("=== Diagnóstico do FigmaMind MCP Server ===");
  console.log(`Node.js: ${process.version}`);
  console.log(`Sistema Operacional: ${process.platform}`);
  
  // Verificar módulos essenciais
  console.log("\n[1] Verificando módulos essenciais...");
  const requiredModules = ['fs', 'readline'];
  let allModulesOk = true;
  
  for (const module of requiredModules) {
    try {
      require(module);
      console.log(`✓ Módulo ${module} carregado com sucesso`);
    } catch (err) {
      console.log(`✗ Erro ao carregar módulo ${module}: ${err.message}`);
      allModulesOk = false;
    }
  }
  
  // Verificar serviços locais
  console.log("\n[2] Verificando serviços locais...");
  try {
    console.log(`✓ figmaService disponível`);
    console.log(`✓ componentProcessor disponível`);
    console.log(`✓ jsonTransformer disponível`);
  } catch (err) {
    console.log(`✗ Erro ao verificar serviços: ${err.message}`);
    allModulesOk = false;
  }

  // Verificar token do Figma
  console.log("\n[3] Verificando configuração do token do Figma...");
  if (FIGMA_TOKEN) {
    console.log(`✓ Token do Figma configurado: ${FIGMA_TOKEN.substring(0, 10)}...`);
    
    // Validação básica do formato do token
    if (FIGMA_TOKEN.startsWith('figd_')) {
      console.log(`✓ Formato do token parece válido`);
    } else {
      console.log(`⚠ Aviso: O formato do token não parece seguir o padrão esperado (figd_...)`);
    }
  } else {
    console.log(`✗ Token do Figma não encontrado`);
  }
  
  // Verificar ferramentas disponíveis
  console.log("\n[4] Verificando ferramentas disponíveis...");
  console.log(`✓ ${tools.length} ferramentas registradas:`);
  tools.forEach(tool => {
    console.log(`  - ${tool.name}: ${tool.description.substring(0, 60)}...`);
  });
  
  // Resumo
  console.log("\n=== Resumo do Diagnóstico ===");
  if (allModulesOk) {
    console.log("✅ Todos os módulos essenciais estão funcionando corretamente");
    console.log(`✅ FigmaMind MCP Server está pronto para uso via ${USE_STDIO ? 'STDIO' : 'HTTP'}`);
  } else {
    console.log("❌ Há problemas que precisam ser resolvidos antes de usar o servidor");
  }
  
  console.log("\nPara iniciar o servidor em modo normal, execute sem a flag --test");
}

// Função principal
async function main() {
  logInfo('Iniciando FigmaMind MCP Server');
  logDebug(`Modo de depuração: ${DEBUG ? 'ativado' : 'desativado'}`);
  logDebug(`Token do Figma: ${FIGMA_TOKEN ? FIGMA_TOKEN.substring(0, 10) + '...' : 'não definido'}`);
  
  // Se estiver em modo de teste, executar diagnósticos e sair
  if (TEST_MODE) {
    await runDiagnostics();
    process.exit(0);
  }
  
  // Iniciar no modo STDIO (compatível com Smithery e Cursor)
  if (USE_STDIO) {
    setupStdio();
  } else {
    // Fallback para STDIO se nenhum modo especificado
    setupStdio();
  }
  
  // Tratamento de sinais para encerramento limpo
  process.on('SIGINT', () => {
    logInfo('Recebido sinal SIGINT, encerrando servidor...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    logInfo('Recebido sinal SIGTERM, encerrando servidor...');
    process.exit(0);
  });
  
  // Capturar erros não tratados
  process.on('uncaughtException', (err) => {
    logError(`Erro não tratado: ${err.message}`);
    logError(err.stack);
    // Não encerrar o processo para manter o servidor funcionando
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    logError(`Rejeição não tratada em promise: ${reason}`);
    // Não encerrar o processo para manter o servidor funcionando
  });
  
  logInfo('Servidor inicializado e aguardando comandos...');
}

// Iniciar o servidor
main().catch(err => {
  logError(`Erro fatal na inicialização: ${err.message}`);
  logError(err.stack);
  process.exit(1);
}); 