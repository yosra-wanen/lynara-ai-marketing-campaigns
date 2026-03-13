# Architecture Lynara Campaign

## Vue d'ensemble

Lynara Campaign est une plateforme de marketing automation multicanal basée sur une architecture microservices. Tous les services backend sont en **Python/FastAPI**.

---

## Schéma d'architecture

```
                                    ┌─────────────────┐
                                    │    Utilisateur   │
                                    └────────┬────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 15)                                │
│                         Port 3000                                           │
│  • UI campagnes, CRM, dashboards                                             │
│  • Design System (constantes réutilisables)                                  │
└─────────────────────────────────────┬──────────────────────────────────────┘
                                      │ HTTP/REST
                                      ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (FastAPI)                                  │
│                      Port 3001                                             │
│  • Point d'entrée unique                                                    │
│  • Routage vers core-service et ai-orchestration                            │
│  • Gestion leads, CRM                                                       │
└──────┬────────────────────────────────────────────┬────────────────────────┘
       │                                             │
       │ Proxy Auth, OCR                             │ Proxy Campagnes, IA
       ▼                                             ▼
┌──────────────────────┐                   ┌──────────────────────────────────┐
│   CORE SERVICE       │                   │     AI ORCHESTRATION              │
│   Port 8001          │                   │     Port 8000                     │
│  • Auth (Supabase)   │                   │  • Agents IA                      │
│  • OCR (Tesseract)   │                   │  • Génération contenu            │
│  • Logique métier    │                   │  • Webhooks canaux                │
└──────────┬───────────┘                   │  • Celery workers                │
           │                               │  • Celery Beat (planification)    │
           │                               └────────────┬─────────────────────┘
           │                                            │
           ▼                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INFRASTRUCTURE                                       │
│  • Supabase (PostgreSQL + Auth + RLS)                                        │
│  • Redis (cache, sessions, broker Celery)                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Microservices

### 1. Frontend

| Attribut | Valeur |
|----------|--------|
| Technologie | Next.js 15, TypeScript |
| Port | 3000 |
| Rôle | Interface utilisateur, dashboards, gestion campagnes |

**Structure :**
- `src/app/` — App Router, pages
- `src/components/` — Composants UI
- `src/lib/design-system/` — Constantes (couleurs, typo, formes)

---

### 2. API Gateway

| Attribut | Valeur |
|----------|--------|
| Technologie | FastAPI (Python) |
| Port | 3001 |
| Rôle | Point d'entrée unique, routage, BFF |

**Endpoints principaux :**
- `GET /` — Root
- `GET /health` — Health check
- `GET /leads` — Liste des leads (à connecter Supabase)

**Variables d'environnement :**
- `AI_SERVICE_URL` — URL du service AI
- `CORE_SERVICE_URL` — URL du core service
- `DATABASE_URL`, `REDIS_URL`

---

### 3. Core Service

| Attribut | Valeur |
|----------|--------|
| Technologie | FastAPI (Python) |
| Port | 8001 |
| Rôle | Authentification, OCR, logique métier |

**Endpoints :**
- `POST /auth/login` — Connexion
- `POST /auth/register` — Inscription
- `GET /auth/me` — Utilisateur courant
- `POST /ocr/extract` — Extraction texte (image)

**Dépendances :** Supabase, pytesseract, Pillow

---

### 4. AI Orchestration

| Attribut | Valeur |
|----------|--------|
| Technologie | FastAPI (Python), Celery |
| Port | 8000 |
| Rôle | Agents IA, campagnes, webhooks |

**Endpoints :**
- `GET /` — Root
- `GET /health` — Health check
- `GET /campaigns` — Liste campagnes

**Celery :**
- Worker : tâches asynchrones
- Beat : planification des campagnes

---

## Flux de données

### Requête typique (exemple : création de campagne)

1. **Frontend** → `POST /campaigns` → **API Gateway**
2. **API Gateway** → proxy → **AI Orchestration**
3. **AI Orchestration** → Celery task → traitement asynchrone
4. **AI Orchestration** → Supabase → persistance
5. Réponse remontée au Frontend

### Authentification

1. **Frontend** → `POST /auth/login` → **API Gateway** (ou direct Core Service)
2. **Core Service** → Supabase Auth → JWT
3. JWT retourné au Frontend pour les requêtes suivantes

---

## Base de données (Supabase)

Modèle minimal (cahier des charges) :

- **entities** : products, properties, media_assets
- **crm** : leads, lead_enrichment, lead_scores, segments
- **campaigns** : campaigns, campaign_steps, channel_messages, schedules
- **conversations** : inbox_messages, social_interactions
- **analytics** : events, social_metrics, roi_reports
- **governance** : api_keys_by_tenant, model_usage, audit_logs

---

## Déploiement Docker

Les services sont définis dans `docker-compose.yml` :

| Service | Image | Port |
|---------|-------|------|
| postgres | postgres:15-alpine | 5432 |
| redis | redis:7-alpine | 6379 |
| api-gateway | build ./backend/api-gateway | 3001 |
| core-service | build ./backend/core-service | 8001 |
| ai-orchestration | build ./backend/ai-orchestration | 8000 |
| celery-worker | build ./backend/ai-orchestration | - |
| celery-beat | build ./backend/ai-orchestration | - |
