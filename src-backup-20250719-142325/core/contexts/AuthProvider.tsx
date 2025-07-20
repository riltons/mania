/**
 * Contexto de autenticação que gerencia o estado de autenticação da aplicação.
 * Fornece métodos para autenticação (login, cadastro, logout, etc.) e informações do usuário.
 * 
 * @component
 * @example
 * // Como usar o AuthProvider
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // Como usar o hook useAuth
 * const { user, isAuthenticated, signIn, signOut } = useAuth();
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/core/lib/supabase';
import { Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { authService } from '@/features/auth/services/authService';

/**
 * Interface para as respostas de autenticação
 */
interface AuthResponse {
  /** Indica se a operação foi bem-sucedida */
  success: boolean;
  
  /** Mensagem de erro, caso ocorra */
  error?: string;
  
  /** Dados adicionais retornados pela operação */
  data?: any;
}

/**
 * Dados e métodos disponíveis no contexto de autenticação
 */
interface AuthContextData {
  /** Usuário autenticado ou null se não estiver autenticado */
  user: User | null;
  
  /** Sessão atual ou null se não houver sessão */
  session: Session | null;
  
  /** Indica se o usuário está autenticado */
  isAuthenticated: boolean;
  
  /** Indica se a verificação de autenticação está em andamento */
  isLoading: boolean;
  
  /** Indica se a inicialização do AuthProvider foi concluída */
  isInitialized: boolean;
  
  /** Controla a exibição da página inicial (landing page) */
  showLanding: boolean;
  
  /** Função para controlar a exibição da landing page */
  setShowLanding: (show: boolean) => void;
  
  /** 
   * Realiza o login do usuário
   * @param email - E-mail do usuário
   * @param password - Senha do usuário
   * @returns Promise com o resultado da operação
   */
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  
  /** 
   * Cadastra um novo usuário
   * @param email - E-mail do usuário
   * @param password - Senha do usuário
   * @param name - Nome do usuário (opcional)
   * @returns Promise com o resultado da operação
   */
  signUp: (email: string, password: string, name?: string) => Promise<AuthResponse>;
  
  /** 
   * Realiza o logout do usuário
   * @returns Promise com o resultado da operação
   */
  signOut: () => Promise<AuthResponse>;
  
  /** 
   * Solicita a redefinição de senha
   * @param email - E-mail do usuário
   * @returns Promise com o resultado da operação
   */
  resetPassword: (email: string) => Promise<AuthResponse>;
  
  /** 
   * Atualiza a sessão do usuário
   * @returns Promise com a nova sessão e usuário ou erro
   */
  refreshSession: () => Promise<{
    session: Session | null;
    user: User | null;
    error?: AuthError | null;
  }>;
}

/**
 * Contexto de autenticação que fornece os dados e métodos de autenticação
 */
export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/**
 * Provedor de autenticação que envolve a aplicação e fornece o contexto de autenticação
 * para todos os componentes filhos.
 * 
 * @param {Object} props - Propriedades do componente
 * @param {React.ReactNode} props.children - Componentes filhos que terão acesso ao contexto de autenticação
 * @returns {JSX.Element} Componente de provedor de autenticação
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

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
      }, 5000) as unknown as NodeJS.Timeout; // Reduzido para 5 segundos para evitar que o app fique preso por muito tempo
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
          setIsInitialized(true);
          
          // Se não houver sessão, mantemos a landing page visível
          if (!session) {
            setShowLanding(true);
          }
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

  /**
   * Trata erros de autenticação de forma centralizada
   * @param {any} error - Erro ocorrido durante a autenticação
   */
  const handleAuthError = useCallback((error: any) => {
    console.error('Erro de autenticação:', {
      message: error?.message,
      status: error?.status,
      name: error?.name,
      stack: error?.stack
    });
    
    // Se for erro de refresh token ou sessão expirada, fazer logout e redirecionar para login
    if (error?.message?.includes('Invalid Refresh Token') || 
        error?.message?.includes('Refresh Token Not Found') ||
        error?.message?.includes('JWT expired')) {
      
      // Limpar tokens imediatamente para evitar loops de erro
      if (Platform.OS === 'web') {
        localStorage.removeItem('supabase.auth.token');
        localStorage.removeItem('supabase.auth.refreshToken');
      }
      
      Alert.alert(
        'Sessão expirada',
        'Sua sessão expirou. Por favor, faça login novamente.',
        [
          { 
            text: 'OK', 
            onPress: async () => {
              try {
                await supabase.auth.signOut();
              } catch (signOutError) {
                console.error('Erro ao fazer logout:', signOutError);
              } finally {
                setSession(null);
                setUser(null);
                router.replace('/login');
              }
            } 
          }
        ]
      );
    }
  }, []);

  /**
   * Realiza o login do usuário com e-mail e senha
   * @param {string} email - E-mail do usuário
   * @param {string} password - Senha do usuário
   * @returns {Promise<AuthResponse>} Resposta da operação de login
   */
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const result = await authService.signIn(email, password);
      return result;
    } catch (error) {
      handleAuthError(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao fazer login'
      };
    }
  }, [handleAuthError]);

  /**
   * Cadastra um novo usuário com e-mail, senha e nome opcional
   * @param {string} email - E-mail do usuário
   * @param {string} password - Senha do usuário
   * @param {string} [name] - Nome do usuário (opcional)
   * @returns {Promise<AuthResponse>} Resposta da operação de cadastro
   */
  const signUp = useCallback(async (email: string, password: string, name?: string): Promise<AuthResponse> => {
    try {
      const result = await authService.signUp(email, password, name);
      return result;
    } catch (error) {
      handleAuthError(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao criar conta'
      };
    }
  }, [handleAuthError]);

  /**
   * Realiza o logout do usuário atual
   * @returns {Promise<AuthResponse>} Resposta da operação de logout
   */
  const signOut = useCallback(async (): Promise<AuthResponse> => {
    try {
      const result = await authService.signOut();
      if (result.success) {
        setSession(null);
        setUser(null);
        setShowLanding(true);
        router.replace('/');
      }
      return result;
    } catch (error) {
      handleAuthError(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao sair'
      };
    }
  }, [handleAuthError]);

  /**
   * Solicita a redefinição de senha para um e-mail
   * @param {string} email - E-mail para o qual a redefinição será enviada
   * @returns {Promise<AuthResponse>} Resposta da operação de redefinição de senha
   */
  const resetPassword = useCallback(async (email: string): Promise<AuthResponse> => {
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      handleAuthError(error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao redefinir senha'
      };
    }
  }, [handleAuthError]);

  /**
   * Atualiza a sessão do usuário atual
   * @returns {Promise<{session: Session | null; user: User | null; error?: AuthError | null}>} 
   * Objeto contendo a sessão, usuário e possíveis erros
   */
  const refreshSession = useCallback(async (): Promise<{
    session: Session | null;
    user: User | null;
    error?: AuthError | null;
  }> => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        handleAuthError(error);
        return { session: null, user: null, error };
      }
      
      setSession(data.session);
      setUser(data.user);
      return { session: data.session, user: data.user };
    } catch (error) {
      const authError = error as AuthError;
      handleAuthError(authError);
      return { 
        session: null, 
        user: null, 
        error: authError 
      };
    }
  }, [handleAuthError]);

  /**
   * Efeito que atualiza o estado do usuário sempre que a sessão for alterada
   */
  useEffect(() => {
    if (session) {
      setUser(session.user);
    } else {
      setUser(null);
    }
  }, [session]);

  /**
   * Valor do contexto que será disponibilizado para os componentes filhos
   */
  const contextValue: AuthContextData = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    isInitialized,
    showLanding,
    setShowLanding,
    signIn,
    signUp,
    signOut,
    resetPassword,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
