import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Database } from '@/types';

// Valores de fallback para quando as variáveis de ambiente não estiverem disponíveis no APK
const FALLBACK_SUPABASE_URL = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// Pega do extra do Expo (app.json) ou, se não definido, do env ou fallback
const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

// Usar temporariamente as URLs do ambiente de produção que sabemos que estão resolvendo corretamente
const supabaseUrl = "https://euqnfrvptiriujrdebpr.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cW5mcnZwdGlyaXVqcmRlYnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNDk4MjQsImV4cCI6MjA2MDYyNTgyNH0.67e4m4mT2CjxgrWoSbYnhubXt3GcweQgdPhq2oalKuM";

console.log('Inicializando cliente Supabase...');
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Erro: Variáveis de ambiente do Supabase não encontradas, usando valores de fallback');
    console.log('URL:', supabaseUrl);
    console.log('ANON_KEY:', supabaseAnonKey ? '[PRESENTE]' : '[AUSENTE]');
}
console.log('Variáveis de ambiente do Supabase verificadas com sucesso');

// Adapter para web
const webAdapter = {
    getItem: (key: string) => {
        try {
            const item = localStorage.getItem(key);
            return Promise.resolve(item);
        } catch {
            return Promise.resolve(null);
        }
    },
    setItem: (key: string, value: string) => {
        try {
            localStorage.setItem(key, value);
            return Promise.resolve();
        } catch {
            return Promise.resolve();
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
            return Promise.resolve();
        } catch {
            return Promise.resolve();
        }
    },
};

// Adapter para mobile
const mobileAdapter = {
    getItem: SecureStore.getItemAsync,
    setItem: SecureStore.setItemAsync,
    removeItem: SecureStore.deleteItemAsync,
};

// Escolher o adapter apropriado baseado na plataforma
const storageAdapter = Platform.OS === 'web' ? webAdapter : mobileAdapter;

console.log('Criando cliente Supabase...');
// Logs para verificar carregamento de env
console.log('→ EXPO_EXTRA:', expoExtra);
console.log('→ SUPABASE_URL usada:', supabaseUrl);
console.log('→ ANON_KEY usada:', supabaseAnonKey);

// Função para verificar a conectividade com o Supabase
export const checkSupabaseConnectivity = async () => {
  try {
    const url = supabaseUrl;
    const key = supabaseAnonKey;
    console.log('Verificando conectividade com o Supabase...', url);
    const response = await fetch(`${url}/auth/v1/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': key
      }
    });
    
    const result = await response.json();
    console.log('Resposta do health check do Supabase:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Erro ao verificar conectividade com o Supabase:', error);
    return { success: false, error };
  }
};

export { supabaseUrl, supabaseAnonKey };
export const supabase = Object.assign(
    createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        onAuthStateChange: (event, session) => {
            console.log('Auth state change:', event);
            if (event === 'TOKEN_REFRESHED') {
                console.log('Token atualizado com sucesso');
            } else if (event === 'SIGNED_OUT') {
                console.log('Usuário desconectado');
                // Clear any stored tokens
                storageAdapter.removeItem('supabase.auth.token');
                storageAdapter.removeItem('supabase.auth.refreshToken');
            } else if (event === 'USER_UPDATED') {
                console.log('Dados do usuário atualizados');
            }
        }
    },
}), 
{ supabaseUrl, supabaseAnonKey });
