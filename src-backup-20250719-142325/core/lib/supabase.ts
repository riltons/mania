import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Database } from '@/types';

// Valores de fallback para quando as variáveis de ambiente não estiverem disponíveis no APK
// Usando valores do ambiente de produção
const FALLBACK_SUPABASE_URL = 'https://euqnfrvptiriujrdebpr.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cW5mcnZwdGlyaXVqcmRlYnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNDk4MjQsImV4cCI6MjA2MDYyNTgyNH0.67e4m4mT2CjxgrWoSbYnhubXt3GcweQgdPhq2oalKuM';

console.log('=== Configuração do Ambiente ===');
console.log('Ambiente:', process.env.NODE_ENV);

// Pega do extra do Expo (app.json) ou, se não definido, do env ou fallback
const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;
console.log('Expo Extra:', JSON.stringify(expoExtra, null, 2));

console.log('=== Variáveis de Ambiente ===');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL || '[NÃO DEFINIDO]');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL || '[NÃO DEFINIDO]');
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? '[PRESENTE]' : '[NÃO DEFINIDO]');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '[PRESENTE]' : '[NÃO DEFINIDO]');

const supabaseUrl = expoExtra.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = expoExtra.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

console.log('=== Inicializando cliente Supabase ===');
console.log('URL do Supabase:', supabaseUrl);
console.log('Chave anônima:', supabaseAnonKey ? '[PRESENTE]' : '[AUSENTE]');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERRO: Variáveis de ambiente do Supabase não encontradas, usando valores de fallback');
    if (!supabaseUrl) console.error('ERRO: URL do Supabase não definida');
    if (!supabaseAnonKey) console.error('ERRO: Chave anônima do Supabase não definida');
} else {
    console.log('Variáveis de ambiente do Supabase carregadas com sucesso');
}

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
    getItem: (key: string) => SecureStore.getItemAsync(key),
    setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
    removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

// Escolher o adapter apropriado baseado na plataforma
const storageAdapter = Platform.OS === 'web' ? webAdapter : mobileAdapter;

console.log('Criando cliente Supabase...');
console.log('→ EXPO_EXTRA:', expoExtra);
console.log('→ SUPABASE_URL usada:', supabaseUrl);
console.log('→ ANON_KEY usada:', supabaseAnonKey);

export { supabaseUrl, supabaseAnonKey };

// Configuração de autenticação
const auth = {
    storage: storageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
};

// Criar e exportar o cliente Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth,
    db: {
        schema: 'public',
    },
});

// Adicionar listener para mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
    console.log(`Evento de autenticação: ${event}`);
    console.log('Sessão atual:', session);
    
    if (event === 'SIGNED_IN') {
        console.log('Usuário autenticado com sucesso');
    } else if (event === 'SIGNED_OUT') {
        console.log('Usuário desconectado');
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token de acesso atualizado');
    } else if (event === 'USER_UPDATED') {
        console.log('Dados do usuário atualizados');
    }
});
