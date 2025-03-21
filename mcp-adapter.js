#!/usr/bin/env node
/**
 * MCP Adapter - Script adaptador para facilitar a comunicação com o Cursor
 * Este script serve como intermediário entre o Cursor e o FigmaMind MCP
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configurações
const DEBUG = true;
const LOG_FILE = path.join(__dirname, 'logs', 'mcp-adapter.log');

// Criar pasta de logs se não existir
try {
  if (!fs.existsSync(path.join(__dirname, 'logs'))) {
    fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
  }
} catch (error) {
  console.error(`Erro ao criar pasta de logs: ${error.message}`);
}

// Função de log
function log(message) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    // Escrever no arquivo de log
    try {
      fs.appendFileSync(LOG_FILE, logMessage);
    } catch (error) {
      // Silenciar erros de log para não interferir no protocolo
    }
  }
}

log('Iniciando MCP Adapter para FigmaMind');

// Iniciar o processo filho (servidor MCP)
const mcpProcess = spawn('node', ['mcp-server.js'], {
  env: {
    ...process.env,
    MCP_USE_STDIO: 'true',
    MCP_DEBUG: 'true',
    FIGMA_TOKEN: process.env.FIGMA_TOKEN || 'figd_dPRrkuMWX6UbPZMKrHhLP3j-ui7SQOc3WiTxb0hP'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

log(`Processo filho iniciado com PID ${mcpProcess.pid}`);

// Encaminhar entrada do Cursor para o servidor MCP
process.stdin.on('data', (data) => {
  const input = data.toString().trim();
  log(`Entrada recebida: ${input}`);
  
  try {
    // Verificar se é um JSON válido
    JSON.parse(input);
    mcpProcess.stdin.write(data);
  } catch (error) {
    log(`Erro ao processar entrada (não é JSON válido): ${error.message}`);
  }
});

// Encaminhar saída do servidor MCP para o Cursor
mcpProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  log(`Saída do MCP: ${output}`);
  
  try {
    // Verificar se é um JSON válido antes de encaminhar
    JSON.parse(output);
    process.stdout.write(data);
  } catch (error) {
    log(`Erro ao processar saída (não é JSON válido): ${error.message}`);
  }
});

// Capturar erros do servidor MCP
mcpProcess.stderr.on('data', (data) => {
  log(`Erro do MCP: ${data.toString().trim()}`);
});

// Lidar com término do processo
mcpProcess.on('close', (code) => {
  log(`Processo MCP encerrado com código ${code}`);
  process.exit(code);
});

// Garantir limpeza ao encerrar
process.on('SIGINT', () => {
  log('Recebido SIGINT, encerrando processos');
  mcpProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  log('Recebido SIGTERM, encerrando processos');
  mcpProcess.kill('SIGTERM');
});

log('MCP Adapter inicializado e pronto para comunicação'); 