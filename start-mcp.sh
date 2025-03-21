#!/bin/bash

# Script para iniciar o servidor MCP do FigmaMind
# Uso: ./start-mcp.sh [--minimal]

# Cores para saída
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verifica se o token do Figma está definido
if [ -z "$FIGMA_TOKEN" ]; then
  echo -e "${YELLOW}Aviso: FIGMA_TOKEN não definido no ambiente.${NC}"
  echo -e "Defina com: ${GREEN}export FIGMA_TOKEN=seu-token-aqui${NC}"
  
  # Usar token padrão para demonstração
  export FIGMA_TOKEN="figd_dPRrkuMWX6UbPZMKrHhLP3j-ui7SQOc3WiTxb0hP"
  echo -e "Usando token de demonstração temporariamente."
fi

# Definir o script a ser executado com base nos parâmetros
if [ "$1" == "--minimal" ]; then
  SCRIPT="minimal-mcp.js"
  echo -e "${GREEN}Iniciando MCP minimalista${NC} (recomendado para Cursor)"
  
  # Configurar variáveis de ambiente específicas para a versão minimalista
  export MCP_USE_STDIO=true
  
elif [ "$1" == "--original" ]; then
  SCRIPT="mcp-server.js"
  echo -e "${YELLOW}Iniciando MCP original${NC} (não recomendado para Cursor)"
  
  # Configurar variáveis de ambiente específicas para a versão original
  export MCP_USE_STDIO=true
  export MCP_SUPPRESS_LOGS=true
  
else
  # Exibir ajuda se o parâmetro não for reconhecido
  echo -e "${GREEN}FigmaMind MCP Starter${NC}"
  echo "Uso: ./start-mcp.sh [OPÇÃO]"
  echo ""
  echo "Opções:"
  echo "  --minimal    Inicia a versão minimalista (recomendada para Cursor)"
  echo "  --original   Inicia a versão original completa (não recomendada para Cursor)"
  echo ""
  echo "Exemplo: ./start-mcp.sh --minimal"
  exit 0
fi

# Verificar se o arquivo existe
if [ ! -f "$SCRIPT" ]; then
  echo -e "${RED}Erro: O arquivo $SCRIPT não foi encontrado.${NC}"
  echo "Verifique se você está no diretório correto."
  exit 1
fi

# Iniciar o servidor
echo -e "Iniciando servidor: ${GREEN}node $SCRIPT${NC}"
echo -e "Pressione Ctrl+C para encerrar.\n"

node "$SCRIPT" 