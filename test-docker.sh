#!/bin/bash
# ================================
# Script de test Docker CareWay
# ================================
# Teste que la configuration Docker fonctionne correctement

set -e  # Arrêter en cas d'erreur

echo "🧪 Tests de la configuration Docker CareWay"
echo "==========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction pour afficher un succès
test_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((TESTS_PASSED++))
}

# Fonction pour afficher un échec
test_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((TESTS_FAILED++))
}

# Fonction pour afficher une info
test_info() {
    echo -e "${YELLOW}ℹ️  INFO${NC}: $1"
}

echo "1️⃣  Vérification des prérequis..."
echo "-----------------------------------"

# Test Docker
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    test_pass "Docker installé: $DOCKER_VERSION"
else
    test_fail "Docker n'est pas installé"
fi

# Test Docker Compose
if command -v docker compose &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    test_pass "Docker Compose installé: $COMPOSE_VERSION"
else
    test_fail "Docker Compose n'est pas installé"
fi

echo ""
echo "2️⃣  Vérification des fichiers Docker..."
echo "-----------------------------------"

# Fichiers requis
FILES=(
    "Dockerfile"
    "Dockerfile.dev"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "nginx.conf"
    ".dockerignore"
    ".env.example"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        test_pass "Fichier trouvé: $file"
    else
        test_fail "Fichier manquant: $file"
    fi
done

echo ""
echo "3️⃣  Vérification du fichier .env..."
echo "-----------------------------------"

if [ -f ".env" ]; then
    test_pass "Fichier .env trouvé"
    
    # Vérifier les variables requises
    if grep -q "VITE_SUPABASE_URL" .env; then
        test_pass "Variable VITE_SUPABASE_URL présente"
    else
        test_fail "Variable VITE_SUPABASE_URL manquante"
    fi
    
    if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        test_pass "Variable VITE_SUPABASE_ANON_KEY présente"
    else
        test_fail "Variable VITE_SUPABASE_ANON_KEY manquante"
    fi
else
    test_fail "Fichier .env manquant (copiez .env.example vers .env)"
fi

echo ""
echo "4️⃣  Test de build du Dockerfile de développement..."
echo "-----------------------------------"

if docker build -f Dockerfile.dev -t careway-dev-test . > /dev/null 2>&1; then
    test_pass "Build Dockerfile.dev réussi"
    docker image rm careway-dev-test > /dev/null 2>&1
else
    test_fail "Build Dockerfile.dev échoué"
fi

echo ""
echo "5️⃣  Test de build du Dockerfile de production..."
echo "-----------------------------------"

if docker build -f Dockerfile -t careway-prod-test . > /dev/null 2>&1; then
    test_pass "Build Dockerfile (prod) réussi"
    
    # Vérifier la taille de l'image
    IMAGE_SIZE=$(docker image inspect careway-prod-test --format='{{.Size}}' | awk '{print $1/1024/1024}')
    test_info "Taille de l'image: ${IMAGE_SIZE} MB"
    
    docker image rm careway-prod-test > /dev/null 2>&1
else
    test_fail "Build Dockerfile (prod) échoué"
fi

echo ""
echo "6️⃣  Test de docker-compose (développement)..."
echo "-----------------------------------"

if docker compose config > /dev/null 2>&1; then
    test_pass "Configuration docker-compose.yml valide"
else
    test_fail "Configuration docker-compose.yml invalide"
fi

echo ""
echo "7️⃣  Test de docker-compose (production)..."
echo "-----------------------------------"

if docker compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
    test_pass "Configuration docker-compose.prod.yml valide"
else
    test_fail "Configuration docker-compose.prod.yml invalide"
fi

echo ""
echo "8️⃣  Vérification de nginx.conf..."
echo "-----------------------------------"

# Créer un conteneur temporaire nginx pour tester la config
if docker run --rm -v "$(pwd)/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:1.25-alpine nginx -t > /dev/null 2>&1; then
    test_pass "Configuration nginx.conf valide"
else
    test_fail "Configuration nginx.conf invalide"
fi

echo ""
echo "==========================================="
echo "📊 Résultats des tests"
echo "==========================================="
echo -e "${GREEN}Tests réussis: $TESTS_PASSED${NC}"
echo -e "${RED}Tests échoués: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés !${NC}"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Si pas déjà fait: cp .env.example .env"
    echo "  2. Configurer vos variables Supabase dans .env"
    echo "  3. Lancer: docker compose up -d"
    echo "  4. Accéder à: http://localhost:3000"
    exit 0
else
    echo -e "${RED}❌ Certains tests ont échoué.${NC}"
    echo "Veuillez corriger les erreurs ci-dessus avant de continuer."
    exit 1
fi
