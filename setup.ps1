# ================================
# Script d'installation CareWay
# ================================
# Ce script copie les fichiers .env nécessaires pour le développement

Write-Host ""
Write-Host "🚀 Installation de CareWay - Configuration .env" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

$rootPath = $PSScriptRoot

# Vérifier si docker/.env existe
$dockerEnvPath = Join-Path $rootPath "docker\.env"
if (-not (Test-Path $dockerEnvPath)) {
    Write-Host "⚠️  Fichier docker/.env manquant, création..." -ForegroundColor Yellow
    
    $envContent = @"
POSTGRES_PASSWORD=your-super-secret-password
JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmV3YXkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNDYzMjc0MCwiZXhwIjoxOTMwMDMwNzQwfQ.N_l_e_i_o_n_s_k_e_y_h_e_r_e
SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNhcmV3YXkiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE0NjMyNzQwLCJleHAiOjE5MzAwMzA3NDB9.s_e_c_r_e_t_a_y_h_e_r_e
"@
    
    Set-Content -Path $dockerEnvPath -Value $envContent
    Write-Host "✅ Fichier docker/.env créé" -ForegroundColor Green
} else {
    Write-Host "✅ Fichier docker/.env existe déjà" -ForegroundColor Green
}

# Vérifier si .env.development existe
$devEnvPath = Join-Path $rootPath ".env.development"
if (-not (Test-Path $devEnvPath)) {
    $examplePath = Join-Path $rootPath ".env.example"
    
    if (Test-Path $examplePath) {
        Copy-Item $examplePath $devEnvPath
        Write-Host "✅ Fichier .env.development créé depuis .env.example" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.example introuvable" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ Fichier .env.development existe déjà" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 Configuration terminée!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Installer les dépendances : npm install" -ForegroundColor Gray
Write-Host "   2. Démarrer Docker         : npm run docker:start" -ForegroundColor Gray
Write-Host "   3. Démarrer l'app          : npm run dev" -ForegroundColor Gray
Write-Host ""
