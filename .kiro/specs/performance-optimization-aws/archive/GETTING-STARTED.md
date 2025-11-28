# 🚀 Getting Started - Performance Optimization AWS

## ✅ Task 1 Complete!

L'infrastructure AWS CloudWatch est maintenant configurée et opérationnelle. Voici comment l'utiliser.

## 📋 Ce qui a été fait

### Infrastructure AWS
- ✅ Dashboard CloudWatch avec 6 widgets de performance
- ✅ 8 alarmes CloudWatch configurées
- ✅ Topic SNS pour les alertes
- ✅ Log group pour les événements applicatifs
- ✅ Namespace de métriques `Huntaze/Performance`

### Code
- ✅ Service CloudWatch monitoring (`lib/aws/cloudwatch.ts`)
- ✅ Client pour métriques navigateur (`lib/aws/metrics-client.ts`)
- ✅ API endpoints pour recevoir les métriques
- ✅ Scripts de setup et test
- ✅ Documentation complète

## 🎯 Quick Start

### 1. Vérifier l'Infrastructure

```bash
# Voir le dashboard
open "https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#dashboards:name=Huntaze-Performance-Dashboard"

# Tester l'intégration
npm run aws:test
```

### 2. Envoyer des Métriques

#### Depuis le Serveur (Node.js)
```typescript
import { getCloudWatchMonitoring } from '@/lib/aws';

const monitoring = getCloudWatchMonitoring();

// Envoyer une métrique
await monitoring.putMetric({
  namespace: 'Huntaze/Performance',
  metricName: 'PageLoadTime',
  value: 1500,
  unit: 'Milliseconds',
  dimensions: {
    Page: '/dashboard',
  },
});
```

#### Depuis le Client (Browser)
```typescript
import { sendMetric } from '@/lib/aws';

// Envoyer une métrique Web Vitals
await sendMetric({
  metricName: 'LCP',
  value: 2000,
  unit: 'Milliseconds',
  dimensions: {
    Page: window.location.pathname,
  },
});
```

### 3. Logger des Événements

```typescript
import { getCloudWatchMonitoring } from '@/lib/aws';

const monitoring = getCloudWatchMonitoring();

await monitoring.logEvent({
  level: 'ERROR',
  message: 'API request failed',
  context: {
    endpoint: '/api/users',
    statusCode: 500,
    userId: 'user123',
  },
});
```

## 📊 Métriques Disponibles

### Core Web Vitals
- **LCP** - Largest Contentful Paint (< 2500ms)
- **FID** - First Input Delay (< 100ms)
- **CLS** - Cumulative Layout Shift (< 0.1)
- **TTFB** - Time to First Byte (< 800ms)
- **FCP** - First Contentful Paint (< 1800ms)

### Performance
- **PageLoadTime** - Temps de chargement total (< 3000ms)
- **APIResponseTime** - Temps de réponse API (< 2000ms)
- **CacheHitRate** - Taux de succès du cache (> 70%)
- **ErrorRate** - Taux d'erreur (< 5%)
- **MemoryUsage** - Utilisation mémoire (< 85%)

## 🔔 Alarmes Configurées

| Alarme | Seuil | Action |
|--------|-------|--------|
| High LCP | > 2500ms | SNS Alert |
| High FID | > 100ms | SNS Alert |
| High CLS | > 0.1 | SNS Alert |
| Slow Page Load | > 3000ms | SNS Alert |
| Slow API Response | > 2000ms | SNS Alert |
| High Error Rate | > 5% | SNS Alert |
| Low Cache Hit Rate | < 70% | SNS Alert |
| High Memory Usage | > 85% | SNS Alert |

## 📚 Documentation

- **[README](../../../lib/aws/README.md)** - Guide complet d'utilisation
- **[AWS Setup Guide](./AWS-SETUP-GUIDE.md)** - Configuration AWS détaillée
- **[Task 1 Summary](./TASK-1-SUMMARY.md)** - Résumé de la tâche 1

## 🔗 Liens Utiles

### AWS Console
- [Dashboard CloudWatch](https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#dashboards:name=Huntaze-Performance-Dashboard)
- [Alarmes](https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#alarmsV2:)
- [Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#logsV2:log-groups/log-group/$252Fhuntaze$252Fperformance)
- [Métriques](https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#metricsV2:graph=~();namespace=Huntaze/Performance)

### Scripts NPM
```bash
npm run aws:setup      # Configurer l'infrastructure
npm run aws:test       # Tester l'intégration
```

## 🎯 Prochaines Étapes

Maintenant que l'infrastructure CloudWatch est en place, vous pouvez:

1. **Task 1.1** - Écrire les tests de propriété pour la collecte de métriques
2. **Task 1.2** - Écrire les tests de propriété pour le logging Web Vitals
3. **Task 2** - Implémenter le système de diagnostics de performance
4. **Task 9** - Intégrer le monitoring Web Vitals avec CloudWatch

## 💡 Exemples d'Utilisation

### Monitorer le Temps de Chargement d'une Page

```typescript
// Dans votre composant Next.js
'use client';

import { useEffect } from 'react';
import { sendMetric } from '@/lib/aws';

export default function MyPage() {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const loadTime = performance.now() - startTime;
      sendMetric({
        metricName: 'PageLoadTime',
        value: loadTime,
        unit: 'Milliseconds',
        dimensions: {
          Page: '/my-page',
        },
      });
    };
  }, []);

  return <div>My Page</div>;
}
```

### Monitorer les Appels API

```typescript
// Dans votre API route
import { getCloudWatchMonitoring } from '@/lib/aws';

export async function GET(request: Request) {
  const startTime = Date.now();
  const monitoring = getCloudWatchMonitoring();
  
  try {
    const data = await fetchData();
    
    // Enregistrer le temps de réponse
    await monitoring.putMetric({
      namespace: 'Huntaze/Performance',
      metricName: 'APIResponseTime',
      value: Date.now() - startTime,
      unit: 'Milliseconds',
      dimensions: {
        Endpoint: '/api/data',
        Status: '200',
      },
    });
    
    return Response.json(data);
  } catch (error) {
    // Logger l'erreur
    await monitoring.logEvent({
      level: 'ERROR',
      message: 'API request failed',
      context: {
        endpoint: '/api/data',
        error: error.message,
      },
    });
    
    throw error;
  }
}
```

### Monitorer les Web Vitals

```typescript
// Dans votre layout ou composant racine
'use client';

import { useEffect } from 'react';
import { sendMetricsBatch } from '@/lib/aws';

export function WebVitalsReporter() {
  useEffect(() => {
    // Utiliser l'API Web Vitals
    import('web-vitals').then(({ onLCP, onFID, onCLS }) => {
      const metrics: any[] = [];
      
      onLCP((metric) => {
        metrics.push({
          metricName: 'LCP',
          value: metric.value,
          unit: 'Milliseconds',
        });
      });
      
      onFID((metric) => {
        metrics.push({
          metricName: 'FID',
          value: metric.value,
          unit: 'Milliseconds',
        });
      });
      
      onCLS((metric) => {
        metrics.push({
          metricName: 'CLS',
          value: metric.value,
          unit: 'Count',
        });
      });
      
      // Envoyer toutes les métriques en batch
      setTimeout(() => {
        if (metrics.length > 0) {
          sendMetricsBatch(metrics);
        }
      }, 5000);
    });
  }, []);
  
  return null;
}
```

## 🎉 Félicitations!

Votre infrastructure de monitoring AWS est maintenant opérationnelle. Vous pouvez commencer à collecter des métriques de performance et recevoir des alertes en temps réel.

Pour toute question, consultez la [documentation complète](../../../lib/aws/README.md) ou le [guide de configuration AWS](./AWS-SETUP-GUIDE.md).
