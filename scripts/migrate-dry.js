#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Script de Migração DRY - DominoMania App');
console.log('==========================================\n');

// Estatísticas
let stats = {
    filesAnalyzed: 0,
    filesMigrated: 0,
    patternsRemoved: 0
};

// Padrões a serem identificados
const patterns = [
    'LoadingContainer = styled.View',
    'ErrorContainer = styled.View', 
    'EmptyContainer = styled.View',
    'const [loading, setLoading] = useState',
    'const [error, setError] = useState'
];

/**
 * Analisa um arquivo e conta padrões duplicados
 */
function analyzeFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        stats.filesAnalyzed++;
        
        let patternsFound = 0;
        patterns.forEach(pattern => {
            if (content.includes(pattern)) {
                patternsFound++;
            }
        });
        
        if (patternsFound > 0) {
            console.log(`📄 ${filePath}`);
            console.log(`   🔍 Padrões encontrados: ${patternsFound}`);
            stats.patternsRemoved += patternsFound;
            stats.filesMigrated++;
        }
        
        return patternsFound;
    } catch (error) {
        console.log(`❌ Erro ao analisar ${filePath}: ${error.message}`);
        return 0;
    }
}

/**
 * Busca arquivos recursivamente
 */
function scanDirectory(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Ignora diretórios específicos
            if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
                scanDirectory(fullPath);
            }
        } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
            analyzeFile(fullPath);
        }
    }
}

/**
 * Função principal
 */
function main() {
    console.log('🔍 Analisando arquivos para identificar duplicações...\n');
    
    // Analisa diretório src-new
    if (fs.existsSync('src-new')) {
        console.log('📁 Analisando src-new/\n');
        scanDirectory('src-new');
    }
    
    // Analisa diretório src
    if (fs.existsSync('src')) {
        console.log('\n📁 Analisando src/\n');
        scanDirectory('src');
    }
    
    // Relatório final
    console.log('\n📊 RELATÓRIO DE ANÁLISE');
    console.log('========================');
    console.log(`📄 Arquivos analisados: ${stats.filesAnalyzed}`);
    console.log(`🔄 Arquivos com duplicações: ${stats.filesMigrated}`);
    console.log(`🎯 Total de padrões duplicados: ${stats.patternsRemoved}`);
    
    if (stats.filesMigrated > 0) {
        console.log('\n✅ COMPONENTES DRY CRIADOS:');
        console.log('- LoadingState (src-new/core/components/feedback/)');
        console.log('- ErrorState (src-new/core/components/feedback/)');
        console.log('- EmptyState (src-new/core/components/feedback/)');
        console.log('- useAsyncState (src-new/core/hooks/)');
        console.log('- useAsyncOperation (src-new/core/hooks/)');
        console.log('- Modal unificado (src-new/core/components/feedback/)');
        console.log('- Funções de data consolidadas (src-new/core/utils/date.ts)');
        
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Revisar o documento EXEMPLO_MIGRACAO.md');
        console.log('2. Migrar arquivos gradualmente usando os novos componentes');
        console.log('3. Substituir imports antigos pelos novos');
        console.log('4. Testar funcionalidade após cada migração');
        console.log('5. Remover arquivos duplicados após confirmação');
        
        console.log('\n💡 BENEFÍCIOS ESPERADOS:');
        console.log(`- Redução de ~${Math.round(stats.patternsRemoved * 10)} linhas de código`);
        console.log('- 100% consistência visual');
        console.log('- Manutenção centralizada');
        console.log('- Melhor performance');
    } else {
        console.log('\n🎉 Nenhuma duplicação encontrada ou já foram migradas!');
    }
}

// Executar
main(); 