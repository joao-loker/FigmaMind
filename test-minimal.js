/**
 * Teste para minimal-mcp.js
 * Simula requisições do Cursor para testar o protocolo
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Constantes
const SERVER_PATH = path.join(__dirname, 'minimal-mcp.js');
const LOG_FILE = path.join(__dirname, 'logs', 'test-minimal.log');

// Função de log
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}\n`;
  
  // Adicionar ao arquivo de log
  fs.appendFileSync(LOG_FILE, logMessage);
  
  // Imprimir no console
  console.log(message);
}

// Garantir que o diretório de logs existe
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

// Limpar log anterior
fs.writeFileSync(LOG_FILE, '');

// Iniciar MCP server
log(`Iniciando MCP server: ${SERVER_PATH}`);

const mcpProcess = spawn('node', [SERVER_PATH], {
  env: {
    ...process.env,
    FIGMA_TOKEN: 'dummy-token-for-testing'
  }
});

// Registrar PID
log(`MCP server iniciado com PID: ${mcpProcess.pid}`);

// Capturar saída do servidor
mcpProcess.stdout.on('data', (data) => {
  const output = data.toString().trim();
  log(`Saída do MCP (stdout): ${output}`);
  
  try {
    // Verificar se a saída é JSON válido
    const json = JSON.parse(output);
    log(`Resposta JSON válida recebida com ID: ${json.id}`);
  } catch (e) {
    log(`ERRO: Saída não é JSON válido: ${e.message}`);
  }
});

mcpProcess.stderr.on('data', (data) => {
  log(`Log do MCP (stderr): ${data.toString().trim()}`);
});

// Enviar requisição de inicialização depois de pequeno delay
setTimeout(() => {
  const initRequest = {
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      client: {
        name: "TestClient",
        version: "1.0.0"
      }
    },
    id: 1
  };
  
  log(`Enviando requisição de inicialização`);
  mcpProcess.stdin.write(JSON.stringify(initRequest) + '\n');
}, 1000);

// Enviar requisição de ferramentas
setTimeout(() => {
  const toolsRequest = {
    jsonrpc: "2.0",
    method: "tools/list",
    params: {},
    id: 2
  };
  
  log(`Enviando requisição de ferramentas`);
  mcpProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
}, 2000);

// Testar a execução da ferramenta
setTimeout(() => {
  const callRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "figmamind_transform",
      params: {
        figmaUrl: "https://www.figma.com/file/example"
      }
    },
    id: 3
  };
  
  log(`Enviando requisição de execução da ferramenta`);
  mcpProcess.stdin.write(JSON.stringify(callRequest) + '\n');
}, 3000);

// Finalizar teste após 5 segundos
setTimeout(() => {
  log('Finalizando teste');
  mcpProcess.kill();
  log('Teste concluído com sucesso');
  process.exit(0);
}, 5000); 