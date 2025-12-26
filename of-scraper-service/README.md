# OF Scraper Worker

Microservice isolé pour le scraping OnlyFans via Playwright + Stealth.

## Architecture

```
┌─────────────────┐     POST /scrape      ┌──────────────────────┐
│  App Next.js    │ ──────────────────▶   │  OF Scraper Worker   │
│  (Vercel)       │                       │  (AWS App Runner)    │
└─────────────────┘                       └──────────────────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────────┐
                                          │  OnlyFans API        │
                                          │  (via Playwright)    │
                                          └──────────────────────┘
```

## Démarrage local

```bash
npm install
npm start
```

Le serveur démarre sur `http://localhost:8080`

## Test local

```bash
curl -X POST http://localhost:8080/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "cookies": "sess=xxx; auth_id=xxx",
    "endpoint": "/api2/v2/users/me"
  }'
```

## Déploiement AWS

### Prérequis
- AWS CLI configuré
- Docker installé et démarré

### Déployer

```bash
./deploy-to-aws.sh
```

Cela va :
1. Créer un repo ECR `of-scraper-worker`
2. Build l'image Docker
3. Push vers ECR

Ensuite, créer le service App Runner manuellement :
1. AWS Console → App Runner → Create Service
2. Source: Amazon ECR
3. Image: `[ACCOUNT_ID].dkr.ecr.us-east-1.amazonaws.com/of-scraper-worker:latest`
4. Config: 1 vCPU, 2 GB RAM, Port 8080

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `PORT` | Port du serveur (défaut: 8080) |

## Endpoints

### `GET /health`
Health check pour AWS App Runner.

### `POST /scrape`
Exécute un scrape OnlyFans.

**Body:**
```json
{
  "cookies": "sess=xxx; auth_id=xxx",
  "userAgent": "Mozilla/5.0...",
  "endpoint": "/api2/v2/users/me",
  "proxyUrl": "http://proxy:port"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

## Coûts estimés (AWS App Runner)

- ~$5-15/mois pour usage léger (50 users beta)
- Facturation au temps d'exécution
- Auto-scale inclus
