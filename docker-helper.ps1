# ================================
# CareWay Docker - Scripts PowerShell (Dev Only)
# ================================
# Script d'aide pour gérer Docker en développement
# Usage: .\docker-helper.ps1 [commande]

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

function Show-Help {
    Write-Host ""
    Write-Host "🐳 CareWay Docker Helper (Développement)" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Commandes disponibles:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  start          " -NoNewline; Write-Host "Démarrer l'environnement de développement" -ForegroundColor Gray
    Write-Host "  stop           " -NoNewline; Write-Host "Arrêter l'environnement" -ForegroundColor Gray
    Write-Host "  restart        " -NoNewline; Write-Host "Redémarrer l'environnement" -ForegroundColor Gray
    Write-Host "  logs           " -NoNewline; Write-Host "Voir les logs en temps réel" -ForegroundColor Gray
    Write-Host "  shell          " -NoNewline; Write-Host "Accéder au shell du conteneur frontend" -ForegroundColor Gray
    Write-Host "  db-shell       " -NoNewline; Write-Host "Accéder au shell PostgreSQL" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  clean          " -NoNewline; Write-Host "Nettoyer (conteneurs + volumes)" -ForegroundColor Gray
    Write-Host "  clean-all      " -NoNewline; Write-Host "Nettoyer tout (ATTENTION: perte de données!)" -ForegroundColor Gray
    Write-Host "  status         " -NoNewline; Write-Host "Voir l'état des conteneurs" -ForegroundColor Gray
    Write-Host "  health         " -NoNewline; Write-Host "Vérifier la santé des conteneurs" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Exemples:" -ForegroundColor Yellow
    Write-Host "  .\docker-helper.ps1 start" -ForegroundColor Green
    Write-Host "  .\docker-helper.ps1 logs" -ForegroundColor Green
    Write-Host "  .\docker-helper.ps1 db-shell" -ForegroundColor Green
    Write-Host ""
}

function Start-Dev {
    Write-Host "🚀 Démarrage de l'environnement de développement..." -ForegroundColor Green
    docker compose up -d
    Write-Host ""
    Write-Host "✅ Services démarrés:" -ForegroundColor Green
    Write-Host "   - Frontend Vite:      http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   - Supabase DB:        localhost:5432" -ForegroundColor Cyan
    Write-Host "   - Supabase API:       http://localhost:54321" -ForegroundColor Cyan
    Write-Host ""
}

function Stop-Dev {
    Write-Host "🛑 Arrêt de l'environnement..." -ForegroundColor Yellow
    docker compose down
    Write-Host "✅ Arrêté" -ForegroundColor Green
}

function Restart-Dev {
    Write-Host "🔄 Redémarrage de l'environnement..." -ForegroundColor Yellow
    docker compose restart
    Write-Host "✅ Redémarré" -ForegroundColor Green
}

function Show-DevLogs {
    Write-Host "📋 Affichage des logs (Ctrl+C pour quitter)..." -ForegroundColor Cyan
    docker compose logs -f
}

function Enter-DevShell {
    Write-Host "🐚 Accès au shell du conteneur frontend..." -ForegroundColor Cyan
    docker compose exec frontend sh
}

function Enter-DBShell {
    Write-Host "🗄️  Accès au shell PostgreSQL..." -ForegroundColor Cyan
    docker compose exec supabase psql -U postgres -d careway
}

function Clean-Docker {
    Write-Host "🧹 Nettoyage des conteneurs et volumes..." -ForegroundColor Yellow
    docker compose down -v
    Write-Host "✅ Nettoyage terminé" -ForegroundColor Green
}

function Clean-All {
    $confirmation = Read-Host "⚠️  ATTENTION: Cela va supprimer TOUS les conteneurs, images et volumes Docker. Continuer? (oui/non)"
    if ($confirmation -eq "oui") {
        Write-Host "🧹 Nettoyage complet de Docker..." -ForegroundColor Red
        docker system prune -a --volumes -f
        Write-Host "✅ Nettoyage complet terminé" -ForegroundColor Green
    } else {
        Write-Host "❌ Annulé" -ForegroundColor Yellow
    }
}

function Show-Status {
    Write-Host "📊 État des conteneurs Docker:" -ForegroundColor Cyan
    docker ps -a --filter "name=careway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

function Show-Health {
    Write-Host "🏥 Santé des conteneurs:" -ForegroundColor Cyan
    $containers = docker ps --filter "name=careway" --format "{{.Names}}"
    foreach ($container in $containers) {
        Write-Host ""
        Write-Host "Conteneur: $container" -ForegroundColor Yellow
        docker inspect --format='{{json .State.Health}}' $container | ConvertFrom-Json | Format-List
    }
}

# Traitement des commandes
switch ($Command.ToLower()) {
    "start"       { Start-Dev }
    "stop"        { Stop-Dev }
    "restart"     { Restart-Dev }
    "logs"        { Show-DevLogs }
    "shell"       { Enter-DevShell }
    "db-shell"    { Enter-DBShell }
    "clean"       { Clean-Docker }
    "clean-all"   { Clean-All }
    "status"      { Show-Status }
    "health"      { Show-Health }
    "help"        { Show-Help }
    default       { 
        Write-Host "❌ Commande inconnue: $Command" -ForegroundColor Red
        Show-Help 
    }
}
