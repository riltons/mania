# Documentação da Arquitetura do Projeto

## Visão Geral

Este projeto utiliza uma arquitetura baseada em **Clean Architecture** combinada com a abordagem **Feature-First**, que foi implementada para melhorar a organização, manutenção e escalabilidade do código.

## Estrutura de Diretórios

```
src/
├── app/                     # Configurações do Expo Router
│   ├── (auth)/              # Rotas relacionadas à autenticação
│   ├── (pages)/             # Rotas principais da aplicação
│   └── (tabs)/              # Rotas da navegação inferior
├── core/                    # Núcleo central da aplicação
│   ├── components/          # Componentes compartilhados
│   │   ├── data-display/    # Exibição de dados
│   │   ├── feedback/        # Feedbacks visuais
│   │   ├── layout/          # Estrutura visual
│   │   └── ui/              # Elementos da interface
│   ├── contexts/            # Contextos globais
│   ├── hooks/               # Hooks compartilhados
│   ├── lib/                 # Bibliotecas externas
│   ├── navigation/          # Configuração de navegação
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

## Princípios da Arquitetura

### Clean Architecture

A Clean Architecture separa o código em camadas com responsabilidades específicas:

1. **Entidades**: Objetos de negócio com regras independentes de UI e banco de dados
2. **Casos de Uso**: Regras de negócio específicas da aplicação
3. **Adaptadores**: Conversão entre formatos externos e internos
4. **Frameworks**: Ferramentas externas como UI, banco de dados, web

### Feature-First

A abordagem Feature-First organiza o código por funcionalidade de negócio, em vez de tipo técnico:

1. **Coesão**: Todo o código relacionado a uma funcionalidade fica no mesmo lugar
2. **Desacoplamento**: Cada feature pode evoluir independentemente
3. **Manutenção**: Facilita encontrar e modificar código relacionado

## Como Importar Componentes e Serviços

### Componentes Compartilhados
```typescript
import { Button } from '@/core/components/ui';
import { AlertModal } from '@/core/components/feedback';
```

### Serviços Específicos de Features
```typescript
import { competitionService } from '@/features/competitions/services';
import { rankingService } from '@/features/statistics/services';
```

## Padrões e Convenções

1. **Barrel Exports**: Cada diretório tem um `index.ts` para exportar seus módulos
2. **Nomenclatura**: 
   - Arquivos de componentes em PascalCase (ex: `PlayerAvatar.tsx`)
   - Arquivos de serviços, hooks e utils em camelCase (ex: `playerService.ts`)
3. **Tipagem**: Use interfaces TypeScript para todas as props e estados
4. **Styled Components**: Siga o padrão de tipagem com ThemeProps

## Migração e Ajustes

Ao migrar código para a nova estrutura:

1. Corrija os caminhos de importação
2. Respeite a organização por feature
3. Mova tipos específicos para a pasta de types da feature
4. Utilize os arquivos barrel (index.ts) para importação
5. Mantenha a consistência nos padrões de tipagem TypeScript

## Políticas de RLS no Supabase

O projeto implementa políticas de Row Level Security no Supabase para controlar o acesso aos dados, especialmente para:

- Criação de jogos
- Adição de membros em competições
- Auto-criação de perfil após sign-up

## Funcionalidades Específicas

### Gerenciamento de Competições
- Lógica avançada de exclusão/inativação
- Funcionalidade de edição com validação
- Verificação de status dos jogos

### Validação de Telefones
- Formato brasileiro: (XX) XXXXX-XXXX
- Validação de DDD (11-99)
- Validação do dígito 9 inicial
