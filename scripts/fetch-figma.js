/**
 * Script para buscar e processar dados do Figma
 * 
 * Uso:
 * node scripts/fetch-figma.js https://www.figma.com/file/KEY/NAME?node-id=XXX
 */

const fs = require('fs-extra');
const path = require('path');
const figmaService = require('../src/services/figmaService');
const { processData } = require('../src/processor/processor');
require('dotenv').config();

// URL de exemplo para testes
const EXAMPLE_FIGMA_URL = 'https://www.figma.com/design/Mlgjf3cCMzOIwM27GLx81Y/New-Onboarding?node-id=2045-33564&t=DxFAM3HNhwKDhliA-4';

// Diretórios de saída
const OUTPUT_DIR = path.resolve('examples/output');
const ASSETS_DIR = path.resolve('examples/output/assets');

/**
 * Busca e processa dados de um arquivo do Figma
 * @param {string} figmaUrl - URL do arquivo do Figma
 * @returns {Promise<Object>} Objeto com dados brutos e processados
 */
async function fetchAndProcessFigma(figmaUrl) {
  try {
    // Garantir que os diretórios existam
    await fs.ensureDir(OUTPUT_DIR);
    await fs.ensureDir(ASSETS_DIR);
    
    console.log(`Buscando dados do Figma: ${figmaUrl}`);
    const figmaResult = await figmaService.fetchFigmaFromUrl(figmaUrl);
    
    console.log(`Processando componentes...`);
    const processed = await processData(figmaResult.data, figmaResult.fileKey);
    
    // Salvar dados brutos
    const rawFilePath = path.join(OUTPUT_DIR, 'figma-raw.json');
    await fs.writeJson(rawFilePath, figmaResult.data, { spaces: 2 });
    console.log(`Dados brutos salvos em ${rawFilePath}`);
    
    // Salvar dados processados
    const processedFilePath = path.join(OUTPUT_DIR, 'figma-processed.json');
    await fs.writeJson(processedFilePath, processed, { spaces: 2 });
    console.log(`Dados processados salvos em ${processedFilePath}`);
    
    // Informações sobre os componentes processados
    console.log(`Processados ${processed.componentsCount} componentes`);
    
    // Mostrar informações sobre a estrutura da tela
    if (processed.screen) {
      console.log(`\nTela "${processed.screen.name}" (${processed.screen.size.width}x${processed.screen.size.height}) estruturada com sucesso:`);
      
      // Mostrar informações sobre as seções identificadas
      if (processed.screen.layout && processed.screen.layout.sections) {
        console.log('\n=== ESTRUTURA DE SEÇÕES ===');
        processed.screen.layout.sections.forEach((section, index) => {
          console.log(`\n${index + 1}. ${section.title} (${section.components.length} componentes)`);
          section.components.forEach((comp, i) => {
            const name = comp.name;
            const type = comp.type;
            const position = `[x:${comp.position.x}, y:${comp.position.y}]`;
            const alignment = comp.alignment ? `align:${comp.alignment.horizontal}` : '';
            console.log(`   ${i+1}. ${name} (${type}) ${position} ${alignment}`);
          });
        });
      }
      
      // Mostrar categorização por tipo para referência
      console.log('\n=== COMPONENTES POR TIPO ===');
      const elements = processed.screen.elements;
      
      // Header
      if (elements.header) {
        console.log(`\n• Header: ${elements.header.name}`);
      }
      
      // Inputs
      if (elements.inputs && elements.inputs.length > 0) {
        console.log(`\n• Inputs: ${elements.inputs.length} encontrados`);
        elements.inputs.forEach((input, i) => {
          const placeholder = input.properties && input.properties.placeholder 
            ? ` ("${input.properties.placeholder}")` 
            : '';
          console.log(`   ${i+1}. ${input.name}${placeholder}`);
        });
      }
      
      // Buttons
      if (elements.buttons && elements.buttons.length > 0) {
        console.log(`\n• Botões: ${elements.buttons.length} encontrados`);
        elements.buttons.forEach((button, i) => {
          const text = button.properties && button.properties.text 
            ? ` ("${button.properties.text}")` 
            : '';
          console.log(`   ${i+1}. ${button.name}${text}`);
        });
      }
      
      // Keyboard
      if (elements.keyboard) {
        const keyboardType = elements.keyboard.properties && elements.keyboard.properties.keyboardType 
          ? elements.keyboard.properties.keyboardType 
          : 'desconhecido';
        console.log(`\n• Teclado: ${elements.keyboard.name} (${keyboardType})`);
      }
      
      // Other components
      if (elements.other && elements.other.length > 0) {
        console.log(`\n• Outros: ${elements.other.length} componentes`);
      }
    }
    
    return {
      raw: figmaResult.data,
      processed
    };
  } catch (error) {
    console.error(`Erro ao buscar e processar Figma: ${error.message}`);
    throw error;
  }
}

// Executar o script se for chamado diretamente
if (require.main === module) {
  // Obter URL do Figma da linha de comando ou usar exemplo
  const figmaUrl = process.argv[2] || EXAMPLE_FIGMA_URL;
  
  fetchAndProcessFigma(figmaUrl)
    .then(() => {
      console.log('\nProcessamento concluído com sucesso!');
      console.log('Uma IA agora pode reconstruir facilmente esta tela usando as seções organizadas em ordem vertical.');
    })
    .catch(error => {
      console.error(`Erro: ${error.message}`);
      process.exit(1);
    });
}

module.exports = {
  fetchAndProcessFigma
}; 