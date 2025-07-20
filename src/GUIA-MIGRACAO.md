# Guia de Migração para Arquitetura Clean + Feature-First

## Visão Geral

Este documento apresenta um guia passo a passo para migrar arquivos do projeto para a nova estrutura de arquitetura. A nova estrutura combina os princípios de **Clean Architecture** e **Feature-First** para melhorar a organização, manutenibilidade e escalabilidade do código.

### Benefícios da Nova Arquitetura

- **Separação de Responsabilidades**: Cada camada tem uma responsabilidade clara e bem definida
- **Maior Testabilidade**: Facilita a escrita de testes unitários e de integração
- **Escalabilidade**: Permite crescimento organizado da base de código
- **Coerência**: Estabelece padrões consistentes em todo o projeto
- **Reutilização**: Facilita o compartilhamento de código entre diferentes partes da aplicação

## Estrutura de Diretórios

```text
src/
├── app/                     # Configurações do Expo Router
│   ├── (auth)/              # Rotas relacionadas à autenticação
│   ├── (pages)/             # Rotas principais da aplicação
│   └── (tabs)/              # Rotas da navegação inferior
├── core/                    # Núcleo central da aplicação
│   ├── components/          # Componentes compartilhados
│   ├── contexts/            # Contextos globais
│   ├── hooks/               # Hooks compartilhados
│   ├── lib/                 # Bibliotecas externas
│   ├── theme/               # Tema global
│   ├── types/               # Tipos globais
│   └── utils/               # Utilitários comuns
└── features/                # Funcionalidades organizadas por domínio
    ├── activities/          # Atividades do usuário
    ├── auth/                # Autenticação
    ├── communities/         # Comunidades
    ├── competitions/        # Competições
    ├── games/               # Jogos
    ├── players/             # Jogadores
    └── statistics/          # Estatísticas e rankings
```

## Instruções para Migração

### 1. Migrando Serviços

Os serviços devem ser organizados dentro da pasta `services` de cada feature. Por exemplo:

```typescript
// ANTES: src/services/competitionService.ts
// DEPOIS: src/features/competitions/services/competitionService.ts
```

Crie arquivos barrel (index.ts) para facilitar importações:
```typescript
// src/features/competitions/services/index.ts
export * from './competitionService';
export * from './competitionsStatsService';
```

### 2. Migrando Componentes

Os componentes devem ser organizados por feature ou no core (se forem compartilhados):

```typescript
// Componentes específicos de uma feature
// src/features/players/components/PlayerCard.tsx

// Componentes compartilhados
// src/core/components/ui/Button.tsx
```

### 3. Migrando Telas

As telas devem ser organizadas dentro da pasta `screens` de cada feature:

```typescript
// ANTES: src/screens/PlayerScreen.tsx
// DEPOIS: src/features/players/screens/PlayerScreen.tsx
```

### 4. Atualizando Importações

Atualize todas as importações para usar os novos caminhos com o alias `@/```bash
npm run dev
```typescript
// ANTES
import { Button } from '../../components/Button';
import { competitionService } from '../../services/competitions/services';

// DEPOIS
import { Button } from '@/core/components/ui';
import { competitionService } from '@/features/competitions/services';
```

Para importar elementos da camada core:

```typescript
import { Button } from '@/core/components/ui';
import { formatDate } from '@/core/utils/date';
```

### 5. Migrando Tipos

Os tipos devem ser organizados dentro da pasta `types` de cada feature ou no core (se forem globais):

```typescript
// Tipos específicos de uma feature
// src/features/players/types/player.ts

// Tipos globais
// src/core/types/database.types.ts
```

## Exemplos de Migração

### Exemplo 1: Migrando um Serviço

```typescript
// ANTES (src/services/playerService.ts)
export const playerService = {
  // métodos
};

// DEPOIS (src/features/players/services/playerService.ts)
export const playerService = {
  // métodos
};

// E criar o arquivo barrel (src/features/players/services/index.ts)
export * from './playerService';
```

### Exemplo 2: Atualizando Importações em um Componente

```typescript
// ANTES
import { playerService } from '../../services/playerService';

// DEPOIS
import { playerService } from '@/features/players/services';
```

## Padrões e Convenções

### Nomenclatura

- **Arquivos**: Use `camelCase` para arquivos de código (ex: `playerService.ts`) e `PascalCase` para componentes React (ex: `PlayerCard.tsx`)
- **Diretórios**: Use sempre `camelCase` para nomes de pastas (ex: `components`, `features`, `auth`)
- **Componentes**: Use `PascalCase` para nomes de componentes React (ex: `PlayerCard`, `Button`)
- **Serviços**: Use `camelCase` para constantes de serviços e terminologia com `Service` (ex: `playerService`, `authService`)
- **Hooks**: Use o prefixo `use` seguido de `PascalCase` (ex: `useAuth`, `usePlayer`)
- **Contextos**: Use o sufixo `Context` e `PascalCase` (ex: `AuthContext`, `ThemeContext`)

### Exportações

- Crie sempre arquivos `index.ts` (barrel files) para exportar os módulos de um diretório
- Utilize exportações nomeadas em vez de exportações default sempre que possível
- Evite o uso de atalhos para importações (ex: `import * as Services from './services'`)

### Componentes React

- Use `React.FC<Props>` para tipar componentes funcionais
- Documente props complexas com JSDocs
- Separe a estilização em componentes estilizados fora da função do componente
- Use o padrão de composição para componentes complexos

### Tipagem

- Defina interfaces para props de componentes
- Use a interface `ThemeProps` para acessar o tema nos componentes estilizados
- Evite o uso de `any`, prefira tipagem explícita
- Centralize tipos relacionados a domínio na pasta `types` da respectiva feature

### Estrutura de Código

- Imports organizados na seguinte ordem:
  1. Bibliotecas React/React Native
  2. Bibliotecas de terceiros
  3. Imports com alias (@/)
  4. Imports relativos (./)
- Use async/await em vez de promises encadeadas
- Documentação em JSDocs para funções e componentes complexos

## Fluxo de Trabalho para Migração

O fluxo de trabalho recomendado para a migração é o seguinte:

1. Analise o código existente na pasta `src`
2. Identifique as dependências e relacionamentos entre os arquivos
3. Crie a estrutura de pastas correspondente na pasta `src-new`
4. Migre os arquivos um por um, adaptando-os à nova estrutura
5. Atualize as importações para usar os novos caminhos relativos e aliases
6. Para desenvolvimento com a nova estrutura, utilize o arquivo `tsconfig.dev.json` que aponta para a pasta `src-new`
7. Teste regularmente as funcionalidades migradas
8. Quando toda a migração estiver concluída e testada, use o script `migrar.ps1` para fazer a troca final

## Ferramentas de Apoio

### Durante o Desenvolvimento

Para facilitar o desenvolvimento usando a nova estrutura em `src-new` sem comprometer o funcionamento do código atual, foi criado um arquivo `tsconfig.dev.json` que pode ser usado durante o desenvolvimento:

```typescript
// Como usar o tsconfig.dev.json
// 1. Abra o terminal e execute:
npx tsc --project tsconfig.dev.json --noEmit --watch

// 2. Isso irá verificar os erros de tipagem na estrutura src-new
// sem interferir na estrutura src atual
```

### Script de Migração Final

Quando toda a migração estiver completa, utilize o script `migrar.ps1` na raiz do projeto para finalizar o processo:

```powershell
./migrar.ps1
```

Este script:

1. Cria um backup da pasta `src` original com timestamp
2. Remove a pasta `src` antiga
3. Renomeia `src-new` para `src`
4. Atualiza o `tsconfig.json` para usar a nova estrutura
5. Remove o arquivo `tsconfig.dev.json` que não será mais necessário
6. Limpa os caches relacionados

## Suporte e Dúvidas

Em caso de dúvidas sobre a migração ou a nova arquitetura, consulte o time de arquitetura ou abra uma issue no repositório do projeto.
import { Button } from '@/core/components/ui';
```

## Verificação Final

Após migrar todos os arquivos, faça uma verificação completa:

1. Verifique se todos os imports estão funcionando
2. Execute a aplicação para garantir que tudo continua funcionando
3. Execute o script de migração `migrar.ps1` para finalizar a migração

## Recursos Adicionais

Consulte o arquivo README.md principal do projeto para uma visão geral mais detalhada da arquitetura.

## Contato para Dúvidas

Se tiver dúvidas sobre a migração ou a nova arquitetura, entre em contato com a equipe de desenvolvimento.
