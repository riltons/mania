// Script para aplicar migração SQL ao Supabase via API REST
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuração do Supabase (usando os valores de fallback do arquivo supabase.ts)
const SUPABASE_URL = 'https://evakdtqrtpqiuqhetkqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2YWtkdHFydHBxaXVxaGV0a3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkzNjk1MjQsImV4cCI6MjA1NDk0NTUyNH0.Ms4VB9QGBBcWMZPJ5j5Oanl3RD1SeECp7twFb_riPAI';

// Caminho para o arquivo de migração
const migrationFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20250504_play_store_subscriptions.sql');

// Função para aplicar a migração
async function applyMigration() {
  try {
    console.log('Lendo arquivo de migração...');
    const migrationSQL = fs.readFileSync(migrationFilePath, 'utf8');
    
    console.log('Aplicando migração ao Supabase...');
    
    // Criar um arquivo SQL temporário com todos os comandos
    const tempSqlFile = path.join(__dirname, 'temp_migration.sql');
    fs.writeFileSync(tempSqlFile, migrationSQL);
    
    console.log('Arquivo SQL temporário criado:', tempSqlFile);
    
    // Dividir o SQL em comandos separados para executar um por um
    const sqlCommands = splitSQLCommands(migrationSQL);
    console.log(`Encontrados ${sqlCommands.length} comandos SQL para executar`);
    
    // Executar cada comando SQL separadamente usando a API REST do Supabase
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`Executando comando ${i + 1}/${sqlCommands.length}...`);
      
      try {
        // Usar a API REST do Supabase para executar SQL diretamente
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({
            query: command
          })
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
          console.error(`Erro ao executar comando ${i + 1}:`, responseText);
        } else {
          console.log(`Comando ${i + 1} executado com sucesso`);
        }
      } catch (error) {
        console.error(`Erro ao executar comando ${i + 1}:`, error.message);
      }
    }
    
    console.log('Migração concluída!');
    console.log('IMPORTANTE: Se encontrou erros, você pode aplicar a migração manualmente:');
    console.log('1. Acesse o Supabase Studio em https://app.supabase.com');
    console.log('2. Selecione seu projeto');
    console.log('3. Vá para a seção "SQL Editor"');
    console.log('4. Crie um novo SQL query');
    console.log('5. Copie e cole o conteúdo do arquivo temp_migration.sql');
    console.log('6. Execute o SQL');
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

// Função para dividir o SQL em comandos separados
function splitSQLCommands(sql) {
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
applyMigration();
