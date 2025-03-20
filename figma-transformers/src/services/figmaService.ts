import axios from 'axios';
import dotenv from 'dotenv';
import { URL } from 'url';

dotenv.config();

// Constantes e tipos
const FIGMA_API_BASE_URL = 'https://api.figma.com/v1';
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;

export interface FigmaFileResponse {
  document: any;
  components: Record<string, any>;
  componentSets: Record<string, any>;
  styles: Record<string, any>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  [key: string]: any;
}

export interface FigmaNodesResponse {
  nodes: Record<string, {
    document: any;
    components?: Record<string, any>;
    componentSets?: Record<string, any>;
    styles?: Record<string, any>;
    [key: string]: any;
  }>;
  name: string;
  lastModified: string;
  thumbnailUrl: string;
  version: string;
  [key: string]: any;
}

/**
 * Extrai o file key do URL do Figma
 */
export function extractFileKeyFromUrl(figmaUrl: string): string {
  try {
    const url = new URL(figmaUrl);
    
    // Verificar se é uma URL do Figma
    if (!url.hostname.includes('figma.com')) {
      throw new Error('URL não é do Figma');
    }
    
    // Extrair o file key do path
    // Formatos típicos: 
    // https://www.figma.com/file/{file_key}/{file_name}
    // https://www.figma.com/design/{file_key}/{file_name}
    const pathParts = url.pathname.split('/');
    
    if (pathParts.length >= 3 && (pathParts[1] === 'file' || pathParts[1] === 'design')) {
      return pathParts[2];
    }
    
    throw new Error('Não foi possível extrair o file key do URL');
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erro ao extrair file key: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Extrai o node ID do URL do Figma, se presente
 */
export function extractNodeIdFromUrl(figmaUrl: string): string | null {
  try {
    const url = new URL(figmaUrl);
    
    // Verificar se tem o parâmetro node-id na URL
    const nodeId = url.searchParams.get('node-id');
    
    return nodeId;
  } catch (error) {
    return null;
  }
}

/**
 * Busca um arquivo completo do Figma
 */
export async function getFigmaFile(fileKey: string): Promise<FigmaFileResponse> {
  try {
    if (!FIGMA_TOKEN) {
      throw new Error('Token do Figma não configurado');
    }
    
    const response = await axios.get<FigmaFileResponse>(`${FIGMA_API_BASE_URL}/files/${fileKey}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      }
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Erro ao buscar arquivo: ${error.response?.status} ${error.response?.statusText}`);
    }
    throw error;
  }
}

/**
 * Busca nós específicos de um arquivo do Figma
 */
export async function getFigmaNodes(fileKey: string, nodeIds: string[]): Promise<FigmaNodesResponse> {
  try {
    if (!FIGMA_TOKEN) {
      throw new Error('Token do Figma não configurado');
    }
    
    const response = await axios.get<FigmaNodesResponse>(`${FIGMA_API_BASE_URL}/files/${fileKey}/nodes`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN
      },
      params: {
        ids: nodeIds.join(',')
      }
    });
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Erro ao buscar nós: ${error.response?.status} ${error.response?.statusText}`);
    }
    throw error;
  }
}

/**
 * Busca dados do Figma a partir de um URL
 */
export async function getFigmaDataFromUrl(figmaUrl: string): Promise<any> {
  try {
    const fileKey = extractFileKeyFromUrl(figmaUrl);
    const nodeId = extractNodeIdFromUrl(figmaUrl);
    
    if (nodeId) {
      // Se tiver um node ID específico, busca apenas esse nó
      const nodesData = await getFigmaNodes(fileKey, [nodeId]);
      return nodesData;
    } else {
      // Caso contrário, busca o arquivo completo
      const fileData = await getFigmaFile(fileKey);
      return fileData;
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Erro ao buscar dados do Figma: ${error.message}`);
    }
    throw error;
  }
} 