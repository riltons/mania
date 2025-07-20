import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { Database } from '@/core/types/database.types';

// Valores de fallback para quando as variáveis de ambiente não estiverem disponíveis no APK
const FALLBACK_SUPABASE_URL = 'https://euqnfrvptiriujrdebpr.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cW5mcnZwdGlyaXVqcmRlYnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNDk4MjQsImV4cCI6MjA2MDYyNTgyNH0.67e4m4mT2CjxgrWoSbYnhubXt3GcweQgdPhq2oalKuM';

// Pega do extra do Expo (app.json) ou, se não definido, do env ou fallback
const expoExtra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

// Prioriza as variáveis de ambiente do .env
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || expoExtra.supabaseUrl || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || expoExtra.supabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY;

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
export { supabaseUrl, supabaseAnonKey };
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: storageAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
    },
});
