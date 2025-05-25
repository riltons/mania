# Script de migração para a nova estrutura de diretórios
# Este script automatiza a migração dos arquivos restantes para a nova estrutura

# Função para criar um diretório se ele não existir
function Criar-Diretorio {
    param (
        [string]$caminho
    )
    
    if (-not (Test-Path $caminho)) {
        New-Item -Path $caminho -ItemType Directory | Out-Null
        Write-Host "Diretório criado: $caminho" -ForegroundColor Green
    }
}

# Função para copiar arquivos com mensagem
function Copiar-Arquivos {
    param (
        [string]$origem,
        [string]$destino,
        [string]$padrao = "*.*"
    )
    
    if (Test-Path $origem) {
        $arquivos = Get-ChildItem -Path $origem -Filter $padrao
        
        if ($arquivos.Count -gt 0) {
            foreach ($arquivo in $arquivos) {
                Copy-Item -Path $arquivo.FullName -Destination $destino
                Write-Host "Arquivo copiado: $($arquivo.Name) -> $destino" -ForegroundColor Cyan
            }
        } else {
            Write-Host "Nenhum arquivo encontrado em: $origem" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Diretório de origem não existe: $origem" -ForegroundColor Red
    }
}

# Configuração de caminhos
$raiz = "."
$src = Join-Path $raiz "src"

# Criação de diretórios principais (caso ainda não existam)
Write-Host "Criando estrutura de diretórios..." -ForegroundColor Magenta

# Core
Criar-Diretorio (Join-Path $src "core\config")
Criar-Diretorio (Join-Path $src "core\hooks")
Criar-Diretorio (Join-Path $src "core\contexts")
Criar-Diretorio (Join-Path $src "core\lib")
Criar-Diretorio (Join-Path $src "core\utils")

# Components
Criar-Diretorio (Join-Path $src "components\ui")
Criar-Diretorio (Join-Path $src "components\layout")
Criar-Diretorio (Join-Path $src "components\feedback")
Criar-Diretorio (Join-Path $src "components\data-display")

# Features
Criar-Diretorio (Join-Path $src "features\auth\components")
Criar-Diretorio (Join-Path $src "features\auth\hooks")
Criar-Diretorio (Join-Path $src "features\auth\services")
Criar-Diretorio (Join-Path $src "features\auth\screens")

Criar-Diretorio (Join-Path $src "features\players\components")
Criar-Diretorio (Join-Path $src "features\players\hooks")
Criar-Diretorio (Join-Path $src "features\players\services")
Criar-Diretorio (Join-Path $src "features\players\screens")

Criar-Diretorio (Join-Path $src "features\games\components")
Criar-Diretorio (Join-Path $src "features\games\hooks")
Criar-Diretorio (Join-Path $src "features\games\services")
Criar-Diretorio (Join-Path $src "features\games\screens")

Criar-Diretorio (Join-Path $src "features\communities\components")
Criar-Diretorio (Join-Path $src "features\communities\hooks")
Criar-Diretorio (Join-Path $src "features\communities\services")
Criar-Diretorio (Join-Path $src "features\communities\screens")

Criar-Diretorio (Join-Path $src "features\competitions\components")
Criar-Diretorio (Join-Path $src "features\competitions\hooks")
Criar-Diretorio (Join-Path $src "features\competitions\services")
Criar-Diretorio (Join-Path $src "features\competitions\screens")

Criar-Diretorio (Join-Path $src "features\statistics\components")
Criar-Diretorio (Join-Path $src "features\statistics\hooks")
Criar-Diretorio (Join-Path $src "features\statistics\services")
Criar-Diretorio (Join-Path $src "features\statistics\screens")

Criar-Diretorio (Join-Path $src "features\admin\components")
Criar-Diretorio (Join-Path $src "features\admin\hooks")
Criar-Diretorio (Join-Path $src "features\admin\services")
Criar-Diretorio (Join-Path $src "features\admin\screens")

# Navigation
Criar-Diretorio (Join-Path $src "navigation\routes")
Criar-Diretorio (Join-Path $src "navigation\components")

# Migração dos arquivos
Write-Host "Migrando arquivos para a nova estrutura..." -ForegroundColor Magenta

# Migrar hooks para core/hooks
Copiar-Arquivos (Join-Path $src "hooks") (Join-Path $src "core\hooks")

# Migrar contextos para core/contexts
Copiar-Arquivos (Join-Path $src "contexts") (Join-Path $src "core\contexts")

# Migrar lib para core/lib
Copiar-Arquivos (Join-Path $src "lib") (Join-Path $src "core\lib")

# Migrar utils para core/utils
Copiar-Arquivos (Join-Path $src "utils") (Join-Path $src "core\utils")

# Migrar componentes UI
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\ui") "Button.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\ui") "TextInput.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\ui") "ThemeToggle.tsx"

# Migrar componentes Layout
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\layout") "Header.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\layout") "InternalHeader.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\layout") "LoggedLayout.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\layout") "BottomNavigation.tsx"

# Migrar componentes Feedback
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\feedback") "AlertModal.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\feedback") "CustomModal.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\feedback") "SplashAnimation.tsx"

# Migrar componentes Data Display
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\data-display") "PlayersList.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\data-display") "RecentActivities.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\data-display") "WebLineChart.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\data-display") "PlayerAvatar.tsx"
Copiar-Arquivos (Join-Path $src "components") (Join-Path $src "components\data-display") "ListaTabelasSupabase.tsx"

# Migrar serviços de autenticação
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\auth\services") "authService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\auth\services") "userService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\auth\services") "subscriptionService.ts"

# Migrar serviços de jogadores
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\players\services") "playerService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\players\services") "playersService.ts"

# Migrar serviços de jogos
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\games\services") "gameService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\games\services") "gamesService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\games\services") "friendlyGamesService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\games\services") "friendlyDataService.ts"

# Migrar serviços de comunidades
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\communities\services") "communityService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\communities\services") "communityMembersService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\communities\services") "communityOrganizerService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\communities\services") "communityOrganizersService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\communities\services") "communityStatsService.ts"

# Migrar serviços de competições
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\competitions\services") "competitionService.ts"

# Migrar serviços de estatísticas
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\statistics\services") "statisticsService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\statistics\services") "rankingService.ts"
Copiar-Arquivos (Join-Path $src "services") (Join-Path $src "features\statistics\services") "activityService.ts"

# Migrar telas de autenticação
Copiar-Arquivos (Join-Path $src "app") (Join-Path $src "features\auth\screens") "login.tsx"
Copiar-Arquivos (Join-Path $src "app") (Join-Path $src "features\auth\screens") "register.tsx"
Copiar-Arquivos (Join-Path $src "app") (Join-Path $src "features\auth\screens") "signup.tsx"
Copiar-Arquivos (Join-Path $src "app") (Join-Path $src "features\auth\screens") "forgot-password.tsx"

# Migrar telas de administração
Copiar-Arquivos (Join-Path $src "app") (Join-Path $src "features\admin\screens") "admin.tsx"
Copiar-Arquivos (Join-Path $src "app") (Join-Path $src "features\admin\screens") "admin-panel.tsx"

# Migrar telas de estatísticas
Copiar-Arquivos (Join-Path $src "app") (Join-Path $src "features\statistics\screens") "stats.tsx"

# Migrar telas de jogadores
Copiar-Arquivos (Join-Path $src "app\jogadores") (Join-Path $src "features\players\screens")

# Migrar telas de duplas
Copiar-Arquivos (Join-Path $src "app\top-duplas") (Join-Path $src "features\statistics\screens")

Write-Host "Migração concluída com sucesso!" -ForegroundColor Green
Write-Host "Próximo passo: Atualizar as importações nos arquivos migrados." -ForegroundColor Yellow
