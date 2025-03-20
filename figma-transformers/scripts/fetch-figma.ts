import fs from 'fs-extra';
import path from 'path';
import { getFigmaDataFromUrl } from '../src/services/figmaService';
import { processFigmaJson } from '../src/core/processor';

// URL padrão de exemplo do Figma
const EXAMPLE_FIGMA_URL = 'https://www.figma.com/file/Mlgjf3cCMzOIwM27GLx81Y/Web-Checkout?node-id=2066%3A45806';

/**
 * Busca dados do Figma, processa e salva em arquivo
 */
async function fetchAndProcessFigma(figmaUrl: string = EXAMPLE_FIGMA_URL): Promise<void> {
  try {
    console.log(`Buscando dados do Figma: ${figmaUrl}`);
    
    // Buscar dados do Figma
    const figmaData = await getFigmaDataFromUrl(figmaUrl);
    
    // Criar diretório se não existir
    const outputDir = path.resolve(__dirname, '../examples/output');
    fs.ensureDirSync(outputDir);
    
    // Salvar o resultado bruto
    const rawOutputPath = path.resolve(outputDir, 'figma-raw.json');
    fs.writeFileSync(rawOutputPath, JSON.stringify(figmaData, null, 2));
    console.log(`Dados brutos salvos em: ${rawOutputPath}`);
    
    // Processar os dados usando o transformador
    const processedData = processFigmaJson(figmaData);
    
    // Salvar o resultado processado
    const processedOutputPath = path.resolve(outputDir, 'figma-processed.json');
    fs.writeFileSync(processedOutputPath, JSON.stringify(processedData, null, 2));
    console.log(`Dados processados salvos em: ${processedOutputPath}`);
    
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Erro: ${error.message}`);
    } else {
      console.error('Erro desconhecido');
    }
    process.exit(1);
  }
}

// Se o script for executado diretamente
if (require.main === module) {
  const customUrl = process.argv[2];
  fetchAndProcessFigma(customUrl);
}

export { fetchAndProcessFigma }; 