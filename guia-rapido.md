# Guia Rápido - Figma Component Transformer

Este guia explica de forma simples e direta como funciona o Figma Component Transformer.

## O que é?

É uma ferramenta que extrai componentes do Figma e os transforma em um formato JSON padronizado que pode ser usado por desenvolvedores em suas aplicações.

## Como funciona?

1. **Extração**: O sistema acessa a API do Figma e extrai os dados dos componentes
2. **Processamento**: Analisa a estrutura dos dados e identifica os componentes
3. **Transformação**: Aplica regras específicas para cada tipo de componente
4. **Serialização**: Salva os dados processados em formato JSON padronizado

## Fluxo Simplificado

```
URL do Figma → Extrator → Dados Brutos → Processador → Dados Processados
```

## Como usar?

### 1. Extrair componentes do Figma

```bash
node scripts/fetch-figma.js https://www.figma.com/design/seu_arquivo_figma
```

Este comando vai:
- Buscar os dados do arquivo do Figma
- Processar esses dados para extrair os componentes
- Salvar os resultados em `examples/output/`

### 2. Usar a API

Inicie o servidor:
```bash
node src/index.js
```

Envie uma requisição para transformar componentes:
```bash
curl -X POST http://localhost:3000/transform \
  -H "Content-Type: application/json" \
  -d '{"figmaUrl":"https://www.figma.com/design/seu_arquivo_figma"}'
```

## Principais Arquivos

- **scripts/fetch-figma.js**: Script para buscar e processar dados do Figma
- **src/index.js**: Servidor da API
- **src/services/figmaService.js**: Serviço de acesso à API do Figma
- **src/processor/processor.js**: Processador de componentes
- **src/transformers/index.js**: Transformadores para cada tipo de componente

## O que você pode fazer com isso?

1. **Design Systems**: Extrair componentes de um Design System no Figma e manter seu código atualizado
2. **Documentação**: Gerar documentação automática de componentes
3. **Integração**: Integrar designs do Figma diretamente em suas aplicações
4. **Versionamento**: Acompanhar mudanças em componentes ao longo do tempo

## Tipos de Componentes Suportados

- Botões
- Cabeçalhos
- Listas
- Textos
- Campos de input
- Botões de rádio
- Campos de código

## Exemplo de Uso Prático

1. **Designer cria um componente no Figma**
2. **Desenvolvedor executa o script**:
   ```bash
   node scripts/fetch-figma.js https://www.figma.com/design/arquivo_do_projeto
   ```
3. **Sistema extrai e processa o componente**
4. **Desenvolvedor usa o JSON resultante em sua aplicação**

## Dicas

- Use o parâmetro `node-id` na URL do Figma para extrair apenas um componente específico
- Verifique os exemplos em `examples/output/` para entender o formato dos dados
- Os arquivos de documentação contêm informações detalhadas sobre o funcionamento interno

## Precisa de Ajuda?

Consulte os arquivos:
- `README.md`: Informações gerais sobre o projeto
- `figma-transformers-process.md`: Detalhes técnicos sobre o processo
- `test-report.md`: Resultados dos testes realizados 