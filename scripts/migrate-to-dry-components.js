#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configurações
const SRC_DIR = 'src-new';
const BACKUP_DIR = 'backup-migration';

// Padrões a serem substituídos
const PATTERNS = {
    // Loading Container
    loadingContainer: {
        pattern: /const LoadingContainer = styled\.View`[\s\S]*?`;/g,
        replacement: ''
    },
    
    // Error Container
    errorContainer: {
        pattern: /const ErrorContainer = styled\.View`[\s\S]*?`;/g,
        replacement: ''
    },
    
    // Empty Container  
    emptyContainer: {
        pattern: /const EmptyContainer = styled\.View`[\s\S]*?`;/g,
        replacement: ''
    },
    
    // Error Text
    errorText: {
        pattern: /const ErrorText = styled\.Text`[\s\S]*?`;/g,
        replacement: ''
    },
    
    // Empty Text
    emptyText: {
        pattern: /const EmptyText = styled\.Text`[\s\S]*?`;/g,
        replacement: ''
    },
    
    // useState patterns
    loadingState: {
        pattern: /const \[loading, setLoading\] = useState\((true|false)\);/g,
        replacement: ''
    },
    
    errorState: {
        pattern: /const \[error, setError\] = useState\(null\);/g,
        replacement: ''
    },
    
    dataState: {
        pattern: /const \[(\w+), set\w+\] = useState\((\[\]|\{\}|null)\);/g,
        replacement: ''
    }
};

// Imports a serem adicionados
const NEW_IMPORTS = {
    feedback: "import { LoadingState, ErrorState, EmptyState } from '@/core/components/feedback';",
    hooks: "import { useAsyncState } from '@/core/hooks';"
};

// Renderizações a serem substituídas
const RENDER_REPLACEMENTS = {
    loading: {
        pattern: /<LoadingContainer>[\s\S]*?<\/LoadingContainer>/g,
        replacement: '<LoadingState message="Carregando..." />'
    },
    
    error: {
        pattern: /<ErrorContainer>[\s\S]*?<\/ErrorContainer>/g,
        replacement: '<ErrorState message={error} onRetry={loadData} />'
    },
    
    empty: {
        pattern: /<EmptyContainer>[\s\S]*?<\/EmptyContainer>/g,
        replacement: '<EmptyState message="Nenhum item encontrado" />'
    }
};

/**
 * Cria backup do arquivo
 */
function createBackup(filePath) {
    const backupPath = path.join(BACKUP_DIR, path.relative(SRC_DIR, filePath));
    const backupDir = path.dirname(backupPath);
    
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }
    
    fs.copyFileSync(filePath, backupPath);
    console.log(`✅ Backup criado: ${backupPath}`);
}

/**
 * Verifica se o arquivo contém padrões duplicados
 */
function hasPatterns(content) {
    return Object.values(PATTERNS).some(({ pattern }) => pattern.test(content));
}

/**
 * Adiciona imports necessários
 */
function addImports(content) {
    const lines = content.split('\n');
    const importIndex = lines.findIndex(line => line.startsWith('import'));
    
    if (importIndex === -1) return content;
    
    // Adiciona imports após o último import existente
    let lastImportIndex = importIndex;
    for (let i = importIndex; i < lines.length; i++) {
        if (lines[i].startsWith('import') || lines[i].trim() === '') {
            lastImportIndex = i;
        } else {
            break;
        }
    }
    
    // Verifica se já tem os imports
    const hasLoadingImport = content.includes('LoadingState');
    const hasHooksImport = content.includes('useAsyncState');
    
    const newImports = [];
    if (!hasLoadingImport && hasPatterns(content)) {
        newImports.push(NEW_IMPORTS.feedback);
    }
    if (!hasHooksImport && content.includes('useState')) {
        newImports.push(NEW_IMPORTS.hooks);
    }
    
    if (newImports.length > 0) {
        lines.splice(lastImportIndex + 1, 0, ...newImports);
    }
    
    return lines.join('\n');
}

/**
 * Remove padrões duplicados
 */
function removePatterns(content) {
    let result = content;
    
    Object.entries(PATTERNS).forEach(([name, { pattern, replacement }]) => {
        if (pattern.test(result)) {
            result = result.replace(pattern, replacement);
            console.log(`  🔄 Removido padrão: ${name}`);
        }
    });
    
    return result;
}

/**
 * Substitui renderizações
 */
function replaceRenders(content) {
    let result = content;
    
    Object.entries(RENDER_REPLACEMENTS).forEach(([name, { pattern, replacement }]) => {
        if (pattern.test(result)) {
            result = result.replace(pattern, replacement);
            console.log(`  🔄 Substituído render: ${name}`);
        }
    });
    
    return result;
}

/**
 * Substitui useState por useAsyncState
 */
function replaceUseState(content) {
    // Padrão complexo para detectar múltiplos useState relacionados
    const hasLoadingState = /const \[loading, setLoading\]/.test(content);
    const hasErrorState = /const \[error, setError\]/.test(content);
    const hasDataState = /const \[(\w+), set\w+\] = useState/.test(content);
    
    if (hasLoadingState && hasErrorState && hasDataState) {
        // Extrair nome da variável de dados
        const dataMatch = content.match(/const \[(\w+), set\w+\] = useState/);
        const dataVar = dataMatch ? dataMatch[1] : 'data';
        
        // Substituir pelos useAsyncState
        let result = content;
        
        // Remove os useState individuais
        result = result.replace(/const \[loading, setLoading\] = useState\((true|false)\);\s*/g, '');
        result = result.replace(/const \[error, setError\] = useState\(null\);\s*/g, '');
        result = result.replace(/const \[(\w+), set\w+\] = useState\((\[\]|\{\}|null)\);\s*/g, '');
        
        // Adiciona useAsyncState
        const asyncStateDeclaration = `    const { data: ${dataVar}, loading, error, setData, setError, setLoading } = useAsyncState([]);`;
        
        // Encontra onde inserir (após imports, antes do useEffect)
        const useEffectIndex = result.indexOf('useEffect');
        if (useEffectIndex !== -1) {
            const lines = result.split('\n');
            const useEffectLineIndex = lines.findIndex(line => line.includes('useEffect'));
            lines.splice(useEffectLineIndex, 0, asyncStateDeclaration);
            result = lines.join('\n');
            console.log(`  🔄 Substituído useState por useAsyncState`);
        }
        
        return result;
    }
    
    return content;
}

/**
 * Processa um arquivo
 */
function processFile(filePath) {
    console.log(`\n📄 Processando: ${filePath}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Verifica se precisa migrar
    if (!hasPatterns(content)) {
        console.log(`  ⏭️  Nenhum padrão duplicado encontrado`);
        return;
    }
    
    // Cria backup
    createBackup(filePath);
    
    // Aplica transformações
    let result = content;
    result = addImports(result);
    result = removePatterns(result);
    result = replaceRenders(result);
    result = replaceUseState(result);
    
    // Remove linhas vazias extras
    result = result.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    // Salva arquivo modificado
    fs.writeFileSync(filePath, result);
    console.log(`  ✅ Arquivo migrado com sucesso`);
}

/**
 * Encontra arquivos TypeScript/TSX
 */
function findFiles(dir) {
    const files = [];
    
    function scan(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Ignora node_modules e outros diretórios
                if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
                    scan(fullPath);
                }
            } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
    }
    
    scan(dir);
    return files;
}

/**
 * Função principal
 */
function main() {
    console.log('🚀 Iniciando migração para componentes DRY...\n');
    
    // Cria diretório de backup
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    // Encontra arquivos
    const files = findFiles(SRC_DIR);
    console.log(`📁 Encontrados ${files.length} arquivos para análise`);
    
    // Processa cada arquivo
    let migratedCount = 0;
    for (const file of files) {
        const originalContent = fs.readFileSync(file, 'utf8');
        processFile(file);
        const newContent = fs.readFileSync(file, 'utf8');
        
        if (originalContent !== newContent) {
            migratedCount++;
        }
    }
    
    console.log(`\n🎉 Migração concluída!`);
    console.log(`📊 Arquivos migrados: ${migratedCount}/${files.length}`);
    console.log(`💾 Backups salvos em: ${BACKUP_DIR}`);
    
    // Relatório de arquivos migrados
    if (migratedCount > 0) {
        console.log('\n📋 Próximos passos:');
        console.log('1. Revisar os arquivos migrados');
        console.log('2. Testar a funcionalidade');
        console.log('3. Corrigir imports se necessário');
        console.log('4. Executar testes');
        console.log('5. Remover backups após confirmação');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main();
}

module.exports = { processFile, findFiles, hasPatterns }; 