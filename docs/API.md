# Documentation API Lynara Campaign

## Vue d'ensemble

L'API Lynara Campaign est composée de 3 services FastAPI :

| Service | Base URL | Documentation Swagger |
|---------|----------|------------------------|
| API Gateway | http://localhost:3001 | /docs |
| Core Service | http://localhost:8001 | /docs |
| AI Orchestration | http://localhost:8000 | /docs |

---

## API Gateway (port 3001)

Point d'entrée principal. Le frontend appelle ce service en priorité.

### Endpoints

| Méthode | Path | Description |
|---------|------|-------------|
| GET | / | Informations du service |
| GET | /health | Health check |
| GET | /leads | Liste des leads |

### Exemples

```bash
# Health check
curl http://localhost:3001/health

# Liste des leads
curl http://localhost:3001/leads
```

---

## Core Service (port 8001)

Authentification, OCR, logique métier.

### Auth

| Méthode | Path | Description |
|---------|------|-------------|
| POST | /auth/login | Connexion |
| POST | /auth/register | Inscription |
| GET | /auth/me | Utilisateur courant |

### OCR

| Méthode | Path | Description |
|---------|------|-------------|
| POST | /ocr/extract | Extraction de texte depuis une image |

### Exemples

```bash
# Login
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"secret"}'

# OCR (fichier image)
curl -X POST http://localhost:8001/ocr/extract \
  -F "file=@image.png"
```

---

## AI Orchestration (port 8000)

Agents IA, campagnes, webhooks.

### Endpoints

| Méthode | Path | Description |
|---------|------|-------------|
| GET | / | Informations du service |
| GET | /health | Health check |
| GET | /campaigns | Liste des campagnes |

### Exemples

```bash
# Health check
curl http://localhost:8000/health

# Liste des campagnes
curl http://localhost:8000/campaigns
```

---

## Format des réponses

### Succès

```json
{
  "data": [...],
  "message": "Description optionnelle"
}
```

### Erreur

```json
{
  "detail": "Message d'erreur"
}
```

---

## CORS

Les APIs autorisent les requêtes depuis :
- http://localhost:3000
- http://127.0.0.1:3000

---

## Documentation interactive

Chaque service expose une documentation Swagger UI :

- **API Gateway** : http://localhost:3001/docs
- **Core Service** : http://localhost:8001/docs
- **AI Orchestration** : http://localhost:8000/docs

ReDoc est également disponible sur `/redoc` pour chaque service.
