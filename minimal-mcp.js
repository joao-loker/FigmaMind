#!/usr/bin/env node

/**
 * FigmaMind MCP - Versão ultra minimalista para Cursor
 * Sem dependências externas e com tratamento robusto de conexões
 */

// Configuração para depuração
const DEBUG = true;

// Módulos nativos
const readline = require('readline');

// Logs via stderr (não interferem na comunicação STDIO)
function log(message) {
  if (DEBUG) console.error(`[DEBUG] ${message}`);
}

// Inicialização
log('Iniciando servidor MCP minimalista');

// Comunicação via STDIO
const rl = readline.createInterface({
  input: process.stdin,
  output: null,
  terminal: false
});

// Evitar que o processo termine quando stdin fechar
process.stdin.on('end', () => {
  log('stdin stream ended, but keeping process alive');
});

// Tratamento de erros
process.stdin.on('error', (err) => {
  log(`Erro no stdin: ${err.message}`);
});

process.stdout.on('error', (err) => {
  log(`Erro no stdout: ${err.message}`);
});

// Handler para cada linha recebida
rl.on('line', (line) => {
  try {
    log(`Recebido: ${line}`);
    
    if (!line || !line.trim()) return;
    
    // Tentar processar como JSON
    const request = JSON.parse(line);
    const { id, method, params } = request;
    
    // Preparar resposta básica
    let response;
    
    if (method === 'initialize') {
      response = {
        jsonrpc: "2.0",
        result: {
          name: "figmamind-minimal",
          version: "1.0.0",
          description: "Minimal MCP server for FigmaMind",
          protocol_version: params?.protocolVersion || "1.0",
          capabilities: {
            tools: true
          }
        },
        id
      };
    } else if (method === 'tools/list') {
      response = {
        jsonrpc: "2.0",
        result: {
          tools: [
            {
              name: "figmamind_minimal_test",
              description: "A test tool for minimal FigmaMind MCP",
              schema: {
                type: "object",
                required: ["message"],
                properties: {
                  message: {
                    type: "string",
                    description: "Message to echo back"
                  }
                }
              }
            }
          ]
        },
        id
      };
    } else if (method === 'tools/call' && params?.name === 'figmamind_minimal_test') {
      response = {
        jsonrpc: "2.0",
        result: {
          success: true,
          message: `Received: ${params.params.message || 'No message provided'}`,
          timestamp: new Date().toISOString()
        },
        id
      };
    } else {
      response = {
        jsonrpc: "2.0",
        error: { 
          code: -32601, 
          message: `Method '${method}' not supported in minimal MCP` 
        },
        id
      };
    }
    
    // Enviar resposta
    process.stdout.write(JSON.stringify(response) + '\n');
    log(`Resposta enviada: ${JSON.stringify(response)}`);
  } catch (err) {
    log(`Erro ao processar mensagem: ${err.message}`);
    
    // Enviar erro de parsing
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Parse error" },
      id: null
    }) + '\n');
  }
});

// Configurações para manter o processo vivo
rl.on('close', () => {
  log('readline closed, but keeping process alive');
  
  // Tentar recriar o readline após um breve intervalo
  setTimeout(() => {
    try {
      const newRl = readline.createInterface({
        input: process.stdin,
        output: null,
        terminal: false
      });
      
      newRl.on('line', rl.listeners('line')[0]);
      newRl.on('close', rl.listeners('close')[0]);
      log('Readline reconnected successfully');
    } catch (err) {
      log(`Failed to reconnect readline: ${err.message}`);
    }
  }, 1000);
});

// Manter stdin aberto
process.stdin.resume();

// Heartbeat para mostrar que o processo ainda está vivo
setInterval(() => {
  log('Heartbeat - process still alive');
}, 5000);

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  log(`Uncaught exception: ${err.message}`);
  // Não encerrar o processo
});

process.on('unhandledRejection', (reason) => {
  log(`Unhandled rejection: ${reason}`);
  // Não encerrar o processo
});

log('Minimal MCP server started and waiting for commands...'); 