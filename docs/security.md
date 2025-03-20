# Segurança do Projeto

Este documento contém diretrizes e informações para manter a segurança do projeto Figma Component Transformer.

## Gerenciamento de Segredos

### Tokens de API

O projeto utiliza o token da API do Figma para acessar arquivos e assets. Por razões de segurança:

1. **NUNCA comite tokens ou chaves de API no repositório**
2. **SEMPRE utilize arquivos .env para armazenar tokens** (este arquivo está no .gitignore)
3. **NÃO compartilhe seu token de API em fóruns, chats ou documentação pública**

### Processo para Configuração Segura

1. Copie o arquivo `.env.example` para `.env` (que será ignorado pelo git)
2. Adicione seus tokens e outras variáveis sensíveis no arquivo `.env`
3. Use o pacote `dotenv` para carregar essas variáveis em seu código

```javascript
require('dotenv').config();
const token = process.env.FIGMA_TOKEN;
```

## Permissões da API do Figma

O token da API do Figma tem acesso a todos os arquivos que seu usuário pode acessar. Por isso:

1. Crie um token com o escopo mínimo necessário para suas necessidades
2. Revogue tokens não utilizados na página de configurações do Figma
3. Rotacione seus tokens periodicamente (recomendado a cada 3-6 meses)

## Segurança do Ambiente de Desenvolvimento

1. Mantenha seu Node.js e npm atualizados para evitar vulnerabilidades conhecidas
2. Execute `npm audit` regularmente para verificar possíveis vulnerabilidades em dependências
3. Utilize um gerenciador de versões como nvm para melhor controle de ambientes

## Tratamento de Dados de Usuários

O projeto Figma Component Transformer não coleta dados de usuários finais. No entanto, os dados dos arquivos do Figma podem conter informações sensíveis como:

1. Nomes de projetos proprietários
2. Design e imagens protegidas por direitos autorais
3. URLs e referências para recursos internos

Tenha cuidado ao compartilhar JSONs gerados ou extrair assets que possam conter informações proprietárias.

## Relatando Problemas de Segurança

Se você descobrir uma vulnerabilidade de segurança neste projeto, por favor:

1. **NÃO a divulgue publicamente** através de issues do GitHub
2. Entre em contato diretamente com os mantenedores do projeto
3. Forneça detalhes sobre a vulnerabilidade e, se possível, passos para reproduzi-la

## Diretrizes de Contribuição para Segurança

Ao contribuir com código para este projeto:

1. Não adicione dependências desnecessárias
2. Verifique se o seu código não introduz vulnerabilidades
3. Mantenha tokens e chaves em variáveis de ambiente, nunca hardcoded
4. Utilize sanitização adequada para inputs que serão processados

Seguindo estas diretrizes, podemos manter o projeto seguro para todos os usuários e desenvolvedores. 