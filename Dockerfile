FROM node:20-slim

WORKDIR /app

# Copiar apenas os arquivos de dependências primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json* ./
RUN npm install

# Depois, copiar o resto dos arquivos
COPY . .

# Tornar o script de inicialização executável
RUN chmod +x start-with-node20.sh

# Configurar variáveis de ambiente para MCP
ENV MCP_SUPPRESS_LOGS=true
ENV MCP_USE_STDIO=true
ENV FIGMA_TOKEN=""

# Expor a porta que o serviço utiliza
EXPOSE 3000

# Comando para iniciar o serviço usando o script que garante Node.js 20
CMD ["./start-with-node20.sh"] 