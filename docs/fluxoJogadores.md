# Fluxo de Registro de Jogadores

Este documento descreve em detalhes o processo completo de registro de jogadores no sistema, desde a interface até o armazenamento no banco de dados.

## Visão Geral do Processo

O fluxo de registro de jogadores envolve as seguintes etapas:

1. Acesso à tela de cadastro de novo jogador
2. Preenchimento do formulário com dados do jogador
3. Validação dos dados no frontend
4. Verificação de jogador existente pelo telefone
5. Criação do registro do jogador no banco de dados
6. Registro de atividade relacionada à criação do jogador
7. Atualização da lista de jogadores em memória
8. Retorno à tela de listagem de jogadores

## Componentes e Arquivos Envolvidos

### 1. Tela de Listagem de Jogadores (`/src/app/(tabs)/jogadores.tsx`)

Este componente exibe a lista de jogadores e fornece acesso à criação de novos jogadores:

- Lista jogadores divididos em duas seções: "Meus Jogadores" e "Jogadores das Comunidades"
- Exibe estatísticas básicas de cada jogador (total de jogos, vitórias, derrotas, buchudas)
- Possui botão de ação flutuante (FAB) para adicionar novo jogador
- Permite editar e excluir jogadores criados pelo usuário

### 2. Tela de Novo Jogador (`/src/app/(pages)/jogador/jogador/novo.tsx`)

Este componente gerencia a interface para criação de um novo jogador:

- Formulário com campos para nome e telefone do jogador
- Validação básica dos campos
- Lógica para chamar o serviço de criação de jogador

### 3. Serviço de Jogador (`/src/services/playerService.ts`)

Este serviço gerencia todas as operações relacionadas a jogadores:

- Métodos para criar, listar, buscar, atualizar e excluir jogadores
- Verificação de jogador existente pelo telefone
- Registro de atividades relacionadas a jogadores
- Cálculo de estatísticas de jogadores

## Estrutura de Dados

### Interface Player

```typescript
export interface Player {
    id: string;
    name: string;
    phone: string;
    created_at: string;
    nickname?: string;
    created_by: string;
    isLinkedUser?: boolean;
    isMine?: boolean;
    stats?: PlayerStats;
    user_player_relations?: Array<{
        is_primary_user: boolean;
        user_id: string;
    }>;
}

export interface PlayerStats {
    total_games: number;
    wins: number;
    losses: number;
    buchudas: number;
}

interface CreatePlayerDTO {
    name: string;
    phone: string;
}
```

## Fluxo Detalhado

### 1. Acesso à Tela de Cadastro

- O usuário acessa a tela de listagem de jogadores (`/(tabs)/jogadores`)
- Clica no botão de ação flutuante (FAB) com ícone "+"
- É redirecionado para a tela de novo jogador (`/jogador/jogador/novo`)

### 2. Preenchimento do Formulário

- O usuário preenche os campos obrigatórios:
  - Nome do jogador
  - Telefone do jogador (formatado automaticamente)
- Clica no botão "Criar Jogador"

### 3. Validação no Frontend

- Verifica se o nome do jogador foi preenchido
- Verifica se o telefone do jogador foi preenchido
- Formata o telefone para conter apenas números (máximo 11 dígitos)

### 4. Verificação de Jogador Existente

- O método `playerService.create` é chamado com os dados do formulário
- Internamente, o serviço chama `playerService.getByPhone` para verificar se já existe um jogador com o mesmo telefone
- Se existir, retorna um erro informando que já existe um jogador com este telefone

### 5. Criação do Registro do Jogador

- Se não existir jogador com o mesmo telefone, obtém o ID do usuário autenticado
- Insere um novo registro na tabela `players` com:
  - Nome do jogador
  - Telefone do jogador
  - ID do usuário criador (`created_by`)
- Retorna os dados do jogador recém-criado

### 6. Registro de Atividade

- Após a criação bem-sucedida do jogador, chama `activityService.createActivity`
- Cria um registro de atividade do tipo "player"
- Inclui descrição e metadados relacionados ao jogador criado
- Implementa sistema de retry com backoff exponencial para garantir o registro da atividade

### 7. Atualização da Lista de Jogadores

- Chama `playerService.list()` para atualizar a lista de jogadores em memória
- Retorna à tela de listagem de jogadores
- A lista é atualizada automaticamente mostrando o novo jogador

## Tratamento de Erros

O sistema inclui tratamento de erros em várias camadas:

1. **Frontend (Tela de Novo Jogador)**
   - Validação básica de campos obrigatórios
   - Exibição de alertas para o usuário em caso de erro
   - Indicador de carregamento durante a criação

2. **Serviço de Jogador**
   - Tratamento de erros específicos do Supabase
   - Verificação de jogador existente para evitar duplicação
   - Sistema de retry para registro de atividades
   - Registro de erros no console para depuração

## Relacionamentos e Permissões

### 1. Relação entre Jogadores e Usuários

- Um jogador é sempre criado por um usuário específico (campo `created_by`)
- Jogadores podem ser vinculados a usuários através da tabela `user_player_relations`
- Um jogador pode ser vinculado a múltiplos usuários, mas apenas um pode ser o usuário primário

### 2. Permissões de Acesso

- Um usuário pode ver, editar e excluir jogadores que ele criou
- Um usuário pode ver (mas não editar/excluir) jogadores das comunidades onde é organizador
- Apenas o criador do jogador ou um administrador pode excluir um jogador