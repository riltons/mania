import { createClient } from '@supabase/supabase-js';

// Definir tipos para o Vite
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SUPABASE_SERVICE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();
console.log('[supabase] carregado', { url: supabaseUrl, key: supabaseAnonKey ? supabaseAnonKey.slice(0, 10) + '…' : 'undef' });

// Cliente padrão com chave anônima (para usuários comuns)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo com chave de serviço (apenas para admin)
export const getAdminClient = () => {
  const serviceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;
  
  // Se a chave de serviço não estiver definida, retorna o cliente padrão
  if (!serviceKey) {
    console.log('Chave de serviço não encontrada, usando cliente padrão');
    return supabase;
  }
  
  return createClient(
    supabaseUrl,
    serviceKey
  );
};
