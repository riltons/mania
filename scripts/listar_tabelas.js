// Script para listar tabelas do Supabase usando o MCP
// Este script pode ser executado diretamente no Node.js

// Importações necessárias
const { createClient } = require('@supabase/supabase-js');

// Credenciais do Supabase (as mesmas usadas no arquivo supabaseMCP.ts)
const supabaseUrl = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// Cria o cliente Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Função para listar todas as tabelas do Supabase relacionadas ao projeto
 */
async function listarTabelasSupabase() {
  console.log('Iniciando consulta de tabelas do Supabase...');
  
  try {
    // Consulta para obter todas as tabelas do esquema público
    console.log('Buscando tabelas no esquema público...');
    
    // Usar uma consulta SQL direta para obter as tabelas
    const { data, error } = await supabase
      .rpc('get_tables')
      .select('*');
    
    if (error) {
      // Se a função RPC não existir, tentar outra abordagem
      console.log('Função RPC não encontrada, tentando consulta direta...');
      
      // Tentar listar tabelas conhecidas do projeto
      const tabelasConhecidas = ['players', 'competitions', 'communities', 'matches', 'game_sessions', 'users'];
      
      console.log('\n==================================');
      console.log('TABELAS CONHECIDAS DO PROJETO');
      console.log('==================================');
      
      // Exibir cada tabela conhecida
      for (let i = 0; i < tabelasConhecidas.length; i++) {
        const tableName = tabelasConhecidas[i];
        console.log(`${i + 1}. ${tableName}`);
        
        try {
          // Verificar se a tabela existe tentando contar os registros
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            console.log(`   ✓ Tabela existe | Registros: ${count || 0}`);
          } else {
            console.log(`   ✗ Erro ao acessar tabela: ${countError.message}`);
          }
        } catch (tableError) {
          console.log(`   ✗ Erro ao verificar tabela: ${tableError.message}`);
        }
      }
      
      console.log('\nObservação: Esta é uma lista de tabelas conhecidas do projeto.');
      console.log('Podem existir outras tabelas no banco de dados que não estão listadas aqui.');
      console.log('==================================');
      return;
    }
    
    console.log('\n==================================');
    console.log('TABELAS DO SUPABASE NO PROJETO');
    console.log('==================================');
    
    if (data && data.length > 0) {
      // Exibir cada tabela encontrada
      data.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
      
      console.log('\nTotal: ' + data.length + ' tabelas encontradas.');
      console.log('==================================');
      
      // Buscar informações adicionais sobre cada tabela
      console.log('\nBuscando detalhes das tabelas...');
      console.log('==================================');
      
      for (const table of data) {
        try {
          // Buscar contagem de registros em cada tabela
          const { count, error: countError } = await supabase
            .from(table.table_name)
            .select('*', { count: 'exact', head: true });
          
          if (!countError) {
            console.log(`Tabela: ${table.table_name.padEnd(20)} | Registros: ${count || 0}`);
          } else {
            console.log(`Tabela: ${table.table_name.padEnd(20)} | Erro ao contar registros: ${countError.message}`);
          }
        } catch (tableError) {
          console.log(`Tabela: ${table.table_name.padEnd(20)} | Erro: ${tableError.message}`);
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
    
    // Tentar listar tabelas conhecidas do projeto como fallback
    console.log('\nTentando listar tabelas conhecidas como alternativa...');
    
    const tabelasConhecidas = ['players', 'competitions', 'communities', 'matches', 'game_sessions', 'users'];
    
    console.log('\n==================================');
    console.log('TABELAS CONHECIDAS DO PROJETO');
    console.log('==================================');
    
    // Exibir cada tabela conhecida
    for (let i = 0; i < tabelasConhecidas.length; i++) {
      const tableName = tabelasConhecidas[i];
      console.log(`${i + 1}. ${tableName}`);
      
      try {
        // Verificar se a tabela existe tentando contar os registros
        const { count, error: countError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (!countError) {
          console.log(`   ✓ Tabela existe | Registros: ${count || 0}`);
        } else {
          console.log(`   ✗ Erro ao acessar tabela: ${countError.message}`);
        }
      } catch (tableError) {
        console.log(`   ✗ Erro ao verificar tabela: ${tableError.message}`);
      }
    }
    
    console.log('\nObservação: Esta é uma lista de tabelas conhecidas do projeto.');
    console.log('Podem existir outras tabelas no banco de dados que não estão listadas aqui.');
    console.log('==================================');
  }
}

// Executar a função principal
listarTabelasSupabase();
