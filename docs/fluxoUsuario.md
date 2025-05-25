# Fluxo de Criação de Usuário

Este documento descreve em detalhes o processo completo de criação de um novo usuário no sistema, desde a interface até o armazenamento no banco de dados.

## Visão Geral do Processo

O fluxo de criação de usuário envolve as seguintes etapas:

1. Preenchimento do formulário de registro pelo usuário
2. Validação dos dados no frontend
3. Criação da conta de autenticação no Supabase
4. Criação do perfil do usuário na tabela `user_profiles`
5. Login automático após o registro bem-sucedido
6. Redirecionamento para a dashboard

## Componentes e Arquivos Envolvidos

### 1. Tela de Registro (`/src/app/register.tsx`)

Este é o componente principal que gerencia a interface de usuário para o registro. Ele contém:

- Formulário com campos para nome completo, e-mail, senha, confirmação de senha e apelido (opcional)
- Validação básica dos campos
- Lógica para chamar os serviços de autenticação e criação de perfil

```tsx
import React, { useState } from 'react';
import { Alert, ActivityIndicator, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import styled from 'styled-components/native';
import { useAuth } from '../hooks/useAuth';
import { userService } from '../services/userService';
import { useTheme } from '../contexts/ThemeProvider';
import { supabase } from '@/lib/supabase';

export default function Register() {
    const router = useRouter();
    const { signUp, signIn } = useAuth();
    const [loading, setLoading] = useState(false);
    const { colors } = useTheme();
    const [form, setForm] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        nickname: ''
    });

    const handleRegister = async () => {
        if (!form.email || !form.password || !form.fullName) {
            Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
            return;
        }

        if (form.password !== form.confirmPassword) {
            Alert.alert('Erro', 'As senhas não conferem');
            return;
        }

        if (form.password.length < 6) {
            Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            // 1. Criar conta de autenticação
            const { data, error: signUpError } = await signUp(form.email, form.password, form.fullName);
            
            if (signUpError) {
                throw new Error(signUpError);
            }

            if (!data?.user) {
                throw new Error('Erro ao criar usuário. Por favor, tente novamente.');
            }

            // 2. Criar perfil inicial (dados básicos)
            const { error: profileError } = await userService.createProfile(
                data.user.id,
                form.fullName,
                '', // telefone será preenchido depois no perfil
                form.nickname
            );

            if (profileError) {
                throw profileError;
            }

            // 3. Fazer login automático
            const { error: signInError } = await signIn(form.email, form.password);
            
            if (signInError) {
                throw new Error(signInError);
            }

            // Redireciona imediatamente após o login bem-sucedido
            router.replace('/(tabs)/dashboard');

        } catch (error: any) {
            console.error('Erro completo no registro:', error);
            Alert.alert(
                'Erro',
                typeof error === 'string' ? error : error?.message || 'Não foi possível criar sua conta. Tente novamente.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Código de renderização do formulário...
}
```

### 2. Hook de Autenticação (`/src/hooks/useAuth.ts`)

Este hook encapsula a lógica de autenticação e fornece métodos para registro, login e logout:

```typescript
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { authService } from '@/services/authService';
import { Alert } from 'react-native';
import { router } from 'expo-router';

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Inicialização e verificação de sessão...

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
        // Outros métodos...
    };

    return value;
}
```

### 3. Serviço de Autenticação (`/src/services/authService.ts`)

Este serviço é responsável por interagir diretamente com a API de autenticação do Supabase:

```typescript
import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
    success: boolean;
    error?: string;
    data?: any;
}

class AuthService {
    // Tratamento de erros...

    async signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
        try {
            const { data, error } = await supabase.auth.signUp({
                email: email.trim().toLowerCase(),
                password,
                options: {
                    data: {
                        name: name || email.split('@')[0]
                    }
                }
            });

            if (error) {
                console.error('Erro no cadastro:', error);
                return {
                    success: false,
                    error: this.getErrorMessage(error)
                };
            }

            // Criar perfil na tabela profile
            if (data?.user) {
                try {
                    const { error: profileError } = await supabase
                        .from('profiles')
                        .insert([
                            {
                                id: data.user.id,
                                name: name || email.split('@')[0],
                                email: email.trim().toLowerCase(),
                                updated_at: new Date().toISOString()
                            }
                        ]);
                    
                    if (profileError) {
                        console.error('Erro ao criar perfil:', profileError);
                    }
                } catch (profileError) {
                    console.error('Exceção ao criar perfil:', profileError);
                }
            }

            return {
                success: true,
                data
            };
        } catch (error: any) {
            console.error('Erro inesperado no cadastro:', error);
            return {
                success: false,
                error: 'Erro inesperado ao criar conta. Tente novamente.'
            };
        }
    }

    // Outros métodos...
}

export const authService = new AuthService();
```

### 4. Serviço de Usuário (`/src/services/userService.ts`)

Este serviço gerencia as operações relacionadas ao perfil do usuário:

```typescript
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/user';

export const userService = {
    async createProfile(
        userId: string,
        fullName: string,
        phoneNumber: string,
        nickname?: string
    ): Promise<{ data: UserProfile | null; error: Error | null }> {
        try {
            // Primeiro verifica se já existe um perfil
            const { data: existingProfile } = await supabase
                .from('user_profiles')
                .select()
                .eq('user_id', userId)
                .single();

            // Se já existe, atualiza
            if (existingProfile) {
                const { data, error } = await supabase
                    .from('user_profiles')
                    .update({
                        full_name: fullName,
                        phone_number: phoneNumber,
                        nickname
                    })
                    .eq('user_id', userId)
                    .select()
                    .single();

                if (error) throw error;
                return { data, error: null };
            }

            // Se não existe, cria novo perfil
            const { data, error } = await supabase
                .from('user_profiles')
                .insert({
                    user_id: userId,
                    full_name: fullName,
                    phone_number: phoneNumber,
                    nickname
                })
                .select()
                .single();

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error creating/updating user profile:', error);
            return { data: null, error: error as Error };
        }
    },
    
    // Outros métodos...
}
```

### 5. Contexto de Autenticação (`/src/contexts/AuthProvider.tsx`)

Este componente fornece o contexto de autenticação para toda a aplicação:

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextData {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }

    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 6. Cliente Supabase (`/src/lib/supabase.ts`)

Este arquivo configura o cliente Supabase para interagir com o backend:

```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { Database } from '@/types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Configuração de armazenamento seguro...

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        onAuthStateChange: (event, session) => {
            // Tratamento de eventos de autenticação...
        }
    },
});
```

## Estrutura do Banco de Dados

### 1. Tabela `auth.users` (gerenciada pelo Supabase Auth)

Esta tabela é gerenciada internamente pelo Supabase e armazena as informações de autenticação:

| Coluna          | Tipo      | Descrição                                |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Identificador único do usuário            |
| email           | string    | E-mail do usuário (usado para login)     |
| encrypted_password | string | Senha criptografada                      |
| email_confirmed_at | timestamp | Data de confirmação do e-mail         |
| last_sign_in_at | timestamp | Data do último login                     |
| raw_app_meta_data | jsonb    | Metadados da aplicação (inclui nome)    |
| raw_user_meta_data | jsonb   | Metadados do usuário                    |
| created_at      | timestamp | Data de criação                          |
| updated_at      | timestamp | Data da última atualização               |

### 2. Tabela `user_profiles`

Esta tabela armazena informações adicionais do perfil do usuário:

| Coluna          | Tipo      | Descrição                                |
|-----------------|-----------|------------------------------------------|
| id              | uuid      | Identificador único do perfil            |
| user_id         | uuid      | Referência ao id do usuário (auth.users) |
| full_name       | string    | Nome completo do usuário                 |
| phone_number    | string    | Número de telefone                       |
| nickname        | string    | Apelido (opcional)                       |
| roles           | array     | Papéis do usuário no sistema             |
| created_at      | timestamp | Data de criação                          |

## Fluxo Detalhado

1. **Preenchimento do Formulário**
   - O usuário acessa a tela de registro (`/register`)
   - Preenche os campos obrigatórios (nome, e-mail, senha) e opcionais (apelido)
   - Clica no botão "Criar Conta"

2. **Validação no Frontend**
   - Verifica se todos os campos obrigatórios foram preenchidos
   - Confirma se as senhas coincidem
   - Verifica se a senha tem pelo menos 6 caracteres

3. **Criação da Conta de Autenticação**
   - O método `signUp` do `useAuth` é chamado
   - Este método chama `authService.signUp`
   - O serviço faz uma requisição para `supabase.auth.signUp`
   - O Supabase cria um registro na tabela `auth.users`
   - Armazena o e-mail, senha (criptografada) e metadados (nome)

4. **Criação do Perfil**
   - Após a criação bem-sucedida da conta de autenticação, o ID do usuário é obtido
   - O método `userService.createProfile` é chamado com o ID do usuário e dados do formulário
   - O serviço verifica se já existe um perfil para o usuário
   - Se não existir, cria um novo registro na tabela `user_profiles`
   - Armazena nome completo, telefone (vazio inicialmente) e apelido (se fornecido)

5. **Login Automático**
   - Após o registro bem-sucedido, o método `signIn` do `useAuth` é chamado
   - Este método chama `authService.signIn`
   - O serviço faz uma requisição para `supabase.auth.signInWithPassword`
   - O Supabase autentica o usuário e retorna uma sessão

6. **Redirecionamento**
   - Após o login bem-sucedido, o usuário é redirecionado para a dashboard (`/(tabs)/dashboard`)
   - O contexto de autenticação (`AuthProvider`) detecta a mudança de estado e atualiza a sessão

## Tratamento de Erros

O sistema inclui tratamento de erros em várias camadas:

1. **Frontend (Tela de Registro)**
   - Validação básica de campos obrigatórios e formato
   - Exibição de alertas para o usuário em caso de erro

2. **Serviço de Autenticação**
   - Tratamento de erros específicos do Supabase
   - Tradução de mensagens de erro para português
   - Registro de erros no console para depuração

3. **Serviço de Usuário**
   - Tratamento de erros na criação/atualização de perfil
   - Verificação de perfil existente para evitar duplicação

## Considerações de Segurança

1. **Armazenamento de Senhas**
   - As senhas são gerenciadas pelo Supabase Auth
   - São armazenadas de forma criptografada, nunca em texto puro

2. **Armazenamento de Tokens**
   - Em dispositivos móveis, os tokens são armazenados no SecureStore
   - Em web, são armazenados no localStorage com medidas de segurança

3. **Validação de Dados**
   - Validação tanto no frontend quanto no backend
   - Sanitização de entradas para prevenir injeção de SQL

4. **Sessões**
   - Tokens são atualizados automaticamente
   - Sessões expiradas são tratadas adequadamente