import { processDirectory } from '../src';
import * as path from 'path';

// Diretórios de entrada e saída
const inputDir = path.resolve(__dirname, '../examples/input');
const outputDir = path.resolve(__dirname, '../examples/output');

// Processar todos os arquivos JSON no diretório
console.log(`Processando arquivos de ${inputDir} para ${outputDir}...`);
processDirectory(inputDir, outputDir); 