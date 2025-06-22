# 🏆 Guia Rápido: Rankings no Dashboard

## 🎯 Acesso Rápido

**URL:** `http://localhost:5174/jogosOnline`

## 📊 Funcionalidades da Sidebar de Rankings

### 1. **Filtrar Rankings por Competição**
- Selecione uma competição no topo do dashboard
- Os rankings são automaticamente atualizados para mostrar apenas dados dessa competição
- Selecione "Todas as Competições" para ver rankings globais

### 2. **Alternar entre Jogadores e Duplas**
- **👤 Tab "Jogadores"**: Ranking individual dos top 10 jogadores
- **👥 Tab "Duplas"**: Ranking das top 8 duplas (apenas jogos 2x2)

### 3. **Informações Exibidas**
- **Posição**: 1º, 2º, 3º... (1º lugar com coroa 👑)
- **Avatar**: Foto do jogador ou inicial do nome
- **Nome**: Nome completo do jogador/dupla
- **Estatísticas**: Vitórias-Derrotas (Taxa de vitória%)
- **Pontos**: Total de pontos ganhos

### 4. **Competições Finalizadas**
- **Seção de Campeões**: Aparece no topo quando a competição está finalizada
- **Background Dourado**: Destaque especial para os campeões
- **Informações Completas**: Campeão individual e campeão de duplas

## 🏅 Critérios de Ranking

### Ordem de Prioridade:
1. **Vitórias** (mais vitórias = melhor posição)
2. **Derrotas** (menos derrotas = melhor posição)
3. **Taxa de Vitória** (% de jogos vencidos)
4. **Pontuação Total** (soma de todos os pontos)

### Filtros Aplicados:
- ✅ Apenas jogadores/duplas com pelo menos 1 jogo finalizado
- ✅ Para duplas: apenas jogos 2x2 contam
- ✅ Baseado apenas em jogos com status "finalizado"

## 📱 Design Responsivo

### TV/Monitor Grande (1600px+)
- Sidebar de 400px de largura
- Fontes grandes e legíveis
- Avatares de 48px

### Tela Média (1400px)
- Sidebar de 350px
- Elementos ligeiramente menores
- Avatares de 40px

### Tela Pequena (< 1200px)
- Layout em coluna
- Sidebar fica em cima do dashboard
- Altura limitada a 60% da tela

## 🔄 Atualizações Automáticas

### Quando os Rankings Atualizam:
- ✅ Ao selecionar uma competição diferente
- ✅ A cada 30 segundos (auto-refresh)
- ✅ Quando um jogo é finalizado (tempo real via Supabase)
- ✅ Quando dados são modificados no banco

### Estados Visuais:
- **Loading**: Spinner + "Carregando rankings..."
- **Vazio**: "Nenhum jogador/dupla com jogos finalizados"
- **Dados**: Rankings organizados e coloridos

## 🎨 Indicadores Visuais

### Cores:
- **Dourado**: 1º lugar (campeão)
- **Roxo**: Header e elementos de destaque
- **Verde**: Taxa de vitória e indicadores positivos
- **Cinza**: Elementos neutros

### Animações:
- **Hover**: Cards se movem ligeiramente para a direita
- **Primeiro Lugar**: Efeito dourado com sombra especial
- **Loading**: Spinner rotativo suave

## 🏆 Status de Campeões

### Competição em Andamento:
```
📊 Rankings
🏁 Nome da Competição
```

### Competição Finalizada:
```
📊 Rankings
🏁 Nome da Competição
🏆 FINALIZADA

🏆 Campeões
Jogador: João Silva
Dupla: Maria & Pedro
```

## ⚡ Dicas de Uso

1. **Para Administradores**: Use para acompanhar performance durante competições
2. **Para Espectadores**: Ideal para exibir em TVs durante eventos
3. **Para Análise**: Compare performance entre diferentes competições
4. **Para Premiação**: Use os dados de campeões para cerimônias

---

**🎮 Aproveite o novo sistema de rankings para tornar suas competições ainda mais emocionantes!** 