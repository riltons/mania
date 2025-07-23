// Script para aplicar migração SQL ao Supabase via API REST
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuração do Supabase (usando os valores do ambiente de desenvolvimento)
const SUPABASE_URL = 'https://zciflougwvuosvmulftn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaWZsb3Vnd3Z1b3N2bXVsZnRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwNDk2MDcsImV4cCI6MjA2MDYyNTYwN30.h3gcU_lnbY0lvjSKDhb2vcmQCGrBoih18bKqubBRSAM';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpjaWZsb3Vnd3Z1b3N2bXVsZnRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NTA0OTYwNywiZXhwIjoyMDYwNjI1NjA3fQ.F2UXygkSe_z1_Ks20_GGHUFvIWCMQtwIUXP9pb_3lSA';

// Caminho para o arquivo de migração
const migrationFilePath = path.join(__dirname, '..', 'supabase', 'migrations', '20250504_play_store_subscriptions.sql');

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
    
    // Tentar executar a migração via API REST usando a chave de serviço
    console.log('\nTentando aplicar a migração via API REST usando a chave de serviço...');
    
    let sucessoTotal = true;
    
    // Executar cada comando SQL separadamente usando a API REST do Supabase
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`Executando comando ${i + 1}/${sqlCommands.length}...`);
      
      try {
        // Usar a API REST do Supabase para executar SQL diretamente com a chave de serviço
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'params=single-object'
          },
          body: JSON.stringify({
            query: command
          })
        });
        
        const responseText = await response.text();
        
        if (!response.ok) {
          console.error(`Erro ao executar comando ${i + 1}:`, responseText);
          sucessoTotal = false;
        } else {
          console.log(`Comando ${i + 1} executado com sucesso`);
        }
      } catch (error) {
        console.error(`Erro ao executar comando ${i + 1}:`, error.message);
        sucessoTotal = false;
      }
    }
    
    if (sucessoTotal) {
      console.log('\nMigração aplicada com sucesso via API REST!');
    } else {
      console.log('\nAlguns comandos falharam. Você pode aplicar a migração manualmente:');
      console.log('1. Acesse o Supabase Studio em https://app.supabase.com');
      console.log('2. Selecione seu projeto');
      console.log('3. Vá para a seção "SQL Editor"');
      console.log('4. Crie um novo SQL query');
      console.log('5. Copie e cole o conteúdo do arquivo migracao_temporaria.sql');
      console.log('6. Execute o SQL');
      
      console.log('\nComandos SQL:');
      
      // Mostrar cada comando SQL para execução manual
      sqlCommands.forEach((command, index) => {
        console.log(`\n--- Comando ${index + 1}/${sqlCommands.length} ---`);
        console.log(command.trim());
      });
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
