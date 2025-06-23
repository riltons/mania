import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import LoginPage from './Login';
import Dashboard from './Dashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Inicializar sessão
  useEffect(() => {
    // Buscar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Loading inicial
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.25rem'
      }}>
        Carregando...
      </div>
    );
  }

  // Se não autenticado, mostrar login
  if (!session) {
    return <LoginPage onLogin={() => {}} />;
  }

  // Se autenticado, mostrar Dashboard direto (sem sidebar de navegação)
  return <Dashboard />;
}

export default App; 