# Script para migração final do código para a nova estrutura Clean + Feature-First
# Este script deve ser executado após completar toda a migração e testes
# Autor: Equipe de Desenvolvimento
# Data: Junho/2025

# Função para exibir mensagens formatadas
function Write-Step {
    param ([string]$Message, [string]$Color = "White")
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] $Message" -ForegroundColor $Color
}

# Verificação inicial de segurança
Write-Step "Iniciando processo de migração..." "Magenta"
Write-Step "ATENÇÃO: Este script realizará a migração final da estrutura do código." "Yellow"
Write-Step "Certifique-se de que todos os testes foram realizados na estrutura src-new." "Yellow"

$confirmation = Read-Host "Você deseja continuar com a migração? (S/N)"
if ($confirmation -ne "S" -and $confirmation -ne "s") {
    Write-Step "Migração cancelada pelo usuário." "Red"
    exit
}

# Verificação da existência das pastas necessárias
if (-not (Test-Path -Path "src")) {
    Write-Step "Pasta src não encontrada. Verifique se você está no diretório correto." "Red"
    exit
}

if (-not (Test-Path -Path "src-new")) {
    Write-Step "Pasta src-new não encontrada. Verifique se a nova estrutura foi criada." "Red"
    exit
}

# Verificação do número de arquivos nas pastas para validar a migração
$srcFileCount = (Get-ChildItem -Path "src" -Recurse -File).Count
$srcNewFileCount = (Get-ChildItem -Path "src-new" -Recurse -File).Count

Write-Step "Pasta src: $srcFileCount arquivos" "Cyan"
Write-Step "Pasta src-new: $srcNewFileCount arquivos" "Cyan"

if ($srcNewFileCount -lt ($srcFileCount * 0.7)) {
    Write-Step "AVISO: A pasta src-new possui significativamente menos arquivos que a pasta src." "Yellow"
    Write-Step "Isso pode indicar que a migração está incompleta." "Yellow"
    $forceConfirmation = Read-Host "Deseja continuar mesmo assim? (S/N)"
    if ($forceConfirmation -ne "S" -and $forceConfirmation -ne "s") {
        Write-Step "Migração cancelada pelo usuário." "Red"
        exit
    }
}

# Criando backup da pasta src original com data e hora
$backupName = "src-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Step "Criando backup da pasta src original em $backupName..." "Yellow"
Copy-Item -Path "src" -Destination $backupName -Recurse -Force
Write-Step "Backup criado em $backupName" "Green"

# Removendo a pasta src atual
Write-Step "Removendo a pasta src atual..." "Yellow"
Remove-Item -Path "src" -Recurse -Force

# Renomeando src-new para src
Write-Step "Renomeando src-new para src..." "Yellow"
Rename-Item -Path "src-new" -NewName "src"

# Função para atualizar o tsconfig.json e remover tsconfig.dev.json
function Update-TsConfig {
    try {
        $tsConfigPath = Join-Path $rootDir "tsconfig.json"
        $tsConfigDevPath = Join-Path $rootDir "tsconfig.dev.json"
        $tsConfig = Get-Content -Raw $tsConfigPath | ConvertFrom-Json

        # Verifica se o paths já existe, se não, cria
        if (-not $tsConfig.compilerOptions.paths) {
            $tsConfig.compilerOptions | Add-Member -NotePropertyName "paths" -NotePropertyValue @{}
        }

        # Atualiza os caminhos para apontar para ./src em vez de ./src-new
        $tsConfig.compilerOptions.paths = @{
            "@/*" = @("./src/*")
            "@/types" = @("./types")
        }

        # Salva o arquivo atualizado
        $tsConfig | ConvertTo-Json -Depth 10 | Set-Content -Path $tsConfigPath
        Write-Host "Arquivo tsconfig.json atualizado com sucesso." -ForegroundColor Green
        
        # Remove o arquivo tsconfig.dev.json se existir
        if (Test-Path $tsConfigDevPath) {
            Remove-Item -Path $tsConfigDevPath -Force
            Write-Host "Arquivo tsconfig.dev.json removido." -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Erro ao atualizar o arquivo tsconfig.json: $_" -ForegroundColor Red
        throw "Erro ao atualizar o arquivo tsconfig.json."
    }
}

# Executando a atualização do tsconfig.json
Write-Step "Atualizando tsconfig.json..." "Yellow"
Update-TsConfig

# Executando limpeza de cache
Write-Step "Limpando cache do projeto..." "Yellow"
try {
    # Verificando qual gerenciador de pacotes está sendo usado
    if (Test-Path -Path "yarn.lock") {
        yarn cache clean
    } elseif (Test-Path -Path "package-lock.json") {
        npm cache clean --force
    }
    Write-Step "Cache limpo com sucesso" "Green"
} catch {
    Write-Step "Aviso: Não foi possível limpar o cache: $_" "Yellow"
}

Write-Step "Migração concluída com sucesso!" "Green"
Write-Step "Próximos passos:" "Cyan"
Write-Step "1. Execute 'npm install' ou 'yarn' para atualizar as dependências" "White"
Write-Step "2. Execute 'npx expo start --clear' para iniciar a aplicação com cache limpo" "White"
Write-Step "3. Teste a aplicação para verificar se tudo está funcionando corretamente" "White"
Write-Step "4. Se encontrar problemas, o backup está disponível na pasta $backupName" "White"
Write-Step "5. Depois de confirmar que tudo está funcionando, você pode remover a pasta de backup" "White"
