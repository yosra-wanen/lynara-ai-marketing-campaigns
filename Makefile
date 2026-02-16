# Lynara Campaign - Plateforme de campagnes marketing multicanales
# Makefile pour le développement et le déploiement

.PHONY: help install install-frontend install-backend dev redis build up down logs clean

# Default target
help:
	@echo "Lynara Campaign - Commandes disponibles:"
	@echo "  make install         - Installer toutes les dépendances (front + back)"
	@echo "  make install-frontend - Installer uniquement le frontend"
	@echo "  make install-backend  - Installer uniquement le backend"
	@echo "  make redis          - Lancer Redis (Docker)"
	@echo "  make dev         - Lancer en mode développement (front + back)"
	@echo "  make dev-front   - Lancer le frontend Next.js"
	@echo "  make dev-api     - Lancer l'API Gateway FastAPI"
	@echo "  make dev-ai      - Lancer le service AI FastAPI"
	@echo "  make dev-core    - Lancer le Core Service (Auth, OCR)"
	@echo "  make dev-celery  - Lancer Celery worker"
	@echo "  make build       - Build Docker"
	@echo "  make up          - Démarrer les services Docker"
	@echo "  make down        - Arrêter les services Docker"
	@echo "  make logs        - Voir les logs Docker"
	@echo "  make clean       - Nettoyer les build artifacts"

# Installation des dépendances
install: install-deps

install-deps:
	@echo ">>> Installation des dépendances (front + backend)..."
	$(MAKE) install-frontend
	$(MAKE) install-backend
	@echo ">>> Installation terminée."

install-frontend:
	@echo ">>> Installation des dépendances frontend..."
	cd frontend && npm install
	@echo ">>> Frontend installé."

install-backend:
	@echo ">>> Installation des dépendances backend..."
	cd backend/api-gateway && pip install -r requirements.txt
	cd backend/ai-orchestration && pip install -r requirements.txt
	cd backend/core-service && pip install -r requirements.txt
	@echo ">>> Backend installé."

# Développement
dev-front:
	@echo ">>> Démarrage du frontend (Next.js)..."
	cd frontend && npm run dev

dev-api:
	@echo ">>> Démarrage de l'API Gateway (FastAPI)..."
	cd backend/api-gateway && python run.py

dev-ai:
	@echo ">>> Démarrage du service AI (FastAPI)..."
	cd backend/ai-orchestration && python run.py

dev-core:
	@echo ">>> Démarrage du Core Service (Auth, OCR)..."
	cd backend/core-service && python run.py

dev-celery:
	@echo ">>> Démarrage du Celery worker..."
	cd backend/ai-orchestration && celery -A app.worker worker -l info

dev: install-deps
	@echo ">>> Lancez en parallèle dans des terminaux séparés:"
	@echo "  Terminal 1: make dev-front"
	@echo "  Terminal 2: make dev-api"
	@echo "  Terminal 3: make dev-ai"
	@echo "  Terminal 4: make dev-core"
	@echo "  (Optionnel) Terminal 5: make dev-celery"

# Build
build:
	@echo ">>> Build des services..."
	docker compose build

# Redis (requis pour Celery)
redis:
	@echo ">>> Démarrage de Redis..."
	docker run -d -p 6379:6379 --name lynara-redis redis:7-alpine 2>/dev/null || docker start lynara-redis

# Docker
up:
	@echo ">>> Démarrage des services Docker..."
	docker compose up -d

down:
	@echo ">>> Arrêt des services Docker..."
	docker compose down

logs:
	docker compose logs -f

# Nettoyage
clean:
	@echo ">>> Nettoyage..."
	rm -rf frontend/.next frontend/node_modules
	rm -rf backend/api-gateway/__pycache__ backend/api-gateway/app/__pycache__
	rm -rf backend/ai-orchestration/__pycache__ backend/ai-orchestration/app/__pycache__
	rm -rf backend/core-service/__pycache__ backend/core-service/app/__pycache__
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	@echo ">>> Nettoyage terminé."
