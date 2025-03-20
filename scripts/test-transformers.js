#!/usr/bin/env node

/**
 * Script para testar os transformadores usando exemplos existentes
 */

const fs = require('fs');
const path = require('path');
const { processData } = require('../src/processor');
const { 
  getRegisteredComponentTypes,
  applyTransformer
} = require('../src/transformers');

// Carregar exemplo de dados do Figma
const loadExample = () => {
  try {
    const examplePath = path.join(__dirname, '../examples/output/figma-raw.json');
    if (!fs.existsSync(examplePath)) {
      console.error('Arquivo de exemplo não encontrado:', examplePath);
      return null;
    }
    
    const data = JSON.parse(fs.readFileSync(examplePath, 'utf8'));
    
    // Verificar estrutura e extrair documento
    if (data.nodes) {
      // Neste formato, pegamos o primeiro nó disponível
      const nodeId = Object.keys(data.nodes)[0];
      console.log(`Usando nó: ${nodeId}`);
      
      // Criar estrutura compatível
      return {
        ...data,
        document: data.nodes[nodeId].document,
        fileKey: nodeId
      };
    }
    
    return data;
  } catch (error) {
    console.error('Erro ao carregar o arquivo de exemplo:', error);
    return null;
  }
};

// Criar um exemplo de botão para teste
const createButtonExample = () => {
  return {
    id: "button-123",
    name: "Button/Primary",
    type: "COMPONENT",
    absoluteBoundingBox: {
      x: 0,
      y: 0,
      width: 200,
      height: 48
    },
    fills: [
      {
        type: "SOLID",
        color: {
          r: 0.2,
          g: 0.4,
          b: 0.9,
          opacity: 1
        },
        visible: true
      }
    ],
    strokes: [],
    children: [
      {
        id: "text-123",
        name: "Text",
        type: "TEXT",
        characters: "Confirmar",
        style: {
          fontFamily: "Inter",
          fontSize: 16,
          fontWeight: 600,
          textAlignHorizontal: "CENTER"
        }
      },
      {
        id: "icon-123",
        name: "Icon",
        type: "INSTANCE",
        visible: true
      }
    ]
  };
};

// Função principal
const main = async () => {
  console.log('Testando sistema de transformadores');
  
  // Verificar tipos de componentes registrados
  const registeredTypes = getRegisteredComponentTypes();
  console.log('Tipos de componentes registrados:', registeredTypes);
  
  // Tentar carregar dados do exemplo
  let figmaData = loadExample();
  if (!figmaData || !figmaData.document) {
    console.warn('Não foi possível carregar os dados de exemplo do arquivo. Usando exemplo interno...');
    
    // Criar exemplo básico para teste
    figmaData = {
      document: {
        id: "example-doc",
        name: "Exemplo",
        type: "DOCUMENT",
        children: [createButtonExample()]
      },
      fileKey: "example-key",
      name: "Exemplo de Documento"
    };
  }
  
  console.log('Dados prontos para processamento. Processando componentes...');
  
  // Processar os dados
  try {
    const result = processData(figmaData, { includeOriginalData: true });
    
    // Salvar resultado processado
    const outputPath = path.join(__dirname, '../examples/output/processed-new.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    
    // Exibir estatísticas
    console.log('\nProcessamento concluído!');
    console.log('----------------------------');
    console.log('Total de componentes processados:', result.meta.totalComponents);
    console.log('Tipos de componentes encontrados:');
    
    Object.entries(result.meta.componentTypeCount).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });
    
    console.log('\nResultado salvo em:', outputPath);
    
    // Testar transformação individual
    console.log('\nTestando transformação individual:');
    const buttonExample = createButtonExample();
    const transformedButton = applyTransformer(buttonExample);
    console.log('Botão transformado:', JSON.stringify(transformedButton, null, 2));
  } catch (error) {
    console.error('Erro durante o processamento:', error);
    process.exit(1);
  }
};

// Executar o script
main().catch(error => {
  console.error('Erro não tratado:', error);
  process.exit(1);
}); 