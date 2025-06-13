/**
 * Tipos relacionados à navegação da aplicação
 */

// Tipo para parâmetros de rotas
export interface RouteParams {
  [key: string]: string | undefined;
}

// Tipo para rotas da aplicação
export type AppRoutes = {
  home: undefined;
  'competicao/competicao/[id]': { id: string };
  'competicao/nova': { comunidadeId: string };
  'jogador/[id]': { id: string };
  'comunidade/[id]': { id: string };
  'comunidade/membros/[id]': { id: string };
  'jogo/novo/[competicaoId]': { competicaoId: string };
  'jogo/[id]': { id: string };
  'profile': undefined;
  'signup': undefined;
  'signin': undefined;
};

// Tipo para parâmetros de rotas com validação
export type ValidatedRouteParams<T extends keyof AppRoutes> = AppRoutes[T];
