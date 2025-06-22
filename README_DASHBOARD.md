# 📺 Dashboard de Jogos em Tempo Real

## ✨ O que foi criado

Um sistema completo de dashboard para acompanhar jogos em tempo real, otimizado para exibição em TVs e monitores grandes. O sistema oferece duas versões:

### 🚀 Funcionalidades Implementadas

- **🔄 Atualizações em tempo real** via Supabase subscriptions
- **⏰ Auto-refresh** a cada 30 segundos
- **🎯 Filtros por competição** para focar em jogos específicos
- **📱 Duas versões**: Mobile (React Native) e Web (React)
- **🎨 Design responsivo** otimizado para TVs
- **🏆 Múltiplas seções**: Jogos em andamento, finalizados e próximos
- **👥 Informações detalhadas** dos jogadores e times
- **🎮 Status especiais**: Buchudas e Buchudas de Ré destacadas

## 📁 Estrutura dos Arquivos Criados

### Versão Mobile (React Native)
```
src-new/
├── app/dashboard.tsx                           # Rota principal do dashboard
├── features/dashboard/
│   ├── services/dashboardService.ts            # Serviços de dados e subscriptions
│   ├── components/
│   │   ├── GameCard.tsx                        # Card individual do jogo
│   │   ├── CompetitionSelector.tsx             # Seletor de competições
│   │   └── DashboardSection.tsx                # Seções organizadas
│   └── screens/Dashboard.tsx                   # Tela principal do dashboard
```

### Versão Web (React)
```
admin-web/src/
├── Dashboard.tsx                               # Componente principal web
├── Dashboard.css                               # Estilos otimizados para TV
└── App.tsx                                     # Roteamento atualizado
```

### Documentação
```
├── DASHBOARD_GUIDE.md                          # Guia completo de uso
└── README_DASHBOARD.md                         # Este arquivo
```

## 🚀 Como Executar

### Pré-requisitos
1. **Supabase configurado** com tabelas de jogos, competições e jogadores
2. **Node.js** instalado (versão 16 ou superior)
3. **Expo CLI** para versão mobile

### Versão Mobile (React Native)

```bash
# 1. Navegue para o diretório do projeto
cd mania-main

# 2. Instale as dependências (se ainda não instaladas)
npm install

# 3. Execute o app
expo start

# 4. No app, navegue para /dashboard
```

### Versão Web (React)

```bash
# 1. Navegue para o diretório web
cd mania-main/admin-web

# 2. Instale react-router-dom se não estiver instalado
npm install react-router-dom

# 3. Execute o servidor web
npm start

# 4. Acesse no navegador
http://localhost:3000/dashboard
```

## 📺 Configuração para TV

### Setup Básico para TV
1. **Conecte um computador à TV** via HDMI
2. **Configure a resolução** da TV (recomendado: 1920x1080 ou superior)
3. **Abra o navegador** em tela cheia (F11)
4. **Acesse** `http://localhost:3000/dashboard`

### Para Melhor Experiência
- **Use Chrome ou Firefox** atualizados
- **Mantenha zoom em 100%** para layout otimizado
- **Configure a TV** para não entrar em modo de economia
- **Conexão estável** de internet para atualizações em tempo real

## 🎮 Como Usar

### 1. Visualização Geral
- O dashboard mostra automaticamente todos os jogos de todas as competições ativas
- Seções organizadas por status: Em Andamento, Finalizados, Próximos

### 2. Filtrar por Competição
- Use o seletor na parte superior para filtrar uma competição específica
- Clique em "Todas as Competições" para voltar à visualização geral

### 3. Informações Exibidas
- **Placar ao vivo** com destaque para o time vencedor
- **Jogadores** com avatars e nomes
- **Status do jogo** (Pendente, Em Andamento, Finalizado)
- **Horários** de início e fim
- **Detalhes especiais** como Buchudas e Buchudas de Ré

### 4. Atualizações Automáticas
- **Tempo real**: Via Supabase subscriptions
- **Auto-refresh**: A cada 30 segundos
- **Indicador "AO VIVO"**: Mostra que está recebendo atualizações

## 🔧 Personalização

### Modificar Frequência de Atualização
Edite o arquivo `Dashboard.tsx` (web) ou `Dashboard.tsx` (mobile):

```javascript
// Linha ~180 (aproximadamente)
const interval = setInterval(() => {
  loadGames(selectedCompetitionId);
}, 30000); // Altere para 15000 para 15 segundos, etc.
```

### Alterar Cores
Edite `Dashboard.css` (versão web):

```css
/* Cores principais */
--primary-color: #8257e5;    /* Roxo principal */
--accent-color: #00875f;     /* Verde de destaque */
--success-color: #22c55e;    /* Verde para jogos em andamento */
```

### Ocultar Seções
Comente seções no componente Dashboard para mostrar apenas o que interessa:

```jsx
{/* Jogos em Andamento - sempre visível */}
<DashboardSection title="Jogos em Andamento" ... />

{/* Comentar para ocultar jogos finalizados */}
{/* <DashboardSection title="Jogos Finalizados" ... /> */}
```

## 🔍 Solução de Problemas

### Dados não carregam
1. **Verifique** se o Supabase está configurado corretamente
2. **Confirme** se existem jogos e competições no banco
3. **Verifique** as permissões RLS no Supabase
4. **Abra o console** do navegador (F12) para ver erros

### Layout quebrado na TV
1. **Zoom** deve estar em 100%
2. **Resolução** da TV deve ser 1920x1080 ou superior
3. **Use navegadores modernos** (Chrome, Firefox, Safari)
4. **Limpe cache** do navegador se necessário

### Performance lenta
1. **Conexão** de internet deve ser estável
2. **Feche outras abas** do navegador
3. **TVs antigas** podem ter limitações de processamento
4. **Reduza** a frequência de auto-refresh se necessário

## 📊 Estrutura de Dados

### Tabelas Utilizadas
- **`games`**: Informações dos jogos (placar, status, times)
- **`competitions`**: Dados das competições
- **`players`**: Informações dos jogadores
- **`community_members`**: Relacionamento jogadores-comunidades

### Campos Importantes
```sql
games:
- status: 'pending' | 'in_progress' | 'finished'
- team1_score, team2_score: Placar atual
- is_buchuda, is_buchuda_de_re: Marcadores especiais
- rounds: Histórico de rodadas

competitions:
- status: 'in_progress' para competições ativas
- name: Nome exibido no dashboard
```

## 🎯 Próximos Passos

### Melhorias Sugeridas
- [ ] **Sons de notificação** quando jogos terminam
- [ ] **Ranking ao vivo** dos jogadores
- [ ] **Gráficos de progresso** durante os jogos
- [ ] **Temas personalizáveis** por evento
- [ ] **Modo picture-in-picture** para múltiplas competições

### Integrações Possíveis
- [ ] **Streaming overlays** para transmissões
- [ ] **APIs REST** para sistemas externos
- [ ] **Push notifications** para aplicativos móveis
- [ ] **Chat ao vivo** para comentários

## 📞 Suporte

### Para Desenvolvedores
- Verifique logs no console do navegador (F12)
- Teste em diferentes navegadores/dispositivos
- Monitore performance com React DevTools

### Para Usuários Finais
1. **Recarregue a página** se houver problemas
2. **Verifique a internet** se dados não atualizam
3. **Ajuste zoom** se layout estiver estranho
4. **Use navegadores atualizados** para melhor compatibilidade

---

## 🎉 Resultado Final

O dashboard está **pronto para uso** e oferece uma experiência completa para acompanhamento de jogos em tempo real. Com design moderno, atualizações automáticas e otimização para TVs, é a solução perfeita para eventos, clubes e competições.

**🚀 Para começar a usar agora, siga os passos da seção "Como Executar" acima!** 