#!/bin/bash

# Log para debug (vai para stderr para não interferir com stdio)
log_debug() {
  echo "[DEBUG] $1" >&2
}

log_debug "Iniciando script start-with-node20.sh"
log_debug "Argumentos recebidos: $@"

# Configurações específicas para o MCP
export MCP_USE_STDIO=true
export MCP_DEBUG=true

# Verificar se estamos em um ambiente Docker
if [ -f "/.dockerenv" ]; then
  log_debug "Executando em ambiente Docker com Node $(node --version)"
  # Em ambiente Docker, usar o Node diretamente (já está na versão correta na imagem base)
  exec node /app/mcp-server.js "$@"
else
  # Em ambiente local, usar NVM para garantir Node.js 20
  export NVM_DIR="$HOME/.nvm"
  
  # Verificar se NVM está disponível
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    log_debug "Carregando NVM"
    . "$NVM_DIR/nvm.sh"
    
    # Tentar usar Node.js 20
    if nvm use 20; then
      log_debug "Usando Node.js 20 via NVM: $(node --version)"
      
      # Configurar NODE_OPTIONS para desabilitar fetch experimental
      export NODE_OPTIONS="--no-experimental-fetch"
      
      # Para problemas com "client closed", manter stdin aberto
      log_debug "Iniciando mcp-server.js com Node.js 20"
      cd "$(dirname "$0")"
      exec node mcp-server.js "$@"
    else
      log_debug "Tentando instalar Node.js 20 via NVM"
      if nvm install 20; then
        log_debug "Node.js 20 instalado, agora usando-o: $(node --version)"
        export NODE_OPTIONS="--no-experimental-fetch"
        cd "$(dirname "$0")"
        exec node mcp-server.js "$@"
      else
        log_debug "ERRO: Falha ao instalar Node.js 20. Tentando usar o sistema padrão..."
      fi
    fi
  else
    log_debug "NVM não encontrado. Verificando versão do Node do sistema: $(node --version)"
  fi
  
  # Fallback: usar o Node do sistema se NVM não estiver disponível ou falhar
  NODE_VERSION=$(node --version)
  log_debug "Usando Node do sistema: $NODE_VERSION"
  
  # Desabilitar fetch experimental
  export NODE_OPTIONS="--no-experimental-fetch"
  
  # Mudar para o diretório do script para garantir caminhos relativos corretos
  cd "$(dirname "$0")"
  
  # Executar o servidor MCP
  log_debug "Executando mcp-server.js com Node do sistema"
  exec node mcp-server.js "$@"
fi 