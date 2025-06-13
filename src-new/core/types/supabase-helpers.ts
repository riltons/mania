/**
 * Helpers para lidar com os tipos do Supabase
 * Este arquivo oferece funções utilitárias para converter os resultados do Supabase
 * para os tipos esperados pela aplicação, tratando erros e tipos corretamente
 */

import { PostgrestError } from '@supabase/supabase-js';

// Importamos os tipos diretamente do arquivo database.types.ts
import { 
  Player, 
  Competition, 
  Game, 
  Community,
  Subscription
} from './database.types';

/**
 * Tipos para facilitar a inferência de resultados de consultas Supabase
 * que podem ter sucesso ou falha
 */
export type SupabaseResult<T> = {
  data: T | null;
  error: PostgrestError | null;
  count?: number | null;
};

export interface SupabaseQueryResult<T> {
  data: T | null;
  error: PostgrestError | null;
}

export interface SupabaseArrayQueryResult<T> {
  data: T[] | null;
  error: PostgrestError | null;
}

/**
 * Função para garantir que um valor seja um array
 * @param value O valor a ser verificado
 * @returns Um array seguro (vazio se o valor não for array ou for nulo)
 */
export function ensureArray<T>(value: T[] | null | undefined): T[] {
  if (!value || !Array.isArray(value)) return [];
  return value;
}

/**
 * Função para acessar com segurança propriedades de objetos que podem ser nulos
 * @param obj O objeto a ser acessado
 * @param prop A propriedade a ser acessada
 * @returns O valor da propriedade ou undefined se o objeto for nulo
 */
export function safeGet<T, K extends keyof T>(obj: T | null | undefined, prop: K): T[K] | undefined {
  if (!obj) return undefined;
  return obj[prop];
}

/**
 * Função para garantir que um array existe e possui elementos
 * @param array O array a ser verificado
 * @returns O array original ou um array vazio se for nulo
 */
export function safeArray<T>(array: T[] | null | undefined): T[] {
  if (!array || !Array.isArray(array)) return [];
  return array;
}

/**
 * Função para converter um resultado Supabase para um tipo específico
 * @param result O resultado da consulta Supabase
 * @returns O valor convertido para o tipo T ou null se for um erro
 */
export function convertToType<T>(result: any): T | null {
  // Se for um erro ou nulo, retorna nulo
  if (!result || result.error === true || result instanceof PostgrestError) {
    return null;
  }
  
  // Converte para o tipo desejado
  return result as T;
}

/**
 * Função para converter um array de resultados Supabase para um array de tipos específicos
 * @param results O array de resultados
 * @returns Array convertido para o tipo T
 */
export function convertArrayToType<T>(results: any[]): T[] {
  if (!Array.isArray(results)) {
    return [];
  }
  
  // Filtra resultados nulos ou com erro e converte para o tipo desejado
  return results
    .filter(item => item && item.error !== true && !(item instanceof PostgrestError))
    .map(item => item as T);
}

// Funções específicas para tipos comuns
export function toPlayer(result: any): Player | null {
  return convertToType<Player>(result);
}

export function toPlayers(results: any[]): Player[] {
  return convertArrayToType<Player>(results);
}

export function toCompetition(result: any): Competition | null {
  return convertToType<Competition>(result);
}

export function toCompetitions(results: any[]): Competition[] {
  return convertArrayToType<Competition>(results);
}

export function toGame(result: any): Game | null {
  return convertToType<Game>(result);
}

export function toGames(results: any[]): Game[] {
  return convertArrayToType<Game>(results);
}

export function toCommunity(result: any): Community | null {
  return convertToType<Community>(result);
}

export function toCommunities(results: any[]): Community[] {
  return convertArrayToType<Community>(results);
}

export function toSubscription(result: any): Subscription | null {
  return convertToType<Subscription>(result);
}

export function toSubscriptions(results: any[]): Subscription[] {
  return convertArrayToType<Subscription>(results);
}
