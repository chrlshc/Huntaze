# Validation Health API - Migration Guide

**Version:** 1.0.0  
**Date:** November 14, 2025  
**Status:** ✅ Ready for Production

---

## 📋 Overview

Ce guide vous aide à intégrer le nouveau endpoint `/api/validation/health` dans votre application pour monitorer la santé des credentials OAuth.

---

## 🚀 Quick Start (5 minutes)

### Étape 1: Tester l'Endpoint

```bash
# Test local
curl http://localhost:3000/api/validation/health

# Test staging
curl https://staging.huntaze.com/api/validation/health

# Test production
curl https://api.huntaze.com/api/validation/health
```

### Étape 2: Installer le Hook React

Le hook est déjà disponible dans le projet :

```tsx
import { useValidationHealth } from '@/hooks/useValidationHealth';

function MyComponent() {
  const { health, isLoading, error } = useValidationHealth();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>Status: {health.status}</div>;
}
```

### Étape 3: Ajouter le Dashboard (Optionnel)

```tsx
import { ValidationHealthDashboard } from '@/components/validation/ValidationHealthDashboard';

function AdminPage() {
  return (
    <div>
      <h1>System Health</h1>
      <ValidationHealthDashboard />
    </div>
  );
}
```

---

## 📖 Cas d'Usage

### 1. Dashboard Admin

Afficher le statut de santé dans le dashboard admin.

```tsx
// app/admin/health/page.tsx
import { ValidationHealthDashboard } from '@/components/validation/ValidationHealthDashboard';

export default function HealthPage() {
  return (
    <div className="container mx-auto p-6">
      <ValidationHealthDashboard />
    </div>
  );
}
```

### 2. Status Page Publique

Créer une page de statut publique pour les utilisateurs.

```tsx
// app/status/page.tsx
'use client';

import { useValidationHealth } from '@/hooks/useValidationHealth';

export default function StatusPage() {
  const { health, isLoading } = useValidationHealth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">System Status</h1>
      
      <div className={`p-4 rounded-lg ${
        health.status === 'healthy' ? 'bg-green-100' : 'bg-yellow-100'
      }`}>
        <h2 className="text-xl font-semibold">
          {health.status === 'healthy' ? '✅ All Systems Operational' : '⚠️ Partial Outage'}
        </h2>
      </div>

      <div className="mt-6 space-y-4">
        {health.platforms.map(platform => (
          <div key={platform.platform} className="p-4 border rounded-lg">
            <h3 className="font-semibold capitalize">{platform.platform}</h3>
            <p className={platform.status === 'healthy' ? 'text-green-600' : 'text-red-600'}>
              {platform.status === 'healthy' ? '✅ Operational' : '❌ Down'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3. Monitoring Automatique

Surveiller la santé et envoyer des alertes.

```tsx
// lib/monitoring/health-monitor.ts
import { OAuthValidators } from '@/lib/security/oauth-validators';

export async function monitorHealth() {
  const report = await OAuthValidators.validateAll();
  
  if (report.overall.validPlatforms === 0) {
    // Send critical alert
    await sendAlert({
      level: 'critical',
      message: 'All OAuth platforms are down',
      platforms: report.platforms,
    });
  } else if (report.overall.validPlatforms < report.overall.totalPlatforms) {
    // Send warning
    await sendAlert({
      level: 'warning',
      message: 'Some OAuth platforms are down',
      platforms: report.platforms,
    });
  }
}

// Run every 5 minutes
setInterval(monitorHealth, 5 * 60 * 1000);
```

### 4. Pre-Deployment Check

Vérifier la santé avant un déploiement.

```bash
#!/bin/bash
# scripts/pre-deploy-health-check.sh

echo "Checking OAuth health..."

RESPONSE=$(curl -s http://localhost:3000/api/validation/health)
STATUS=$(echo $RESPONSE | jq -r '.status')

if [ "$STATUS" != "healthy" ]; then
  echo "❌ Health check failed: $STATUS"
  echo $RESPONSE | jq '.'
  exit 1
fi

echo "✅ Health check passed"
exit 0
```

### 5. Platform-Specific Checks

Vérifier un platform spécifique avant une opération.

```tsx
import { usePlatformHealth } from '@/hooks/useValidationHealth';

function TikTokUploadButton() {
  const { isHealthy, isConfigured } = usePlatformHealth('tiktok');

  if (!isConfigured) {
    return <div>TikTok not configured</div>;
  }

  if (!isHealthy) {
    return <div>TikTok is currently unavailable</div>;
  }

  return (
    <button onClick={handleUpload}>
      Upload to TikTok
    </button>
  );
}
```

---

## 🔧 Configuration

### Environment Variables

Assurez-vous que toutes les variables d'environnement OAuth sont configurées :

```bash
# TikTok
TIKTOK_CLIENT_KEY=your_client_key
TIKTOK_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://yourdomain.com/api/tiktok/callback

# Instagram (Facebook)
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_FACEBOOK_REDIRECT_URI=https://yourdomain.com/api/instagram/callback

# Reddit
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=YourApp/1.0.0
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://yourdomain.com/api/reddit/callback
```

### Cache Configuration

Le cache est configuré par défaut à 5 minutes. Pour modifier :

```typescript
// app/api/validation/health/route.ts

// Modifier la durée du cache
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Modifier le timeout
const REQUEST_TIMEOUT_MS = 30000; // 30 secondes
```

### Hook Configuration

Configurer le hook pour votre cas d'usage :

```tsx
// Auto-refresh toutes les 2 minutes
const { health } = useValidationHealth({
  refreshInterval: 2 * 60 * 1000,
});

// Désactiver l'auto-refresh
const { health } = useValidationHealth({
  refreshInterval: 0,
});

// Désactiver complètement
const { health } = useValidationHealth({
  enabled: false,
});
```

---

## 📊 Monitoring & Alerting

### 1. CloudWatch Metrics

```typescript
// lib/monitoring/cloudwatch.ts
import { CloudWatch } from 'aws-sdk';

const cloudwatch = new CloudWatch();

export async function publishHealthMetrics(health: HealthStatus) {
  await cloudwatch.putMetricData({
    Namespace: 'Huntaze/OAuth',
    MetricData: [
      {
        MetricName: 'HealthyPlatforms',
        Value: health.summary.healthy,
        Unit: 'Count',
      },
      {
        MetricName: 'HealthPercentage',
        Value: health.summary.healthPercentage,
        Unit: 'Percent',
      },
    ],
  }).promise();
}
```

### 2. Slack Notifications

```typescript
// lib/monitoring/slack.ts
export async function sendSlackAlert(health: HealthStatus) {
  if (health.status === 'unhealthy') {
    await fetch(process.env.SLACK_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: '🚨 OAuth Health Alert',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Status:* ${health.status}\n*Healthy:* ${health.summary.healthy}/${health.summary.total}`,
            },
          },
        ],
      }),
    });
  }
}
```

### 3. Sentry Integration

```typescript
// lib/monitoring/sentry.ts
import * as Sentry from '@sentry/nextjs';

export function trackHealthStatus(health: HealthStatus) {
  if (health.status !== 'healthy') {
    Sentry.captureMessage('OAuth health degraded', {
      level: health.status === 'unhealthy' ? 'error' : 'warning',
      extra: {
        status: health.status,
        platforms: health.platforms,
        summary: health.summary,
      },
    });
  }
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
// tests/unit/api/validation-health.test.ts
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/validation/health/route';

describe('Validation Health API', () => {
  it('should return healthy status', async () => {
    const response = await GET(new Request('http://localhost:3000/api/validation/health'));
    const data = await response.json();
    
    expect(data.status).toBe('healthy');
    expect(data.summary.healthy).toBeGreaterThan(0);
  });
});
```

### Integration Tests

```typescript
// tests/integration/validation-health.test.ts
import { describe, it, expect } from 'vitest';

describe('Validation Health Integration', () => {
  it('should validate all platforms', async () => {
    const response = await fetch('http://localhost:3000/api/validation/health');
    const data = await response.json();
    
    expect(data.platforms).toHaveLength(3);
    expect(data.platforms.map(p => p.platform)).toEqual(['tiktok', 'instagram', 'reddit']);
  });
});
```

### E2E Tests

```typescript
// tests/e2e/validation-health.spec.ts
import { test, expect } from '@playwright/test';

test('health dashboard displays correctly', async ({ page }) => {
  await page.goto('/admin/health');
  
  await expect(page.locator('h2')).toContainText('OAuth Validation Health');
  await expect(page.locator('[data-testid="platform-card"]')).toHaveCount(3);
});
```

---

## 🐛 Troubleshooting

### Issue: Timeout Errors

**Symptôme:** Requêtes qui timeout après 15 secondes

**Solutions:**
1. Vérifier la connectivité réseau
2. Augmenter le timeout si nécessaire
3. Vérifier les credentials OAuth

```typescript
// Augmenter le timeout
const REQUEST_TIMEOUT_MS = 30000; // 30 secondes
```

### Issue: Cache Stale

**Symptôme:** Données en cache obsolètes

**Solutions:**
1. Attendre l'expiration du cache (5 min)
2. Utiliser le bouton "Refresh"
3. Redémarrer le serveur

```typescript
// Forcer le refresh
const { refresh } = useValidationHealth();
await refresh();
```

### Issue: All Platforms Unhealthy

**Symptôme:** Tous les platforms montrent "unhealthy"

**Solutions:**
1. Vérifier les variables d'environnement
2. Vérifier les credentials OAuth
3. Tester manuellement les APIs

```bash
# Vérifier les variables
echo $TIKTOK_CLIENT_KEY
echo $FACEBOOK_APP_ID
echo $REDDIT_CLIENT_ID

# Tester l'API
curl http://localhost:3000/api/validation/health | jq '.'
```

---

## 📚 Resources

### Documentation
- [API Documentation](./validation-health.md)
- [OAuth Validators](../../lib/security/oauth-validators.ts)
- [Production Security Guide](../PRODUCTION_ENV_SECURITY_COMPLETION.md)

### Code Examples
- [Hook Usage](../../hooks/useValidationHealth.ts)
- [Component Example](../../components/validation/ValidationHealthDashboard.tsx)
- [Tests](../../tests/unit/api/validation-health.test.ts)

### External Links
- [TikTok OAuth Docs](https://developers.tiktok.com/doc/oauth-user-access-token-management)
- [Facebook OAuth Docs](https://developers.facebook.com/docs/facebook-login)
- [Reddit OAuth Docs](https://github.com/reddit-archive/reddit/wiki/OAuth2)

---

## ✅ Checklist de Migration

### Configuration
- [ ] Variables d'environnement configurées
- [ ] Credentials OAuth valides
- [ ] Redirect URIs configurés

### Code
- [ ] Hook importé et utilisé
- [ ] Dashboard ajouté (optionnel)
- [ ] Monitoring configuré (optionnel)

### Tests
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] Tests E2E passent (optionnel)

### Déploiement
- [ ] Testé en dev
- [ ] Testé en staging
- [ ] Déployé en production
- [ ] Monitoring actif

---

## 🎉 Conclusion

Vous êtes maintenant prêt à utiliser l'API Validation Health dans votre application !

Pour toute question ou problème, consultez la [documentation complète](./validation-health.md) ou contactez l'équipe technique.

---

**Version:** 1.0.0  
**Last Updated:** November 14, 2025  
**Status:** ✅ Production Ready
