#!/bin/bash

# Verificar se estamos em um ambiente Docker
if [ -f "/.dockerenv" ]; then
  # Em ambiente Docker, usar o Node diretamente (já está na versão correta na imagem base)
  echo "[INFO] Executando em ambiente Docker com Node $(node --version)"
  exec node mcp-server.js "$@"
else
  # Em ambiente local, usar NVM
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    echo "[INFO] Carregando NVM"
    . "$NVM_DIR/nvm.sh"
    if nvm use 20; then
      echo "[INFO] Usando Node.js 20 via NVM"
      exec node mcp-server.js "$@"
    else
      echo "[ERRO] Falha ao ativar Node.js 20 via NVM. Tentando usar o Node padrão..."
      exec node mcp-server.js "$@"
    fi
  else
    echo "[AVISO] NVM não encontrado. Usando Node padrão: $(node --version)"
    exec node mcp-server.js "$@"
  fi
fi 