import React, { useState, useEffect, useRef } from 'react';
import { supabase, getAdminClient } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import LoginPage from './Login';

// Tipos e estado
interface RecentUser { email: string; created_at: string; }
interface Stats { totalUsers: number; totalSubscriptions: number; byStatus: Record<string, number>; recentUsers: RecentUser[]; }
const initialStats: Stats = { totalUsers: 0, totalSubscriptions: 0, byStatus: {}, recentUsers: [] };

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light'|'dark'>(() => (localStorage.getItem('theme') as 'light'|'dark') || 'light');

  // Ref para garantir fetchStats apenas uma vez após login
  const fetchCalledRef = useRef(false);

  // Inicializa sessão de usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Buscar stats após autenticação, apenas uma vez
  useEffect(() => {
    if (session && !fetchCalledRef.current) {
      fetchStats();
      fetchCalledRef.current = true;
    }
  }, [session]);

  // Função para definir dados de demonstração
  function setDemoData() {
    setLoading(false);
    setError('Usando dados de demonstração - Clique em "Atualizar" para tentar conectar novamente');
    setStats({
      totalUsers: 42,
      totalSubscriptions: 50,
      byStatus: {
        active: 35,
        canceled: 8,
        trial: 7
      },
      recentUsers: [
        { email: 'usuario1@exemplo.com', created_at: new Date().toISOString() },
        { email: 'usuario2@exemplo.com', created_at: new Date(Date.now() - 86400000).toISOString() },
        { email: 'usuario3@exemplo.com', created_at: new Date(Date.now() - 172800000).toISOString() },
        { email: 'usuario4@exemplo.com', created_at: new Date(Date.now() - 259200000).toISOString() },
        { email: 'usuario5@exemplo.com', created_at: new Date(Date.now() - 345600000).toISOString() }
      ]
    });
  }

  // Função para tentar buscar dados reais via Edge Function
  async function fetchStats() {
    try {
      setLoading(true);
      setError(null);
      
      // Obter token de acesso para chamar Edge Function
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Não foi possível obter credenciais de administrador');
      }
      
      // Chamar Edge Function para obter estatísticas
      const { data, error } = await adminClient.functions.invoke('admin-stats');
      
      if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Nenhum dado retornado pela função');
      }
      
      // Atualizar estado com dados recebidos
      setStats({
        totalUsers: data.totalUsers || 0,
        totalSubscriptions: data.totalSubscriptions || 0,
        byStatus: data.byStatus || {},
        recentUsers: data.recentUsers || []
      });
      
      console.log('Dados carregados com sucesso:', data);
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err);
      setError(err.message || 'Erro desconhecido ao buscar dados');
      
      // Usar dados de demonstração em caso de erro
      setDemoData();
    } finally {
      setLoading(false);
    }
  }

  // Toggle tema e persistência
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme==='dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (!session) {
    return <LoginPage onLogin={() => {}} />;
  }

  // Loading
  if (loading) return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><p style={{fontSize: '1.25rem'}}>Carregando...</p></div>;

  return (
    <div className="container">
      {error && (
        <div className="alert">
          <div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{color: '#F59E0B'}}>
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="alert-content">
            <p className="alert-message">{error}</p>
            <button 
              onClick={() => fetchStats()} 
              className="alert-action"
              aria-label="Tentar novamente"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: '4px'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Atualizar
            </button>
          </div>
        </div>
      )}
        
      <div className="dashboard-grid">
        <div className="stat-card primary">
          <p className="stat-title">Total de Usuários</p>
          <p className="stat-value">{stats.totalUsers}</p>
          <div className="stat-icon">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
        
        <div className="stat-card success">
          <p className="stat-title">Total de Assinaturas</p>
          <p className="stat-value">{stats.totalSubscriptions}</p>
          <div className="stat-icon">
            <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
        
        {stats.byStatus.active && (
          <div className="stat-card">
            <p className="stat-title">Assinaturas Ativas</p>
            <p className="stat-value">{stats.byStatus.active}</p>
            <div className="stat-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}
        
        {stats.byStatus.canceled && (
          <div className="stat-card warning">
            <p className="stat-title">Assinaturas Canceladas</p>
            <p className="stat-value">{stats.byStatus.canceled}</p>
            <div className="stat-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}
        
        {stats.byStatus.trial && (
          <div className="stat-card danger">
            <p className="stat-title">Período de Teste</p>
            <p className="stat-value">{stats.byStatus.trial}</p>
            <div className="stat-icon">
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem'}}>
        <div className="stat-card">
          <p className="stat-title">Taxa de Conversão</p>
          <div className="donut-chart">
            <div className="donut-chart-value">
              {Math.round((stats.byStatus.active || 0) / (stats.totalSubscriptions || 1) * 100)}%
            </div>
          </div>
          <div className="donut-chart-label">Assinaturas ativas / Total</div>
        </div>
        
        <div>
          <h2 className="section-title">Usuários Recentes</h2>
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Data de Cadastro</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentUsers.map((u,i) => (
                  <tr key={i}>
                    <td>
                      <span className="user-email">{u.email}</span>
                    </td>
                    <td>
                      <span className="user-date">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td>
                      <span className="badge" style={{background: 'rgba(78, 205, 196, 0.1)', color: '#4ecdc4', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem'}}>
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
