import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabaseMCP } from '@/lib/supabaseMCP';

type TabelaInfo = {
  nome: string;
  registros?: number;
  carregando?: boolean;
  erro?: string;
};

export default function ListaTabelasSupabase() {
  const [tabelas, setTabelas] = useState<TabelaInfo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensagemStatus, setMensagemStatus] = useState('Inicializando...');
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);

  // Função para listar as tabelas do Supabase
  const listarTabelas = async () => {
    setCarregando(true);
    setErro(null);
    setMensagemStatus('Conectando ao Supabase e buscando tabelas...');
    setTabelas([]);
    
    try {
      // Consulta para obter todas as tabelas do esquema público
      const { data, error } = await supabaseMCP
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .not('tablename', 'like', 'pg_%')
        .not('tablename', 'like', 'auth_%')
        .not('tablename', 'like', 'storage_%')
        .order('tablename');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setMensagemStatus(`${data.length} tabelas encontradas`);
        
        // Mapear os dados para o formato que queremos
        const tabelasInfo = data.map(table => ({
          nome: table.tablename,
        }));
        
        setTabelas(tabelasInfo);
      } else {
        setMensagemStatus('Nenhuma tabela encontrada');
      }
    } catch (error: any) {
      console.error('Erro ao listar tabelas:', error);
      setErro(`Erro ao listar tabelas: ${error.message || 'Erro desconhecido'}`);
      setMensagemStatus('Ocorreu um erro');
    } finally {
      setCarregando(false);
    }
  };

  // Função para buscar detalhes de cada tabela
  const buscarDetalhesTabelas = async () => {
    if (tabelas.length === 0) return;
    
    setMostrarDetalhes(true);
    setMensagemStatus('Buscando detalhes das tabelas...');
    
    // Criar uma cópia das tabelas com status de carregamento
    const tabelasAtualizadas = tabelas.map(tabela => ({
      ...tabela,
      carregando: true,
    }));
    
    setTabelas(tabelasAtualizadas);
    
    // Buscar detalhes para cada tabela
    for (let i = 0; i < tabelasAtualizadas.length; i++) {
      const tabela = tabelasAtualizadas[i];
      
      try {
        // Buscar contagem de registros
        const { count, error: countError } = await supabaseMCP
          .from(tabela.nome)
          .select('*', { count: 'exact', head: true });
        
        // Atualizar a tabela com os detalhes
        tabelasAtualizadas[i] = {
          ...tabela,
          registros: count || 0,
          carregando: false,
          erro: countError ? countError.message : undefined,
        };
        
        // Atualizar o estado para mostrar o progresso
        setTabelas([...tabelasAtualizadas]);
      } catch (error: any) {
        // Atualizar a tabela com o erro
        tabelasAtualizadas[i] = {
          ...tabela,
          carregando: false,
          erro: error.message || 'Erro desconhecido',
        };
        
        // Atualizar o estado para mostrar o erro
        setTabelas([...tabelasAtualizadas]);
      }
    }
    
    setMensagemStatus('Detalhes das tabelas carregados');
  };

  // Carregar as tabelas quando o componente montar
  useEffect(() => {
    listarTabelas();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Tabelas do Supabase</Text>
      
      {mensagemStatus ? (
        <View style={styles.statusContainer}>
          <Text style={styles.statusTexto}>{mensagemStatus}</Text>
        </View>
      ) : null}
      
      {erro ? (
        <View style={styles.erroContainer}>
          <Text style={styles.erroTexto}>{erro}</Text>
        </View>
      ) : null}
      
      <View style={styles.botoesContainer}>
        <TouchableOpacity 
          style={styles.botao} 
          onPress={listarTabelas}
          disabled={carregando}
        >
          <Text style={styles.botaoTexto}>
            {carregando ? 'Carregando...' : 'Atualizar Lista'}
          </Text>
        </TouchableOpacity>
        
        {tabelas.length > 0 && !mostrarDetalhes && (
          <TouchableOpacity 
            style={[styles.botao, styles.botaoSecundario]} 
            onPress={buscarDetalhesTabelas}
            disabled={carregando}
          >
            <Text style={styles.botaoTexto}>Mostrar Detalhes</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {carregando && tabelas.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
          <Text style={styles.loadingTexto}>Carregando tabelas...</Text>
        </View>
      ) : (
        <ScrollView style={styles.listaContainer}>
          <Text style={styles.subtitulo}>
            {tabelas.length > 0 
              ? `${tabelas.length} Tabelas Encontradas:` 
              : 'Nenhuma tabela encontrada'}
          </Text>
          
          {tabelas.map((tabela, index) => (
            <View key={tabela.nome} style={styles.tabelaItem}>
              <Text style={styles.tabelaNome}>
                {index + 1}. {tabela.nome}
              </Text>
              
              {mostrarDetalhes && (
                <View style={styles.detalhesContainer}>
                  {tabela.carregando ? (
                    <ActivityIndicator size="small" color="#0066cc" />
                  ) : tabela.erro ? (
                    <Text style={styles.erroTexto}>Erro: {tabela.erro}</Text>
                  ) : (
                    <Text style={styles.detalhesTexto}>
                      Registros: {tabela.registros}
                    </Text>
                  )}
                </View>
              )}
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
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statusContainer: {
    backgroundColor: '#e6f7ff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  statusTexto: {
    color: '#0066cc',
    textAlign: 'center',
  },
  erroContainer: {
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  erroTexto: {
    color: '#d32f2f',
  },
  botoesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  botao: {
    backgroundColor: '#0066cc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  botaoSecundario: {
    backgroundColor: '#4caf50',
  },
  botaoTexto: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTexto: {
    marginTop: 10,
    color: '#666',
  },
  listaContainer: {
    flex: 1,
  },
  tabelaItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  tabelaNome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detalhesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  detalhesTexto: {
    color: '#666',
  },
});
