FROM node:20-slim

WORKDIR /app

# Copiar apenas os arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json* ./
RUN npm install

# Depois, copiar o resto dos arquivos
COPY . .

# Tornar os scripts executáveis
RUN chmod +x cursor-mcp.js

# Configurar variáveis de ambiente para MCP
ENV MCP_DEBUG=true
ENV FIGMA_TOKEN=""
ENV NODE_OPTIONS="--no-experimental-fetch"

# Expor a porta que o serviço utiliza
EXPOSE 3000

# Comando para iniciar o serviço usando o script simplificado
CMD ["node", "cursor-mcp.js"] 