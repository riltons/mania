# Script para atualizar as importações nos arquivos migrados
# Este script ajuda a atualizar os caminhos de importação para a nova estrutura de diretórios

# Função para atualizar importações em um arquivo
function Atualizar-Importacoes {
    param (
        [string]$arquivoPath
    )
    
    if (Test-Path $arquivoPath) {
        $conteudo = Get-Content -Path $arquivoPath -Raw
        $arquivoModificado = $false
        
        # Mapeamento de importações antigas para novas
        $mapeamentos = @(
            # Contextos
            @{Antigo = "from '@/contexts/"; Novo = "from '@/core/contexts/"},
            
            # Lib
            @{Antigo = "from '@/lib/"; Novo = "from '@/core/lib/"},
            
            # Utils
            @{Antigo = "from '@/utils/"; Novo = "from '@/core/utils/"},
            
            # Hooks
            @{Antigo = "from '@/hooks/"; Novo = "from '@/core/hooks/"},
            
            # Componentes UI
            @{Antigo = "from '@/components/Button"; Novo = "from '@/components/ui/Button"},
            @{Antigo = "from '@/components/TextInput"; Novo = "from '@/components/ui/TextInput"},
            @{Antigo = "from '@/components/ThemeToggle"; Novo = "from '@/components/ui/ThemeToggle"},
            
            # Componentes Layout
            @{Antigo = "from '@/components/Header"; Novo = "from '@/components/layout/Header"},
            @{Antigo = "from '@/components/InternalHeader"; Novo = "from '@/components/layout/InternalHeader"},
            @{Antigo = "from '@/components/LoggedLayout"; Novo = "from '@/components/layout/LoggedLayout"},
            @{Antigo = "from '@/components/BottomNavigation"; Novo = "from '@/components/layout/BottomNavigation"},
            
            # Componentes Feedback
            @{Antigo = "from '@/components/AlertModal"; Novo = "from '@/components/feedback/AlertModal"},
            @{Antigo = "from '@/components/CustomModal"; Novo = "from '@/components/feedback/CustomModal"},
            @{Antigo = "from '@/components/SplashAnimation"; Novo = "from '@/components/feedback/SplashAnimation"},
            
            # Componentes Data Display
            @{Antigo = "from '@/components/PlayersList"; Novo = "from '@/components/data-display/PlayersList"},
            @{Antigo = "from '@/components/RecentActivities"; Novo = "from '@/components/data-display/RecentActivities"},
            @{Antigo = "from '@/components/WebLineChart"; Novo = "from '@/components/data-display/WebLineChart"},
            @{Antigo = "from '@/components/PlayerAvatar"; Novo = "from '@/components/data-display/PlayerAvatar"},
            @{Antigo = "from '@/components/ListaTabelasSupabase"; Novo = "from '@/components/data-display/ListaTabelasSupabase"},
            
            # Serviços Auth
            @{Antigo = "from '@/services/authService"; Novo = "from '@/features/auth/services/authService"},
            @{Antigo = "from '@/services/userService"; Novo = "from '@/features/auth/services/userService"},
            @{Antigo = "from '@/services/subscriptionService"; Novo = "from '@/features/auth/services/subscriptionService"},
            
            # Serviços Players
            @{Antigo = "from '@/services/playerService"; Novo = "from '@/features/players/services/playerService"},
            @{Antigo = "from '@/services/playersService"; Novo = "from '@/features/players/services/playersService"},
            
            # Serviços Games
            @{Antigo = "from '@/services/gameService"; Novo = "from '@/features/games/services/gameService"},
            @{Antigo = "from '@/services/gamesService"; Novo = "from '@/features/games/services/gamesService"},
            @{Antigo = "from '@/services/friendlyGamesService"; Novo = "from '@/features/games/services/friendlyGamesService"},
            @{Antigo = "from '@/services/friendlyDataService"; Novo = "from '@/features/games/services/friendlyDataService"},
            
            # Serviços Communities
            @{Antigo = "from '@/services/communityService"; Novo = "from '@/features/communities/services/communityService"},
            @{Antigo = "from '@/services/communityMembersService"; Novo = "from '@/features/communities/services/communityMembersService"},
            @{Antigo = "from '@/services/communityOrganizerService"; Novo = "from '@/features/communities/services/communityOrganizerService"},
            @{Antigo = "from '@/services/communityOrganizersService"; Novo = "from '@/features/communities/services/communityOrganizersService"},
            @{Antigo = "from '@/services/communityStatsService"; Novo = "from '@/features/communities/services/communityStatsService"},
            
            # Serviços Competitions
            @{Antigo = "from '@/services/competitionService"; Novo = "from '@/features/competitions/services/competitionService"},
            
            # Serviços Statistics
            @{Antigo = "from '@/services/statisticsService"; Novo = "from '@/features/statistics/services/statisticsService"},
            @{Antigo = "from '@/services/rankingService"; Novo = "from '@/features/statistics/services/rankingService"},
            @{Antigo = "from '@/services/activityService"; Novo = "from '@/features/statistics/services/activityService"}
        )
        
        # Aplicar cada mapeamento
        foreach ($mapeamento in $mapeamentos) {
            if ($conteudo -match $mapeamento.Antigo) {
                $conteudo = $conteudo -replace $mapeamento.Antigo, $mapeamento.Novo
                $arquivoModificado = $true
            }
        }
        
        # Salvar alterações se o arquivo foi modificado
        if ($arquivoModificado) {
            Set-Content -Path $arquivoPath -Value $conteudo
            Write-Host "Importações atualizadas em: $arquivoPath" -ForegroundColor Green
        } else {
            Write-Host "Nenhuma importação para atualizar em: $arquivoPath" -ForegroundColor Yellow
        }
    } else {
        Write-Host "Arquivo não encontrado: $arquivoPath" -ForegroundColor Red
    }
}

# Função para processar todos os arquivos em um diretório recursivamente
function Processar-Diretorio {
    param (
        [string]$diretorioPath,
        [string[]]$extensoes = @("*.ts", "*.tsx", "*.js", "*.jsx")
    )
    
    # Obter todos os arquivos com as extensões especificadas
    $arquivos = Get-ChildItem -Path $diretorioPath -Include $extensoes -Recurse
    
    # Processar cada arquivo
    foreach ($arquivo in $arquivos) {
        Atualizar-Importacoes -arquivoPath $arquivo.FullName
    }
}

# Diretório raiz do projeto
$raizProjeto = "."
$srcDir = Join-Path $raizProjeto "src"

# Processar todos os arquivos no diretório src
Write-Host "Iniciando atualização de importações..." -ForegroundColor Magenta
Processar-Diretorio -diretorioPath $srcDir

Write-Host "Atualização de importações concluída!" -ForegroundColor Green
Write-Host "Verifique se há erros de compilação e corrija manualmente se necessário." -ForegroundColor Yellow
