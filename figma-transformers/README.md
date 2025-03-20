# Figma Transformers

Biblioteca para padronização de componentes do Figma em formatos específicos.

## Objetivo

Esta biblioteca foi criada para processar arquivos JSON exportados do Figma e transformá-los em estruturas padronizadas para diferentes tipos de componentes. Ela também remove automaticamente todos os nós ou propriedades relacionados a "variable" nos arquivos JSON.

## Componentes Suportados

1. **Botão (Main-Primary)**
2. **Lista (list-item)**
3. **Cabeçalho (Head)**
4. **Campo de Entrada Onboarding (Onboarding/default)**
5. **Botão de Rádio (radio button)**
6. **Campo de Código de Verificação (verification-code-fields)**

## Instalação

```bash
npm install
npm run build
```

## Uso

### Processamento de um único arquivo

```typescript
import { processFile } from 'figma-transformers';

processFile('caminho/para/arquivo.json', 'caminho/para/resultado.json');
```

### Processamento de um diretório inteiro

```typescript
import { processDirectory } from 'figma-transformers';

processDirectory('diretorio/de/entrada', 'diretorio/de/saida');
```

### Usando o script de processamento

```bash
npm run process
```

## Adicionando novos transformadores

Para adicionar suporte a novos componentes:

1. Defina a interface do template no arquivo `src/core/types.ts`
2. Crie um novo transformador em `src/transformers/`
3. Exporte o transformador em `src/transformers/index.ts`
4. Adicione o mapeamento em `src/config/mappings.ts`

## Estrutura do Projeto

```
figma-transformers/
├── src/
│   ├── index.ts                  # Ponto de entrada principal
│   ├── core/
│   │   ├── processor.ts          # Lógica principal de processamento
│   │   ├── utils.ts              # Funções utilitárias
│   │   └── types.ts              # Definições de tipos
│   ├── transformers/
│   │   ├── index.ts              # Exportação de todos os transformadores
│   │   ├── button.ts             # Transformador para botões
│   │   ├── list.ts               # Transformador para listas
│   │   ├── head.ts               # Transformador para head
│   │   ├── onboardInputField.ts  # Transformador para campos de input
│   │   ├── radioButton.ts        # Transformador para radio buttons
│   │   └── onboardCodeField.ts   # Transformador para campos de código
│   └── config/
│       └── mappings.ts           # Mapeamento de identificadores para transformadores
├── examples/                     # Exemplos de JSON antes e depois
├── scripts/                      # Scripts de processamento
├── package.json
└── tsconfig.json
```

## Licença

MIT 