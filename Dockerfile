FROM node:18-slim

WORKDIR /app

# Copiar apenas os arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json* ./
RUN npm install

# Depois, copiar o resto dos arquivos
COPY . .

# Configurar variáveis de ambiente para MCP
ENV MCP_SUPPRESS_LOGS=true
ENV MCP_USE_STDIO=true
ENV NODE_OPTIONS="--no-warnings"

# Expor a porta que o serviço utiliza
EXPOSE 3000

# Comando para iniciar o serviço
CMD ["node", "mcp-server.js"] 