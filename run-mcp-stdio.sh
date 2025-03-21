#!/bin/bash
# Script para executar o FigmaMind MCP no modo STDIO
# Este script configura corretamente todas as variáveis de ambiente necessárias

# Configurar variáveis de ambiente
export MCP_USE_STDIO=true
export MCP_SUPPRESS_LOGS=true
export MCP_DEBUG=true
export FIGMA_TOKEN=figd_dPRrkuMWX6UbPZMKrHhLP3j-ui7SQOc3WiTxb0hP

# Criar diretório de logs se não existir
mkdir -p logs

# Alterar para o diretório do projeto
cd "$(dirname "$0")"

# Executar o servidor, redirecionando stderr para um arquivo de log
exec node mcp-server.js 2> logs/mcp-stderr.log 