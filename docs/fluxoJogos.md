# Fluxo de Criação e Gestão de Jogos

Este documento descreve em detalhes o processo completo de criação e gestão de jogos no sistema, desde a interface até o armazenamento no banco de dados e cálculo de resultados.

## Visão Geral do Processo

O fluxo de criação e gestão de jogos envolve as seguintes etapas:

1. Acesso à tela de detalhes da competição
2. Criação de um novo jogo
3. Seleção de jogadores para formar as equipes
4. Registro de rodadas durante o jogo
5. Finalização do jogo e cálculo de pontuação
6. Atualização das estatísticas da competição

## Componentes e Arquivos Envolvidos

### 1. Tela de Detalhes da Competição (`/src/app/(pages)/comunidade/[id]/competicao/[competitionId].tsx`)

Este componente exibe os detalhes da competição e fornece acesso à criação de novos jogos:

- Lista os jogos existentes na competição
- Exibe o status de cada jogo (pendente, em andamento, finalizado)
- Possui botão para adicionar novo jogo (disponível apenas quando a competição está em andamento)
- Permite navegar para os detalhes de um jogo específico

### 2. Tela de Novo Jogo (`/src/app/(pages)/comunidade/[id]/competicao/[competitionId]/jogo/novo.tsx`)

Este componente gerencia a interface para criação de um novo jogo:

- Lista os jogadores disponíveis na competição
- Permite selecionar jogadores para formar duas equipes
- Oferece opção de seleção manual ou aleatória de equipes
- Valida se as equipes estão balanceadas (mesmo número de jogadores)
- Lógica para chamar o serviço de criação de jogo

### 3. Tela de Detalhes do Jogo (`/src/app/(pages)/comunidade/[id]/competicao/[competitionId]/jogo/[gameId].tsx`)

Este componente gerencia a visualização e interação com um jogo específico:

- Exibe detalhes do jogo (equipes, pontuação atual, status)
- Lista as rodadas já registradas
- Permite iniciar o jogo (mudar status de "pendente" para "em andamento")
- Permite registrar novas rodadas (quando o jogo está em andamento)
- Exibe o resultado final quando o jogo é concluído

### 4. Tela de Registro de Rodada (`/src/app/(pages)/comunidade/[id]/competicao/[competitionId]/jogo/[gameId]/registrar.tsx`)

Este componente gerencia o registro de uma nova rodada em um jogo:

- Exibe as equipes participantes
- Permite selecionar o tipo de vitória (simples, carroça, lá-e-lô, cruzada, contagem)
- Permite selecionar a equipe vencedora
- Exibe informações sobre pontuação e regras especiais
- Lógica para chamar o serviço de registro de rodada

### 5. Serviço de Jogo (`/src/services/gameService.ts`)

Este serviço gerencia todas as operações relacionadas a jogos:

- Métodos para criar, listar, buscar e atualizar jogos
- Gerenciamento de rodadas e pontuação
- Controle de status do jogo (pendente, em andamento, finalizado)
- Cálculo de resultados especiais (buchuda, buchuda de ré)
- Integração com o serviço de competição para atualizar estatísticas

## Estrutura de Dados

### Interfaces Principais

```typescript
export type VictoryType = 
    | 'simple'    // 1 ponto
    | 'carroca'   // 2 pontos
    | 'la_e_lo'   // 3 pontos
    | 'cruzada'   // 4 pontos
    | 'contagem'  // 1 ponto
    | 'empate';   // 0 ponto + 1 na próxima

export interface GameRound {
    type: VictoryType;
    winner_team: 1 | 2 | null;
    has_bonus: boolean;
}

export interface Game {
    id: string;
    competition_id: string;
    team1: string[];
    team2: string[];
    team1_score: number;
    team2_score: number;
    status: 'pending' | 'in_progress' | 'finished';
    created_at: string;
    rounds: GameRound[];
    last_round_was_tie: boolean;
    team1_was_losing_5_0: boolean;
    team2_was_losing_5_0: boolean;
    is_buchuda: boolean;
    is_buchuda_de_re: boolean;
}

export interface CreateGameDTO {
    competition_id: string;
    team1: string[];
    team2: string[];
}
```

## Fluxo Detalhado de Criação de Jogo

### 1. Acesso à Tela de Criação

- O usuário acessa a tela de detalhes da competição
- Verifica que a competição está no estado "em andamento"
- Clica no botão "Novo Jogo"
- É redirecionado para a tela de novo jogo (`/comunidade/[id]/competicao/[competitionId]/jogo/novo`)

### 2. Seleção de Jogadores

- O sistema carrega a lista de jogadores da competição
- O usuário pode escolher entre:
  - **Seleção Manual**: Selecionar manualmente os jogadores para cada equipe
  - **Seleção Aleatória**: Deixar o sistema formar as equipes aleatoriamente

#### 2.1 Seleção Manual

- O usuário seleciona jogadores da lista disponível
- Atribui cada jogador selecionado para o Time 1 ou Time 2
- O sistema valida se as equipes estão balanceadas (mesmo número de jogadores)

#### 2.2 Seleção Aleatória

- O usuário seleciona o número total de jogadores
- O sistema distribui aleatoriamente os jogadores entre as duas equipes
- Garante que as equipes tenham o mesmo número de jogadores

### 3. Validação no Frontend

- Verifica se ambas as equipes têm o mesmo número de jogadores
- Verifica se há pelo menos 2 jogadores por equipe
- Exibe alertas de erro caso as validações falhem

### 4. Criação do Jogo no Banco de Dados

- O método `gameService.create` é chamado com os dados do jogo
- Insere um novo registro na tabela `games` com:
  - ID da competição
  - Lista de jogadores do Time 1
  - Lista de jogadores do Time 2
  - Status inicial "pending" (pendente)
  - Pontuação inicial zerada
  - Array de rodadas vazio
- Retorna os dados do jogo recém-criado

### 5. Registro de Atividade

- Após a criação bem-sucedida do jogo, chama `activityService.createActivity`
- Cria um registro de atividade do tipo "game"
- Inclui descrição e metadados relacionados ao jogo criado
- Implementa sistema de retry com backoff exponencial para garantir o registro da atividade

### 6. Redirecionamento

- Após a criação bem-sucedida, o usuário é redirecionado para a tela de detalhes do jogo
- A tela exibe as equipes formadas e permite iniciar o jogo

## Fluxo de Jogo

### 1. Iniciar o Jogo

- Na tela de detalhes do jogo, o usuário clica no botão "Iniciar Jogo"
- O método `gameService.startGame` é chamado
- O status do jogo é alterado de "pending" para "in_progress"
- A interface é atualizada para permitir o registro de rodadas

### 2. Registro de Rodadas

- O usuário clica no botão "Registrar Rodada"
- É redirecionado para a tela de registro de rodada
- Seleciona o tipo de vitória:
  - **Vitória Simples**: 1 ponto
  - **Vitória de Carroça**: 2 pontos
  - **Vitória de Lá-e-lô**: 3 pontos
  - **Vitória de Cruzada**: 4 pontos
  - **Vitória por Contagem**: 1 ponto
  - **Empate**: 0 pontos (com bônus na próxima rodada)
- Seleciona a equipe vencedora (Time 1, Time 2 ou Empate)
- Confirma o registro da rodada

### 3. Processamento da Rodada

- O método `gameService.registerRound` é chamado com os dados da rodada
- Calcula a pontuação baseada no tipo de vitória
- Atualiza o placar do jogo
- Verifica condições especiais:
  - Rodada após empate (bônus de +1 ponto)
  - Situação de "buchuda" (vitória de 6-0)
  - Situação de "buchuda de ré" (vitória após estar perdendo por 5-0)
- Adiciona a rodada ao array de rodadas do jogo
- Verifica se o jogo deve ser finalizado (uma equipe atingiu 6 pontos)

### 4. Finalização Automática do Jogo

- Quando uma equipe atinge 6 pontos, o jogo é automaticamente finalizado
- O status do jogo é alterado para "finished"
- São registradas as condições especiais (buchuda, buchuda de ré)
- A interface é atualizada para mostrar o resultado final
- O usuário é redirecionado para a tela de detalhes do jogo

### 5. Atualização das Estatísticas

- Após a finalização do jogo, as estatísticas da competição são atualizadas
- Os resultados do jogo são considerados para o cálculo do ranking
- As estatísticas individuais dos jogadores são atualizadas

## Regras Especiais e Pontuação

### 1. Tipos de Vitória

- **Vitória Simples**: Vitória normal, vale 1 ponto
- **Vitória de Carroça**: Vitória com uma carroça (peça com números iguais), vale 2 pontos
- **Vitória de Lá-e-lô**: Vitória especial, vale 3 pontos
- **Vitória de Cruzada**: Vitória mais rara, vale 4 pontos
- **Vitória por Contagem**: Vitória por contagem de pontos, vale 1 ponto
- **Empate**: Não vale pontos, mas a próxima rodada terá bônus de +1 ponto

### 2. Condições Especiais

- **Bônus após Empate**: A rodada seguinte a um empate vale +1 ponto adicional
- **Buchuda**: Quando uma equipe vence por 6-0, é registrada como "buchuda"
- **Buchuda de Ré**: Quando uma equipe estava perdendo por 5-0 e vira o jogo para 6-5, é registrada como "buchuda de ré"

### 3. Finalização do Jogo

- O jogo termina quando uma equipe atinge 6 pontos
- O sistema registra automaticamente o vencedor
- Condições especiais são registradas para cálculo de estatísticas

## Tratamento de Erros

O sistema inclui tratamento de erros em várias camadas:

1. **Frontend (Tela de Novo Jogo)**
   - Validação de equipes balanceadas
   - Validação de número mínimo de jogadores
   - Exibição de alertas para o usuário em caso de erro
   - Indicador de carregamento durante operações

2. **Frontend (Tela de Registro de Rodada)**
   - Validação de seleção de tipo de vitória
   - Validação de seleção de equipe vencedora
   - Exibição de alertas para o usuário em caso de erro

3. **Serviço de Jogo**
   - Tratamento de erros específicos do Supabase
   - Verificações de permissão para operações críticas
   - Sistema de retry para registro de atividades
   - Registro de erros no console para depuração

## Estrutura do Banco de Dados

### 1. Tabela `games`

Esta tabela armazena as informações básicas dos jogos:

| Coluna                  | Tipo      | Descrição                                |
|-------------------------|-----------|------------------------------------------|
| id                      | uuid      | Identificador único do jogo              |
| competition_id          | uuid      | Referência à competição                  |
| team1                   | uuid[]    | Array de IDs dos jogadores do time 1     |
| team2                   | uuid[]    | Array de IDs dos jogadores do time 2     |
| team1_score             | integer   | Pontuação atual do time 1                |
| team2_score             | integer   | Pontuação atual do time 2                |
| rounds                  | jsonb     | Array de rodadas do jogo                 |
| status                  | enum      | Status do jogo (pending, in_progress, finished) |
| created_at              | timestamp | Data de criação                          |
| last_round_was_tie      | boolean   | Indica se a última rodada foi empate     |
| team1_was_losing_5_0    | boolean   | Indica se o time 1 estava perdendo por 5-0 |
| team2_was_losing_5_0    | boolean   | Indica se o time 2 estava perdendo por 5-0 |
| is_buchuda              | boolean   | Indica se o jogo terminou em buchuda     |
| is_buchuda_de_re        | boolean   | Indica se o jogo terminou em buchuda de ré |

## Relacionamentos e Integrações

### 1. Relação com Competições

- Um jogo pertence a uma competição específica
- Os jogos só podem ser criados quando a competição está em andamento
- Os resultados dos jogos alimentam as estatísticas da competição

### 2. Relação com Jogadores

- Os jogadores participantes devem ser membros da competição
- Um jogador pode participar de múltiplos jogos
- As estatísticas dos jogadores são atualizadas com base nos resultados dos jogos

### 3. Relação com Atividades

- Ações importantes relacionadas a jogos geram registros de atividade
- Essas atividades são exibidas no feed de atividades do usuário
- Exemplos: criação de jogo, finalização de jogo, registro de buchuda

## Considerações de Interface do Usuário

### 1. Feedback Visual

- Cores diferentes para indicar o status do jogo (pendente, em andamento, finalizado)
- Destaque visual para a equipe vencedora
- Ícones intuitivos para os diferentes tipos de vitória
- Indicadores de carregamento durante operações assíncronas

### 2. Usabilidade

- Interface simplificada para registro rápido de rodadas
- Opção de formação aleatória de equipes para agilizar o processo
- Confirmação visual após cada registro de rodada
- Resumo claro do resultado final do jogo

### 3. Responsividade

- Layout adaptável para diferentes tamanhos de tela
- Elementos de toque dimensionados adequadamente para uso em dispositivos móveis
- Scrolling suave para navegação em listas longas de jogadores ou jogos