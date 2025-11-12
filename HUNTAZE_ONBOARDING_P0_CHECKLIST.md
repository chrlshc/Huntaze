# 🚨 Huntaze Onboarding - Checklist P0 (Avant Trafic Externe)

## ⚠️ BLOQUANTS PRODUCTION

Ces éléments **DOIVENT** être complétés avant d'exposer le système à du trafic externe réel.

---

## 1. Tests Automatisés Minimaux ❌

### 1.1 Unit Tests (80% coverage requis)
**Status**: ❌ À faire

```bash
# Tests à créer
tests/unit/onboarding/
├── progress-calculation.test.ts     # Calcul de progression
├── gating-logic.test.ts             # Logique de gating
├── step-transitions.test.ts         # Transitions d'état
├── repositories/
│   ├── step-definitions.test.ts
│   ├── user-onboarding.test.ts
│   └── events.test.ts
└── middleware/
    └── onboarding-gating.test.ts    # 409 responses
```

**Seuils requis:**
- 80% lignes couvertes
- 80% branches couvertes
- Tests en CI (fail fast)

**Commande:**
```bash
npm test -- --coverage --coverageThreshold='{"global":{"lines":80,"branches":80}}'
```

---

### 1.2 Integration Tests
**Status**: ⚠️ Partiels (onboarding.test.ts existe)

```bash
# Tests à compléter
tests/integration/api/onboarding/
├── get-onboarding.test.ts           # GET /api/onboarding
├── patch-step.test.ts               # PATCH /steps/:id
├── snooze.test.ts                   # POST /snooze
├── gating-409.test.ts               # 409 sur store/publish
└── flows/
    ├── skip-flow.test.ts            # Skip → progress update
    ├── done-flow.test.ts            # Done → progress update
    └── snooze-flow.test.ts          # Snooze → hide nudge
```

**Scénarios critiques:**
- ✅ GET retourne les bonnes étapes
- ❌ PATCH met à jour le statut
- ❌ Skip met à jour la progression
- ❌ 409 sur store/publish sans payments
- ❌ Snooze cache le nudge

---

### 1.3 E2E Tests (Playwright)
**Status**: ❌ À faire

```bash
# Tests E2E critiques
tests/e2e/onboarding/
├── new-user-flow.spec.ts            # Nouveau compte → dashboard
├── skip-flow.spec.ts                # Skip étape → vérif UI
├── gating-flow.spec.ts              # Publish → modal → complete
└── mobile-flow.spec.ts              # Responsive mobile
```

**Scénarios P0:**
1. Nouveau compte → voir guide sur dashboard
2. Cliquer "Passer" → progression mise à jour
3. Tenter publish → modal 409 → compléter paiements
4. Mobile: guide responsive + touch-friendly

**Commande:**
```bash
npx playwright test tests/e2e/onboarding --project=chromium
```

---

## 2. Feature Flag & Kill Switch ❌

### 2.1 Feature Flag
**Status**: ❌ À implémenter

```typescript
// lib/feature-flags.ts
export interface OnboardingFlags {
  enabled: boolean;
  rolloutPercentage: number;  // 0-100
  markets: string[];          // ['FR', 'US'] ou ['*']
  userWhitelist: string[];    // User IDs
}

export async function isOnboardingEnabled(
  userId: string,
  market: string
): Promise<boolean> {
  const flags = await getFlags('onboarding.huntaze');
  
  if (!flags.enabled) return false;
  if (flags.userWhitelist.includes(userId)) return true;
  if (!flags.markets.includes('*') && !flags.markets.includes(market)) {
    return false;
  }
  
  // Consistent hashing pour rollout %
  const hash = hashUserId(userId);
  return (hash % 100) < flags.rolloutPercentage;
}
```

**Configuration:**
```bash
# .env ou remote config
ONBOARDING_ENABLED=true
ONBOARDING_ROLLOUT_PERCENTAGE=0  # Start at 0%
ONBOARDING_MARKETS=FR,US
```

**Rollout progressif:**
- 0% → Tests internes
- 5% → Early adopters
- 25% → Validation
- 50% → Monitoring
- 100% → Full rollout

---

### 2.2 Kill Switch
**Status**: ❌ À implémenter

```typescript
// lib/onboarding-kill-switch.ts
export async function checkKillSwitch(): Promise<boolean> {
  // Check remote config (Redis, DB, ou API)
  const isDisabled = await redis.get('onboarding:kill_switch');
  return isDisabled === 'true';
}

// Dans middleware et composants
if (await checkKillSwitch()) {
  // Désactiver gating
  // Cacher UI
  // Fallback vers legacy
  return legacyBehavior();
}
```

**Bouton d'urgence:**
```bash
# Désactiver immédiatement
redis-cli SET onboarding:kill_switch true

# Ou via API admin
curl -X POST https://staging.huntaze.com/api/admin/kill-switch \
  -d '{"feature":"onboarding","enabled":false}'
```

---

## 3. Sécurité Manquante ❌

### 3.1 Rate Limiting
**Status**: ❌ À implémenter

```typescript
// lib/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const onboardingRateLimit = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 20,                     // 20 requêtes/min
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'TOO_MANY_REQUESTS',
      message: 'Trop de requêtes. Réessayez dans 1 minute.',
      retryAfter: 60,
    });
  },
});

// Appliquer sur routes mutatives
app.patch('/api/onboarding/steps/:id', onboardingRateLimit, handler);
app.post('/api/onboarding/snooze', onboardingRateLimit, handler);
```

**Limites recommandées:**
- PATCH /steps/:id: 20/min par user
- POST /snooze: 3/jour par user
- Resend email: 5/heure par user

---

### 3.2 CSRF Protection
**Status**: ❌ À implémenter

```typescript
// Option 1: SameSite cookies (Next.js)
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        {
          key: 'Set-Cookie',
          value: 'SameSite=Lax; Secure; HttpOnly',
        },
      ],
    }];
  },
};

// Option 2: Double-submit token
// lib/middleware/csrf.ts
export function csrfProtection(req, res, next) {
  const token = req.headers['x-csrf-token'];
  const cookieToken = req.cookies['csrf-token'];
  
  if (token !== cookieToken) {
    return res.status(403).json({ error: 'CSRF_TOKEN_INVALID' });
  }
  
  next();
}
```

---

### 3.3 Security Headers
**Status**: ❌ À implémenter

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

module.exports = {
  async headers() {
    return [{
      source: '/:path*',
      headers: securityHeaders,
    }];
  },
};
```

---

### 3.4 Audit Rôles
**Status**: ⚠️ À vérifier

**Vérifications:**
- [ ] Staff ne peut pas voir les détails de paiements
- [ ] Staff ne peut pas modifier les étapes owner-only
- [ ] Logs d'audit pour actions sensibles
- [ ] Validation côté serveur des permissions

```typescript
// lib/middleware/check-permissions.ts
export function requireOwner(req, res, next) {
  if (req.user.role !== 'owner') {
    return res.status(403).json({
      error: 'FORBIDDEN',
      message: 'Cette action nécessite le rôle owner',
    });
  }
  next();
}

// Appliquer sur routes sensibles
app.patch('/api/onboarding/steps/payments', requireOwner, handler);
```

---

## 4. Observabilité Prête-Prod ❌

### 4.1 SLOs (Service Level Objectives)
**Status**: ❌ À définir et monitorer

```yaml
# SLOs requis
onboarding_api_latency:
  metric: p95_latency_ms
  target: < 300ms
  routes:
    - GET /api/onboarding
    - PATCH /api/onboarding/steps/:id

onboarding_error_rate:
  metric: error_rate_percent
  target: < 0.5%
  codes: [500, 502, 503, 504]

onboarding_availability:
  metric: uptime_percent
  target: > 99.9%
```

---

### 4.2 Dashboards
**Status**: ❌ À créer

**Métriques à afficher:**
```
Onboarding Health Dashboard
├── HTTP Status Codes (2xx/4xx/5xx)
├── Latencies (p50/p95/p99)
├── 409 Rate par route
├── Analytics drops (events non envoyés)
├── Redis cache hit rate
├── Database query time
└── Active users avec onboarding
```

**Outils:**
- Grafana + Prometheus
- Datadog
- New Relic
- CloudWatch (si AWS)

---

### 4.3 Alertes
**Status**: ❌ À configurer

```yaml
# Alertes critiques
alerts:
  - name: High 409 Rate
    condition: 409_rate > 10%
    duration: 10min
    severity: warning
    
  - name: High Error Rate
    condition: 5xx_rate > 1%
    duration: 5min
    severity: critical
    
  - name: High Latency
    condition: p95_latency > 500ms
    duration: 10min
    severity: warning
    
  - name: Analytics Drops
    condition: event_drop_rate > 5%
    duration: 15min
    severity: warning
```

---

### 4.4 Tracing
**Status**: ⚠️ Partial (correlationId existe)

**À compléter:**
```typescript
// Propager correlationId partout
// Request → Middleware → Repository → Database → Logs

// lib/tracing.ts
export function propagateCorrelationId(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  
  // Ajouter aux logs
  logger.child({ correlationId });
  
  next();
}

// Dans les queries DB
await db.query(sql, params, { correlationId: req.correlationId });
```

---

## 5. Backups & Rollback ❌

### 5.1 Backup Database
**Status**: ❌ À configurer

```bash
# Backup automatique avant migration
pg_dump $DATABASE_URL > backups/pre-onboarding-$(date +%Y%m%d).sql

# Backup continu (si pas déjà en place)
# - Point-in-time recovery
# - Snapshots quotidiens
# - Rétention 30 jours
```

---

### 5.2 Rollback Plan
**Status**: ❌ À créer

```sql
-- lib/db/migrations/2024-11-11-shopify-style-onboarding-down.sql
-- Script de rollback idempotent

BEGIN;

-- Drop tables (ordre inverse)
DROP TABLE IF EXISTS onboarding_events CASCADE;
DROP TABLE IF EXISTS user_onboarding CASCADE;
DROP TABLE IF EXISTS onboarding_step_definitions CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS calculate_onboarding_progress CASCADE;

COMMIT;
```

**Procédure de rollback:**
1. Désactiver kill switch
2. Restore backup DB
3. Redeploy version précédente
4. Vérifier logs
5. Communiquer aux users

---

### 5.3 Dry-Run Migration
**Status**: ❌ À faire

```bash
# Test sur staging avec dump anonymisé
pg_dump $PROD_DB | anonymize-pii > staging-dump.sql
psql $STAGING_DB < staging-dump.sql

# Run migration
psql $STAGING_DB < lib/db/migrations/2024-11-11-shopify-style-onboarding.sql

# Vérifier
psql $STAGING_DB -c "SELECT COUNT(*) FROM onboarding_step_definitions;"

# Seed
node scripts/seed-huntaze-onboarding.js

# Test queries
psql $STAGING_DB -c "SELECT * FROM onboarding_step_definitions LIMIT 5;"
```

---

## 6. Step Versioning (Migration Réelle) ⚠️

### 6.1 Alignement Status
**Status**: ⚠️ Incohérent

**Problème:**
- Design doc dit "Task 13: Step versioning ✅"
- Mais Task 15 dit "à faire"
- Migration v1→v2 pas implémentée

**À faire:**
```typescript
// lib/db/migrations/migrate-step-version.ts
export async function migrateStepVersion(
  stepId: string,
  fromVersion: number,
  toVersion: number
) {
  await db.transaction(async (trx) => {
    // 1. Créer nouvelle version
    await trx('onboarding_step_definitions').insert({
      id: stepId,
      version: toVersion,
      // ... nouveaux champs
    });
    
    // 2. Migrer user progress
    await trx.raw(`
      INSERT INTO user_onboarding (user_id, step_id, version, status, completed_at)
      SELECT user_id, step_id, ?, status, completed_at
      FROM user_onboarding
      WHERE step_id = ? AND version = ? AND status = 'done'
    `, [toVersion, stepId, fromVersion]);
    
    // 3. Recalculer progression
    await recalculateProgress(trx);
    
    // 4. Désactiver ancienne version
    await trx('onboarding_step_definitions')
      .where({ id: stepId, version: fromVersion })
      .update({ active_to: new Date() });
  });
}
```

---

### 6.2 Tests de Concurrence
**Status**: ❌ À faire

```typescript
// tests/integration/concurrency/patch-step.test.ts
describe('Concurrent PATCH requests', () => {
  it('should handle simultaneous updates with optimistic locking', async () => {
    const userId = 'test-user';
    const stepId = 'theme';
    
    // Lancer 10 PATCH simultanés
    const promises = Array(10).fill(null).map(() =>
      fetch(`/api/onboarding/steps/${stepId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'done' }),
      })
    );
    
    const results = await Promise.all(promises);
    
    // Vérifier: 1 succès, 9 conflicts
    const successes = results.filter(r => r.status === 200);
    const conflicts = results.filter(r => r.status === 409);
    
    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(9);
  });
});
```

**Optimistic locking:**
```sql
-- Ajouter version column
ALTER TABLE user_onboarding ADD COLUMN row_version INTEGER DEFAULT 1;

-- Update avec version check
UPDATE user_onboarding
SET status = $1, row_version = row_version + 1
WHERE user_id = $2 AND step_id = $3 AND row_version = $4
RETURNING *;
```

---

## 7. Conformité RGPD Pratique ❌

### 7.1 Registre des Traitements
**Status**: ❌ À documenter

```markdown
# Registre RGPD - Onboarding Huntaze

## Traitement: Suivi de progression onboarding
- Finalité: Améliorer l'expérience utilisateur
- Base légale: Intérêt légitime
- Données: user_id, step_id, status, timestamps
- Durée conservation: 2 ans après dernière activité
- Destinataires: Équipe produit (analytics)
- Transferts: Aucun hors UE

## Traitement: Analytics events
- Finalité: Optimisation produit
- Base légale: Consentement (si perso) ou intérêt légitime
- Données: user_id, event_type, metadata, correlationId
- Durée conservation: 1 an
- Destinataires: Équipe data
- Transferts: Aucun
```

---

### 7.2 DPIA (Data Protection Impact Assessment)
**Status**: ❌ À faire si analytics perso

**Critères nécessitant DPIA:**
- Profilage automatisé
- Données sensibles à grande échelle
- Surveillance systématique

**Si analytics = profilage:**
- Documenter risques
- Mesures de mitigation
- Validation DPO

---

### 7.3 Politique de Rétention
**Status**: ❌ À implémenter

```typescript
// scripts/cleanup-old-events.ts
export async function cleanupOldEvents() {
  const retentionDays = 365; // 1 an
  
  await db('onboarding_events')
    .where('created_at', '<', db.raw(`NOW() - INTERVAL '${retentionDays} days'`))
    .delete();
    
  console.log(`Deleted events older than ${retentionDays} days`);
}

// Cron job quotidien
// 0 2 * * * node scripts/cleanup-old-events.js
```

---

### 7.4 DSR (Data Subject Requests)
**Status**: ❌ À implémenter

```typescript
// app/api/admin/dsr/export/route.ts
export async function POST(req: Request) {
  const { userId } = await req.json();
  
  // Export toutes les données user
  const data = {
    onboarding_progress: await db('user_onboarding').where({ user_id: userId }),
    events: await db('onboarding_events').where({ user_id: userId }),
  };
  
  return Response.json(data);
}

// app/api/admin/dsr/delete/route.ts
export async function POST(req: Request) {
  const { userId } = await req.json();
  
  await db.transaction(async (trx) => {
    await trx('onboarding_events').where({ user_id: userId }).delete();
    await trx('user_onboarding').where({ user_id: userId }).delete();
  });
  
  return Response.json({ success: true });
}
```

---

### 7.5 Cookie Consent
**Status**: ❌ À implémenter si analytics non essentiels

```typescript
// components/CookieConsent.tsx
export function CookieConsent() {
  const [consent, setConsent] = useState<boolean | null>(null);
  
  const handleAccept = () => {
    setConsent(true);
    localStorage.setItem('analytics_consent', 'true');
    // Activer analytics
  };
  
  const handleReject = () => {
    setConsent(false);
    localStorage.setItem('analytics_consent', 'false');
    // Désactiver analytics
  };
  
  if (consent !== null) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
      <p>Nous utilisons des cookies pour améliorer votre expérience.</p>
      <button onClick={handleAccept}>Accepter</button>
      <button onClick={handleReject}>Refuser</button>
    </div>
  );
}
```

---

## 📊 Résumé P0

| Catégorie | Items | Status | Bloquant |
|-----------|-------|--------|----------|
| Tests | 3 | ❌ 0/3 | ✅ OUI |
| Feature Flags | 2 | ❌ 0/2 | ✅ OUI |
| Sécurité | 4 | ❌ 0/4 | ✅ OUI |
| Observabilité | 4 | ❌ 0/4 | ✅ OUI |
| Backups | 3 | ❌ 0/3 | ✅ OUI |
| Versioning | 2 | ⚠️ 0/2 | ✅ OUI |
| RGPD | 5 | ❌ 0/5 | ⚠️ Selon contexte |

**Total: 0/23 items P0 complétés**

---

## 🎯 Plan d'Action

### Semaine 1: Tests + Feature Flags
1. Unit tests (2 jours)
2. Integration tests (2 jours)
3. E2E tests (1 jour)
4. Feature flags + kill switch (2 jours)

### Semaine 2: Sécurité + Observabilité
1. Rate limiting (1 jour)
2. CSRF + headers (1 jour)
3. Audit rôles (1 jour)
4. Dashboards + alertes (2 jours)

### Semaine 3: Backups + RGPD
1. Backups + rollback (1 jour)
2. Step versioning (2 jours)
3. RGPD compliance (2 jours)

**Total: ~3 semaines avant production-ready**

---

## ⚠️ ATTENTION

**NE PAS déployer en production sans:**
- ✅ Tests automatisés (80% coverage)
- ✅ Feature flag + kill switch
- ✅ Rate limiting
- ✅ Security headers
- ✅ Monitoring + alertes
- ✅ Backup + rollback plan

**Le système actuel est OK pour staging, mais PAS pour production avec trafic réel.**

---

**Status**: 🔴 NOT PRODUCTION READY  
**Items P0**: 0/23 complétés  
**ETA Production**: +3 semaines  
**Date**: 2024-11-11
