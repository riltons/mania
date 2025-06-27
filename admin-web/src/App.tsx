import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Dashboard from './Dashboard';
import LoginPage from './Login';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário já está autenticado
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Escutar mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        console.log('Estado de autenticação mudou:', event, !!session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Loading inicial
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontFamily: 'Inter, sans-serif',
        backgroundColor: '#f7fafc'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '2rem'
        }}>
          <div style={{
            fontSize: '2rem',
            marginBottom: '1rem'
          }}>🏆</div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 600,
            color: '#4a5568',
            marginBottom: '0.5rem'
          }}>DominóMania Admin</div>
          <div style={{
            fontSize: '0.9rem',
            color: '#718096'
          }}>Carregando...</div>
        </div>
      </div>
    );
  }

  // Se não está autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  // Se está autenticado, mostrar o dashboard
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/jogosOnline" replace />} />
        <Route path="/jogosOnline" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
