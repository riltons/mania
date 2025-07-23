# Fluxo de Criação e Gestão de Competições

Este documento descreve em detalhes o processo completo de criação e gestão de competições no sistema, desde a interface até o armazenamento no banco de dados e cálculo de resultados.

## Visão Geral do Processo

O fluxo de criação e gestão de competições envolve as seguintes etapas:

1. Acesso à tela de competições dentro de uma comunidade
2. Criação de uma nova competição
3. Adição de jogadores à competição
4. Gerenciamento de jogos durante a competição
5. Finalização da competição e cálculo de resultados
6. Visualização de estatísticas e rankings

## Componentes e Arquivos Envolvidos

### 1. Tela de Listagem de Competições (`/src/app/(tabs)/competicoes.tsx`)

Este componente exibe a lista de competições e fornece acesso aos detalhes de cada uma:

- Lista todas as competições que o usuário participa
- Exibe informações básicas como nome, comunidade e status
- Permite navegar para os detalhes de uma competição específica
- Utiliza códigos de cores para indicar o status da competição (pendente, em andamento, finalizada)

### 2. Tela de Nova Competição (`/src/app/(pages)/comunidade/[id]/competicao/nova.tsx`)

Este componente gerencia a interface para criação de uma nova competição:

- Formulário com campos para nome, descrição e data de início
- Validação básica dos campos
- Integração com o DatePicker para seleção de data
- Lógica para chamar o serviço de criação de competição

### 3. Tela de Detalhes da Competição (`/src/app/(pages)/comunidade/[id]/competicao/[competitionId].tsx`)

Este componente gerencia a visualização e interação com uma competição específica:

- Exibe detalhes da competição (nome, descrição, status)
- Lista os jogadores participantes
- Permite adicionar/remover jogadores (dependendo do status)
- Gerencia a criação e visualização de jogos
- Controla o fluxo de iniciar e finalizar a competição
- Exibe resultados e estatísticas após a finalização

### 4. Serviço de Competição (`/src/services/competitionService.ts`)

Este serviço gerencia todas as operações relacionadas a competições:

- Métodos para criar, listar, buscar e atualizar competições
- Gerenciamento de membros da competição
- Controle de status da competição (pendente, em andamento, finalizada)
- Cálculo de resultados e estatísticas
- Integração com o serviço de jogos

## Estrutura de Dados

### Interfaces Principais

```typescript
export interface Competition {
    id: string;
    name: string;
    description: string;
    community_id: string;
    start_date: string;
    created_at: string;
    status: 'pending' | 'in_progress' | 'finished';
}

export interface CreateCompetitionDTO {
    name: string;
    description: string;
    community_id: string;
    start_date: string;
}

export interface CompetitionResult {
    players: {
        id: string;
        name: string;
        score: number;
        wins: number;
        losses: number;
        buchudas: number;
        buchudasDeRe: number;
    }[];
    pairs: {
        players: string[];
        score: number;
        wins: number;
        losses: number;
        buchudas: number;
        buchudasDeRe: number;
    }[];
}
```

## Fluxo Detalhado de Criação de Competição

### 1. Acesso à Tela de Criação

- O usuário acessa a tela de detalhes da comunidade
- Navega para a seção de competições
- Clica no botão "Nova Competição"
- É redirecionado para a tela de nova competição (`/comunidade/[id]/competicao/nova`)

### 2. Preenchimento do Formulário

- O usuário preenche os campos obrigatórios:
  - Nome da competição
  - Descrição da competição (opcional)
  - Data de início (selecionada através do DatePicker)
- Clica no botão "Criar Competição"

### 3. Validação no Frontend

- Verifica se o nome da competição foi preenchido
- Realiza a limpeza dos dados (trim) para remover espaços em branco desnecessários
- Valida se a data de início é válida

### 4. Criação da Competição no Banco de Dados

- O método `competitionService.create` é chamado com os dados do formulário
- Obtém o ID do usuário autenticado
- Insere um novo registro na tabela `competitions` com:
  - Nome da competição
  - Descrição da competição
  - ID da comunidade
  - Data de início
  - Status inicial "pending" (pendente)
- Retorna os dados da competição recém-criada

### 5. Registro de Atividade

- Após a criação bem-sucedida da competição, chama `activityService.createActivity`
- Cria um registro de atividade do tipo "competition"
- Inclui descrição e metadados relacionados à competição criada
- Implementa sistema de retry com backoff exponencial para garantir o registro da atividade

### 6. Atualização da Lista de Competições

- Chama `competitionService.refreshCompetitions` para atualizar a lista de competições da comunidade
- Isso garante que a nova competição apareça imediatamente na lista

### 7. Redirecionamento

- Após a criação bem-sucedida, o usuário é redirecionado para a tela de detalhes da comunidade
- A lista de competições é atualizada mostrando a nova competição

## Gestão de Competições

### 1. Ciclo de Vida da Competição

Uma competição passa por três estados principais:

- **Pendente (pending)**: Estado inicial após a criação
  - Permite adicionar/remover jogadores
  - Não permite a criação de jogos
  - Pode ser iniciada pelo organizador

- **Em Andamento (in_progress)**: Estado após iniciar a competição
  - Não permite adicionar/remover jogadores
  - Permite a criação e gerenciamento de jogos
  - Pode ser finalizada quando houver jogos suficientes

- **Finalizada (finished)**: Estado final após concluir a competição
  - Não permite modificações nos jogadores ou jogos
  - Exibe resultados finais e estatísticas
  - Atualiza o ranking da comunidade

### 2. Gerenciamento de Jogadores

- **Adição de Jogadores**:
  - Disponível apenas no estado "pendente"
  - Mostra lista de membros da comunidade que ainda não estão na competição
  - Permite adicionar múltiplos jogadores
  - Atualiza a tabela `competition_members`

- **Remoção de Jogadores**:
  - Disponível apenas no estado "pendente"
  - Permite remover jogadores que ainda não participaram de jogos
  - Atualiza a tabela `competition_members`

### 3. Gerenciamento de Jogos

- **Criação de Jogos**:
  - Disponível apenas no estado "em andamento"
  - Permite selecionar jogadores para formar equipes
  - Registra o resultado do jogo (pontuação, buchudas, etc.)
  - Atualiza a tabela `games`

- **Visualização de Jogos**:
  - Lista todos os jogos da competição
  - Exibe informações como equipes, resultado e data
  - Permite filtrar por status (pendente, em andamento, finalizado)

### 4. Finalização da Competição

- **Verificação de Elegibilidade**:
  - Chama `competitionService.canFinishCompetition`
  - Verifica se há jogos suficientes para finalizar
  - Confirma que todos os jogos estão concluídos

- **Cálculo de Resultados**:
  - Chama `competitionService.finishCompetition`
  - Calcula estatísticas individuais (vitórias, derrotas, buchudas)
  - Calcula estatísticas de duplas
  - Determina os vencedores baseado na pontuação

- **Atualização de Status**:
  - Atualiza o status da competição para "finished"
  - Bloqueia qualquer modificação adicional

## Tratamento de Erros

O sistema inclui tratamento de erros em várias camadas:

1. **Frontend (Tela de Nova Competição)**
   - Validação básica de campos obrigatórios
   - Exibição de alertas para o usuário em caso de erro
   - Indicador de carregamento durante a criação

2. **Serviço de Competição**
   - Tratamento de erros específicos do Supabase
   - Sistema de retry para registro de atividades
   - Verificações de permissão para operações críticas
   - Registro de erros no console para depuração

## Estrutura do Banco de Dados

### 1. Tabela `competitions`

Esta tabela armazena as informações básicas das competições:

| Coluna          | Tipo      | Descrição                                |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Identificador único da competição        |
| name            | string    | Nome da competição                       |
| description     | string    | Descrição da competição                  |
| community_id    | uuid      | Referência à comunidade                  |
| start_date      | timestamp | Data de início da competição             |
| created_at      | timestamp | Data de criação                          |
| status          | enum      | Status da competição (pending, in_progress, finished) |

### 2. Tabela `competition_members`

Esta tabela gerencia os jogadores participantes de cada competição:

| Coluna          | Tipo      | Descrição                                |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Identificador único do registro          |
| competition_id  | uuid      | Referência à competição                  |
| player_id       | uuid      | Referência ao jogador                    |
| created_at      | timestamp | Data de criação                          |

### 3. Tabela `games`

Esta tabela armazena os jogos realizados em cada competição:

| Coluna          | Tipo      | Descrição                                |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Identificador único do jogo              |
| competition_id  | uuid      | Referência à competição                  |
| team_a          | uuid[]    | Array de IDs dos jogadores do time A     |
| team_b          | uuid[]    | Array de IDs dos jogadores do time B     |
| score_a         | integer   | Pontuação do time A                      |
| score_b         | integer   | Pontuação do time B                      |
| buchuda_a       | integer   | Número de buchudas do time A             |
| buchuda_b       | integer   | Número de buchudas do time B             |
| buchuda_re_a    | integer   | Número de buchudas de ré do time A       |
| buchuda_re_b    | integer   | Número de buchudas de ré do time B       |
| created_at      | timestamp | Data de criação                          |
| status          | enum      | Status do jogo (pending, finished)       |

## Relacionamentos e Integrações

### 1. Relação com Comunidades

- Uma comunidade pode ter múltiplas competições
- Apenas organizadores da comunidade podem criar competições
- As competições são vinculadas a uma comunidade específica através do `community_id`

### 2. Relação com Jogadores

- Os jogadores participantes devem ser membros da comunidade
- Um jogador pode participar de múltiplas competições
- As estatísticas dos jogadores são atualizadas com base nos resultados das competições

### 3. Relação com Jogos

- Uma competição contém múltiplos jogos
- Os jogos só podem ser criados quando a competição está em andamento
- Os resultados dos jogos determinam o resultado final da competição

### 4. Relação com Ranking

- Os resultados das competições alimentam o sistema de ranking da comunidade
- O ranking é atualizado quando uma competição é finalizada
- As estatísticas individuais e de duplas são calculadas com base nos jogos

### 5. Relação com Atividades

- Ações importantes relacionadas a competições geram registros de atividade
- Essas atividades são exibidas no feed de atividades do usuário
- Exemplos: criação de competição, início de competição, finalização de competição

## Cálculo de Resultados e Estatísticas

O sistema implementa um algoritmo complexo para calcular os resultados das competições:

1. **Estatísticas Individuais**:
   - Contagem de vitórias e derrotas
   - Contagem de buchudas e buchudas de ré
   - Cálculo de pontuação baseado em uma fórmula que considera vitórias, derrotas e buchudas

2. **Estatísticas de Duplas**:
   - Identificação de todas as duplas que jogaram juntas
   - Contagem de vitórias e derrotas por dupla
   - Contagem de buchudas e buchudas de ré por dupla
   - Cálculo de pontuação por dupla

3. **Ranking Final**:
   - Ordenação dos jogadores por pontuação
   - Ordenação das duplas por pontuação
   - Identificação dos vencedores individuais e de duplas