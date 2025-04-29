# DominoApp - Aplicativo de Dominó

## Descrição
O DominoApp é um aplicativo para gerenciar partidas de dominó, com foco em competições e rankings. Ele permite registrar jogos, acompanhar estatísticas dos jogadores e organizar competições.

## Tecnologias Utilizadas
- React Native com Expo
- Supabase para backend e autenticação
- TypeScript
- Styled Components
- Expo Router para navegação

## Estrutura do Banco de Dados

### Tabelas Principais

#### communities
- id: string (UUID)
- name: string
- description: string
- owner_id: string (FK)
- created_at: timestamp
- is_private: boolean

#### community_members
- id: string (UUID)
- community_id: string (FK)
- player_id: string (FK)
- role: enum ('admin', 'member')
- created_at: timestamp

#### players
- id: string (UUID)
- name: string
- email: string
- created_at: timestamp

#### competitions
- id: string (UUID)
- name: string
- community_id: string (FK)
- created_at: timestamp

#### competition_members
- id: string (UUID)
- competition_id: string (FK)
- player_id: string (FK)
- status: enum ('active', 'inactive')
- joined_at: timestamp
- left_at: timestamp (nullable)
- total_games: number
- total_wins: number
- total_buchudas: number
- total_buchudas_de_re: number

#### games
- id: string (UUID)
- competition_id: string (FK)
- team1_player1_id: string (FK)
- team1_player2_id: string (FK)
- team2_player1_id: string (FK)
- team2_player2_id: string (FK)
- team1_score: number
- team2_score: number
- status: enum ('pending', 'in_progress', 'finished')
- rounds: GameRound[]
- last_round_was_tie: boolean
- team1_was_losing_5_0: boolean
- team2_was_losing_5_0: boolean
- is_buchuda: boolean
- is_buchuda_de_re: boolean
- created_at: timestamp

## Fluxos Principais

### 1. Gestão de Comunidades
1. Criação de comunidade:
   - Nome e descrição da comunidade
   - Definição de privacidade (pública/privada)
   - Criador torna-se automaticamente admin

2. Gerenciamento de membros:
   - Convite de novos membros
   - Definição de papéis (admin/membro)
   - Remoção de membros
   - Solicitações de entrada (para comunidades privadas)

### 2. Competições
1. Criação de competição:
   - Nome da competição
   - Vinculação à comunidade
   - Definição de participantes

2. Gerenciamento:
   - Adição/remoção de jogadores
   - Acompanhamento de estatísticas
   - Definição de regras específicas

### 3. Autenticação
- Registro de usuário com email, Celular e senha
- Login usando credenciais
- Recuperação de senha
- Logout

### 4. Gerenciamento de Jogos
1. Criação de novo jogo:
   - Seleção da competição
   - Seleção dos jogadores para cada time
   - Inicialização com placar 0x0

2. Registro de rodadas:
   - Tipos de vitória:
     - Simples (1 ponto)
     - Carroça (2 pontos)
     - Lá e Ló (3 pontos)
     - Cruzada (4 pontos)
     - Contagem (1 ponto)
     - Empate (0 ponto + 1 na próxima)
   
   - Condições especiais:
     - Buchuda: quando um time vence sem o adversário pontuar (6x0)
     - Buchuda de Ré: quando um time que estava perdendo de 5x0 vira e vence
     - Bônus após empate: +1 ponto na próxima rodada

3. Finalização do jogo:
   - Jogo termina quando um time atinge 6 pontos
   - Registro de estatísticas especiais (buchudas, buchudas de ré)

### 5. Ranking e Estatísticas
1. Estatísticas por Comunidade:
   - Ranking geral de jogadores
   - Melhores duplas
   - Total de jogos realizados
   - Média de pontos por jogo

2. Estatísticas por Competição:
   - Classificação atual
   - Desempenho dos jogadores
   - Histórico de confrontos

3. Estatísticas por Jogador:
   - Total de jogos
   - Vitórias e derrotas
   - Taxa de vitória
   - Buchudas e buchudas de ré
   - Melhores parceiros
   - Histórico de partidas

4. Estatísticas por Dupla:
   - Total de jogos juntos
   - Taxa de vitória em dupla
   - Buchudas e buchudas de ré em dupla
   - Competições vencidas
   - Histórico de confrontos

### 6. Fluxo de Dados e Atualizações
1. Registro de Partida:
   - Criação do jogo vinculado à competição
   - Seleção dos jogadores
   - Registro de rodadas
   - Atualização automática de estatísticas

2. Atualização de Rankings:
   - Recálculo após cada partida
   - Atualização de estatísticas especiais
   - Registro no histórico

3. Notificações:
   - Novos jogos
   - Atualizações de ranking
   - Conquistas desbloqueadas
   - Convites para comunidades/competições

## Regras de Negócio Importantes

1. **Pontuação**
   - Jogo vai até 6 pontos
   - Diferentes tipos de vitória valem pontos diferentes
   - Empate gera bônus na próxima rodada

2. **Buchudas**
   - Buchuda normal: vencer por 6x0
   - Buchuda de Ré: vencer após estar perdendo de 5x0

3. **Status do Jogo**
   - Pending: jogo criado mas não iniciado
   - In Progress: jogo em andamento
   - Finished: jogo finalizado (alguém atingiu 6 pontos)

4. **Competições**
   - Jogos devem estar vinculados a uma competição
   - Competições pertencem a uma comunidade
   - Jogadores podem participar de múltiplas competições

## Prompt para IA

```
Desenvolva um aplicativo React Native com Expo para gerenciar partidas de dominó com as seguintes funcionalidades:

1. Gestão de Comunidades:
- Sistema de criação e gerenciamento de comunidades
- Controle de privacidade (pública/privada)
- Gerenciamento de membros e papéis (admin/membro)
- Sistema de convites e solicitações de entrada
- Dashboard com estatísticas da comunidade

2. Autenticação:
- Sistema de login/registro usando Supabase
- Proteção de rotas autenticadas
- Gerenciamento seguro de sessão
- Perfil do usuário com histórico de comunidades

3. Competições:
- Criação de competições dentro das comunidades
- Gerenciamento de participantes
- Sistema de rankings por competição
- Histórico de competições
- Estatísticas específicas por competição

4. Gerenciamento de Jogos:
- CRUD completo de jogos
- Sistema de pontuação com diferentes tipos de vitória
- Detecção automática de buchudas e buchudas de ré
- Suporte a jogos em dupla
- Sistema de rounds com histórico

5. Ranking e Estatísticas:
- Cálculo de taxa de vitória
- Contagem de buchudas e buchudas de ré
- Ranking por jogador e por dupla
- Filtros por comunidade e competição
- Histórico detalhado de partidas

6. Interface:
- Design moderno e responsivo
- Feedback visual para ações importantes
- Suporte a temas claro/escuro
- Animações suaves para transições
- Sistema de notificações

7. Dados:
- Uso do Supabase como backend
- Estrutura de dados otimizada
- Relacionamentos entre comunidades, competições e jogos
- Cache local para melhor performance
- Sincronização em tempo real

8. Requisitos Técnicos:
- TypeScript para type safety
- Styled Components para estilização
- Expo Router para navegação
- Gerenciamento de estado eficiente
- Logs detalhados para debugging

O aplicativo deve seguir as regras oficiais de dominó, com suporte especial para:
- Diferentes tipos de vitória (simples, carroça, lá e ló, cruzada)
- Detecção automática de condições especiais (buchudas e buchudas de ré)
- Sistema de pontuação com bônus após empate
- Histórico completo de partidas e todo score gerado.

Priorize:
1. Experiência do usuário
2. Performance
3. Manutenibilidade do código
4. Escalabilidade
5. Segurança dos dados
```

## Próximos Passos Sugeridos

1. Implementar testes automatizados
2. Adicionar análise de estatísticas mais detalhadas
3. Implementar sistema de conquistas
4. Adicionar suporte a torneios
5. Desenvolver modo offline
6. Implementar notificações push
7. Adicionar recursos sociais (chat, comentários)
