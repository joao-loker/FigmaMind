# Extração de Assets do Figma

Este documento descreve a funcionalidade de extração automática de assets (imagens e ícones) dos componentes do Figma implementada neste sistema.

## Visão Geral

A extração de assets permite que imagens, ícones e outros elementos visuais sejam automaticamente extraídos dos componentes do Figma durante o processo de transformação. Esses assets são salvos como arquivos individuais no diretório `examples/output/assets/` e referenciados no JSON de saída.

## Como Funciona

1. Durante o processo de extração dos componentes do Figma, o sistema identifica automaticamente nós que contêm imagens ou ícones.
2. Para cada asset identificado, o sistema:
   - Extrai o ID único do nó
   - Solicita a URL de exportação da imagem à API do Figma
   - Baixa a imagem e a salva localmente
   - Adiciona a referência ao asset no JSON do componente processado

## Tipos de Assets Suportados

O sistema suporta a extração dos seguintes tipos de assets:

- Imagens (PNG, JPG, SVG)
- Ícones (como componentes de imagem)
- Elementos de fundo com imagens
- Máscaras e elementos com recorte

## Propriedade "assets" no JSON

Nos componentes processados, os assets extraídos são referenciados em uma propriedade dedicada chamada `assets`. Esta propriedade contém um objeto onde as chaves são os IDs dos nós originais e os valores são os caminhos para os arquivos extraídos.

Exemplo:

```json
{
  "id": "2139:96740",
  "name": "Main-Primary",
  "type": "INSTANCE",
  "properties": {
    "size": {
      "width": 358,
      "height": 56
    },
    "position": {
      "x": -10142,
      "y": 6710
    },
    "assets": {
      "2139:96741": "examples/output/assets/2139-96741.png",
      "2139:96742": "examples/output/assets/2139-96742.svg"
    }
  }
}
```

## Configuração

Por padrão, o sistema está configurado para extrair automaticamente todos os assets encontrados nos componentes. Não é necessária nenhuma configuração adicional para habilitar essa funcionalidade.

## Acesso aos Assets pela API

Os assets extraídos podem ser acessados através do endpoint `/api/assets/:filename` da API REST, onde `:filename` é o nome do arquivo de asset (por exemplo, `2139-96741.png`).

Exemplo de requisição:

```
GET /api/assets/2139-96741.png
```

Esta requisição retornará o arquivo de imagem correspondente.

## Limitações

- A qualidade e o formato dos assets extraídos dependem das opções de exportação definidas no Figma
- Assets muito grandes podem demorar mais para serem processados
- Alguns efeitos complexos aplicados a imagens no Figma podem não ser totalmente preservados

## Resolução de Problemas

Se você encontrar problemas com a extração de assets:

1. Verifique se o token de API do Figma tem permissões para acessar o arquivo
2. Certifique-se de que o diretório `examples/output/assets/` existe e tem permissões de escrita
3. Para imagens que não estão sendo extraídas corretamente, verifique se elas são exportáveis no Figma

## Exemplos de Código

Exemplo de como o sistema extrai um asset de imagem:

```javascript
// Trecho do figmaService.js
async function downloadImage(nodeId, figmaFileKey) {
  const imagesResponse = await figma.getImage(figmaFileKey, {
    ids: [nodeId],
    format: 'png',
    scale: 2
  });
  
  if (imagesResponse && imagesResponse.images && imagesResponse.images[nodeId]) {
    const imageUrl = imagesResponse.images[nodeId];
    const imagePath = `examples/output/assets/${nodeId.replace(':', '-')}.png`;
    
    await downloadFile(imageUrl, imagePath);
    return imagePath;
  }
  
  return null;
}
``` 