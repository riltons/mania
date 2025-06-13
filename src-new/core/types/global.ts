/**
 * Tipos globais utilizados em toda a aplicação
 */

// Tipo para estruturas de resposta de APIs
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Tipo para paginação
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Tipo para opções de seleção em formulários
export interface SelectOption {
  value: string | number;
  label: string;
}
