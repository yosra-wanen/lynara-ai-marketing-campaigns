# AI Orchestration Microservice

Microservice FastAPI dédié à l'orchestration des agents IA pour la collecte, l'analyse et la qualification de leads B2B.

---

## Description

Ce microservice gère le pipeline complet de recherche de leads IA :

SerpAPI (recherche web) -> Firecrawl (extraction contenu) -> Claude AI (analyse & scoring) -> CRM (import)

---

## Structure du projet
ai-orchestration/
├── app/
│   ├── api/
│   │   ├── lead_research.py     # Endpoints principaux
│   │   ├── campaigns.py         # Endpoints campagnes
│   │   └── health.py            # Health check
│   ├── config/
│   │   └── settings.py          # Configuration & variables d'environnement
│   ├── prompts/
│   │   └── lead_research.py     # Prompts système et extraction
│   ├── services/
│   │   ├── ai_client.py         # Client OpenRouter/LLM
│   │   ├── serpapi_service.py   # Recherche web SerpAPI
│   │   ├── firecrawl_service.py # Extraction contenu pages
│   │   ├── rate_limiter.py      # Rate limiting par company
│   │   └── metrics.py           # Métriques et observabilité
│   └── main.py                  # Point d'entrée FastAPI
├── tests/
│   ├── test_config.py           # Tests module config
│   ├── test_serpapi.py          # Tests service SerpAPI
│   ├── test_firecrawl.py        # Tests service Firecrawl
│   ├── test_pipeline.py         # Tests orchestrateur & pipeline
│   └── test_integration.py      # Tests d'intégration
├── .env.example                 # Variables d'environnement exemple
├── requirements.txt             # Dépendances Python
├── run.py                       # Lancement du service
└── README.md                    # Ce fichier

---

## Configuration

Copier `.env.example` vers `.env` et renseigner les variables :
```bash
cp .env.example .env
```

### Variables requises

| Variable | Description |
|----------|-------------|
| AI_API_KEY | Clé API OpenRouter |
| AI_MODEL | Modèle LLM (ex: anthropic/claude-3-haiku) |
| AI_BASE_URL | URL base OpenRouter |
| SERPAPI_KEY | Clé API SerpAPI |
| FIRECRAWL_KEY | Clé API Firecrawl |
| SUPABASE_URL | URL Supabase |
| SUPABASE_SERVICE_KEY | Clé service Supabase |
| CRM_SERVICE_URL | URL API Gateway (défaut: http://localhost:3001) |

### Variables optionnelles

| Variable | Défaut | Description |
|----------|--------|-------------|
| SERPAPI_RATE_LIMIT | 10 | Max appels SerpAPI/minute/company |
| FIRECRAWL_RATE_LIMIT | 5 | Max appels Firecrawl/minute/company |
| AI_RATE_LIMIT | 20 | Max appels AI/minute/company |
| MAX_LEADS_PER_JOB | 50 | Max leads par job |
| ENABLE_METRICS | true | Activer les métriques |
| LOG_LEVEL | INFO | Niveau de logs |

---

## Lancement
```bash
# Installer les dépendances
pip install -r requirements.txt

# Lancer le service
python run.py
```

Le service est disponible sur http://localhost:8000

Documentation Swagger : http://localhost:8000/docs

---

## Endpoints principaux

### Pipeline Lead Research

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | /ai-orchestration/jobs | Lancer une recherche IA |
| GET | /ai-orchestration/jobs/{id} | Statut d'un job |
| POST | /ai-orchestration/jobs/{id}/import | Importer les leads dans le CRM |

### Gouvernance

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /ai-orchestration/quotas | Quotas par entreprise |
| GET | /ai-orchestration/metrics | Métriques et observabilité |
| GET | /ai-orchestration/access | Vérifier l'accès utilisateur |
| GET | /ai-orchestration/target-params | Paramètres cible par défaut |
| POST | /ai-orchestration/target-params | Sauvegarder paramètres cible |

### Historique et Templates

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | /ai-orchestration/history | Historique des recherches |
| GET | /ai-orchestration/templates | Templates sauvegardés |
| POST | /ai-orchestration/templates | Créer un template |
| DELETE | /ai-orchestration/templates/{id} | Supprimer un template |

---

## Pipeline de traitement

Réception de la requête (keywords, location, industry, volume)
Génération de requêtes de recherche variées (max 3)
Recherche web via SerpAPI
Extraction contenu pages via Firecrawl (top 3 URLs)
Analyse et scoring via Claude AI (pertinence, maturité, potentiel)
Normalisation et classification (chaud/moyen/froid)
Sauvegarde base de données et mise à jour quotas
Retour des leads qualifiés


---

## Sécurité et Gouvernance

- Rate limiting par entreprise et par service (SerpAPI, Firecrawl, AI)
- Quotas par entreprise (searches, leads, API calls)
- Contrôle d'accès par rôle (owner uniquement)
- Clés API masquées dans les logs
- Validation des inputs via Pydantic

---

## Tests
```bash
# Lancer tous les tests
python -m pytest tests/ -v
```

40 tests couvrant :
- Module config (12 tests)
- Service SerpAPI (5 tests)
- Service Firecrawl (4 tests)
- Pipeline, Rate limiter et Metrics (13 tests)
- Tests d'intégration (6 tests)

---

## Dépendances principales

| Package | Usage |
|---------|-------|
| fastapi | Framework API |
| httpx | Client HTTP async |
| supabase | Client Supabase |
| pydantic | Validation des données |
| python-dotenv | Gestion des variables d'environnement |
| pytest | Tests unitaires |
| pytest-asyncio | Tests async |