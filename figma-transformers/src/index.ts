import * as fs from 'fs';
import * as path from 'path';
import { processFigmaJson } from './core/processor';

/**
 * Processa um arquivo JSON do Figma
 */
export function processFile(inputPath: string, outputPath: string): void {
  try {
    // Ler o arquivo de entrada
    const data = fs.readFileSync(inputPath, 'utf8');
    const figmaJson = JSON.parse(data);
    
    // Processar o JSON
    const processedJson = processFigmaJson(figmaJson);
    
    // Escrever o resultado
    fs.writeFileSync(outputPath, JSON.stringify(processedJson, null, 2));
    console.log(`Arquivo processado com sucesso: ${outputPath}`);
  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    throw error;
  }
}

/**
 * Processa todos os arquivos JSON em um diretório
 */
export function processDirectory(inputDir: string, outputDir: string): void {
  try {
    // Criar diretório de saída se não existir
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Ler todos os arquivos do diretório
    const files = fs.readdirSync(inputDir);
    
    // Processar cada arquivo JSON
    let processedCount = 0;
    for (const file of files) {
      if (file.endsWith('.json')) {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);
        processFile(inputPath, outputPath);
        processedCount++;
      }
    }
    
    console.log(`Processamento concluído. ${processedCount} arquivos processados.`);
  } catch (error) {
    console.error('Erro ao processar diretório:', error);
    throw error;
  }
}

// Exportar também as funções principais e tipos
export * from './core/types';
export * from './core/utils';
export * from './core/processor';
export * from './transformers'; 