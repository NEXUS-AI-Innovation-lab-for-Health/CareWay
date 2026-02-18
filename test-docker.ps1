# ================================
# Script de test Docker CareWay (PowerShell)
# ================================
# Teste que la configuration Docker fonctionne correctement

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "🧪 Tests de la configuration Docker CareWay" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Compteurs
$TestsPassed = 0
$TestsFailed = 0

# Fonctions
function Test-Pass {
    param([string]$Message)
    Write-Host "✅ PASS: " -NoNewline -ForegroundColor Green
    Write-Host $Message
    $script:TestsPassed++
}

function Test-Fail {
    param([string]$Message)
    Write-Host "❌ FAIL: " -NoNewline -ForegroundColor Red
    Write-Host $Message
    $script:TestsFailed++
}

function Test-Info {
    param([string]$Message)
    Write-Host "ℹ️  INFO: " -NoNewline -ForegroundColor Yellow
    Write-Host $Message
}

# Test 1: Prérequis
Write-Host "1️⃣  Vérification des prérequis..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

# Docker
try {
    $dockerVersion = docker --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Docker installé: $dockerVersion"
    } else {
        Test-Fail "Docker n'est pas installé ou n'est pas dans le PATH"
    }
} catch {
    Test-Fail "Docker n'est pas installé"
}

# Docker Compose
try {
    $composeVersion = docker compose version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Docker Compose installé: $composeVersion"
    } else {
        Test-Fail "Docker Compose n'est pas installé"
    }
} catch {
    Test-Fail "Docker Compose n'est pas installé"
}

Write-Host ""

# Test 2: Fichiers Docker
Write-Host "2️⃣  Vérification des fichiers Docker..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

$files = @(
    "Dockerfile",
    "Dockerfile.dev",
    "docker-compose.yml",
    "docker-compose.prod.yml",
    "nginx.conf",
    ".dockerignore",
    ".env.example"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Test-Pass "Fichier trouvé: $file"
    } else {
        Test-Fail "Fichier manquant: $file"
    }
}

Write-Host ""

# Test 3: Fichier .env
Write-Host "3️⃣  Vérification du fichier .env..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

if (Test-Path ".env") {
    Test-Pass "Fichier .env trouvé"
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "VITE_SUPABASE_URL") {
        Test-Pass "Variable VITE_SUPABASE_URL présente"
    } else {
        Test-Fail "Variable VITE_SUPABASE_URL manquante"
    }
    
    if ($envContent -match "VITE_SUPABASE_ANON_KEY") {
        Test-Pass "Variable VITE_SUPABASE_ANON_KEY présente"
    } else {
        Test-Fail "Variable VITE_SUPABASE_ANON_KEY manquante"
    }
} else {
    Test-Fail "Fichier .env manquant (copiez .env.example vers .env)"
}

Write-Host ""

# Test 4: Build Dockerfile.dev
Write-Host "4️⃣  Test de build du Dockerfile de développement..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

try {
    $buildOutput = docker build -f Dockerfile.dev -t careway-dev-test . 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Build Dockerfile.dev réussi"
        docker image rm careway-dev-test 2>&1 | Out-Null
    } else {
        Test-Fail "Build Dockerfile.dev échoué"
    }
} catch {
    Test-Fail "Build Dockerfile.dev échoué: $_"
}

Write-Host ""

# Test 5: Build Dockerfile (prod)
Write-Host "5️⃣  Test de build du Dockerfile de production..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

try {
    $buildOutput = docker build -f Dockerfile -t careway-prod-test . 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Build Dockerfile (prod) réussi"
        
        # Vérifier la taille
        $imageInfo = docker image inspect careway-prod-test | ConvertFrom-Json
        $sizeMB = [math]::Round($imageInfo[0].Size / 1MB, 2)
        Test-Info "Taille de l'image: $sizeMB MB"
        
        docker image rm careway-prod-test 2>&1 | Out-Null
    } else {
        Test-Fail "Build Dockerfile (prod) échoué"
    }
} catch {
    Test-Fail "Build Dockerfile (prod) échoué: $_"
}

Write-Host ""

# Test 6: docker-compose.yml
Write-Host "6️⃣  Test de docker-compose (développement)..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

try {
    $configOutput = docker compose config 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Configuration docker-compose.yml valide"
    } else {
        Test-Fail "Configuration docker-compose.yml invalide"
    }
} catch {
    Test-Fail "Configuration docker-compose.yml invalide: $_"
}

Write-Host ""

# Test 7: docker-compose.prod.yml
Write-Host "7️⃣  Test de docker-compose (production)..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

try {
    $configOutput = docker compose -f docker-compose.prod.yml config 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Configuration docker-compose.prod.yml valide"
    } else {
        Test-Fail "Configuration docker-compose.prod.yml invalide"
    }
} catch {
    Test-Fail "Configuration docker-compose.prod.yml invalide: $_"
}

Write-Host ""

# Test 8: nginx.conf
Write-Host "8️⃣  Vérification de nginx.conf..." -ForegroundColor Yellow
Write-Host "-----------------------------------"

try {
    $nginxPath = (Get-Location).Path + "\nginx.conf"
    $testOutput = docker run --rm -v "${nginxPath}:/etc/nginx/nginx.conf:ro" nginx:1.25-alpine nginx -t 2>&1
    if ($LASTEXITCODE -eq 0) {
        Test-Pass "Configuration nginx.conf valide"
    } else {
        Test-Fail "Configuration nginx.conf invalide"
    }
} catch {
    Test-Fail "Configuration nginx.conf invalide: $_"
}

Write-Host ""

# Résultats
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "📊 Résultats des tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Tests réussis: " -NoNewline
Write-Host "$TestsPassed" -ForegroundColor Green
Write-Host "Tests échoués: " -NoNewline
Write-Host "$TestsFailed" -ForegroundColor Red
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "✅ Tous les tests sont passés !" -ForegroundColor Green
    Write-Host ""
    Write-Host "Prochaines étapes:"
    Write-Host "  1. Si pas déjà fait: Copy-Item .env.example .env"
    Write-Host "  2. Configurer vos variables Supabase dans .env"
    Write-Host "  3. Lancer: docker compose up -d"
    Write-Host "  4. Accéder à: http://localhost:3000"
    exit 0
} else {
    Write-Host "❌ Certains tests ont échoué." -ForegroundColor Red
    Write-Host "Veuillez corriger les erreurs ci-dessus avant de continuer."
    exit 1
}
