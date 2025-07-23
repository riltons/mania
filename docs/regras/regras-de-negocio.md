### **Regras de Negócio para o Aplicativo de Gerenciamento de Competições de Dominó**

---

#### **Cadastro e Papéis de Usuário**
1. **Administrador e Organizador**:
   - Ao se cadastrar, o usuário recebe os papéis de **Administrador** e **Organizador**.
   - O **Administrador** pode criar suas próprias comunidades e nomear outros organizadores vinculados a estas.
   - O **Organizador** pode:
     - Adicionar jogadores.
     - Criar competições.
     - Gerenciar jogos e partidas.
     - Visualizar estatísticas.
   - Apenas o **Administrador** pode criar comunidades.

2. **Registro Adicional para Administradores**:
   - Se o administrador seguir o fluxo normal de registro, o sistema reconhece que ele já possui o papel de **Organizador**.
   - O sistema permite que ele amplie seu perfil para incluir o papel de **Administrador**, possibilitando criar suas próprias comunidades e gerenciar outros organizadores vinculados a estas.

3. **Cadastro de Jogadores**:
   - Dados solicitados para jogadores:
     - Nome (obrigatório).
     - Apelido (opcional).
     - Número de celular (obrigatório).
   - Se um jogador tentar se registrar no sistema:
     - O sistema reconhece o número de celular.
     - Permite que ele crie um perfil de **Administrador e Organizador** para suas próprias comunidades.
     - O jogador mantém acesso para visualizar eventos da comunidade onde participa como jogador.

---

#### **Gestão de Comunidades**
1. **Criação de Comunidades**:
   - Realizada exclusivamente por administradores.
   - Ao criar uma comunidade:
     - Um grupo do WhatsApp é criado automaticamente.
   - Jogadores podem ser adicionados diretamente a partir dos contatos do smartphone.
   - Jogadores recebem uma mensagem para aceitar ou recusar o convite ao grupo.

---

#### **Gestão de Competições**
1. **Criação de Competições**:
   - Criada por um organizador dentro de uma comunidade.
   - Inicialmente, a competição permanece em estado **Pendente**.

2. **Início da Competição**:
   - O botão "Iniciar Competição" é habilitado após a adição de pelo menos 4 jogadores.
   - A partir daí, jogos podem ser criados.

3. **Encerramento da Competição**:
   - Uma competição pode ser encerrada se:
     - Houver pelo menos 1 jogo finalizado.
     - Não houver nenhum jogo pendente ou em andamento.
   - O sistema exibe os ganhadores da competição e o score de cada jogador e dupla participante.

---

#### **Gestão de Jogos e Partidas**
1. **Criação de Jogos**:
   - Jogos podem ser criados por sorteio ou escolha manual das duplas participantes.

2. **Composição de Jogos e Partidas**:
   - Cada jogo é composto por múltiplas partidas.
   - A pontuação de cada partida segue as regras:
     - **Vitória Simples**: 1 ponto.
     - **Vitória de Carroça**: 2 pontos.
     - **Vitória de Lá-e-lô**: 3 pontos.
     - **Vitória de Cruzada**: 4 pontos.
     - **Vitória por Contagem de Pontos**: 1 ponto.
     - **Empate**: 0 ponto, mas a próxima partida concede 1 ponto extra à dupla vencedora.

3. **Finalização de Jogos**:
   - Um jogo termina quando uma dupla alcança pelo menos **6 pontos**.
   - O placar final é exibido, e o sistema destaca vitórias especiais:
     - **Buchuda**: Quando uma dupla vence sem que a adversária marque pontos.
     - **Buchuda de Ré**: Quando uma dupla vence após virar o placar estando em desvantagem de **5 a 0**.

---

#### **Dashboard e Estatísticas**
1. **Página de Dashboard**:
   - Apresenta os scores:
     - De jogadores.
     - De jogos e partidas realizadas.
   - Estatísticas detalhadas por jogador, dupla, e competição.