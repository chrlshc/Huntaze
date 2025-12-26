# 🚀 OnlyFans Scraper Extension

## Résumé

Le browser worker Playwright a été étendu avec 3 nouvelles actions de scraping utilisant la technique du **JSON Sniffing** (interception des réponses API au lieu de parser le HTML).

## Nouvelles Actions

| Action | Description | Budget Impact |
|--------|-------------|---------------|
| `scrape_financials` | Revenus, stats, earnings | ⭐ Très léger (1 page) |
| `scrape_fans` | Liste des abonnés + dépenses | ⚠️ Moyen (scroll limité) |
| `scrape_content` | Stats des posts (likes, tips) | ⚠️ Moyen (scroll limité) |

## Fichiers Créés

### Scrapers (Browser Worker)
```
infra/fargate/browser-worker/src/scrapers/
├── index.ts           # Export des modules
├── financials.ts      # Scrape revenus/stats
├── fans.ts            # Scrape liste fans
└── content-stats.ts   # Scrape stats posts
```

### API Routes (Next.js)
```
app/api/of/scrape/
├── financials/route.ts  # POST /api/of/scrape/financials
├── fans/route.ts        # POST /api/of/scrape/fans
└── content/route.ts     # POST /api/of/scrape/content
```

## Comment ça Marche

### 1. JSON Sniffing
Au lieu de parser le DOM (fragile), on intercepte les réponses JSON de l'API OnlyFans:
- `/api2/v2/payouts/stats` → Revenus
- `/api2/v2/users/me/stats` → Stats profil
- `/api2/v2/subscriptions/subscribers` → Liste fans

### 2. Blocage Médias (Budget $23!)
```typescript
await page.route('**/*', (route) => {
  const type = route.request().resourceType();
  if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
    return route.abort();
  }
  return route.continue();
});
```

### 3. Scroll Contrôlé
Pour les fans et content, on limite le scroll pour éviter d'exploser le budget:
- Fans: max 100 par défaut (configurable via `SCRAPE_FANS_LIMIT`)
- Content: max 50 par défaut (configurable via `SCRAPE_CONTENT_LIMIT`)

## Tables DynamoDB

### `HuntazeOfAnalytics` (PK: userId, SK: date)
```json
{
  "userId": "u_123",
  "date": "2025-12-23",
  "type": "financials",
  "data": "{...json...}",
  "updatedAt": "2025-12-23T10:00:00Z"
}
```

### `HuntazeOfFans` (PK: creatorId, SK: fanId)
```json
{
  "creatorId": "u_123",
  "fanId": "f_456",
  "username": "FanDu83",
  "totalSpent": 150.00,
  "tipsSum": 25.00,
  "status": "active",
  "updatedAt": "2025-12-23T10:00:00Z"
}
```

## Variables d'Environnement

```bash
# Tables DynamoDB (optionnel - defaults fournis)
OF_DDB_ANALYTICS_TABLE=HuntazeOfAnalytics
OF_DDB_FANS_TABLE=HuntazeOfFans

# Limites de scraping (budget)
SCRAPE_FANS_LIMIT=100
SCRAPE_CONTENT_LIMIT=50
```

## Utilisation API

### Scrape Financials (Priorité 1)
```bash
curl -X POST https://ton-app.vercel.app/api/of/scrape/financials \
  -H "Authorization: Bearer <token>"
```

### Scrape Fans (Priorité 2)
```bash
curl -X POST https://ton-app.vercel.app/api/of/scrape/fans \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"maxCount": 50, "type": "active"}'
```

### Scrape Content (Priorité 3)
```bash
curl -X POST https://ton-app.vercel.app/api/of/scrape/content \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"maxCount": 30}'
```

## Recommandations Budget $23/mois

1. **`scrape_financials`** - 1x/jour (très léger)
2. **`scrape_fans`** - 1x/semaine (limité à 50-100 fans)
3. **`scrape_content`** - Optionnel pour beta

## Métriques CloudWatch

- `ScrapeFinancialsSuccess` / `ScrapeFinancialsCount`
- `ScrapeFansSuccess` / `ScrapeFansCount`
- `ScrapeContentSuccess` / `ScrapeContentCount`

## Prochaines Étapes

1. Créer les tables DynamoDB `HuntazeOfAnalytics` et `HuntazeOfFans`
2. Rebuild et push l'image Docker du browser worker
3. Tester avec un compte OF connecté
4. Connecter le dashboard React aux nouvelles données

---

**La Ferrari a maintenant son GPS! 🏎️💰**
