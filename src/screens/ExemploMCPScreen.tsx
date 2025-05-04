import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MCP, MCPUtils } from '@/lib/supabaseMCP';
import { useRouter } from 'expo-router';

// Tipos para as entidades do banco de dados
type Player = {
  id: string;
  name: string;
  nickname: string | null;
  user_id: string;
  created_at: string;
};

type Competition = {
  id: string;
  name: string;
  description: string | null;
  community_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  prize_pool: number | null;
  created_at: string;
};

export default function ExemploMCPScreen() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMensagem, setStatusMensagem] = useState<string>('');

  // Inicializar o MCP e carregar dados iniciais
  useEffect(() => {
    const inicializarDados = async () => {
      try {
        setLoading(true);
        setStatusMensagem('Inicializando MCP...');
        
        // Inicializar o MCP
        await MCPUtils.initialize();
        setStatusMensagem('MCP inicializado. Carregando jogadores...');
        
        // Carregar jogadores
        const { data: playersData, error: playersError } = await MCPUtils.fetchAndUpdateContext('players', {});
        if (playersError) throw playersError;
        setPlayers(playersData || []);
        
        setStatusMensagem('Carregando competiu00e7u00f5es...');
        // Carregar competiu00e7u00f5es
        const { data: competitionsData, error: competitionsError } = await MCPUtils.fetchAndUpdateContext('competitions', {});
        if (competitionsError) throw competitionsError;
        setCompetitions(competitionsData || []);
        
        setStatusMensagem('Dados carregados com sucesso!');
      } catch (err) {
        console.error('Erro ao inicializar dados:', err);
        setError(`Erro ao carregar dados: ${(err as Error).message}`);
        setStatusMensagem('Ocorreu um erro ao carregar os dados.');
      } finally {
        setLoading(false);
      }
    };

    inicializarDados();

    // Configurar listeners para atualizau00e7u00f5es em tempo real
    const playersSubscription = MCPUtils.setupRealtimeListeners('players', (payload) => {
      console.log('Atualizau00e7u00e3o de jogadores recebida:', payload);
      const updatedPlayers = MCP.getContext('players') || [];
      setPlayers(updatedPlayers);
    });

    const competitionsSubscription = MCPUtils.setupRealtimeListeners('competitions', (payload) => {
      console.log('Atualizau00e7u00e3o de competiu00e7u00f5es recebida:', payload);
      const updatedCompetitions = MCP.getContext('competitions') || [];
      setCompetitions(updatedCompetitions);
    });

    // Limpar subscriptions quando o componente desmontar
    return () => {
      playersSubscription.unsubscribe();
      competitionsSubscription.unsubscribe();
    };
  }, []);

  // Funu00e7u00e3o para atualizar os dados
  const atualizarDados = async () => {
    setLoading(true);
    setError(null);
    setStatusMensagem('Atualizando dados...');
    
    try {
      // Recarregar jogadores
      const { data: playersData, error: playersError } = await MCPUtils.fetchAndUpdateContext('players', {});
      if (playersError) throw playersError;
      setPlayers(playersData || []);
      
      // Recarregar competiu00e7u00f5es
      const { data: competitionsData, error: competitionsError } = await MCPUtils.fetchAndUpdateContext('competitions', {});
      if (competitionsError) throw competitionsError;
      setCompetitions(competitionsData || []);
      
      setStatusMensagem('Dados atualizados com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar dados:', err);
      setError(`Erro ao atualizar dados: ${(err as Error).message}`);
      setStatusMensagem('Ocorreu um erro ao atualizar os dados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Exemplo de Integrau00e7u00e3o MCP</Text>
      
      {statusMensagem ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTexto}>{statusMensagem}</Text>
        </View>
      ) : null}
      
      {error ? (
        <View style={styles.erroContainer}>
          <Text style={styles.erroTexto}>{error}</Text>
        </View>
      ) : null}
      
      <TouchableOpacity 
        style={styles.botaoAtualizar} 
        onPress={atualizarDados}
        disabled={loading}
      >
        <Text style={styles.botaoTexto}>
          {loading ? 'Carregando...' : 'Atualizar Dados'}
        </Text>
      </TouchableOpacity>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingTexto}>Carregando dados...</Text>
        </View>
      ) : (
        <ScrollView style={styles.conteudoContainer}>
          {/* Seu00e7u00e3o de Jogadores */}
          <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Jogadores ({players.length})</Text>
            
            {players.length === 0 ? (
              <Text style={styles.mensagemVazio}>Nenhum jogador encontrado</Text>
            ) : (
              players.map((player) => (
                <View key={player.id} style={styles.itemCard}>
                  <Text style={styles.itemTitulo}>{player.name}</Text>
                  {player.nickname && (
                    <Text style={styles.itemSubtitulo}>Apelido: {player.nickname}</Text>
                  )}
                  <Text style={styles.itemInfo}>
                    Cadastrado em: {new Date(player.created_at).toLocaleDateString('pt-BR')}
                  </Text>
                </View>
              ))
            )}
          </View>
          
          {/* Seu00e7u00e3o de Competiu00e7u00f5es */}
          <View style={styles.secaoContainer}>
            <Text style={styles.secaoTitulo}>Competiu00e7u00f5es ({competitions.length})</Text>
            
            {competitions.length === 0 ? (
              <Text style={styles.mensagemVazio}>Nenhuma competiu00e7u00e3o encontrada</Text>
            ) : (
              competitions.map((competition) => (
                <View key={competition.id} style={styles.itemCard}>
                  <Text style={styles.itemTitulo}>{competition.name}</Text>
                  {competition.description && (
                    <Text style={styles.itemDescricao}>{competition.description}</Text>
                  )}
                  <Text style={styles.itemInfo}>
                    Inu00edcio: {new Date(competition.start_date).toLocaleDateString('pt-BR')}
                  </Text>
                  {competition.end_date && (
                    <Text style={styles.itemInfo}>
                      Tu00e9rmino: {new Date(competition.end_date).toLocaleDateString('pt-BR')}
                    </Text>
                  )}
                  <Text style={[styles.itemStatus, { color: getStatusColor(competition.status) }]}>
                    Status: {getStatusText(competition.status)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// Funu00e7u00f5es auxiliares para formatar o status
function getStatusText(status: string): string {
  switch (status) {
    case 'active': return 'Ativo';
    case 'upcoming': return 'Em breve';
    case 'completed': return 'Concluu00eddo';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return '#52c41a';
    case 'upcoming': return '#1890ff';
    case 'completed': return '#722ed1';
    case 'cancelled': return '#f5222d';
    default: return '#000000';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: '#333',
  },
  statusContainer: {
    backgroundColor: '#e6f7ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statusTexto: {
    color: '#0066cc',
    fontSize: 14,
  },
  erroContainer: {
    backgroundColor: '#fff2f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  erroTexto: {
    color: '#ff4d4f',
    fontSize: 14,
  },
  botaoAtualizar: {
    backgroundColor: '#1890ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  botaoTexto: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTexto: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  conteudoContainer: {
    flex: 1,
  },
  secaoContainer: {
    marginBottom: 24,
  },
  secaoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  mensagemVazio: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  itemTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  itemSubtitulo: {
    fontSize: 16,
    marginBottom: 4,
    color: '#666',
  },
  itemDescricao: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  itemInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  itemStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
});
