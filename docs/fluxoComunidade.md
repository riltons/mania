# Fluxo de Criação e Gestão de Comunidades

Este documento descreve em detalhes o processo completo de criação e gestão de comunidades no sistema, desde a interface até o armazenamento no banco de dados.

## Visão Geral do Processo

O fluxo de criação e gestão de comunidades envolve as seguintes etapas:

1. Acesso à tela de listagem de comunidades
2. Criação de uma nova comunidade
3. Visualização e gerenciamento de comunidades existentes
4. Adição de organizadores e membros
5. Criação de competições dentro da comunidade
6. Visualização de estatísticas da comunidade

## Componentes e Arquivos Envolvidos

### 1. Tela de Listagem de Comunidades (`/src/app/(tabs)/comunidades.tsx`)

Este componente exibe a lista de comunidades e fornece acesso à criação de novas comunidades:

- Lista comunidades divididas em duas seções: "Minhas Comunidades" e "Comunidades que Organizo"
- Exibe informações básicas de cada comunidade (nome, descrição, número de membros)
- Possui botão de ação flutuante (FAB) para adicionar nova comunidade
- Permite navegar para os detalhes de uma comunidade específica

### 2. Tela de Nova Comunidade (`/src/app/(pages)/comunidade/nova.tsx`)

Este componente gerencia a interface para criação de uma nova comunidade:

- Formulário com campos para nome e descrição da comunidade
- Validação básica dos campos
- Lógica para chamar o serviço de criação de comunidade

### 3. Serviço de Comunidade (`/src/services/communityService.ts`)

Este serviço gerencia todas as operações relacionadas a comunidades:

- Métodos para criar, listar, buscar, atualizar e excluir comunidades
- Gerenciamento de organizadores e membros
- Registro de atividades relacionadas a comunidades
- Busca de comunidades por nome

## Estrutura de Dados

### Interfaces Principais

```typescript
export interface Community {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    members_count: number;
    games_count: number;
    is_organizer?: boolean;
}

export interface CreateCommunityDTO {
    name: string;
    description: string;
}

export interface UpdateCommunityDTO {
    name?: string;
    description?: string;
}
```

## Fluxo Detalhado de Criação de Comunidade

### 1. Acesso à Tela de Criação

- O usuário acessa a tela de listagem de comunidades (`/(tabs)/comunidades`)
- Clica no botão de ação flutuante (FAB) com ícone "+"
- É redirecionado para a tela de nova comunidade (`/comunidade/nova`)

### 2. Preenchimento do Formulário

- O usuário preenche os campos obrigatórios:
  - Nome da comunidade
  - Descrição da comunidade (opcional)
- Clica no botão "Criar Comunidade"

### 3. Validação no Frontend

- Verifica se o nome da comunidade foi preenchido
- Realiza a limpeza dos dados (trim) para remover espaços em branco desnecessários

### 4. Criação da Comunidade no Banco de Dados

- O método `communityService.create` é chamado com os dados do formulário
- Obtém o ID do usuário autenticado
- Insere um novo registro na tabela `communities` com:
  - Nome da comunidade
  - Descrição da comunidade
  - ID do usuário criador (`created_by`)
- Retorna os dados da comunidade recém-criada

### 5. Adição do Criador como Organizador

- Após a criação bem-sucedida da comunidade, verifica se o criador já é um organizador
- Se não for, adiciona o criador como organizador na tabela `community_organizers`
- Isso garante que o criador tenha permissões de administração sobre a comunidade

### 6. Registro de Atividade

- Após a criação bem-sucedida da comunidade, chama `activityService.createActivity`
- Cria um registro de atividade do tipo "community"
- Inclui descrição e metadados relacionados à comunidade criada
- Implementa sistema de retry com backoff exponencial para garantir o registro da atividade

### 7. Redirecionamento

- Após a criação bem-sucedida, o usuário é redirecionado para a tela de listagem de comunidades
- A lista é atualizada automaticamente mostrando a nova comunidade

## Gestão de Comunidades

### 1. Listagem de Comunidades

O sistema exibe dois tipos de comunidades para o usuário:

- **Minhas Comunidades**: Comunidades criadas pelo usuário
- **Comunidades que Organizo**: Comunidades onde o usuário é um organizador, mas não o criador

Para cada comunidade, são exibidas informações como:
- Nome da comunidade
- Descrição
- Número de membros
- Número de competições

### 2. Estrutura de Permissões

O sistema implementa diferentes níveis de permissão:

- **Criador**: Tem controle total sobre a comunidade, incluindo adicionar/remover organizadores e excluir a comunidade
- **Organizador**: Pode gerenciar membros, criar competições e editar informações da comunidade
- **Membro**: Pode participar de competições e visualizar informações da comunidade

## Tratamento de Erros

O sistema inclui tratamento de erros em várias camadas:

1. **Frontend (Tela de Nova Comunidade)**
   - Validação básica de campos obrigatórios
   - Exibição de alertas para o usuário em caso de erro
   - Indicador de carregamento durante a criação

2. **Serviço de Comunidade**
   - Tratamento de erros específicos do Supabase
   - Sistema de retry para registro de atividades
   - Registro de erros no console para depuração

## Estrutura do Banco de Dados

### 1. Tabela `communities`

Esta tabela armazena as informações básicas das comunidades:

| Coluna          | Tipo      | Descrição                                |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Identificador único da comunidade        |
| name            | string    | Nome da comunidade                       |
| description     | string    | Descrição da comunidade                  |
| created_by      | uuid      | ID do usuário que criou a comunidade     |
| created_at      | timestamp | Data de criação                          |
| updated_at      | timestamp | Data da última atualização               |

### 2. Tabela `community_organizers`

Esta tabela gerencia os organizadores de cada comunidade:

| Coluna          | Tipo      | Descrição                                |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Identificador único do registro          |
| community_id    | uuid      | Referência à comunidade                  |
| user_id         | uuid      | Referência ao usuário organizador        |
| created_by      | uuid      | ID do usuário que adicionou o organizador|
| created_at      | timestamp | Data de criação                          |

### 3. Tabela `community_members`

Esta tabela gerencia os membros de cada comunidade:

| Coluna          | Tipo      | Descrição                                |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Identificador único do registro          |
| community_id    | uuid      | Referência à comunidade                  |
| player_id       | uuid      | Referência ao jogador membro             |
| created_by      | uuid      | ID do usuário que adicionou o membro     |
| created_at      | timestamp | Data de criação                          |

## Relacionamentos e Integrações

### 1. Relação com Jogadores

- Uma comunidade pode ter múltiplos jogadores como membros
- Os jogadores podem participar de competições dentro da comunidade
- As estatísticas dos jogadores são calculadas com base nas competições da comunidade

### 2. Relação com Competições

- Uma comunidade pode ter múltiplas competições
- As competições são criadas e gerenciadas pelos organizadores da comunidade
- As estatísticas da comunidade são calculadas com base nas competições realizadas

### 3. Relação com Atividades

- Ações importantes relacionadas a comunidades geram registros de atividade
- Essas atividades são exibidas no feed de atividades do usuário
- Exemplos: criação de comunidade, adição de membro, criação de competição