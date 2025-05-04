# Estrutura do Projeto

Este diretório contém o código fonte principal do aplicativo DominoMania, organizado seguindo princípios de Arquitetura em Camadas e Domain-Driven Design.

## Estrutura de Diretórios

### Core (Núcleo da Aplicação)
- `/core` - Componentes e utilitários fundamentais da aplicação
  - `/config` - Configurações da aplicação
  - `/contexts` - Contextos React para gerenciamento de estado global
  - `/hooks` - Hooks personalizados globais
  - `/lib` - Bibliotecas e integrações externas
  - `/utils` - Funções utilitárias e helpers

### Componentes
- `/components` - Componentes reutilizáveis da interface do usuário
  - `/ui` - Componentes básicos (botões, inputs, etc.)
  - `/layout` - Componentes de layout (headers, footers, etc.)
  - `/feedback` - Componentes de feedback (modais, alertas, etc.)
  - `/data-display` - Componentes de exibição de dados (listas, gráficos, etc.)

### Features (Domínios da Aplicação)
- `/features` - Recursos organizados por domínio
  - `/auth` - Autenticação e gerenciamento de usuários
  - `/players` - Gerenciamento de jogadores
  - `/games` - Gerenciamento de jogos e partidas
  - `/communities` - Gerenciamento de comunidades
  - `/competitions` - Gerenciamento de competições
  - `/statistics` - Estatísticas e rankings
  - `/admin` - Funcionalidades de administração

Cada domínio (feature) segue uma estrutura consistente:
  - `/components` - Componentes específicos do domínio
  - `/hooks` - Hooks específicos do domínio
  - `/services` - Serviços para comunicação com APIs
  - `/screens` - Telas relacionadas ao domínio

### Outros Diretórios
- `/assets` - Recursos estáticos como imagens, ícones e fontes
- `/navigation` - Configuração de navegação e rotas
- `/styles` - Estilos e temas do aplicativo
- `/types` - Definições de tipos TypeScript
- `/app` - Ponto de entrada da aplicação (Expo Router)