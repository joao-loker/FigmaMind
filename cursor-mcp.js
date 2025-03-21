#!/usr/bin/env node

/**
 * FigmaMind MCP - Versão Ultra Simplificada para Cursor
 * Implementação mínima projetada para evitar o erro "client closed"
 */

// Módulos nativos
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuração
const DEBUG = true;
const CONFIG_FILE = path.join(__dirname, 'figmamind-config.json');
let figmaToken = process.env.FIGMA_TOKEN || '';

// Funções de utilitário
function log(message) {
  if (DEBUG) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [CURSOR-MCP] ${message}`;
    process.stderr.write(formattedMessage + '\n');
    
    // Também salvar em arquivo de log
    try {
      fs.appendFileSync(path.join(__dirname, 'cursor-mcp.log'), formattedMessage + '\n');
    } catch (err) {
      // Falha silenciosa ao escrever no log
    }
  }
}

// Salvar configuração
function saveConfig() {
  try {
    const config = { figmaToken };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (err) {
    log(`Erro ao salvar configuração: ${err.message}`);
  }
}

// Carregar configuração
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.figmaToken) {
        figmaToken = config.figmaToken;
        log(`Configuração carregada com sucesso`);
      }
    }
  } catch (err) {
    log(`Erro ao carregar configuração: ${err.message}`);
  }
}

// Validar token Figma
function isValidFigmaToken(token) {
  return typeof token === 'string' && /^figd_[A-Za-z0-9_-]+$/.test(token);
}

// Função para obter arquivos do Figma (simulada)
async function getFigmaDesign(fileId) {
  log(`Solicitando Figma design com ID: ${fileId}`);
  
  if (!isValidFigmaToken(figmaToken)) {
    return { 
      error: true, 
      message: 'Token Figma inválido. Configure um token válido usando setFigmaToken.' 
    };
  }
  
  const tokenStart = figmaToken.slice(0, 10);
  log(`Usando token Figma (truncado): ${tokenStart}...`);
  
  // Simulação - em um cenário real, isso faria uma solicitação à API do Figma
  return {
    success: true,
    name: "Design de exemplo",
    components: [
      { id: "btn-01", name: "Button Primary", type: "Button" },
      { id: "inp-01", name: "Input Field", type: "TextField" }
    ],
    message: "Esta é uma resposta simulada, pois não estamos fazendo uma solicitação real à API do Figma."
  };
}

// Inicialização
log('Iniciando FigmaMind Cursor MCP');
loadConfig();

// Configurar interface de leitura para comunicação STDIO
const rl = readline.createInterface({
  input: process.stdin,
  output: null,
  terminal: false
});

// Evitar que o processo termine quando stdin fechar
process.stdin.on('end', () => {
  log('stdin encerrado, mantendo processo ativo');
  // Não encerrar para permitir reconexão
});

// Tratamento de erros
process.stdin.on('error', (err) => {
  log(`Erro no stdin: ${err.message}`);
  // Tentar recuperar o stream
  process.stdin.resume();
});

process.stdout.on('error', (err) => {
  log(`Erro no stdout: ${err.message}`);
});

// Ferramentas disponíveis
const TOOLS = [
  {
    name: "getFigmaDesign",
    description: "Obtém informações de design de um arquivo do Figma",
    schema: {
      type: "object",
      required: ["fileId"],
      properties: {
        fileId: {
          type: "string",
          description: "ID do arquivo do Figma (ex: 'abcDEF123456')"
        }
      }
    }
  },
  {
    name: "setFigmaToken",
    description: "Define o token de API do Figma",
    schema: {
      type: "object",
      required: ["token"],
      properties: {
        token: {
          type: "string",
          description: "Token de API do Figma (deve começar com 'figd_')"
        }
      }
    }
  },
  {
    name: "testConnection",
    description: "Testa a conexão com o servidor MCP",
    schema: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Mensagem opcional para ecoar de volta"
        }
      }
    }
  }
];

// Handler para cada linha recebida
rl.on('line', async (line) => {
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
          name: "FigmaMind Cursor MCP",
          version: "1.0.0",
          description: "MCP para extrair e processar componentes do Figma",
          protocol_version: params?.protocolVersion || "1.0",
          capabilities: { tools: true }
        },
        id
      };
    } 
    else if (method === 'tools/list') {
      response = {
        jsonrpc: "2.0",
        result: { tools: TOOLS },
        id
      };
    } 
    else if (method === 'tools/call') {
      const toolName = params?.name;
      const toolParams = params?.params || {};
      
      switch (toolName) {
        case 'getFigmaDesign':
          const result = await getFigmaDesign(toolParams.fileId);
          response = {
            jsonrpc: "2.0",
            result,
            id
          };
          break;
        
        case 'setFigmaToken':
          if (isValidFigmaToken(toolParams.token)) {
            figmaToken = toolParams.token;
            saveConfig();
            response = {
              jsonrpc: "2.0",
              result: { 
                success: true, 
                message: "Token Figma configurado com sucesso" 
              },
              id
            };
          } else {
            response = {
              jsonrpc: "2.0",
              result: { 
                error: true, 
                message: "Token inválido. Deve começar com 'figd_'" 
              },
              id
            };
          }
          break;
        
        case 'testConnection':
          response = {
            jsonrpc: "2.0",
            result: { 
              success: true, 
              message: `Conexão testada com sucesso. Mensagem: ${toolParams.message || 'Nenhuma'}`,
              timestamp: new Date().toISOString()
            },
            id
          };
          break;
        
        default:
          response = {
            jsonrpc: "2.0",
            error: { 
              code: -32601, 
              message: `Ferramenta '${toolName}' não encontrada` 
            },
            id
          };
      }
    } 
    else {
      response = {
        jsonrpc: "2.0",
        error: { 
          code: -32601, 
          message: `Método '${method}' não suportado` 
        },
        id
      };
    }
    
    // Enviar resposta
    const responseString = JSON.stringify(response) + '\n';
    process.stdout.write(responseString);
    log(`Resposta enviada: ${responseString}`);
  } 
  catch (err) {
    log(`Erro ao processar mensagem: ${err.message}`);
    
    // Enviar erro de parsing
    try {
      process.stdout.write(JSON.stringify({
        jsonrpc: "2.0",
        error: { code: -32700, message: "Erro de parsing" },
        id: null
      }) + '\n');
    } catch (writeErr) {
      log(`Erro ao enviar resposta de erro: ${writeErr.message}`);
    }
  }
});

// Configurações para manter o processo vivo
rl.on('close', () => {
  log('readline fechado, tentando reiniciar');
  
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
      log('Readline reconectado com sucesso');
    } catch (err) {
      log(`Falha ao reconectar readline: ${err.message}`);
    }
  }, 1000);
});

// Manter o processo vivo
process.stdin.resume();

// Heartbeat/Keep-alive para mostrar que o processo ainda está vivo
setInterval(() => {
  log('Heartbeat - processo ativo');
}, 5000);

// Tratamento de sinais para não encerrar o processo
['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
  process.on(signal, () => {
    log(`Sinal ${signal} recebido, mas mantendo processo ativo`);
  });
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  log(`Exceção não capturada: ${err.message}`);
  // Não encerrar o processo
});

process.on('unhandledRejection', (reason) => {
  log(`Rejeição não tratada: ${reason}`);
  // Não encerrar o processo
});

log('FigmaMind Cursor MCP iniciado e aguardando comandos...'); 