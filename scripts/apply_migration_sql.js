// Script para aplicar migração SQL ao Supabase usando a API de gerenciamento
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
    
    // Dividir o SQL em comandos separados para executar um por um
    const sqlCommands = splitSQLCommands(migrationSQL);
    
    console.log(`Encontrados ${sqlCommands.length} comandos SQL para executar`);
    
    // Criar um arquivo SQL temporário com todos os comandos
    const tempSqlFile = path.join(__dirname, 'temp_migration.sql');
    fs.writeFileSync(tempSqlFile, migrationSQL);
    
    console.log('Arquivo SQL temporário criado:', tempSqlFile);
    console.log('Para aplicar esta migração, você precisa:');
    console.log('1. Acessar o Supabase Studio em https://app.supabase.com');
    console.log('2. Selecionar seu projeto');
    console.log('3. Ir para a seção "SQL Editor"');
    console.log('4. Criar um novo SQL query');
    console.log('5. Copiar e colar o conteúdo do arquivo temp_migration.sql');
    console.log('6. Executar o SQL');
    
    console.log('\nAlternativamente, você pode executar cada comando SQL individualmente:');
    
    // Mostrar cada comando SQL para execução manual
    sqlCommands.forEach((command, index) => {
      console.log(`\n--- Comando ${index + 1}/${sqlCommands.length} ---`);
      console.log(command.trim());
    });
    
    console.log('\nMigração preparada! Execute os comandos SQL no Supabase Studio.');
  } catch (error) {
    console.error('Erro ao preparar migração:', error);
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
      currentCommand += line + '\n';
      commands.push(currentCommand);
      currentCommand = '';
    } else {
      // Continuar acumulando o comando atual
      currentCommand += line + '\n';
    }
  }
  
  // Adicionar o último comando se houver
  if (currentCommand.trim()) {
    commands.push(currentCommand);
  }
  
  return commands;
}

// Executar a migração
applyMigration();
