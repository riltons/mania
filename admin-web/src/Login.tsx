import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import './login.css';

interface LoginPageProps {
  onLogin?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      onLogin && onLogin();
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-container">
          <div className="login-header">
            <div className="login-logo">
              <h1>🏆 DominóMania</h1>
              <p>Painel Administrativo</p>
            </div>
          </div>
          
          <div className="login-form-container">
            <h2>Acesso ao Dashboard</h2>
            {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <div className="input-container">
                  <span className="input-icon">📧</span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Senha
                </label>
                <div className="input-container">
                  <span className="input-icon">🔒</span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Digite sua senha"
                    required
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                className={`login-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Entrando...
                  </>
                ) : (
                  <>
                    <span>Entrar no Dashboard</span>
                    <span className="button-icon">→</span>
                  </>
                )}
              </button>
            </form>
          </div>
          
          <div className="login-footer">
            <p>© 2024 DominóMania - Sistema de Gestão</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
