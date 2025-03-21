#!/bin/bash

# Log para debug (vai para stderr para não interferir com stdio)
log_debug() {
  echo "[DEBUG] $1" >&2
}

log_debug "Iniciando script start-with-node20.sh"

# Configurações específicas para o MCP
export MCP_USE_STDIO=true
export MCP_DEBUG=true
export NODE_OPTIONS="--no-experimental-fetch"

# Verificar se estamos em um ambiente Docker
if [ -f "/.dockerenv" ]; then
  log_debug "Executando em ambiente Docker"
  # Em ambiente Docker, usar o Node diretamente
  exec node /app/mcp-server.js "$@"
else
  # Em ambiente local, usar NVM para garantir Node.js 20
  export NVM_DIR="$HOME/.nvm"
  
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    log_debug "Carregando NVM"
    . "$NVM_DIR/nvm.sh"
    
    # Usar Node.js 20
    log_debug "Configurando para usar Node.js 20"
    nvm use 20 > /dev/null 2>&1
    
    if [ $? -ne 0 ]; then
      log_debug "Tentando instalar Node.js 20"
      nvm install 20 > /dev/null 2>&1
      nvm use 20 > /dev/null 2>&1
    fi
  fi
  
  # Verificar a versão do Node
  NODE_VERSION=$(node --version)
  log_debug "Usando Node.js versão: $NODE_VERSION"
  
  # Executar o MCP Server com a versão atual do Node
  cd "$(dirname "$0")"
  log_debug "Diretório atual: $(pwd)"
  log_debug "Iniciando mcp-server.js"
  
  # Executar o servidor com argumentos passados para o script
  exec node mcp-server.js "$@"
fi 