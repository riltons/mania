import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';

interface AuthContextData {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
