import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { supabaseMCP, MCP, MCPUtils } from '@/lib/supabaseMCP';

type Community = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  owner_id: string;
};

export default function SupabaseMCPTest() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Inicializar o MCP quando o componente montar
  useEffect(() => {
    const initializeMCP = async () => {
      try {
        await MCPUtils.initialize();
        setMessage('MCP inicializado com sucesso');
      } catch (err) {
        setError('Erro ao inicializar MCP: ' + (err as Error).message);
      }
    };

    initializeMCP();

    // Configurar listener para atualizações em tempo real
    const subscription = MCPUtils.setupRealtimeListeners('communities', (payload) => {
      console.log('Atualização em tempo real recebida:', payload);
      setMessage(`Atualização recebida: ${payload.eventType} em communities`);
      // As atualizações do contexto são gerenciadas automaticamente pelo MCP
      const updatedCommunities = MCP.getContext('communities') || [];
      setCommunities(updatedCommunities);
    });

    // Limpar subscription quando o componente desmontar
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Função para buscar comunidades usando o MCP
  const fetchCommunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await MCPUtils.fetchAndUpdateContext('communities', {});
      if (error) throw error;
      
      setCommunities(data || []);
      setMessage(`${data?.length || 0} comunidades carregadas`);
    } catch (err) {
      setError('Erro ao buscar comunidades: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Função para adicionar uma comunidade de teste
  const addTestCommunity = async () => {
    setLoading(true);
    setError(null);
    try {
      const newCommunity = {
        name: `Comunidade Teste ${new Date().toISOString().substring(0, 10)}`,
        description: 'Esta é uma comunidade de teste criada via MCP',
        owner_id: (await supabaseMCP.auth.getUser()).data.user?.id || 'unknown',
      };

      const { data, error } = await MCPUtils.sendAndUpdateContext('communities', newCommunity);
      if (error) throw error;
      
      setMessage('Comunidade adicionada com sucesso');
      // O contexto já foi atualizado pelo MCP, mas vamos buscar novamente para garantir
      fetchCommunities();
    } catch (err) {
      setError('Erro ao adicionar comunidade: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar o contexto MCP
  const clearContext = () => {
    MCP.clearAllContext();
    setCommunities([]);
    setMessage('Contexto MCP limpo');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Teste do Supabase com MCP</Text>
      
      {message && (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button 
          title="Buscar Comunidades" 
          onPress={fetchCommunities} 
          disabled={loading} 
        />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Adicionar Comunidade Teste" 
          onPress={addTestCommunity} 
          disabled={loading} 
        />
        <View style={styles.buttonSpacer} />
        <Button 
          title="Limpar Contexto MCP" 
          onPress={clearContext} 
          disabled={loading} 
        />
      </View>
      
      {loading ? (
        <Text style={styles.loadingText}>Carregando...</Text>
      ) : (
        <ScrollView style={styles.listContainer}>
          <Text style={styles.subtitle}>
            {communities.length > 0 
              ? `${communities.length} Comunidades Encontradas:` 
              : 'Nenhuma comunidade encontrada'}
          </Text>
          
          {communities.map((community) => (
            <View key={community.id} style={styles.communityItem}>
              <Text style={styles.communityName}>{community.name}</Text>
              <Text style={styles.communityDescription}>
                {community.description || 'Sem descrição'}
              </Text>
              <Text style={styles.communityMeta}>
                ID: {community.id} | Criado em: {new Date(community.created_at).toLocaleDateString()}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  buttonSpacer: {
    width: 8,
  },
  listContainer: {
    flex: 1,
  },
  communityItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  communityName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  communityDescription: {
    fontSize: 14,
    marginBottom: 8,
    color: '#555',
  },
  communityMeta: {
    fontSize: 12,
    color: '#888',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  messageContainer: {
    backgroundColor: '#e6f7ff',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  messageText: {
    color: '#0066cc',
  },
  errorContainer: {
    backgroundColor: '#fff2f0',
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#ff4d4f',
  },
});
