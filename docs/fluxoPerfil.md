# Fluxo de Atualização de Perfil do Usuário

Este documento descreve em detalhes o processo de atualização do perfil do usuário no sistema, desde a interface até o armazenamento no banco de dados.

## Visão Geral do Processo

O fluxo de atualização do perfil do usuário envolve as seguintes etapas:

1. Acesso à tela de perfil do usuário
2. Carregamento dos dados do perfil existente
3. Edição das informações do perfil
4. Validação dos dados inseridos
5. Atualização do perfil no banco de dados
6. Exibição de mensagens de sucesso ou erro

## Componentes e Arquivos Envolvidos

### 1. Tela de Perfil do Usuário (`/src/app/(pages)/perfil.tsx`)

Este componente exibe as informações do perfil do usuário e permite a edição:

- Exibe campos para nome completo, número de telefone e apelido
- Botão para salvar as alterações
- Exibe mensagens de erro ou sucesso após a atualização

### 2. Serviço de Usuário (`/src/services/userService.ts`)

Este serviço gerencia todas as operações relacionadas ao perfil do usuário:

- Métodos para criar, atualizar e buscar perfis de usuário
- Validação de dados antes de atualizar o perfil
- Integração com o Supabase para persistência de dados

## Estrutura de Dados

### Interfaces Principais

```typescript
export interface UserProfile {
    user_id: string;
    full_name: string;
    phone_number: string;
    nickname?: string;
}

export interface UpdateProfileDTO {
    full_name?: string;
    phone_number?: string;
    nickname?: string;
}
```

## Fluxo Detalhado de Atualização do Perfil

### 1. Acesso à Tela de Perfil

- O usuário acessa a tela de perfil através do menu principal ou configurações
- A tela é carregada com as informações do perfil existente

### 2. Carregamento dos Dados do Perfil

- O método `userService.getProfile` é chamado para buscar os dados do perfil
- Os dados são exibidos nos campos correspondentes na tela

### 3. Edição das Informações do Perfil

- O usuário pode editar os campos de nome, telefone e apelido
- As alterações são salvas em um estado local até que o usuário decida salvar

### 4. Validação dos Dados Inseridos

- O sistema verifica se os campos obrigatórios estão preenchidos
- Exibe mensagens de erro caso algum campo esteja inválido

### 5. Atualização do Perfil no Banco de Dados

- O método `userService.updateProfile` é chamado com os dados atualizados
- O perfil é atualizado no banco de dados através do Supabase
- Se a atualização for bem-sucedida, o sistema exibe uma mensagem de sucesso

### 6. Exibição de Mensagens de Sucesso ou Erro

- O sistema exibe um alerta de sucesso se a atualização for bem-sucedida
- Caso ocorra um erro, uma mensagem de erro é exibida ao usuário

## Considerações de Interface do Usuário

### 1. Feedback Visual

- Campos de entrada com validação em tempo real
- Mensagens de erro exibidas abaixo dos campos correspondentes
- Indicador de carregamento durante a atualização do perfil

### 2. Usabilidade

- Interface intuitiva para fácil edição das informações do perfil
- Botão de salvar claramente visível
- Opção de cancelar a edição e voltar à tela anterior sem salvar

### 3. Responsividade

- Layout adaptável para diferentes tamanhos de tela
- Elementos de toque dimensionados adequadamente para uso em dispositivos móveis