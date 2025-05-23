import React, { useState, useEffect, useRef } from 'react';
import { supabase, getAdminClient } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import LoginPage from './Login';

// Tipos e estado
interface RecentUser { email: string; created_at: string; }
interface Stats { 
  totalUsers: number; 
  totalSubscriptions: number; 
  byStatus: Record<string, number>; 
  recentUsers: RecentUser[]; 
}

const initialStats: Stats = { 
  totalUsers: 0, 
  totalSubscriptions: 0, 
  byStatus: {}, 
  recentUsers: [] 
};

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light'|'dark'>(() => 
    (localStorage.getItem('theme') as 'light'|'dark') || 'light'
  );

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

  // Função para buscar dados reais
  async function fetchStats() {
    console.log('[App] fetchStats iniciada - session:', session);
    setLoading(true);
    setError(null);
    const adminClient = getAdminClient();
    console.log('[App] fetchStats - adminClient obtido');
    try {
      const { count: subsCount, error: countError } = await adminClient
        .from('subscriptions')
        .select('*', { count: 'exact', head: true });
      if (countError) throw countError;

      const { data: subscriptions, error: subsError } = await adminClient
        .from('subscriptions')
        .select('status');
      if (subsError) throw subsError;

      const byStatus = subscriptions.reduce((acc, sub) => {
        const status = sub.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const { data: recentUsers, error: usersError } = await adminClient
        .from('profiles')
        .select('email,created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      if (usersError) throw usersError;

      // Contagem de usuários únicos por user_id via PostgREST distinct
      // @ts-ignore: distinct não presente em tipos oficiais, mas funciona em runtime
      const { count: uniqueUserCount, error: uniqueCountError } = await adminClient
        .from('subscriptions')
        .select('user_id', { head: true, count: 'exact', distinct: ['user_id'] } as any);
      if (uniqueCountError) throw uniqueCountError;

      const statsData: Stats = {
        totalUsers: uniqueUserCount || 0,
        totalSubscriptions: subsCount || 0,
        byStatus,
        recentUsers: recentUsers || [],
      };
      setStats(statsData);
    } catch (error) {
      console.error('Erro ao buscar dados administrativos:', error);
      setError('Não foi possível buscar dados reais. Usando dados de demonstração.');
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

  // Se não autenticado, mostrar tela de login
  if (!session) {
    return <LoginPage onLogin={() => {}} />;
  }

  // Loading
  if (loading) return (
    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      <p style={{fontSize: '1.25rem'}}>Carregando...</p>
    </div>
  );

  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-header">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEMzMS4wNDU3IDAgNDAgOC45NTQzIDQwIDIwQzQwIDMxLjA0NTcgMzEuMDQ1NyA0MCAyMCA0MEw4IDQwQzMuNTgxNzIgNDAgMCAzNi40MTgzIDAgMzJMMCAxNkMwIDcuMTYzNDQgNy4xNjM0NCAwIDE2IDBMMjAgMFoiIGZpbGw9IiM0ZWNkYzQiLz48cGF0aCBkPSJNMTUgMTVMMTUgMjVMMjUgMjVMMjUgMTVMMTUgMTVaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==" alt="Logo" />
          <h1>DominôMania</h1>
        </div>
        
        <div className="nav-menu">
          <div className="nav-item active">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </div>
          <div className="nav-item">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Usuários
          </div>
          <div className="nav-item">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Assinaturas
          </div>
        </div>
        
        <div style={{marginTop: 'auto', paddingTop: '2rem'}}>
          <button 
            onClick={() => setTheme(t => t==='light'?'dark':'light')} 
            className="btn btn-outline"
            style={{width: '100%'}}
          >
            {theme==='light' ? '🌙 Modo Escuro' : '☀️ Modo Claro'}
          </button>
        </div>
      </div>
      
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          
          <div style={{display: 'flex', gap: '0.75rem'}}>
            <button 
              onClick={() => fetchStats()} 
              className="btn btn-primary"
              title="Atualizar dados"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{marginRight: '4px'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Atualizar
            </button>
          </div>
        </div>
        
        {error && (
          <div className="alert">
            <div>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="alert-content">
              <p className="alert-message">{error}</p>
              <button 
                onClick={() => fetchStats()} 
                className="alert-action"
              >
                Tentar novamente
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
    </div>
  );
}

export default App;
