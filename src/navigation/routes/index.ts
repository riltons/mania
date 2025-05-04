// Definição de rotas da aplicação
export const ROUTES = {
  // Rotas de autenticação
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    SIGNUP: '/signup',
    FORGOT_PASSWORD: '/forgot-password',
  },
  
  // Rotas principais
  HOME: '/',
  
  // Rotas de jogadores
  PLAYERS: {
    ROOT: '/jogadores',
    DETAILS: (id: string) => `/jogadores/${id}`,
  },
  
  // Rotas de estatísticas
  STATISTICS: {
    ROOT: '/stats',
    TOP_PAIRS: '/top-duplas',
  },
  
  // Rotas de administração
  ADMIN: {
    ROOT: '/admin',
    PANEL: '/admin-panel',
  },
};
