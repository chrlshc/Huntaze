# Guide pour les Tâches Restantes - Intégration AI

Ce document fournit un guide détaillé pour compléter les 3 dernières tâches de l'intégration AI.

---

## 17.5 - Intégration avec les Données Existantes

### Objectif
Enrichir le système AI avec les données existantes de l'application Huntaze pour fournir un contexte plus riche et des insights plus pertinents.

### Tâches à Réaliser

#### 5.1 - Utiliser oauth_accounts pour le contexte des plateformes

**Fichier à modifier:** `lib/ai/agents/messaging.ts`, `lib/ai/agents/content.ts`

```typescript
// Ajouter une fonction helper pour récupérer les tokens OAuth
import { db as prisma } from '@/lib/prisma';

async function getPlatformContext(userId: number, platform: string) {
  const oauthAccount = await prisma.oauth_accounts.findFirst({
    where: {
      user_id: userId,
      provider: platform,
    },
    select: {
      provider_account_id: true,
      metadata: true,
    },
  });

  return oauthAccount;
}

// Utiliser dans les agents pour enrichir le contexte
```

#### 5.2 - Lier les insights AI avec marketing_campaigns

**Fichier à créer:** `lib/ai/data-integration.ts`

```typescript
import { db as prisma } from '@/lib/prisma';

/**
 * Link AI insights with marketing campaigns
 */
export async function linkInsightToCampaign(
  userId: number,
  insightId: string,
  campaignId: string
) {
  // Récupérer l'insight
  const insight = await prisma.aIInsight.findUnique({
    where: { id: insightId },
  });

  if (!insight) return null;

  // Mettre à jour la campagne avec l'insight
  await prisma.marketing_campaigns.update({
    where: { id: campaignId },
    data: {
      stats: {
        ...((await prisma.marketing_campaigns.findUnique({
          where: { id: campaignId },
          select: { stats: true },
        }))?.stats as any),
        aiInsights: [
          ...(((await prisma.marketing_campaigns.findUnique({
            where: { id: campaignId },
            select: { stats: true },
          }))?.stats as any)?.aiInsights || []),
          {
            insightId: insight.id,
            type: insight.type,
            confidence: insight.confidence,
            data: insight.data,
            timestamp: insight.createdAt,
          },
        ],
      },
    },
  });

  return true;
}

/**
 * Get AI insights for a campaign
 */
export async function getCampaignInsights(campaignId: string) {
  const campaign = await prisma.marketing_campaigns.findUnique({
    where: { id: campaignId },
    select: {
      stats: true,
      user_id: true,
    },
  });

  if (!campaign) return [];

  const aiInsights = (campaign.stats as any)?.aiInsights || [];
  return aiInsights;
}
```

#### 5.3 - Utiliser user_stats pour enrichir le contexte

**Fichier à modifier:** `lib/ai/agents/analytics.ts`

```typescript
// Ajouter au début de analyzePerformance
async function getUserStatsContext(userId: number) {
  const stats = await prisma.user_stats.findUnique({
    where: { user_id: userId },
  });

  return {
    messagesCount: stats?.messages_sent || 0,
    messagesTrend: stats?.messages_trend || 0,
    responseRate: stats?.response_rate || 0,
    revenue: stats?.revenue || 0,
    revenueTrend: stats?.revenue_trend || 0,
    activeChats: stats?.active_chats || 0,
  };
}

// Utiliser dans le prompt AI pour enrichir l'analyse
```

#### 5.4 - Enrichir avec les données de subscriptions

**Fichier à modifier:** `lib/ai/agents/sales.ts`

```typescript
async function getSubscriptionContext(userId: number) {
  const subscriptions = await prisma.subscriptions.findMany({
    where: {
      user_id: userId,
      status: 'active',
    },
    select: {
      tier: true,
      amount: true,
      platform: true,
      started_at: true,
    },
  });

  return {
    activeSubscriptions: subscriptions.length,
    totalRevenue: subscriptions.reduce((sum, sub) => sum + sub.amount, 0),
    platforms: [...new Set(subscriptions.map(s => s.platform))],
    averageSubscriptionValue: subscriptions.length > 0
      ? subscriptions.reduce((sum, sub) => sum + sub.amount, 0) / subscriptions.length
      : 0,
  };
}
```

### Checklist 17.5

- [ ] Créer `lib/ai/data-integration.ts`
- [ ] Ajouter fonction `getPlatformContext` dans les agents
- [ ] Implémenter `linkInsightToCampaign` et `getCampaignInsights`
- [ ] Ajouter `getUserStatsContext` dans AnalyticsAgent
- [ ] Ajouter `getSubscriptionContext` dans SalesAgent
- [ ] Tester l'enrichissement des données
- [ ] Vérifier que les insights sont plus pertinents

---

## 17.6 - Tests End-to-End

### Objectif
Valider le fonctionnement complet du système AI avec des scénarios utilisateur réels.

### Prérequis

1. Base de données de test configurée
2. Utilisateurs de test créés
3. Variables d'environnement de test configurées
4. GEMINI_API_KEY configurée

### Tests à Créer

#### 6.1 - Test du Flow Complet Utilisateur

**Fichier à créer:** `tests/e2e/ai-complete-flow.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('AI System Complete Flow', () => {
  test('User can use AI features and reach quota', async ({ page }) => {
    // 1. Login
    await page.goto('/auth/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // 2. Navigate to Dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // 3. Check quota indicator is visible
    const quotaIndicator = page.locator('.ai-quota-indicator');
    await expect(quotaIndicator).toBeVisible();
    
    // 4. Use AI Chat Assistant
    await page.goto('/messages');
    await page.fill('[name="fan-message"]', 'Hey! Love your content!');
    await page.click('button:has-text("Generate AI Response")');
    
    // 5. Wait for AI response
    await expect(page.locator('.assistant-response')).toBeVisible({ timeout: 30000 });
    
    // 6. Check usage updated
    await page.goto('/dashboard');
    const spentAmount = await page.locator('.quota-spent').textContent();
    expect(parseFloat(spentAmount || '0')).toBeGreaterThan(0);
    
    // 7. Use Caption Generator
    await page.goto('/content/create');
    await page.selectOption('[name="platform"]', 'instagram');
    await page.fill('[name="description"]', 'Beach sunset photo');
    await page.click('button:has-text("Generate Caption")');
    
    // 8. Verify caption generated
    await expect(page.locator('.result-caption')).toBeVisible({ timeout: 30000 });
    
    // 9. Check Analytics Dashboard
    await page.goto('/analytics');
    await expect(page.locator('.ai-analytics-dashboard')).toBeVisible();
    await page.click('button:has-text("Refresh Analysis")');
    
    // 10. Verify quota is being tracked
    await page.goto('/dashboard');
    const percentUsed = await page.locator('.quota-details').textContent();
    expect(percentUsed).toContain('$');
  });
});
```

#### 6.2 - Test de l'Enforcement des Quotas

**Fichier à créer:** `tests/integration/ai-quota-enforcement.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { db as prisma } from '@/lib/prisma';
import { assertWithinMonthlyQuota } from '@/lib/ai/quota';

describe('AI Quota Enforcement', () => {
  let testUserId: number;

  beforeEach(async () => {
    // Créer un utilisateur de test
    const user = await prisma.users.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        ai_plan: 'starter',
      },
    });
    testUserId = user.id;
  });

  it('should block requests when quota is exceeded', async () => {
    // Simuler $10 de dépenses (quota starter)
    await prisma.usageLog.create({
      data: {
        creatorId: testUserId,
        feature: 'test',
        model: 'gemini-2.5-pro',
        tokensInput: 1000000,
        tokensOutput: 1000000,
        costUsd: 10.0,
      },
    });

    // Tenter une nouvelle requête devrait échouer
    await expect(
      assertWithinMonthlyQuota(testUserId, 'starter', 0.01)
    ).rejects.toThrow('Monthly quota exceeded');
  });

  it('should allow requests within quota', async () => {
    // Simuler $5 de dépenses
    await prisma.usageLog.create({
      data: {
        creatorId: testUserId,
        feature: 'test',
        model: 'gemini-2.5-pro',
        tokensInput: 500000,
        tokensOutput: 500000,
        costUsd: 5.0,
      },
    });

    // Devrait réussir
    await expect(
      assertWithinMonthlyQuota(testUserId, 'starter', 0.01)
    ).resolves.not.toThrow();
  });
});
```

#### 6.3 - Test du Rate Limiting

**Fichier à créer:** `tests/integration/ai-rate-limiting.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { checkCreatorRateLimit } from '@/lib/ai/rate-limit';

describe('AI Rate Limiting', () => {
  it('should enforce rate limits for starter plan', async () => {
    const userId = 999999; // Test user
    
    // Faire 50 requêtes (limite starter)
    for (let i = 0; i < 50; i++) {
      await expect(
        checkCreatorRateLimit(userId, 'starter')
      ).resolves.not.toThrow();
    }
    
    // La 51ème devrait échouer
    await expect(
      checkCreatorRateLimit(userId, 'starter')
    ).rejects.toThrow('Rate limit exceeded');
  });
});
```

### Checklist 17.6

- [ ] Installer Playwright: `npm install -D @playwright/test`
- [ ] Créer `tests/e2e/ai-complete-flow.test.ts`
- [ ] Créer `tests/integration/ai-quota-enforcement.test.ts`
- [ ] Créer `tests/integration/ai-rate-limiting.test.ts`
- [ ] Configurer base de données de test
- [ ] Créer utilisateurs de test avec différents plans
- [ ] Exécuter tous les tests: `npm run test:e2e`
- [ ] Vérifier que tous les tests passent
- [ ] Documenter les résultats

---

## 17.7 - Migration et Déploiement

### Objectif
Déployer le système AI en production de manière sécurisée et contrôlée.

### Étape 1: Préparation de la Migration

#### 1.1 - Vérifier la Migration Prisma

```bash
# Vérifier que la migration est prête
npx prisma migrate status

# Si nécessaire, créer la migration
npx prisma migrate dev --name add_ai_plan_to_users
```

#### 1.2 - Backup de la Base de Données

```bash
# Créer un backup avant la migration
pg_dump $DATABASE_URL > backup_before_ai_migration_$(date +%Y%m%d).sql
```

### Étape 2: Configuration des Variables d'Environnement

#### 2.1 - Variables Requises en Production

Ajouter dans AWS Amplify ou votre système de gestion des secrets:

```bash
# Gemini AI
GEMINI_API_KEY=your_production_api_key
GEMINI_MODEL=gemini-2.5-pro

# ElastiCache Redis (déjà configuré)
ELASTICACHE_REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
ELASTICACHE_REDIS_PORT=6379

# Database (déjà configuré)
DATABASE_URL=your_production_database_url

# Quotas (optionnel - utilise les valeurs par défaut si non spécifié)
QUOTA_STARTER_USD=10
QUOTA_PRO_USD=50
QUOTA_BUSINESS_USD=999999
```

#### 2.2 - Script de Vérification

**Fichier à créer:** `scripts/verify-ai-production-config.ts`

```typescript
#!/usr/bin/env ts-node

const requiredEnvVars = [
  'GEMINI_API_KEY',
  'DATABASE_URL',
  'ELASTICACHE_REDIS_HOST',
];

console.log('🔍 Vérification de la configuration AI pour production...\n');

let allPresent = true;

for (const envVar of requiredEnvVars) {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar}: Configuré`);
  } else {
    console.log(`❌ ${envVar}: MANQUANT`);
    allPresent = false;
  }
}

if (allPresent) {
  console.log('\n✅ Toutes les variables d'environnement sont configurées!');
  process.exit(0);
} else {
  console.log('\n❌ Certaines variables sont manquantes. Veuillez les configurer avant le déploiement.');
  process.exit(1);
}
```

### Étape 3: Déploiement

#### 3.1 - Checklist Pré-Déploiement

- [ ] Tous les tests passent localement
- [ ] Migration Prisma testée en staging
- [ ] Backup de la base de données créé
- [ ] Variables d'environnement configurées
- [ ] Documentation à jour
- [ ] Équipe informée du déploiement

#### 3.2 - Déploiement sur AWS Amplify

```bash
# 1. Pousser les changements
git add .
git commit -m "feat: AI system integration complete"
git push origin main

# 2. Amplify déploiera automatiquement
# Surveiller le déploiement dans la console AWS Amplify
```

#### 3.3 - Exécuter la Migration en Production

```bash
# Se connecter à l'environnement de production
# Exécuter la migration
npx prisma migrate deploy

# Vérifier que la migration a réussi
npx prisma migrate status
```

### Étape 4: Validation Post-Déploiement

#### 4.1 - Tests de Smoke

**Fichier à créer:** `scripts/smoke-test-ai-production.ts`

```typescript
#!/usr/bin/env ts-node

async function smokeTest() {
  console.log('🔥 Smoke tests AI en production...\n');

  // Test 1: Vérifier que l'API quota répond
  try {
    const response = await fetch('https://your-domain.com/api/ai/quota', {
      headers: {
        'Authorization': 'Bearer test-token',
      },
    });
    console.log(`✅ API Quota: ${response.status}`);
  } catch (error) {
    console.log(`❌ API Quota: ERREUR`);
  }

  // Test 2: Vérifier Redis
  try {
    const Redis = require('ioredis');
    const redis = new Redis({
      host: process.env.ELASTICACHE_REDIS_HOST,
      port: 6379,
    });
    await redis.ping();
    console.log(`✅ Redis: Connecté`);
    redis.quit();
  } catch (error) {
    console.log(`❌ Redis: ERREUR`);
  }

  // Test 3: Vérifier la base de données
  try {
    const { db } = require('@/lib/prisma');
    const count = await db.users.count();
    console.log(`✅ Database: ${count} utilisateurs`);
  } catch (error) {
    console.log(`❌ Database: ERREUR`);
  }

  console.log('\n✅ Smoke tests terminés!');
}

smokeTest();
```

#### 4.2 - Monitoring Initial

Surveiller pendant les premières 24h:

- Logs d'erreurs dans CloudWatch
- Métriques de coûts AI
- Taux d'erreur des API
- Latence des requêtes
- Utilisation Redis

### Étape 5: Rollback (si nécessaire)

Si des problèmes critiques surviennent:

```bash
# 1. Revenir au commit précédent
git revert HEAD
git push origin main

# 2. Restaurer la base de données
psql $DATABASE_URL < backup_before_ai_migration_YYYYMMDD.sql

# 3. Vérifier que l'application fonctionne
```

### Checklist 17.7

- [ ] Backup base de données créé
- [ ] Migration Prisma testée en staging
- [ ] Variables d'environnement configurées en production
- [ ] Script de vérification exécuté
- [ ] Code déployé sur Amplify
- [ ] Migration exécutée en production
- [ ] Smoke tests passés
- [ ] Monitoring configuré
- [ ] Équipe formée sur les nouvelles fonctionnalités
- [ ] Documentation mise à jour

---

## Résumé des Commandes

### Pour 17.5 (Intégration Données)
```bash
# Créer les fichiers d'intégration
touch lib/ai/data-integration.ts

# Tester l'intégration
npm run test -- lib/ai/data-integration
```

### Pour 17.6 (Tests E2E)
```bash
# Installer Playwright
npm install -D @playwright/test

# Créer les tests
mkdir -p tests/e2e
touch tests/e2e/ai-complete-flow.test.ts

# Exécuter les tests
npx playwright test
```

### Pour 17.7 (Déploiement)
```bash
# Vérifier la configuration
ts-node scripts/verify-ai-production-config.ts

# Créer backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Déployer
git push origin main

# Exécuter migration
npx prisma migrate deploy

# Smoke tests
ts-node scripts/smoke-test-ai-production.ts
```

---

## Support et Dépannage

### Problèmes Courants

**Problème:** Migration Prisma échoue
**Solution:** Vérifier que le champ `ai_plan` n'existe pas déjà, restaurer le backup si nécessaire

**Problème:** Tests E2E timeout
**Solution:** Augmenter le timeout dans la configuration Playwright, vérifier que GEMINI_API_KEY est configurée

**Problème:** Rate limiting ne fonctionne pas
**Solution:** Vérifier la connexion Redis, vérifier les logs ElastiCache

**Problème:** Quotas non appliqués
**Solution:** Vérifier que `getUserAIPlanFromSubscription` retourne le bon plan, vérifier les logs de base de données

---

## Prochaines Étapes Après Déploiement

1. **Monitoring continu** - Surveiller les coûts AI quotidiennement
2. **Optimisation** - Ajuster les prompts pour réduire les coûts
3. **Feedback utilisateurs** - Collecter les retours sur les fonctionnalités AI
4. **Itération** - Améliorer les agents basé sur les insights
5. **Documentation utilisateur** - Créer des guides pour les créateurs

---

**Dernière mise à jour:** 2024-11-22  
**Auteur:** Kiro AI Assistant  
**Version:** 1.0
