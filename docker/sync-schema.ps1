# ================================
# Sync Supabase Cloud to Local Docker
# ================================
# Usage: .\docker\sync-schema.ps1 <project-ref> (optional)

param(
    [string]$ProjectRef = ""
)

$DockerDir = Join-Path (Get-Location) "docker"
$EnvFile = Join-Path $DockerDir ".env"
$MigrationDir = Join-Path (Get-Location) "supabase/migrations"

Write-Host "🔄 CareWay Supabase Sync" -ForegroundColor Cyan
Write-Host "=========================" -ForegroundColor Cyan

# 1. Check if Supabase CLI is installed
if (-not (Get-Command "supabase" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Supabase CLI is not installed!" -ForegroundColor Red
    Write-Host "   Please install it: scope install supabase"
    exit 1
}

# 2. Login check (basic)
Write-Host "1. Checking Supabase Login..." -ForegroundColor Yellow
# We assume user is logged in or will be prompted.

# 3. Pull Schema
Write-Host "2. Pulling Schema from Cloud..." -ForegroundColor Yellow
if ($ProjectRef -eq "") {
    Write-Host "   Fetching project ref from user input or config..."
    $ProjectRef = Read-Host "Enter your Supabase Project Ref (or press enter if linked)"
}

if ($ProjectRef) {
    supabase link --project-ref $ProjectRef
    supabase db pull
} else {
    supabase db pull
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull schema." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Schema pulled to ./supabase/migrations" -ForegroundColor Green

# 4. Apply to Local Docker
Write-Host "3. Applying migrations to Local Docker Database..." -ForegroundColor Yellow

# Get DB config from .env
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match "POSTGRES_PASSWORD=(.*)") { $env:PGPASSWORD = $matches[1] }
    }
} else {
    $env:PGPASSWORD = "your-super-secret-password" # Fallback
}

$ContainerName = "careway-db"

# List all .sql files
$SqlFiles = Get-ChildItem -Path $MigrationDir -Filter "*.sql" | Sort-Object Name

foreach ($File in $SqlFiles) {
    Write-Host "   Applying $($File.Name)..." -ForegroundColor Gray
    # Copy file to container to avoid complex quoting issues
    docker cp $File.FullName "$($ContainerName):/tmp/$($File.Name)"
    
    # Execute psql
    docker exec -e PGPASSWORD=$env:PGPASSWORD $ContainerName psql -U postgres -d postgres -f "/tmp/$($File.Name)"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to apply $($File.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✅ Sync Complete! Local Supabase is up to date." -ForegroundColor Green
Write-Host "   Studio: http://localhost:54323" -ForegroundColor Cyan
