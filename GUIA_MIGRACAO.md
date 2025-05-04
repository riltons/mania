# Guia de Migração para a Nova Estrutura

Este documento descreve o processo de migração para a nova estrutura de diretórios do projeto DominoMania, que segue princípios de Arquitetura em Camadas e Domain-Driven Design.

## Visão Geral da Nova Estrutura

```
src/
├── core/                      # Núcleo da aplicação
│   ├── config/                # Configurações da aplicação
│   ├── lib/                   # Bibliotecas e integrações externas
│   ├── hooks/                 # React hooks globais
│   ├── contexts/              # Contextos React globais
│   └── utils/                 # Utilitários e helpers
│
├── components/                # Componentes reutilizáveis
│   ├── ui/                    # Componentes de UI básicos
│   ├── layout/                # Componentes de layout
│   ├── feedback/              # Componentes de feedback
│   └── data-display/          # Componentes de exibição de dados
│
├── features/                  # Recursos organizados por domínio
│   ├── auth/                  # Autenticação
│   ├── players/               # Jogadores
│   ├── games/                 # Jogos
│   ├── communities/           # Comunidades
│   ├── competitions/          # Competições
│   ├── statistics/            # Estatísticas
│   └── admin/                 # Administração
│
├── navigation/                # Configuração de navegação
├── assets/                    # Recursos estáticos
├── styles/                    # Estilos globais e temas
├── types/                     # Definições de tipos TypeScript
└── app/                       # Ponto de entrada da aplicação
```

## Etapas de Migração

### 1. Atualização de Importações

Ao migrar arquivos para a nova estrutura, é necessário atualizar as importações. Abaixo estão alguns exemplos de como as importações devem ser atualizadas:

#### Antes:
```typescript
import { Button } from '@/components/Button';
import { useTheme } from '@/contexts/ThemeProvider';
import { supabase } from '@/lib/supabase';
```

#### Depois:
```typescript
import { Button } from '@/components/ui';
import { useTheme } from '@/core/contexts/ThemeProvider';
import { supabase } from '@/core/lib/supabase';
```

### 2. Migração Gradual

A migração deve ser feita gradualmente, seguindo estas etapas:

1. **Fase 1**: Migrar arquivos de infraestrutura (core, componentes básicos)
2. **Fase 2**: Migrar serviços para suas respectivas pastas de domínio
3. **Fase 3**: Migrar telas e componentes específicos de domínio
4. **Fase 4**: Atualizar todas as importações no projeto

### 3. Testes

Após cada fase de migração, é importante executar testes para garantir que tudo continua funcionando corretamente:

```bash
# Verificar se a aplicação compila
npm run build

# Executar testes (se disponíveis)
npm test

# Iniciar a aplicação para testes manuais
npm start
```

## Benefícios da Nova Estrutura

1. **Melhor Organização**: Código organizado por domínio e responsabilidade
2. **Maior Manutenibilidade**: Facilita encontrar e modificar código relacionado
3. **Escalabilidade**: Estrutura preparada para crescimento do projeto
4. **Reutilização**: Componentes e lógica organizados para facilitar reutilização
5. **Separação de Responsabilidades**: Cada parte do código tem uma função clara

## Próximos Passos

1. Completar a migração de todos os arquivos
2. Atualizar documentação do projeto
3. Remover diretórios e arquivos obsoletos após a migração completa
4. Implementar testes automatizados para garantir a integridade do código
