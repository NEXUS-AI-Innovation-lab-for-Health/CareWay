# ================================
# Makefile - CareWay Docker
# ================================
# Commandes rapides pour gérer Docker
# Usage: make [commande]

.PHONY: help dev-start dev-stop dev-restart dev-logs dev-shell prod-build prod-start prod-stop prod-logs clean clean-all status health

# Couleurs pour l'affichage
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

help: ## Afficher cette aide
	@echo "$(CYAN)🐳 CareWay Docker - Makefile$(NC)"
	@echo "$(CYAN)============================$(NC)"
	@echo ""
	@echo "$(YELLOW)Commandes de développement:$(NC)"
	@grep -E '^dev-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Commandes de production:$(NC)"
	@grep -E '^prod-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Autres commandes:$(NC)"
	@grep -E '^(clean|status|health)[a-zA-Z_-]*:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ================================
# Développement
# ================================

dev-start: ## Démarrer l'environnement de développement
	@echo "$(GREEN)🚀 Démarrage de l'environnement de développement...$(NC)"
	docker compose up -d
	@echo "$(GREEN)✅ Application disponible sur http://localhost:3000$(NC)"

dev-stop: ## Arrêter l'environnement de développement
	@echo "$(YELLOW)🛑 Arrêt de l'environnement de développement...$(NC)"
	docker compose down
	@echo "$(GREEN)✅ Arrêté$(NC)"

dev-restart: ## Redémarrer l'environnement de développement
	@echo "$(YELLOW)🔄 Redémarrage de l'environnement de développement...$(NC)"
	docker compose restart
	@echo "$(GREEN)✅ Redémarré$(NC)"

dev-logs: ## Voir les logs en temps réel (Ctrl+C pour quitter)
	@echo "$(CYAN)📋 Affichage des logs...$(NC)"
	docker compose logs -f frontend

dev-shell: ## Accéder au shell du conteneur de dev
	@echo "$(CYAN)🐚 Accès au shell du conteneur...$(NC)"
	docker compose exec frontend sh

dev-rebuild: ## Reconstruire et redémarrer le conteneur de dev
	@echo "$(GREEN)🔨 Reconstruction du conteneur...$(NC)"
	docker compose up -d --build
	@echo "$(GREEN)✅ Reconstruction terminée$(NC)"

# ================================
# Production
# ================================

prod-build: ## Builder l'image de production
	@echo "$(GREEN)🏗️  Build de l'image de production...$(NC)"
	docker compose -f docker-compose.prod.yml build
	@echo "$(GREEN)✅ Build terminé$(NC)"

prod-start: ## Démarrer en mode production
	@echo "$(GREEN)🚀 Démarrage en production...$(NC)"
	docker compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✅ Application disponible sur http://localhost$(NC)"

prod-stop: ## Arrêter l'environnement de production
	@echo "$(YELLOW)🛑 Arrêt de l'environnement de production...$(NC)"
	docker compose -f docker-compose.prod.yml down
	@echo "$(GREEN)✅ Arrêté$(NC)"

prod-logs: ## Voir les logs de production
	@echo "$(CYAN)📋 Affichage des logs de production...$(NC)"
	docker compose -f docker-compose.prod.yml logs -f frontend

prod-deploy: prod-build prod-start ## Builder et démarrer en production (déploiement complet)

# ================================
# Nettoyage et maintenance
# ================================

clean: ## Nettoyer les conteneurs et volumes
	@echo "$(YELLOW)🧹 Nettoyage des conteneurs et volumes...$(NC)"
	docker compose down -v
	@echo "$(GREEN)✅ Nettoyage terminé$(NC)"

clean-all: ## Nettoyer tout Docker (ATTENTION: supprime tout!)
	@echo "$(RED)⚠️  ATTENTION: Cela va supprimer TOUS les conteneurs, images et volumes Docker!$(NC)"
	@read -p "Continuer? (oui/non): " confirm && [ "$$confirm" = "oui" ] || exit 1
	@echo "$(RED)🧹 Nettoyage complet de Docker...$(NC)"
	docker system prune -a --volumes -f
	@echo "$(GREEN)✅ Nettoyage complet terminé$(NC)"

status: ## Voir l'état des conteneurs
	@echo "$(CYAN)📊 État des conteneurs Docker:$(NC)"
	@docker ps -a --filter "name=careway" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

health: ## Vérifier la santé des conteneurs
	@echo "$(CYAN)🏥 Santé des conteneurs:$(NC)"
	@docker ps --filter "name=careway" --format "{{.Names}}" | xargs -I {} sh -c 'echo "\n$(YELLOW)Conteneur: {}$(NC)" && docker inspect --format="{{json .State.Health}}" {} | jq .'

# ================================
# Utilitaires
# ================================

setup: ## Configuration initiale (créer .env depuis .env.example)
	@if [ ! -f .env ]; then \
		echo "$(GREEN)📝 Création du fichier .env...$(NC)"; \
		cp .env.example .env; \
		echo "$(YELLOW)⚠️  N'oubliez pas de configurer vos variables Supabase dans .env$(NC)"; \
	else \
		echo "$(YELLOW)ℹ️  Le fichier .env existe déjà$(NC)"; \
	fi

check: ## Vérifier la configuration Docker
	@echo "$(CYAN)🔍 Vérification de la configuration Docker...$(NC)"
	@echo ""
	@echo "$(YELLOW)Version Docker:$(NC)"
	@docker --version
	@echo ""
	@echo "$(YELLOW)Version Docker Compose:$(NC)"
	@docker compose version
	@echo ""
	@echo "$(YELLOW)Fichier .env:$(NC)"
	@if [ -f .env ]; then \
		echo "$(GREEN)✅ Présent$(NC)"; \
	else \
		echo "$(RED)❌ Manquant - Exécutez 'make setup'$(NC)"; \
	fi

install: setup ## Alias pour setup
	@echo "$(GREEN)✅ Configuration initiale terminée$(NC)"

.DEFAULT_GOAL := help
