#!/bin/bash
# Script para executar o FigmaMind MCP no modo STDIO
# Este script configura corretamente todas as variáveis de ambiente necessárias

# Configurar variáveis de ambiente
export MCP_USE_STDIO=true
export MCP_SUPPRESS_LOGS=true
export FIGMA_TOKEN=figd_dPRrkuMWX6UbPZMKrHhLP3j-ui7SQOc3WiTxb0hP

# Alterar para o diretório do projeto
cd "$(dirname "$0")"

# Executar o servidor
exec node mcp-server.js 