# Documento de Requisitos - Sistema Completo DominoMania

## Introdução

DominoMania é um aplicativo completo para gerenciamento de jogos de dominó, competições e comunidades. O sistema permite que usuários criem comunidades, organizem competições, registrem jogos e acompanhem estatísticas detalhadas. O aplicativo foi desenvolvido em React Native com Expo e utiliza Supabase como backend.

## Requisitos

### Requisito 1 - Sistema de Autenticação e Usuários

**História do Usuário:** Como um usuário, eu quero me registrar e fazer login no aplicativo, para que eu possa acessar todas as funcionalidades do sistema.

#### Critérios de Aceitação

1. QUANDO um usuário acessa o aplicativo pela primeira vez ENTÃO o sistema DEVE exibir opções de login e registro
2. QUANDO um usuário preenche o formulário de registro com email, senha, nome completo e apelido (opcional) ENTÃO o sistema DEVE criar uma conta de autenticação e um perfil de usuário
3. QUANDO um usuário faz login com credenciais válidas ENTÃO o sistema DEVE autenticar o usuário e redirecioná-lo para a dashboard
4. QUANDO um usuário está autenticado ENTÃO o sistema DEVE manter a sessão ativa e permitir acesso às funcionalidades protegidas
5. QUANDO um usuário faz logout ENTÃO o sistema DEVE encerrar a sessão e redirecioná-lo para a tela de login
6. QUANDO um usuário esquece a senha ENTÃO o sistema DEVE permitir recuperação via email
7. QUANDO um usuário edita seu perfil ENTÃO o sistema DEVE atualizar as informações (nome, telefone, apelido)

### Requisito 2 - Gerenciamento de Jogadores

**História do Usuário:** Como um usuário, eu quero cadastrar e gerenciar jogadores, para que eu possa organizá-los em jogos e competições.

#### Critérios de Aceitação

1. QUANDO um usuário acessa a seção de jogadores ENTÃO o sistema DEVE exibir "Meus Jogadores" e "Jogadores das Comunidades"
2. QUANDO um usuário cria um novo jogador com nome e telefone ENTÃO o sistema DEVE verificar se já existe um jogador com o mesmo telefone
3. SE um jogador com o mesmo telefone já existe ENTÃO o sistema DEVE vincular o jogador existente ao usuário atual
4. QUANDO um jogador é criado com sucesso ENTÃO o sistema DEVE registrar a atividade e atualizar a lista
5. QUANDO um usuário visualiza um jogador ENTÃO o sistema DEVE exibir estatísticas básicas (total de jogos, vitórias, derrotas, buchudas)
6. QUANDO um usuário edita um jogador que criou ENTÃO o sistema DEVE permitir alteração de nome, telefone e avatar
7. QUANDO um usuário exclui um jogador que criou ENTÃO o sistema DEVE remover o jogador se não houver jogos associados
8. QUANDO um usuário faz upload de avatar para um jogador ENTÃO o sistema DEVE armazenar a imagem no Supabase Storage

### Requisito 3 - Sistema de Comunidades

**História do Usuário:** Como um usuário, eu quero criar e gerenciar comunidades, para que eu possa organizar grupos de jogadores e competições.

#### Critérios de Aceitação

1. QUANDO um usuário cria uma nova comunidade ENTÃO o sistema DEVE verificar o limite de 3 comunidades por usuário
2. QUANDO uma comunidade é criada ENTÃO o sistema DEVE adicionar automaticamente o criador como organizador
3. QUANDO um usuário visualiza suas comunidades ENTÃO o sistema DEVE separar entre "Minhas Comunidades" e "Comunidades que Organizo"
4. QUANDO um organizador adiciona membros à comunidade ENTÃO o sistema DEVE permitir busca e seleção de jogadores
5. QUANDO um organizador gerencia a comunidade ENTÃO o sistema DEVE permitir adicionar/remover organizadores e membros
6. QUANDO um usuário visualiza uma comunidade ENTÃO o sistema DEVE exibir estatísticas (número de membros, competições, jogos)
7. QUANDO um criador desabilita uma comunidade ENTÃO o sistema DEVE ocultar a comunidade das listagens públicas
8. QUANDO um usuário pesquisa comunidades ENTÃO o sistema DEVE filtrar por nome usando busca parcial

### Requisito 4 - Sistema de Competições

**História do Usuário:** Como um organizador de comunidade, eu quero criar e gerenciar competições, para que eu possa organizar torneios estruturados.

#### Critérios de Aceitação

1. QUANDO um organizador cria uma competição ENTÃO o sistema DEVE verificar o limite de 5 competições ativas por comunidade
2. QUANDO uma competição é criada ENTÃO o sistema DEVE definir status inicial como "pendente"
3. QUANDO uma competição está pendente ENTÃO o sistema DEVE permitir adicionar/remover jogadores
4. QUANDO um organizador inicia uma competição ENTÃO o sistema DEVE alterar status para "em andamento" e bloquear alterações de membros
5. QUANDO uma competição está em andamento ENTÃO o sistema DEVE permitir criação de jogos entre os membros
6. QUANDO um organizador finaliza uma competição ENTÃO o sistema DEVE calcular resultados individuais e de duplas
7. QUANDO uma competição é finalizada ENTÃO o sistema DEVE alterar status para "finalizada" e registrar atividade com resultados
8. QUANDO um usuário visualiza uma competição ENTÃO o sistema DEVE exibir membros, jogos e estatísticas conforme o status

### Requisito 5 - Sistema de Jogos e Partidas

**História do Usuário:** Como um participante de competição, eu quero registrar jogos e rodadas, para que eu possa acompanhar o progresso das partidas.

#### Critérios de Aceitação

1. QUANDO um usuário cria um novo jogo ENTÃO o sistema DEVE verificar se é membro da competição e adicionar automaticamente se necessário
2. QUANDO um jogo é criado ENTÃO o sistema DEVE permitir seleção manual ou aleatória de equipes balanceadas
3. QUANDO um jogo é iniciado ENTÃO o sistema DEVE alterar status para "em andamento" e permitir registro de rodadas
4. QUANDO uma rodada é registrada ENTÃO o sistema DEVE calcular pontuação baseada no tipo de vitória (simples: 1pt, carroça: 2pts, lá-e-lô: 3pts, cruzada: 4pts, contagem: 1pt, empate: 0pt + bônus)
5. QUANDO uma rodada tem bônus de empate anterior ENTÃO o sistema DEVE adicionar +1 ponto à pontuação
6. QUANDO um time atinge 6 pontos ENTÃO o sistema DEVE finalizar automaticamente o jogo
7. QUANDO um jogo termina 6x0 ENTÃO o sistema DEVE registrar como "buchuda"
8. QUANDO um time estava perdendo 5x0 e vence ENTÃO o sistema DEVE registrar como "buchuda de ré"
9. QUANDO um jogo é finalizado ENTÃO o sistema DEVE registrar atividade com resultado detalhado
10. QUANDO um usuário visualiza um jogo ENTÃO o sistema DEVE exibir histórico de rodadas e placar atual

### Requisito 6 - Sistema de Estatísticas e Rankings

**História do Usuário:** Como um usuário, eu quero visualizar estatísticas detalhadas, para que eu possa acompanhar o desempenho dos jogadores e duplas.

#### Critérios de Aceitação

1. QUANDO um usuário acessa a dashboard ENTÃO o sistema DEVE exibir estatísticas básicas do usuário
2. QUANDO um usuário visualiza ranking de jogadores ENTÃO o sistema DEVE ordenar por vitórias, derrotas e pontuação
3. QUANDO um usuário visualiza ranking de duplas ENTÃO o sistema DEVE calcular estatísticas combinadas dos parceiros
4. QUANDO estatísticas são calculadas ENTÃO o sistema DEVE considerar todos os jogos finalizados
5. QUANDO um jogador tem buchudas ou buchudas de ré ENTÃO o sistema DEVE contabilizar separadamente
6. QUANDO uma competição é finalizada ENTÃO o sistema DEVE atualizar rankings globais
7. QUANDO um usuário filtra estatísticas ENTÃO o sistema DEVE permitir filtro por comunidade e competição

### Requisito 7 - Sistema de Atividades e Notificações

**História do Usuário:** Como um usuário, eu quero acompanhar atividades recentes, para que eu possa estar informado sobre eventos importantes.

#### Critérios de Aceitação

1. QUANDO uma ação importante ocorre ENTÃO o sistema DEVE registrar uma atividade com descrição e metadados
2. QUANDO um usuário visualiza atividades recentes ENTÃO o sistema DEVE exibir as 10 atividades mais recentes
3. QUANDO uma comunidade é criada ENTÃO o sistema DEVE registrar atividade com nome e descrição
4. QUANDO uma competição é criada ou finalizada ENTÃO o sistema DEVE registrar atividade com detalhes
5. QUANDO um jogo é criado ou finalizado ENTÃO o sistema DEVE registrar atividade com equipes e resultado
6. QUANDO buchudas ou buchudas de ré ocorrem ENTÃO o sistema DEVE destacar na atividade
7. QUANDO o sistema falha ao registrar atividade ENTÃO o sistema DEVE implementar retry com backoff exponencial

### Requisito 8 - Sistema de Armazenamento e Dados

**História do Usuário:** Como um usuário, eu quero que meus dados sejam armazenados de forma segura e eficiente, para que eu possa confiar na integridade das informações.

#### Critérios de Aceitação

1. QUANDO dados são armazenados ENTÃO o sistema DEVE utilizar Supabase como backend principal
2. QUANDO usuários acessam dados ENTÃO o sistema DEVE implementar Row Level Security (RLS) para proteção
3. QUANDO imagens são enviadas ENTÃO o sistema DEVE armazenar no Supabase Storage com URLs públicas
4. QUANDO relacionamentos são criados ENTÃO o sistema DEVE manter integridade referencial
5. QUANDO dados são consultados ENTÃO o sistema DEVE otimizar queries para performance
6. QUANDO erros ocorrem ENTÃO o sistema DEVE implementar tratamento adequado e logs detalhados
7. QUANDO migrações são aplicadas ENTÃO o sistema DEVE manter versionamento e rollback capability

### Requisito 9 - Interface do Usuário e Experiência

**História do Usuário:** Como um usuário, eu quero uma interface intuitiva e responsiva, para que eu possa usar o aplicativo facilmente em diferentes dispositivos.

#### Critérios de Aceitação

1. QUANDO um usuário acessa o aplicativo ENTÃO o sistema DEVE exibir interface adaptável para mobile e web
2. QUANDO operações são executadas ENTÃO o sistema DEVE exibir indicadores de carregamento
3. QUANDO erros ocorrem ENTÃO o sistema DEVE exibir mensagens claras e acionáveis
4. QUANDO dados são atualizados ENTÃO o sistema DEVE refletir mudanças em tempo real
5. QUANDO usuário navega ENTÃO o sistema DEVE manter estado consistente entre telas
6. QUANDO temas são aplicados ENTÃO o sistema DEVE suportar modo claro e escuro
7. QUANDO formulários são preenchidos ENTÃO o sistema DEVE validar dados no frontend e backend

### Requisito 10 - Integração com WhatsApp

**História do Usuário:** Como um organizador de comunidade, eu quero integrar a comunidade com um grupo do WhatsApp, para que os membros recebam notificações automáticas sobre eventos importantes.

#### Critérios de Aceitação

1. QUANDO uma comunidade é criada ENTÃO o sistema DEVE criar automaticamente um grupo no WhatsApp via Evolution API
2. QUANDO membros são adicionados à comunidade ENTÃO o sistema DEVE adicioná-los automaticamente ao grupo do WhatsApp
3. QUANDO uma competição é iniciada ENTÃO o sistema DEVE enviar mensagem automática para o grupo informando o início
4. QUANDO uma competição é finalizada ENTÃO o sistema DEVE enviar mensagem com resultados e ranking para o grupo
5. QUANDO um jogo é iniciado ENTÃO o sistema DEVE enviar mensagem informando as equipes participantes
6. QUANDO um jogo é finalizado ENTÃO o sistema DEVE enviar mensagem com o resultado e destaques (buchudas, buchudas de ré)
7. QUANDO buchudas ou buchudas de ré ocorrem ENTÃO o sistema DEVE destacar especialmente na mensagem
8. QUANDO o organizador configura notificações ENTÃO o sistema DEVE permitir personalizar tipos e frequência de mensagens
9. QUANDO há falha na integração ENTÃO o sistema DEVE implementar retry automático e logs de erro

### Requisito 11 - Sistema de Administração e Configuração

**História do Usuário:** Como um administrador, eu quero gerenciar configurações do sistema, para que eu possa manter o aplicativo funcionando adequadamente.

#### Critérios de Aceitação

1. QUANDO um usuário tem papel de administrador ENTÃO o sistema DEVE permitir acesso ao painel administrativo
2. QUANDO configurações são alteradas ENTÃO o sistema DEVE aplicar mudanças globalmente
3. QUANDO limites são definidos ENTÃO o sistema DEVE enforçar restrições (comunidades, competições, jogos)
4. QUANDO dados são migrados ENTÃO o sistema DEVE manter integridade e versionamento
5. QUANDO problemas são detectados ENTÃO o sistema DEVE registrar logs detalhados
6. QUANDO manutenção é necessária ENTÃO o sistema DEVE permitir operações administrativas
7. QUANDO métricas são coletadas ENTÃO o sistema DEVE fornecer insights sobre uso e performance