# Estrutura de Features

Este diretório contém os recursos organizados por domínio de negócio, seguindo princípios de Domain-Driven Design (DDD).

## Organização

Cada domínio (feature) segue uma estrutura consistente:

- `/components` - Componentes específicos do domínio
- `/hooks` - Hooks específicos do domínio
- `/services` - Serviços para comunicação com APIs
- `/screens` - Telas relacionadas ao domínio

## Domínios Disponíveis

- `/auth` - Autenticação e gerenciamento de usuários
- `/players` - Gerenciamento de jogadores
- `/games` - Gerenciamento de jogos e partidas
- `/communities` - Gerenciamento de comunidades
- `/competitions` - Gerenciamento de competições
- `/statistics` - Estatísticas e rankings
- `/admin` - Funcionalidades de administração

## Boas Práticas

1. **Coesão** - Cada domínio deve conter apenas código relacionado à sua responsabilidade
2. **Baixo Acoplamento** - Minimize dependências entre domínios diferentes
3. **Reutilização** - Componentes genéricos devem ficar na pasta `/components` global
4. **Organização** - Mantenha cada domínio organizado seguindo a estrutura padrão
