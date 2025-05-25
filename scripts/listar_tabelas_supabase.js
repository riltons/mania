// Script para listar tabelas do Supabase usando o MCP
import { supabaseMCP } from './src/lib/supabaseMCP';

async function listarTabelasSupabase() {
  try {
    console.log('Conectando ao Supabase e buscando tabelas...');
    
    // Consulta para obter todas as tabelas do esquema público
    const { data, error } = await supabaseMCP
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .not('tablename', 'like', 'pg_%')
      .not('tablename', 'like', 'auth_%')
      .not('tablename', 'like', 'storage_%')
      .order('tablename');
    
    if (error) {
      throw error;
    }
    
    console.log('\nTabelas encontradas no Supabase:');
    console.log('============================');
    
    if (data && data.length > 0) {
      data.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename}`);
      });
      console.log(`\nTotal: ${data.length} tabelas encontradas.`);
      
      // Opcional: Buscar informações adicionais sobre cada tabela
      console.log('\nBuscando detalhes das tabelas...');
      for (const table of data) {
        try {
          // Buscar uma amostra de dados de cada tabela
          const { count, error: countError } = await supabaseMCP
            .from(table.tablename)
            .select('*', { count: 'exact', head: true });
            
          if (!countError) {
            console.log(`Tabela: ${table.tablename} - Registros: ${count || 0}`);
          }
        } catch (tableError) {
          console.log(`Erro ao buscar detalhes da tabela ${table.tablename}: ${tableError.message}`);
        }
      }
    } else {
      console.log('Nenhuma tabela encontrada no esquema público.');
    }
    
  } catch (error) {
    console.error('Erro ao listar tabelas:', error.message);
  }
}

// Executar a função
listarTabelasSupabase();
