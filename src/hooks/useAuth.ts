import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import { Alert } from 'react-native';
import { router } from 'expo-router';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('[useAuth] Iniciando verificação de sessão...');
        let isMounted = true;

        const initializeAuth = async () => {
            try {
                console.log('[useAuth] Tentando obter sessão do Supabase...');
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('[useAuth] Erro ao obter sessão:', error);
                    handleAuthError(error);
                    if (isMounted) {
                        setSession(null);
                        setLoading(false);
                    }
                    return;
                }

                if (data?.session?.user) {
                    console.log('[useAuth] Sessão obtida com sucesso:', {
                        userId: data.session.user.id,
                        email: data.session.user.email,
                        lastSignIn: data.session.user.last_sign_in_at
                    });
                } else {
                    console.log('[useAuth] Nenhuma sessão ativa encontrada');
                }

                if (isMounted) {
                    setSession(data.session);
                    setLoading(false);
                }
            } catch (error) {
                console.error('[useAuth] Erro crítico ao verificar sessão:', error);
                if (isMounted) {
                    setSession(null);
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // Escuta mudanças na autenticação
        console.log('[useAuth] Configurando listener de mudanças de autenticação...');
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('[useAuth] Mudança de estado de autenticação:', _event, session?.user?.id);
            if (isMounted) {
                setSession(session);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            console.log('[useAuth] Cleanup: Listener de autenticação removido');
        };
    }, []);

    // Função para lidar com erros de autenticação
    const handleAuthError = (error: any) => {
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
                                router.replace('/login');
                            }
                        } 
                    }
                ]
            );
        }
    };

    // Adicionar listener para erros de autenticação
    useEffect(() => {
        const subscription = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'TOKEN_REFRESHED') {
                console.log('Token atualizado com sucesso');
            }
            
            if (event === 'SIGNED_OUT') {
                console.log('Usuário desconectado');
                setSession(null);
            }
        });

        return () => subscription.data.subscription.unsubscribe();
    }, []);

    const user = session?.user ?? null;
    const value = {
        user,
        isAuthenticated: !!user,
        loading,
        signIn: async (email: string, password: string) => {
            try {
                return await authService.signIn(email, password);
            } catch (error) {
                handleAuthError(error);
                throw error;
            }
        },
        signUp: async (email: string, password: string, name?: string) => {
            try {
                return await authService.signUp(email, password, name);
            } catch (error) {
                handleAuthError(error);
                throw error;
            }
        },
        signOut: async () => {
            try {
                return await authService.signOut();
            } catch (error) {
                handleAuthError(error);
                throw error;
            }
        },
        resetPassword: async (email: string) => {
            try {
                return await authService.resetPassword(email);
            } catch (error) {
                handleAuthError(error);
                throw error;
            }
        }
    };

    return value;
}
