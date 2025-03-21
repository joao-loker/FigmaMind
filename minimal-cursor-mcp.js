#!/usr/bin/env node

/**
 * FigmaMind MCP - Versão Mínima
 * 
 * Esta é uma versão ultra-simplificada do MCP para resolver o erro "failed to create client"
 */

const readline = require('readline');
const fs = require('fs');

// Logging simples
function log(msg) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync('minimal-mcp.log', `[${timestamp}] ${msg}\n`);
  } catch (e) {
    // Falha silenciosa
  }
}

log('=== INICIANDO MINIMAL MCP ===');
log(`Node.js: ${process.version}`);
log(`CWD: ${process.cwd()}`);

// Interface readline para STDIO
const rl = readline.createInterface({
  input: process.stdin,
  output: null,
  terminal: false
});

// Ferramentas disponíveis
const TOOLS = [
  {
    name: "testConnection",
    description: "Testa a conexão com o servidor MCP",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Mensagem opcional"
        }
      }
    }
  }
];

// Processa cada linha recebida
rl.on('line', (line) => {
  try {
    log(`RECEBIDO: ${line}`);
    
    if (!line || !line.trim()) return;
    
    const request = JSON.parse(line);
    const { id, method, params } = request;
    
    let response;
    
    // Método initialize
    if (method === 'initialize') {
      response = {
        jsonrpc: "2.0",
        result: {
          name: "FigmaMind Minimal MCP",
          version: "1.0.0",
          description: "MCP mínimo para testar conexão",
          protocol_version: "1.0",
          capabilities: { tools: true }
        },
        id
      };
    } 
    // Método tools/list
    else if (method === 'tools/list') {
      response = {
        jsonrpc: "2.0",
        result: { tools: TOOLS },
        id
      };
    } 
    // Método tools/call
    else if (method === 'tools/call') {
      const toolName = params?.name;
      
      if (toolName === 'testConnection') {
        response = {
          jsonrpc: "2.0",
          result: { 
            success: true, 
            message: `Conexão funcionando. Mensagem: ${params?.params?.message || 'Nenhuma'}`
          },
          id
        };
      } else {
        response = {
          jsonrpc: "2.0",
          error: { code: -32601, message: `Ferramenta não encontrada: ${toolName}` },
          id
        };
      }
    } 
    // Método não suportado
    else {
      response = {
        jsonrpc: "2.0",
        error: { code: -32601, message: `Método não suportado: ${method}` },
        id
      };
    }
    
    // Enviar resposta
    process.stdout.write(JSON.stringify(response) + '\n');
    log(`ENVIADO: ${JSON.stringify(response)}`);
  } 
  catch (err) {
    log(`ERRO: ${err.message}`);
    
    // Enviar erro de parsing
    process.stdout.write(JSON.stringify({
      jsonrpc: "2.0",
      error: { code: -32700, message: "Erro de parsing" },
      id: null
    }) + '\n');
  }
});

// Manter o processo vivo e lidar com eventos
process.stdin.resume();

process.stdin.on('end', () => {
  log('STDIN encerrado, mas mantendo processo vivo');
});

process.on('uncaughtException', (err) => {
  log(`Exceção não tratada: ${err.message}`);
});

// Heartbeat para log
setInterval(() => {
  log('Heartbeat');
}, 5000);

log('MCP pronto para comunicação'); 