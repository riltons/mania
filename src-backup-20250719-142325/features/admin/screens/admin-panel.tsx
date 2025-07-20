import React, { useState, useEffect } from 'react';
import { ActivityIndicator, ScrollView, Text, View, Alert } from 'react-native';
import { useAuth } from '@/core/hooks/useAuth';
import { supabase } from '@/core/lib/supabase';
import styled from 'styled-components/native';

const Container = styled.View`
  flex: 1;
  padding: 20px;
  background-color: ${({ theme }: { theme: any }) => theme.colors.backgroundDark};
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: bold;
  color: ${({ theme }: { theme: any }) => theme.colors.primary};
  margin-bottom: 16px;
`;

const StatBox = styled.View`
  margin-bottom: 24px;
`;

const StatText = styled.Text`
  font-size: 18px;
  color: ${({ theme }: { theme: any }) => theme.colors.textPrimary};
  margin-bottom: 8px;
`;

export default function AdminPanelPage() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ 
    totalUsers: 0, 
    totalSubscriptions: 0, 
    byStatus: {} as Record<string, number>,
    recentUsers: [] as Array<{email: string, created_at: string}>
  });

  useEffect(() => {
    if (!authLoading && user) {
      // Verificar se o usuário é admin
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error('Erro ao verificar papel do usuário:', error);
            setIsAdmin(false);
            return;
          }
          
          if (data && data.length > 0) {
            setIsAdmin(data[0].role === 'admin');
          } else {
            setIsAdmin(false);
          }
        });
    } else if (!user) {
      setIsAdmin(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  async function fetchStats() {
    try {
      // Buscar contagem de assinaturas
      const { count: subsCount, error: countError } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });
        
      if (countError) throw countError;
      
      // Buscar assinaturas com status
      const { data: subs, error: subsError } = await supabase
        .from('subscriptions')
        .select('user_id,status');
        
      if (subsError) throw subsError;
      
      // Buscar usuários recentes
      const { data: recentUsers, error: usersError } = await supabase
        .from('users')
        .select('email,created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (usersError) {
        console.error('Erro ao buscar usuários recentes:', usersError);
      }
      
      // Processar dados
      const userIds = new Set((subs || []).map(s => s.user_id));
      const byStatus = (subs || []).reduce((acc, s) => {
        acc[s.status] = (acc[s.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      setStats({ 
        totalUsers: userIds.size, 
        totalSubscriptions: subsCount || 0, 
        byStatus,
        recentUsers: recentUsers || []
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as estatísticas');
    }
  }

  if (authLoading || isAdmin === null) return <Container><ActivityIndicator /></Container>;
  if (!isAdmin) return <Container><Text style={{ color: '#fff' }}>Acesso negado</Text></Container>;

  return (
    <ScrollView>
      <Container>
        <Title>Painel Administrativo</Title>
        
        <StatBox>
          <StatText>Total de usuários com assinaturas: {stats.totalUsers}</StatText>
        </StatBox>
        
        <StatBox>
          <StatText>Total de assinaturas: {stats.totalSubscriptions}</StatText>
        </StatBox>
        
        <StatBox>
          <StatText>Assinaturas por status:</StatText>
          {Object.entries(stats.byStatus).map(([status, count]) => (
            <View key={status} style={{flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4}}>
              <Text style={{color: '#fff'}}>{status}</Text>
              <Text style={{color: '#fff'}}>{count}</Text>
            </View>
          ))}
        </StatBox>
        
        <StatBox>
          <StatText>Usuários recentes:</StatText>
          {stats.recentUsers.map((user, index) => (
            <View key={index} style={{marginVertical: 4}}>
              <Text style={{color: '#fff'}}>{user.email}</Text>
              <Text style={{color: '#fff', fontSize: 12}}>
                {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          ))}
        </StatBox>
        
        <View style={{marginTop: 20, marginBottom: 40}}>
          <Text style={{color: '#fff', textAlign: 'center'}}>
            Acesse o painel completo em: /admin-panel
          </Text>
          <Text style={{color: '#fff', textAlign: 'center', marginTop: 8}}>
            Usuário super admin: riltons@gmail.com
          </Text>
        </View>
      </Container>
    </ScrollView>
  );
}

