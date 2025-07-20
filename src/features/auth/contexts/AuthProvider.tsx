import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/core/lib/supabase';
import { Platform } from 'react-native';

interface AuthContextData {
  session: Session | null;
  isLoading: boolean;
  user: any | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Função de login
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Tentando login com:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro no login:', error.message);
        return { success: false, error: error.message };
      }
      
      console.log('Login bem-sucedido:', data.session?.user?.id);
      // Atualiza o estado da sessão imediatamente após login bem-sucedido
      setSession(data.session);
      return { success: true, data };
    } catch (error: any) {
      console.error('Exceção no login:', error.message);
      return { success: false, error: error.message };
    }
  };
  
  // Função de registro
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName
          }
        }
      });
      
      if (error) {
        return { success: false, error: error.message, data: null };
      }
      
      return { success: true, error: null, data };
    } catch (error: any) {
      return { success: false, error: error.message, data: null };
    }
  };
  
  // Função de logout
  const signOut = async () => {
    try {
      console.log('Realizando logout...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erro ao fazer logout:', error.message);
      } else {
        console.log('Logout realizado com sucesso');
        // Limpa a sessão imediatamente após o logout
        setSession(null);
      }
    } catch (error: any) {
      console.error('Exceção ao fazer logout:', error.message);
    }
  };
  
  // Função de recuperação de senha
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return { success: true, error: null };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    console.log('AuthProvider: Iniciando verificação de sessão e configuração...');
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;
    let subscription: { unsubscribe: () => void } | null = null;

    // Adiciona um timeout de segurança para evitar que o app fique preso na tela de splash
    const startTimeout = () => {
      timeoutId = setTimeout(() => {
        if (isMounted && isLoading) {
          console.warn('AuthProvider: Timeout de inicialização atingido - Forçando continuação');
          setSession(null);
          setIsLoading(false);
        }
      }, 5000); // Reduzido para 5 segundos para evitar que o app fique preso por muito tempo
    };

    const initializeAuth = async () => {
      try {
        if (typeof window === 'undefined') {
          console.log('AuthProvider: Ambiente não-web detectado');
          if (isMounted) setIsLoading(false);
          return;
        }

        // Verificar sessão atual
        console.log('AuthProvider: Verificando sessão atual...');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('AuthProvider: Erro ao verificar sessão:', error);
          if (isMounted) {
            setSession(null);
            setIsLoading(false);
          }
          return;
        }

        if (session) {
          console.log('AuthProvider: Sessão encontrada para usuário:', session.user.id);
        } else {
          console.log('AuthProvider: Nenhuma sessão ativa encontrada');
        }

        if (isMounted) {
          setSession(session);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('AuthProvider: Erro crítico durante inicialização:', error);
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    // Iniciar o processo de autenticação com prioridade
    Promise.resolve().then(() => {
      startTimeout();
      return initializeAuth();
    }).then(() => {
      // Escutar mudanças na autenticação após inicialização bem-sucedida
      console.log('AuthProvider: Configurando listener de autenticação...');
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log('AuthProvider: Mudança de estado detectada:', _event);
        if (isMounted) {
          setSession(session);
        }
      });
      subscription = authSubscription;
      return authSubscription;
    }).catch(error => {
      console.error('AuthProvider: Erro na configuração:', error);
      if (isMounted) {
        setSession(null);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('AuthProvider: Limpando recursos...');
      clearTimeout(timeoutId);
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const isAuthenticated = !!session;

  return (
    <AuthContext.Provider value={{ 
      session, 
      isLoading, 
      user: session?.user || null,
      isAuthenticated,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
