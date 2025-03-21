/**
 * Script de teste para o MCP corrigido
 * Simula requisições do Cursor
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuração
const SERVER_PATH = path.join(__dirname, 'cursor-fixed-mcp.js');
const LOG_FILE = path.join(__dirname, 'logs', 'test-fixed-mcp.log');

// Função para logs
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(LOG_FILE, logMessage);
  console.log(message);
}

// Criar pasta de logs
if (!fs.existsSync(path.join(__dirname, 'logs'))) {
  fs.mkdirSync(path.join(__dirname, 'logs'), { recursive: true });
}

log('Iniciando teste do MCP corrigido');

// Iniciar o processo servidor MCP
const mcpProcess = spawn('node', [SERVER_PATH], {
  env: {
    ...process.env,
    FIGMA_TOKEN: 'figd_dPRrkuMWX6UbPZMKrHhLP3j-ui7SQOc3WiTxb0hP'
  },
  stdio: ['pipe', 'pipe', 'pipe']
});

log(`Servidor MCP iniciado com PID ${mcpProcess.pid}`);

// Capturar a saída do servidor
mcpProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  log(`Recebido do servidor: ${output}`);
});

// Capturar erros do servidor
mcpProcess.stderr.on('data', (data) => {
  const error = data.toString().trim();
  log(`Erro do servidor: ${error}`);
});

// Enviar uma requisição de inicialização
setTimeout(() => {
  log('Enviando requisição initialize');
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: true,
        prompts: false,
        resources: true,
        logging: false,
        roots: {
          listChanged: false
        }
      },
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

// Enviar uma requisição tools/list
setTimeout(() => {
  log('Enviando requisição tools/list');
  const toolsRequest = {
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/list'
  };
  
  mcpProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 2000);

// Finalizar o teste após 5 segundos
setTimeout(() => {
  log('Finalizando teste');
  mcpProcess.kill();
  process.exit(0);
}, 5000); 