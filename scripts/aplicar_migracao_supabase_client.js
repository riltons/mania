// Script para aplicar migração SQL ao Supabase usando a biblioteca oficial
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase (usando os valores do ambiente de desenvolvimento)
const SUPABASE_URL = 'https://zciflougwvuosvmulftn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaWZsb3Vnd3Z1b3N2bXVsZnRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA0OTYwNywiZXhwIjoyMDYwNjI1NjA3fQ.F2UXygkSe_z1_Ks20_GGHUFvIWCMQtwIUXP9pb_3lSA';

// Caminho para o arquivo de migração
const migrationFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20250504_play_store_subscriptions.sql');

// Inicializar o cliente Supabase com a chave de serviço
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para aplicar a migração
async function aplicarMigracao() {
  try {
    console.log('Lendo arquivo de migração...');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Preparando migração para o Supabase...');
    
    // Criar um arquivo SQL temporário com todos os comandos
    const tempSqlFile = path.join(__dirname, 'migracao_temporaria.sql');
    fs.writeFileSync(tempSqlFile, migrationSQL);
    
    console.log('Arquivo SQL temporário criado:', tempSqlFile);
    
    // Dividir o SQL em comandos separados
    const sqlCommands = dividirComandosSQL(migrationSQL);
    console.log(`Encontrados ${sqlCommands.length} comandos SQL para executar`);
    
    // Tentar executar a migração usando o cliente Supabase
    console.log('\nTentando aplicar a migração usando o cliente Supabase...');
    
    let sucessoTotal = true;
    
    // Executar cada comando SQL separadamente
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`Executando comando ${i + 1}/${sqlCommands.length}...`);
      
      try {
        // Usar o cliente Supabase para executar SQL diretamente
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command
        });
        
        if (error) {
          console.error(`Erro ao executar comando ${i + 1}:`, error);
          sucessoTotal = false;
        } else {
          console.log(`Comando ${i + 1} executado com sucesso`);
        }
      } catch (error) {
        console.error(`Erro ao executar comando ${i + 1}:`, error.message);
        sucessoTotal = false;
        
        // Se for um erro de função não encontrada, tentar criar a função exec_sql
        if (error.message.includes('function') && error.message.includes('exec_sql') && i === 0) {
          console.log('Tentando criar a função exec_sql...');
          try {
            const createFunctionSQL = `
              CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
              RETURNS void AS $$
              BEGIN
                EXECUTE sql_query;
              END;
              $$ LANGUAGE plpgsql SECURITY DEFINER;
            `;
            
            const { error: createError } = await supabase.rpc('exec_sql', {
              sql_query: createFunctionSQL
            });
            
            if (createError) {
              console.error('Erro ao criar função exec_sql:', createError);
            } else {
              console.log('Função exec_sql criada com sucesso. Tentando novamente...');
              i--; // Tentar novamente o mesmo comando
            }
          } catch (createError) {
            console.error('Erro ao criar função exec_sql:', createError.message);
          }
        }
      }
    }
    
    if (sucessoTotal) {
      console.log('\nMigração aplicada com sucesso!');
    } else {
      console.log('\nAlguns comandos falharam. Você pode aplicar a migração manualmente:');
      console.log('1. Acesse o Supabase Studio em https://app.supabase.com');
      console.log('2. Selecione seu projeto');
      console.log('3. Vá para a seção "SQL Editor"');
      console.log('4. Crie um novo SQL query');
      console.log('5. Copie e cole o conteúdo do arquivo migracao_temporaria.sql');
      console.log('6. Execute o SQL');
      
      // Tentar uma abordagem alternativa: executar todo o SQL de uma vez
      console.log('\nTentando abordagem alternativa: executar todo o SQL de uma vez...');
      
      try {
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: migrationSQL
        });
        
        if (error) {
          console.error('Erro ao executar migração completa:', error);
        } else {
          console.log('Migração completa executada com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao executar migração completa:', error.message);
      }
    }
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

// Função para dividir o SQL em comandos separados
function dividirComandosSQL(sql) {
  // Dividir por ponto e vírgula, mas preservar ponto e vírgula em funções e triggers
  const commands = [];
  let currentCommand = '';
  let inFunction = false;
  
  // Dividir por linhas para facilitar o processamento
  const lines = sql.split('\n');
  
  for (const line of lines) {
    // Ignorar comentários
    if (line.trim().startsWith('--')) {
      currentCommand += line + '\n';
      continue;
    }
    
    // Verificar se estamos entrando ou saindo de uma função/trigger
    if (line.includes('$$') && !inFunction) {
      inFunction = true;
      currentCommand += line + '\n';
    } else if (line.includes('$$') && inFunction) {
      inFunction = false;
      currentCommand += line + '\n';
    } else if (line.includes(';') && !inFunction) {
      // Fim de um comando normal
      currentCommand += line;
      commands.push(currentCommand.trim());
      currentCommand = '';
    } else {
      // Continuar acumulando o comando atual
      currentCommand += line + '\n';
    }
  }
  
  // Adicionar o último comando se houver
  if (currentCommand.trim()) {
    commands.push(currentCommand.trim());
  }
  
  return commands;
}

// Executar a migração
aplicarMigracao();
