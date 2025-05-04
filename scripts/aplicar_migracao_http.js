// Script para aplicar migração SQL ao Supabase usando API HTTP direta
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuração do Supabase (usando os valores do ambiente de desenvolvimento)
const SUPABASE_URL = 'https://zciflougwvuosvmulftn.supabase.co';
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
    
    // Tentar executar a migração usando a API HTTP direta
    console.log('\nTentando aplicar a migração usando a API HTTP direta...');
    
    try {
      // Usar a API HTTP direta para executar SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          query: migrationSQL
        })
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Erro ao executar migração:', responseText);
        console.log('\nVocê pode aplicar a migração manualmente:');
        console.log('1. Acesse o Supabase Studio em https://app.supabase.com');
        console.log('2. Selecione seu projeto');
        console.log('3. Vá para a seção "SQL Editor"');
        console.log('4. Crie um novo SQL query');
        console.log('5. Copie e cole o conteúdo do arquivo migracao_temporaria.sql');
        console.log('6. Execute o SQL');
      } else {
        console.log('Migração aplicada com sucesso!');
        console.log('Resposta:', responseText);
      }
    } catch (error) {
      console.error('Erro ao executar migração:', error.message);
      
      console.log('\nVocê pode aplicar a migração manualmente:');
      console.log('1. Acesse o Supabase Studio em https://app.supabase.com');
      console.log('2. Selecione seu projeto');
      console.log('3. Vá para a seção "SQL Editor"');
      console.log('4. Crie um novo SQL query');
      console.log('5. Copie e cole o conteúdo do arquivo migracao_temporaria.sql');
      console.log('6. Execute o SQL');
    }
  } catch (error) {
    console.error('Erro ao aplicar migração:', error);
  }
}

// Executar a migração
aplicarMigracao();
