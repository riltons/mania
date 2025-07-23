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
  plansCount: {
    free: number;
    premium_monthly: number;
    premium_yearly: number;
  };
  recentUsers: RecentUser[]; 
}

const initialStats: Stats = { 
  totalUsers: 0, 
  totalSubscriptions: 0, 
  byStatus: {}, 
  plansCount: {
    free: 0,
    premium_monthly: 0,
    premium_yearly: 0
  },
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
      plansCount: {
        free: 10,
        premium_monthly: 15,
        premium_yearly: 20
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
        .select('status, plan_id');
      if (subsError) throw subsError;

      const byStatus = subscriptions.reduce((acc, sub) => {
        const status = sub.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const byPlan = subscriptions.reduce((acc, sub) => {
        const plan = (sub.plan_id as string) || 'unknown';
        acc[plan] = (acc[plan] || 0) + 1;
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
        plansCount: {
          free: byPlan.free || 0,
          premium_monthly: byPlan.premium_monthly || 0,
          premium_yearly: byPlan.premium_yearly || 0
        },
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
      <p style={{fontSize: '1rem'}}>Carregando...</p>
    </div>
  );

  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-logo">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMEMzMS4wNDU3IDAgNDAgOC45NTQzIDQwIDIwQzQwIDMxLjA0NTcgMzEuMDQ1NyA0MCAyMCA0MEw4IDQwQzMuNTgxNzIgNDAgMCAzNi40MTgzIDAgMzJMMCAxNkMwIDcuMTYzNDQgNy4xNjM0NCAwIDE2IDBMMjAgMFoiIGZpbGw9IiM0ZjZhZjYiLz48cGF0aCBkPSJNMTUgMTVMMTUgMjVMMjUgMjVMMjUgMTVMMTUgMTVaIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==" alt="Logo" />
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
          <div className="nav-item">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Relatórios
          </div>
          <div className="nav-item">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurações
          </div>
        </div>
      </div>
      
      <div className="main-content">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
          
          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
            <div className="search-bar">
              <input type="text" placeholder="Pesquisar..." />
              <button>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
            
            <button 
              onClick={() => fetchStats()} 
              className="btn btn-primary"
              title="Atualizar dados"
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Atualizar
            </button>
            
            <div className="user-profile">
              <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iI2U2ZTZlNiIvPjxwYXRoIGQ9Ik0yMCAxOWMzLjMxNCAwIDYtMi42ODYgNi02cy0yLjY4Ni02LTYtNi02IDIuNjg2LTYgNiAyLjY4NiA2IDYgNnptMCAzYy06LjA3OCAwLTExIDMuNjY3LTExIDguMmMwIDIuNTc3IDIuMDI5IDQuNjY3IDQuNTI5IDQuOEgyNi40N2MyLjUgLS4xMzMgNC41My0yLjIyMyA0LjUzLTQuOCAwLTQuNTMzLTQuOTIyLTguMi0xMS04LnoiIGZpbGw9IiM5OTkiLz48L3N2Zz4=" alt="Usuário" />
              <span>Admin</span>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="alert">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" style={{color: 'var(--warning-color)'}}>
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
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
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <p className="stat-title">Total de Usuários</p>
            <p className="stat-value">{stats.totalUsers}+</p>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon orange">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p className="stat-title">Total de Assinaturas</p>
            <p className="stat-value">{stats.totalSubscriptions}+</p>
          </div>
          
          {stats.byStatus.active && (
            <div className="stat-card">
              <div className="stat-icon green">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="stat-title">Assinaturas Ativas</p>
              <p className="stat-value">{stats.byStatus.active}+</p>
            </div>
          )}
          
          {stats.byStatus.trial && (
            <div className="stat-card">
              <div className="stat-icon purple">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="stat-title">Período de Teste</p>
              <p className="stat-value">{stats.byStatus.trial}</p>
            </div>
          )}
          {stats.plansCount.free !== undefined && (
            <div className="stat-card">
              <div className="stat-icon blue"></div>
              <p className="stat-title">Planos Gratuitos</p>
              <p className="stat-value">{stats.plansCount.free}</p>
            </div>
          )}
          {stats.plansCount.premium_monthly !== undefined && (
            <div className="stat-card">
              <div className="stat-icon orange"></div>
              <p className="stat-title">Planos Premium Mensais</p>
              <p className="stat-value">{stats.plansCount.premium_monthly}</p>
            </div>
          )}
          {stats.plansCount.premium_yearly !== undefined && (
            <div className="stat-card">
              <div className="stat-icon green"></div>
              <p className="stat-title">Planos Premium Anuais</p>
              <p className="stat-value">{stats.plansCount.premium_yearly}</p>
            </div>
          )}
        </div>
        
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h2 className="chart-title">Relatório de Vendas</h2>
              <div className="chart-filter">
                Mensal
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="chart-content">
              <div style={{
                width: '100%', 
                height: '100%', 
                background: 'linear-gradient(180deg, rgba(79, 106, 246, 0.1) 0%, rgba(79, 106, 246, 0.05) 100%)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-light)',
                fontSize: '0.9rem'
              }}>
                Gráfico de vendas será exibido aqui
              </div>
            </div>
          </div>
          
          <div className="chart-card">
            <div className="chart-header">
              <h2 className="chart-title">Estatísticas</h2>
              <div className="chart-filter">
                Diário
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <div className="chart-content">
              <div style={{
                width: '100%', 
                height: '100%', 
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '0.5rem 0 1rem 0'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: 'var(--text-color)',
                  marginBottom: '1rem',
                  marginLeft: '0.5rem'
                }}>Estatísticas</h3>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'flex-end',
                  height: '150px',
                  marginBottom: '1rem'
                }}>
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, i) => {
                    // Alturas aleatórias mais controladas para o gráfico
                    const heights = [40, 80, 50, 45, 70, 90, 55];
                    return (
                      <div key={i} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '30px'
                      }}>
                        <div style={{
                          width: '20px',
                          height: heights[i],
                          background: 'var(--primary-color)',
                          borderRadius: '4px 4px 0 0'
                        }}></div>
                        <span style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-light)',
                          marginTop: '0.5rem'
                        }}>{day}</span>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '0.5rem',
                  gap: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      width: '10px',
                      height: '10px',
                      background: 'var(--primary-color)',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-light)'
                    }}>Assinaturas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="tables-grid">
          <div className="table-card">
            <div className="table-header">
              <h2 className="table-title">Usuários Recentes</h2>
              <span className="see-all">Ver todos</span>
            </div>
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Data de Cadastro</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentUsers.map((u,i) => (
                    <tr key={i}>
                      <td>
                        <div className="product-cell">
                          <div className="product-image">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="product-name">{u.email}</div>
                            <div className="product-id">ID: {i+1000}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="user-date">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          background: 'rgba(78, 203, 113, 0.1)',
                          color: '#4ecb71',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          Ativo
                        </span>
                      </td>
                      <td className="action-cell">•••</td>
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
