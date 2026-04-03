# Lynara Campaign

**Plateforme de campagnes marketing multicanales pilotée par des agents IA**

*Module intégré à la plateforme Lynara (INRA/Lynara/Navin)*

Email • WhatsApp • Instagram • Facebook • TikTok

---

## 📋 Description

Lynara Campaign est le module de marketing automation multicanal de la plateforme Lynara. Il permet de :

1. **Collecter et créer des leads** depuis plusieurs sources web
2. **Enrichir automatiquement** les leads (emails, téléphones)
3. **Générer des contenus adaptés** par canal (texte, visuels)
4. **Exécuter et planifier des campagnes** (emailing, WhatsApp, réseaux sociaux)
5. **Piloter les interactions** via une architecture d'agents IA

---

## 🏗️ Architecture Fonctionnelle & UI

L'application est structurée autour de deux espaces principaux et d'une gestion multi-entreprises :

### 1. Gestion Multi-Entreprises
*   Un utilisateur peut créer et gérer **plusieurs entreprises**.
*   Le **Profil Utilisateur** (`/profile`) est situé **en dehors du Dashboard** pour gérer les paramètres personnels et la sélection de l'entreprise.

### 2. Dashboard Modulaire
Le Dashboard est divisé en **deux sections (modules)** distinctes, accessibles via un commutateur dans la **Navbar** :

*   **🎨 Section CRM**
    *   **Fonctionnalités** : Dashboard, Clients, Contacts, Propositions, Contrats, Planning, Formulaires.
    *   **Objectif** : Gestion de la relation client et des ventes.

*   **🛍️ Section Catalogue**
    *   **Fonctionnalités** : Dashboard, Services (Produits), Comptabilité, Rapports, Automatisations, Paramètres.
    *   **Objectif** : Gestion de l'offre, des produits et de l'administratif.

La **Sidebar** est contextuelle et change dynamiquement selon la section active.

### 3. Design System
*   Style minimaliste, fond blanc, texte sombre.
*   Constantes partagées (typo, formes, espacements) dans `frontend/src/lib/design-system/`.

---

## 🏗️ Architecture Technique

### Schéma global

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                        │
│  Next.js 15 (port 3000) - UI campagnes, CRM, dashboards                     │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (port 3001)                           │
│  FastAPI - Point d'entrée unique, routage, CRM, leads                       │
└─────┬───────────────────────────────┬───────────────────────────────┬─────┘
      │                               │                               │
      ▼                               ▼                               ▼
┌──────────────┐              ┌─────────────────┐              ┌──────────────┐
│ CORE SERVICE │              │ AI ORCHESTRATION│              │   SUPABASE   │
│ (port 8001)  │              │   (port 8000)   │              │ (PostgreSQL) │
│ Auth, OCR    │              │ Agents IA       │              │   + Redis    │
└──────────────┘              │ Celery workers  │              └──────────────┘
                              └─────────────────┘
```

### Structure du projet

```
lynara-campaign/
├── frontend/                    # Microservice Front
│   ├── src/
│   │   ├── app/                 # Pages Next.js (App Router)
│   │   │   ├── (auth)/          # Pages d'authentification
│   │   │   ├── (dashboard)/     # Espace de travail (Layout principal)
│   │   │   │   ├── clients/
│   │   │   │   ├── services/
│   │   │   │   └── ...
│   │   │   ├── profile/         # Espace Profil (Hors Dashboard)
│   │   │   └── page.tsx         # Landing Page
│   │   ├── components/          # Composants réutilisables
│   │   │   ├── layout/          # Sidebar, Header, MainLayout
│   │   │   └── ui/              # Boutons, Cards, Inputs, etc.
│   │   ├── providers/           # Contextes (Theme, I18n, Section)
│   │   └── lib/
│   │       └── design-system/   # Constantes (typo, formes, espacements)
│   └── package.json
│
├── backend/                     # Microservices Back (FastAPI)
...
```

### Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 15, TypeScript, Node.js 20+ |
| Backend | Python 3.11+, FastAPI |
| Base de données | Supabase (PostgreSQL + RLS) |
| Cache | Redis |
| Tâches asynchrones | Celery, Celery Beat |

---

## 🚀 Installation

### Prérequis

| Outil | Version |
|-------|---------|
| Node.js | 20+ |
| Python | 3.11+ |
| npm | 10+ |
| pip | 23+ |
| Docker | (optionnel, pour Redis et déploiement) |

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-username/lynara-campaign.git
cd lynara-campaign
```

### 2. Installer les dépendances

**Option A : Tout installer (frontend + backend)**

```bash
make install
```

**Option B : Frontend uniquement**

```bash
make install-frontend
```

Ou manuellement :
```bash
cd frontend && npm install
```

**Option C : Backend uniquement**

```bash
make install-backend
```

Ou manuellement :
```bash
cd backend/api-gateway && pip install -r requirements.txt
cd backend/ai-orchestration && pip install -r requirements.txt
cd backend/core-service && pip install -r requirements.txt
```

---

## 🚀 Lancer les microservices

Chaque microservice peut être lancé **séparément**. En développement, on utilise en général le frontend dans un terminal et le backend dans un ou plusieurs autres.

### Frontend

```bash
cd frontend && npm run dev
```

Ou depuis la racine : `make dev-front`

Le frontend est disponible sur **http://localhost:3000**.

### Backend

**Lancer tous les microservices backend** (API Gateway, Core Service, AI Orchestration) dans un seul terminal :

```bash
make start
```

**Lancer un seul microservice** (un terminal par service) :

| Commande | Service | Port |
|----------|---------|------|
| `make dev-api` | API Gateway | 3001 |
| `make dev-core` | Core Service | 8001 |
| `make dev-ai` | AI Orchestration | 8000 |

L’API Gateway (3001) est le point d’entrée utilisé par le frontend ; Core et AI sont appelés par l’API Gateway.

### Redis (pour Celery / AI)

Requis si vous utilisez les tâches asynchrones (Celery).

```bash
make redis
```

Ou Docker : `docker run -d -p 6379:6379 --name lynara-redis redis:7-alpine`

Vérifier : `redis-cli ping` → `PONG`

### Celery (optionnel)

```bash
make dev-celery
```

### Docker Compose (tous les services)

```bash
make up
```

Arrêter : `make down`

---

## 📍 URLs des services

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Gateway | http://localhost:3001 |
| Docs API Gateway | http://localhost:3001/docs |
| AI Orchestration | http://localhost:8000 |
| Docs AI | http://localhost:8000/docs |
| Core Service | http://localhost:8001 |
| Docs Core | http://localhost:8001/docs |

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture détaillée, flux de données |
| [docs/SETUP.md](docs/SETUP.md) | Guide d'installation et configuration |
| [docs/API.md](docs/API.md) | Documentation des endpoints API |

---

## 📦 Design System

Constantes partagées dans `frontend/src/lib/design-system/` (typo, formes, espacements, breakpoints). Import : `import { typography, borderRadius } from '@/lib/design-system';`

---

## 🔧 Configuration

Copier les fichiers `.env.example` dans chaque service et renseigner les variables :

```bash
cp frontend/.env.example frontend/.env
cp backend/api-gateway/.env.example backend/api-gateway/.env
cp backend/core-service/.env.example backend/core-service/.env
cp backend/ai-orchestration/.env.example backend/ai-orchestration/.env
```

Voir [docs/SETUP.md](docs/SETUP.md) pour les détails des variables.

---

## 📄 Licence

MIT - Projet PFE Lynara Campaign


