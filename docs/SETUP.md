# Guide d'installation et configuration

## Prérequis

| Outil | Version minimale |
|-------|------------------|
| Node.js | 20+ (recommandé : 24) |
| Python | 3.11+ |
| npm | 10+ |
| pip | 23+ |
| Docker | 24+ (optionnel) |
| Docker Compose | 2+ (optionnel) |

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/lynara-campaign.git
cd lynara-campaign
```

### 2. Installer les dépendances

```bash
make install
```

Cette commande installe :
- **Frontend** : `npm install` dans `frontend/`
- **API Gateway** : `pip install -r requirements.txt` dans `backend/api-gateway/`
- **Core Service** : `pip install -r requirements.txt` dans `backend/core-service/`
- **AI Orchestration** : `pip install -r requirements.txt` dans `backend/ai-orchestration/`

### 3. Installation manuelle (si besoin)

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend/api-gateway && pip install -r requirements.txt
cd backend/core-service && pip install -r requirements.txt
cd backend/ai-orchestration && pip install -r requirements.txt
```

---

## Configuration des variables d'environnement

### Frontend

Créer `frontend/.env` :

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8000
NEXT_PUBLIC_CORE_SERVICE_URL=http://localhost:8001
```

### API Gateway

Créer `backend/api-gateway/.env` :

```env
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lynara_campaign
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
CORE_SERVICE_URL=http://localhost:8001
```

### Core Service

Créer `backend/core-service/.env` :

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lynara_campaign
```

### AI Orchestration

Créer `backend/ai-orchestration/.env` :

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/lynara_campaign
REDIS_URL=redis://localhost:6379
CELERY_BROKER_URL=redis://localhost:6379/0
```

---

## Lancer Redis (requis pour Celery)

### Option A : Docker

```bash
docker run -d -p 6379:6379 --name lynara-redis redis:7-alpine
```

### Option B : Installation locale

- **macOS** : `brew install redis && brew services start redis`
- **Ubuntu** : `sudo apt install redis-server && sudo systemctl start redis`

---

## Lancer PostgreSQL (développement local)

### Option A : Docker

```bash
docker run -d -p 5432:5432 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=lynara_campaign \
  --name lynara-postgres \
  postgres:15-alpine
```

### Option B : Supabase

Utiliser l'URL de connexion fournie par Supabase dans `DATABASE_URL`.

---

## Démarrage en développement

### Terminaux séparés

```bash
# Terminal 1 - Frontend
make dev-front

# Terminal 2 - API Gateway
make dev-api

# Terminal 3 - AI Orchestration
make dev-ai

# Terminal 4 - Core Service
make dev-core

# Terminal 5 (optionnel) - Celery Worker
make dev-celery
```

### Docker Compose (tous les services)

```bash
make up
```

---

## Vérification

| Service | URL | Vérification |
|---------|-----|---------------|
| Frontend | http://localhost:3000 | Page d'accueil |
| API Gateway | http://localhost:3001/docs | Swagger UI |
| API Gateway Health | http://localhost:3001/health | `{"status":"ok"}` |
| Core Service | http://localhost:8001/docs | Swagger UI |
| AI Orchestration | http://localhost:8000/docs | Swagger UI |

---

## Dépannage

### Port déjà utilisé

Modifier le port dans le fichier `.env` du service concerné ou dans `run.py`.

### Redis non accessible

Vérifier que Redis tourne : `redis-cli ping` doit retourner `PONG`.

### Erreur de connexion PostgreSQL

Vérifier `DATABASE_URL` et que PostgreSQL/Supabase est accessible.

### Celery ne démarre pas

Vérifier `CELERY_BROKER_URL` et que Redis est démarré.
