import { createClient } from '@supabase/supabase-js';

// Configuração direta do Supabase (mesma configuração do app principal)
const supabaseUrl = 'https://euqnfrvptiriujrdebpr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cW5mcnZwdGlyaXVqcmRlYnByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNDk4MjQsImV4cCI6MjA2MDYyNTgyNH0.67e4m4mT2CjxgrWoSbYnhubXt3GcweQgdPhq2oalKuM';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1cW5mcnZwdGlyaXVqcmRlYnByIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA0OTgyNCwiZXhwIjoyMDYwNjI1ODI0fQ.71SbUyiabSKssQy1K8pErep2IC9gyZmKCl7MqI3NSSM';

console.log('[supabase] Dashboard Web configurado', { 
  url: supabaseUrl, 
  key: supabaseAnonKey.slice(0, 10) + '…' 
});

// Cliente padrão com chave anônima (para usuários comuns)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente administrativo com chave de serviço (apenas para admin)
export const getAdminClient = () => {
  return createClient(
    supabaseUrl,
    supabaseServiceKey
  );
};
