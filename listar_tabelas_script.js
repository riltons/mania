// Script para listar tabelas do Supabase usando o MCP
import { supabaseMCP } from './src/lib/supabaseMCP';

/**
 * Função para listar todas as tabelas do Supabase relacionadas ao projeto
 */
async function listarTabelasSupabase() {
  console.log('Iniciando consulta de tabelas do Supabase...');
  
  try {
    // Consulta para obter todas as tabelas do esquema público
    console.log('Buscando tabelas no esquema público...');
    
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
    
    console.log('\n==================================');
    console.log('TABELAS DO SUPABASE NO PROJETO');
    console.log('==================================');
    
    if (data && data.length > 0) {
      // Exibir cada tabela encontrada
      data.forEach((table, index) => {
        console.log(`${index + 1}. ${table.tablename}`);
      });
      
      console.log('\nTotal: ' + data.length + ' tabelas encontradas.');
      console.log('==================================');
      
      // Buscar informações adicionais sobre cada tabela
      console.log('\nBuscando detalhes das tabelas...');
      console.log('==================================');
      
      for (const table of data) {
        try {
          // Buscar contagem de registros em cada tabela
          const { count, error: countError } = await supabaseMCP
            .from(table.tablename)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            console.log(`Tabela: ${table.tablename.padEnd(20)} | Registros: ${count || 0}`);
          } else {
            console.log(`Tabela: ${table.tablename.padEnd(20)} | Erro ao contar registros: ${countError.message}`);
          }
        } catch (tableError) {
          console.log(`Tabela: ${table.tablename.padEnd(20)} | Erro: ${tableError.message}`);
        }
      }
      
      console.log('==================================');
    } else {
      console.log('Nenhuma tabela encontrada no esquema público.');
      console.log('==================================');
    }
  } catch (error) {
    console.error('\nERRO AO LISTAR TABELAS:');
    console.error(error.message);
    console.error('==================================');
  }
}

// Executar a função principal
listarTabelasSupabase();
