FROM node:18-slim

WORKDIR /app

# Copiar apenas os arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json* ./
RUN npm install

# Depois, copiar o resto dos arquivos
COPY . .

# Configurar variável de ambiente para suprimir logs durante a inicialização
ENV MCP_SUPPRESS_LOGS=true

# Expor a porta que o serviço utiliza
EXPOSE 3000

# Comando para iniciar o serviço
CMD ["node", "mcp-server.js"] 