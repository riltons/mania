# Regras de Negócio - Gerenciamento de Usuários no Sistema de Competições de Dominó

## 1. Papéis de Usuário

### 1.1. Administrador
- **Permissões Gerais**:
  - Possui controle total sobre suas comunidades criadas
  - Pode criar novas comunidades
  - Pode nomear organizadores para suas comunidades
  - Possui automaticamente um perfil de jogador

- **Processo de Cadastro**:
  - Ao se cadastrar, recebe automaticamente o papel de Administrador
  - Deve completar seu perfil de jogador na página de perfil
  - Deve fornecer número de celular para validação

- **Gestão de Organizadores**:
  - Pode nomear organizadores através do email do usuário
  - Sistema verifica se o email está cadastrado
  - Notifica o novo organizador via email e push notification

### 1.2. Organizador
- **Permissões**:
  - Gerenciar jogadores nas comunidades onde é organizador
  - Criar e gerenciar competições
  - Gerenciar jogos e partidas
  - Visualizar estatísticas da comunidade

- **Limitações**:
  - Não pode criar novas comunidades (exclusivo para Administradores)
  - Só pode gerenciar comunidades onde foi nomeado como organizador

### 1.3. Jogador
- **Dados Cadastrais**:
  - Nome (obrigatório)
  - Apelido (opcional)
  - Número de celular (obrigatório)

- **Funcionalidades**:
  - Visualizar eventos das comunidades onde participa
  - Acompanhar suas estatísticas e rankings
  - Participar de competições quando adicionado

## 2. Regras de Sistema

### 2.1. Cadastro e Autenticação
- Sistema verifica duplicidade de números de celular
- Jogadores existentes podem criar conta de Administrador
- Matches de jogadores são feitos pelo número de celular
- Scores e histórico são mantidos em caso de match

### 2.2. Comunidades
- Administrador é automaticamente adicionado como membro ao criar comunidade
- Administrador pode adicionar jogadores já cadastrados
- Sistema verifica existência prévia dos jogadores por celular

### 2.3. Validações Futuras
- Implementação futura de validação de celular via SMS
- Sistema de confirmação para participação em comunidades

