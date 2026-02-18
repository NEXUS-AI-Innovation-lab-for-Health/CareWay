# ================================
# CareWay Docker Helper - PowerShell (Dev Only)
# ================================
# Usage: .\docker\docker-helper.ps1 [command]
# Run from repository root or use relative paths.

param(
    [Parameter(Position=0)]
    [string]$Command = "help"
)

# Set location to the docker directory for docker compose context, then return
$InitPath = Get-Location
$DockerDir = Join-Path $InitPath "docker"

function Show-Help {
    Write-Host ""
    Write-Host "🐳 CareWay Docker Helper" -ForegroundColor Cyan
    Write-Host "========================" -ForegroundColor Cyan
    Write-Host "Usage: .\docker\docker-helper.ps1 <command>"
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor Yellow
    Write-Host "  start          " -NoNewline; Write-Host "Start development environment" -ForegroundColor Gray
    Write-Host "  stop           " -NoNewline; Write-Host "Stop environment" -ForegroundColor Gray
    Write-Host "  restart        " -NoNewline; Write-Host "Restart environment" -ForegroundColor Gray
    Write-Host "  logs           " -NoNewline; Write-Host "View logs (Ctrl+C to exit)" -ForegroundColor Gray
    Write-Host "  shell          " -NoNewline; Write-Host "Shell into frontend container" -ForegroundColor Gray
    Write-Host "  db-shell       " -NoNewline; Write-Host "Shell into database container" -ForegroundColor Gray
    Write-Host "  clean          " -NoNewline; Write-Host "Remove containers and volumes" -ForegroundColor Gray
    Write-Host "  sync-schema    " -NoNewline; Write-Host "Pull schema from Cloud (requires login)" -ForegroundColor Gray
    Write-Host ""
}

function Run-Compose {
    param([string[]]$Arguments)
    # Ensure we run docker compose from the docker directory context if needed, 
    # but usually 'docker compose -f docker/docker-compose.yml --project-directory .' is better 
    # so we can use paths relative to root in docker-compose.yml.
    
    # We will run from ROOT, pointing to the file in docker/
    # We explicitly load the .env file from the docker directory
    docker compose --env-file "$DockerDir\.env" -f "$DockerDir\docker-compose.yml" --project-directory "$InitPath" @Arguments
}

function Start-Dev {
    Write-Host "🚀 Starting CareWay Dev Environment..." -ForegroundColor Green
    Run-Compose "up", "-d"
    Write-Host ""
    Write-Host "✅ Services started:" -ForegroundColor Green
    Write-Host "   - Frontend:      http://localhost:3000" -ForegroundColor Cyan
    Write-Host "   - Studio:        http://localhost:54323" -ForegroundColor Cyan
    Write-Host "   - API:           http://localhost:54321" -ForegroundColor Cyan
    Write-Host "   - DB:            localhost:54322" -ForegroundColor Cyan
}

function Stop-Dev {
    Write-Host "🛑 Stopping environment..." -ForegroundColor Yellow
    Run-Compose "down"
    Write-Host "✅ Stopped" -ForegroundColor Green
}

function Restart-Dev {
    Write-Host "🔄 Restarting..." -ForegroundColor Yellow
    Run-Compose "restart"
    Write-Host "✅ Restarted" -ForegroundColor Green
}

function Show-Logs {
    Write-Host "📋 Logs..." -ForegroundColor Cyan
    Run-Compose "logs", "-f"
}

function Enter-Shell {
    Write-Host "🐚 Frontend Shell..." -ForegroundColor Cyan
    Run-Compose "exec", "frontend", "sh"
}

function Enter-DbShell {
    Write-Host "🗄️  Database Shell..." -ForegroundColor Cyan
    Run-Compose "exec", "db", "psql", "-U", "postgres"
}

function Clean-Docker {
    Write-Host "🧹 Cleaning containers and volumes..." -ForegroundColor Yellow
    Run-Compose "down", "-v"
    Write-Host "✅ Cleaned" -ForegroundColor Green
}

function Sync-Schema {
    Write-Host "🔄 Syncing functionality coming soon..." -ForegroundColor Yellow
    # Placeholder for sync logic
}

# Command Switch
switch ($Command.ToLower()) {
    "start"       { Start-Dev }
    "stop"        { Stop-Dev }
    "restart"     { Restart-Dev }
    "logs"        { Show-Logs }
    "shell"       { Enter-Shell }
    "db-shell"    { Enter-DbShell }
    "clean"       { Clean-Docker }
    "sync-schema" { Sync-Schema }
    "help"        { Show-Help }
    default       { Show-Help }
}
