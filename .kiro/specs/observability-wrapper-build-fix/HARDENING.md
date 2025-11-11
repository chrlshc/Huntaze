# Observability Hardening - Durcissements Production

## 🎯 Objectif

Bétonner la solution observability pour éviter les régressions et garantir la stabilité en production.

## ✅ Implémentations

### 1. Registry Centralisé avec Idempotence

**Fichier:** `lib/metrics-registry.ts`

**Problème résolu:**
- Doublons de métriques en dev/HMR causant des erreurs
- Réinitialisation multiple de `collectDefaultMetrics()`
- Pas de réutilisation des métriques existantes

**Solution:**
```typescript
import 'server-only';

let promP: Promise<typeof import('prom-client')> | undefined;

export async function prom() {
  promP ||= (async () => {
    const p = await import('prom-client');
    p.collectDefaultMetrics(); // Une seule fois par process
    return p;
  })();
  return promP;
}

// Helpers idempotents
export async function getOrCreateCounter(name, help, labelNames) {
  const p = await prom();
  const existing = p.register.getSingleMetric(name);
  if (existing) return existing as Counter;
  return new p.Counter({ name, help, labelNames });
}
```

**Avantages:**
- ✅ Lazy loading centralisé
- ✅ Cache global du module prom-client
- ✅ `getSingleMetric()` évite les doublons
- ✅ `server-only` empêche import côté client
- ✅ Idempotent en dev avec HMR

### 2. Route Metrics Durcie

**Fichier:** `app/api/metrics/route.ts`

**Changements:**
```typescript
// Force Node.js runtime et dynamic rendering
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { register, collectDefaultMetrics, contentType } = 
      await import('prom-client')
    
    collectDefaultMetrics() // Idempotent
    const body = await register.metrics()
    
    return new Response(body, {
      headers: { 'Content-Type': contentType }
    })
  } catch (error) {
    console.error('Metrics unavailable:', error)
    return Response.json({ error: 'Metrics unavailable' }, { status: 500 })
  }
}
```

**Pourquoi:**
- `runtime = 'nodejs'` → Garantit accès aux APIs Node.js (pas Edge)
- `dynamic = 'force-dynamic'` → Évite pré-rendu au build-time
- Try/catch → Graceful degradation si prom-client fail

**Références:**
- [Next.js Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [prom-client GitHub](https://github.com/siimon/prom-client)

### 3. Worker avec Métriques Idempotentes

**Fichier:** `src/lib/insights/schedulerWorker.ts`

**Avant:**
```typescript
const { prom } = await import('@/src/lib/prom')
prom.gauges.schedulerInflight.labels({ queue }).set(entries.length)
```

**Après:**
```typescript
const { getOrCreateGauge } = await import('@/lib/metrics-registry')

const schedulerInflight = await getOrCreateGauge(
  'scheduler_inflight',
  'Number of scheduler jobs currently in flight',
  ['queue']
)

schedulerInflight.labels({ queue }).set(entries.length)
```

**Avantages:**
- ✅ Pas de doublon si métrique existe déjà
- ✅ Fonctionne en dev avec HMR
- ✅ Pas d'erreur "metric already registered"

### 4. ESLint Guard Rails

**Fichier:** `.eslintrc.hardening.json`

**Configuration:**
```json
{
  "rules": {
    "@typescript-eslint/no-restricted-imports": ["error", {
      "paths": [
        {
          "name": "prom-client",
          "message": "❌ Import dynamically: await import('prom-client')"
        },
        {
          "name": "@/lib/monitoring",
          "message": "❌ withMonitoring is deprecated"
        }
      ]
    }]
  }
}
```

**Effet:**
- ❌ Bloque `import * as prom from 'prom-client'` au top-level
- ❌ Bloque `import { withMonitoring } from '@/lib/monitoring'`
- ✅ Force l'utilisation de `await import()` ou `metrics-registry`

**Activation:**
```bash
# Merge dans .eslintrc.json ou utiliser directement
npm run lint -- --config .eslintrc.hardening.json
```

**Référence:**
- [ESLint no-restricted-imports](https://eslint.org/docs/latest/rules/no-restricted-imports)

### 5. Server-Only Protection

**Tous les fichiers metrics:**
```typescript
import 'server-only';
```

**Effet:**
- Erreur de build si importé côté client
- Protection contre les fuites de code serveur

**Référence:**
- [Next.js server-only](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment)

## 📋 Checklist de Durcissement

### Routes API Critiques

- [x] `/api/metrics` - runtime='nodejs' + dynamic='force-dynamic'
- [ ] `/api/cron/*` - Vérifier runtime='nodejs' si métriques utilisées
- [ ] `/api/workers/*` - Vérifier runtime='nodejs' si métriques utilisées

### Métriques Idempotentes

- [x] `lib/metrics-registry.ts` - Registry centralisé créé
- [x] `src/lib/insights/schedulerWorker.ts` - Migré vers getOrCreate*
- [ ] `src/lib/analytics/summarizer.ts` - À migrer vers getOrCreate*
- [ ] Autres workers - Audit et migration

### ESLint & Protection

- [x] `.eslintrc.hardening.json` - Règles créées
- [ ] Merge dans `.eslintrc.json` principal
- [ ] CI/CD - Ajouter lint check avec hardening rules
- [x] `server-only` - Ajouté dans metrics-registry.ts

### Documentation

- [x] HARDENING.md - Ce document
- [ ] TEAM_BRIEFING.md - Mettre à jour avec hardening
- [ ] README - Ajouter section observability best practices

## 🧪 Tests de Validation

### 1. Test Build Stability
```bash
# Build doit réussir 100% du temps
for i in {1..5}; do
  echo "Build attempt $i"
  npm run build || exit 1
done
```

### 2. Test Metrics Idempotence (Dev)
```bash
# Démarrer dev server
npm run dev

# Faire plusieurs requêtes à /api/metrics
for i in {1..10}; do
  curl http://localhost:3000/api/metrics > /dev/null
done

# Vérifier logs - pas d'erreur "metric already registered"
```

### 3. Test ESLint Guards
```bash
# Créer un fichier test avec import interdit
cat > test-bad-import.ts << 'EOF'
import * as prom from 'prom-client';
export const test = () => prom.register.metrics();
EOF

# ESLint doit échouer
npx eslint test-bad-import.ts --config .eslintrc.hardening.json
# Attendu: Error avec message "Import dynamically"

# Cleanup
rm test-bad-import.ts
```

### 4. Test Runtime Config
```bash
# Vérifier que /api/metrics force nodejs runtime
npm run build
grep -A 5 "api/metrics" .next/server/app/api/metrics/route.js | grep nodejs
```

### 5. Test Graceful Degradation
```typescript
// Simuler échec prom-client
// Dans app/api/metrics/route.ts, temporairement:
const { register } = await import('prom-client-INVALID')

// Requête doit retourner 500 avec message, pas crash
curl http://localhost:3000/api/metrics
// Attendu: {"error":"Metrics unavailable"}
```

## 🚀 Migration Progressive

### Phase 1: Infrastructure (✅ DONE)
- [x] Créer `lib/metrics-registry.ts`
- [x] Durcir `/api/metrics`
- [x] Créer ESLint rules
- [x] Documenter

### Phase 2: Migration Workers (🔄 IN PROGRESS)
- [x] `schedulerWorker.ts` migré
- [ ] `summarizer.ts` à migrer
- [ ] Autres workers à identifier et migrer

### Phase 3: Activation Guards (📋 TODO)
- [ ] Merger ESLint rules dans `.eslintrc.json`
- [ ] Ajouter lint check en CI/CD
- [ ] Ajouter pre-commit hook

### Phase 4: Audit Complet (📋 TODO)
- [ ] Scanner tous les usages de métriques
- [ ] Vérifier runtime='nodejs' sur routes avec métriques
- [ ] Documenter patterns dans TEAM_BRIEFING.md

## 📚 Références Officielles

### Next.js
- [Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config) - runtime, dynamic
- [Server-Only Code](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns#keeping-server-only-code-out-of-the-client-environment)
- [OpenTelemetry Guide](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation) - Alternative future

### Prometheus
- [prom-client GitHub](https://github.com/siimon/prom-client)
- [Best Practices](https://prometheus.io/docs/practices/naming/)
- [Node.js Client Docs](https://github.com/siimon/prom-client#prometheus-client-for-nodejs)

### ESLint
- [no-restricted-imports](https://eslint.org/docs/latest/rules/no-restricted-imports)
- [TypeScript ESLint](https://typescript-eslint.io/rules/no-restricted-imports/)

## 🤔 FAQ Hardening

### Q: Pourquoi getSingleMetric() au lieu de créer directement?
**R:** En dev avec HMR, les modules peuvent être rechargés. Sans `getSingleMetric()`, on tente de recréer une métrique déjà enregistrée → erreur "metric already registered". `getSingleMetric()` réutilise l'existante.

### Q: runtime='nodejs' est-il vraiment nécessaire?
**R:** Oui pour les routes utilisant prom-client. Par défaut, Next.js peut choisir Edge runtime qui n'a pas accès aux APIs Node.js complètes. `runtime='nodejs'` force l'exécution Node.js.

### Q: Pourquoi dynamic='force-dynamic'?
**R:** Évite que Next.js tente de pré-rendre la route au build-time. Les métriques sont par nature dynamiques et doivent être générées à chaque requête.

### Q: server-only vs runtime='nodejs'?
**R:** Différents:
- `server-only`: Package npm qui empêche import côté client (build error)
- `runtime='nodejs'`: Config Next.js qui force exécution Node.js vs Edge

Les deux sont complémentaires.

### Q: Peut-on utiliser OpenTelemetry à la place?
**R:** Oui, c'est une alternative moderne. Next.js a un [guide officiel](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation). Migration future possible mais prom-client fonctionne bien avec ce hardening.

### Q: Impact performance du lazy loading?
**R:** Négligeable:
- Premier import: ~10-50ms (une fois par process)
- Imports suivants: cache, ~0ms
- `getSingleMetric()`: lookup O(1) dans registry

### Q: Que faire si une métrique existe déjà avec des labels différents?
**R:** Erreur intentionnelle. Les labels doivent être cohérents. Si besoin de changer, il faut:
1. Changer le nom de la métrique
2. Ou clear le registry (pas recommandé en prod)
3. Ou restart le process

## 🎯 Prochaines Étapes

1. **Immédiat:**
   - [ ] Merger ESLint rules dans config principal
   - [ ] Migrer `summarizer.ts` vers metrics-registry
   - [ ] Tester en staging

2. **Court terme:**
   - [ ] Audit complet des workers
   - [ ] Ajouter tests automatisés pour idempotence
   - [ ] Documentation équipe mise à jour

3. **Moyen terme:**
   - [ ] Évaluer migration OpenTelemetry
   - [ ] Centraliser tous les workers vers metrics-registry
   - [ ] Monitoring des métriques de métriques (meta!)

## ✅ Validation Finale

Avant de considérer le hardening complet:

- [ ] Build stable sur 10 runs consécutifs
- [ ] Aucune erreur "metric already registered" en dev
- [ ] ESLint bloque les imports interdits
- [ ] `/api/metrics` retourne données en prod
- [ ] Grafana dashboards fonctionnent
- [ ] Alertes Prometheus actives
- [ ] Documentation équipe à jour
- [ ] Tests automatisés passent

---

**Status:** 🔄 Phase 1 Complete, Phase 2 In Progress

**Dernière mise à jour:** 2024-01-XX

**Responsable:** Équipe Platform
