# Script para corrigir imports do ThemeProvider em todo o projeto
# Autor: Cascade
# Data: 2025-05-04

Write-Host "Iniciando correcao dos imports do ThemeProvider..."

# Diretorio raiz do projeto
$projetoDir = Split-Path -Parent $PSScriptRoot

# Encontrar todos os arquivos .tsx e .ts
$arquivos = Get-ChildItem -Path $projetoDir\src -Recurse -Include *.tsx,*.ts

$arquivosCorrigidos = 0

foreach ($arquivo in $arquivos) {
    $conteudo = Get-Content -Path $arquivo.FullName
    $modificado = $false
    $novoConteudo = @()
    
    foreach ($linha in $conteudo) {
        if ($linha -match "import.*useTheme.*from.*@/contexts/ThemeProvider") {
            $novaLinha = $linha -replace "@/contexts/ThemeProvider", "@/core/contexts/ThemeProvider"
            $novoConteudo += $novaLinha
            $modificado = $true
        } else {
            $novoConteudo += $linha
        }
    }
    
    if ($modificado) {
        Set-Content -Path $arquivo.FullName -Value $novoConteudo
        Write-Host "Corrigido: $($arquivo.FullName)"
        $arquivosCorrigidos++
    }
}

Write-Host "Correcao concluida! $arquivosCorrigidos arquivos foram atualizados."
