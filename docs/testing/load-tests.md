# Guide des Tests de Charge (Load Testing)

Guide complet pour écrire et exécuter les tests de charge avec k6 dans Huntaze.

## Vue d'ensemble

Les tests de charge vérifient que l'application peut gérer le volume de trafic attendu sans dégradation des performances. Ils simulent des utilisateurs concurrents et mesurent les temps de réponse, le débit et la stabilité du système.

## Structure des Tests

```
tests/load/
├── scenarios/
│   ├── baseline.js              # Trafic normal
│   ├── peak-traffic.js          # Trafic de pointe
│   ├── spike-test.js            # Pic soudain
│   └── stress-test.js           # Test de stress
├── rate-limiting/
│   ├── rate-limiter-validation.js
│   └── circuit-breaker.js
├── utils/
│   ├── auth.js                  # Utilitaires auth
│   ├── metrics.js               # Métriques custom
│   └── data-generators.js       # Générateurs de données
├── config/
│   ├── thresholds.js            # Seuils de performance
│   └── environments.js          # Configs environnement
└── reports/
    └── (rapports générés)
```

## Installation de k6

### macOS

```bash
brew install k6
```

### Linux

```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Vérification

```bash
k6 version
```

## Écrire un Test de Charge

### Structure de Base

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Métriques custom
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Configuration du test
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Montée à 50 users
    { duration: '3m', target: 50 },   // Maintien à 50 users
    { duration: '1m', target: 0 },    // Descente à 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],  // 95% < 500ms
    'http_req_failed': ['rate<0.01'],    // Erreurs < 1%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // Faire une requête
  const response = http.get(`${BASE_URL}/api/dashboard`);
  
  // Vérifier la réponse
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time OK': (r) => r.timings.duration < 500,
  });
  
  // Enregistrer les métriques
  errorRate.add(response.status !== 200);
  responseTime.add(response.timings.duration);
  
  // Temps de réflexion
  sleep(1);
}
```

### Exemple Complet: Test Baseline

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import { generateAuthToken } from '../utils/auth.js';

// Métriques custom
const errorRate = new Rate('errors');
const dashboardLoadTime = new Trend('dashboard_load_time');
const apiCalls = new Counter('api_calls');

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Warm up
    { duration: '5m', target: 100 },   // Stable
    { duration: '2m', target: 500 },   // Ramp up
    { duration: '5m', target: 500 },   // Peak
    { duration: '2m', target: 1000 },  // Max
    { duration: '5m', target: 1000 },  // Sustained
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  // Créer des utilisateurs de test
  const users = [];
  for (let i = 0; i < 10; i++) {
    users.push({
      id: `user-${i}`,
      token: generateAuthToken(`user-${i}`),
    });
  }
  return { users };
}

export default function (data) {
  const user = data.users[Math.floor(Math.random() * data.users.length)];
  const headers = {
    'Authorization': `Bearer ${user.token}`,
    'Content-Type': 'application/json',
  };
  
  group('Dashboard Workflow', () => {
    // Load dashboard
    const dashboardStart = Date.now();
    const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, { headers });
    dashboardLoadTime.add(Date.now() - dashboardStart);
    apiCalls.add(1);
    
    check(dashboardRes, {
      'dashboard loaded': (r) => r.status === 200,
      'dashboard has data': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.metrics !== undefined;
        } catch {
          return false;
        }
      },
    });
    
    if (dashboardRes.status !== 200) {
      errorRate.add(1);
    }
  });
  
  group('Content Workflow', () => {
    // Load content
    const contentRes = http.get(`${BASE_URL}/api/content`, { headers });
    apiCalls.add(1);
    
    check(contentRes, {
      'content loaded': (r) => r.status === 200,
    });
    
    if (contentRes.status !== 200) {
      errorRate.add(1);
    }
  });
  
  group('Messages Workflow', () => {
    // Load messages
    const messagesRes = http.get(`${BASE_URL}/api/messages/unified`, { headers });
    apiCalls.add(1);
    
    check(messagesRes, {
      'messages loaded': (r) => r.status === 200,
    });
    
    if (messagesRes.status !== 200) {
      errorRate.add(1);
    }
  });
  
  // Think time
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

export function teardown(data) {
  console.log('Test complete');
  console.log(`Total API calls: ${apiCalls.value}`);
}
```

## Types de Tests de Charge

### 1. Baseline Test (Trafic Normal)

Simule le trafic normal quotidien.

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '10m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};
```

**Objectif**: Établir les performances de base
**Utilisateurs**: 100-1000 concurrents
**Durée**: 15-30 minutes

### 2. Peak Traffic Test (Trafic de Pointe)

Simule les périodes de forte affluence.

```javascript
export const options = {
  stages: [
    { duration: '5m', target: 2500 },
    { duration: '30m', target: 2500 },
    { duration: '5m', target: 0 },
  ],
};
```

**Objectif**: Vérifier la tenue en charge de pointe
**Utilisateurs**: 2000-5000 concurrents
**Durée**: 30-60 minutes

### 3. Spike Test (Pic Soudain)

Simule une augmentation soudaine du trafic.

```javascript
export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '1m', target: 5000 },   // Spike!
    { duration: '5m', target: 5000 },
    { duration: '1m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};
```

**Objectif**: Tester la résilience aux pics
**Utilisateurs**: 100 → 5000 en 1 minute
**Durée**: 10-15 minutes

### 4. Stress Test (Test de Stress)

Trouve le point de rupture du système.

```javascript
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 1000 },
    { duration: '5m', target: 5000 },
    { duration: '5m', target: 10000 },
    { duration: '5m', target: 15000 },
    { duration: '2m', target: 0 },
  ],
};
```

**Objectif**: Identifier la capacité maximale
**Utilisateurs**: Augmentation progressive jusqu'à rupture
**Durée**: 30-60 minutes

### 5. Soak Test (Test de Durée)

Vérifie la stabilité sur une longue période.

```javascript
export const options = {
  stages: [
    { duration: '5m', target: 500 },
    { duration: '4h', target: 500 },
    { duration: '5m', target: 0 },
  ],
};
```

**Objectif**: Détecter les fuites mémoire
**Utilisateurs**: 500 concurrents constants
**Durée**: 4-8 heures

## Métriques et Seuils

### Métriques k6 Standard

```javascript
export const options = {
  thresholds: {
    // Temps de réponse
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    
    // Taux d'erreur
    'http_req_failed': ['rate<0.01'],
    
    // Débit
    'http_reqs': ['rate>100'],
    
    // Durée des checks
    'checks': ['rate>0.95'],
  },
};
```

### Métriques Custom

```javascript
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Taux
const errorRate = new Rate('errors');
errorRate.add(true);  // Erreur
errorRate.add(false); // Succès

// Tendance (temps)
const responseTime = new Trend('response_time');
responseTime.add(response.timings.duration);

// Compteur
const apiCalls = new Counter('api_calls');
apiCalls.add(1);

// Jauge
const activeUsers = new Gauge('active_users');
activeUsers.add(currentUsers);
```

## Utilitaires

### Authentification

```javascript
// tests/load/utils/auth.js
export function generateAuthToken(userId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }));
  const signature = randomString(43);
  
  return `${header}.${payload}.${signature}`;
}

export function createAuthHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}
```

### Générateurs de Données

```javascript
// tests/load/utils/data-generators.js
import { randomString, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

export function generateUser() {
  return {
    id: `user-${randomString(10)}`,
    email: `test-${randomString(8)}@example.com`,
    name: `Test User ${randomString(5)}`,
  };
}

export function generateContent() {
  return {
    platform: randomItem(['instagram', 'tiktok', 'reddit']),
    type: randomItem(['post', 'story', 'reel']),
    caption: `Test content ${randomString(20)}`,
  };
}
```

## Exécution des Tests

### Commandes de Base

```bash
# Test simple
k6 run tests/load/scenarios/baseline.js

# Avec variables d'environnement
BASE_URL=https://staging.huntaze.com k6 run tests/load/scenarios/baseline.js

# Avec sortie JSON
k6 run --out json=results.json tests/load/scenarios/baseline.js

# Avec plus d'utilisateurs
k6 run --vus 100 --duration 30s tests/load/scenarios/baseline.js
```

### Scripts npm

```bash
# Tests de charge rate limiting
npm run test:load:rate-limiter
npm run test:load:circuit-breaker
npm run test:load:all

# Script interactif
./scripts/run-load-tests.sh
```

### Options Avancées

```bash
# Avec InfluxDB (pour Grafana)
k6 run --out influxdb=http://localhost:8086/k6 test.js

# Avec plusieurs sorties
k6 run --out json=results.json --out influxdb=http://localhost:8086/k6 test.js

# Mode cloud k6
k6 cloud test.js
```

## Interprétation des Résultats

### Résultats Positifs ✅

```
✓ http_req_duration..............: avg=245ms p(95)=450ms p(99)=800ms
✓ http_req_failed................: 0.12%
✓ http_reqs......................: 15234 (254.5/s)
✓ checks.........................: 99.8%
✓ vus............................: 1000
```

**Indicateurs**:
- p95 < 500ms ✅
- Taux d'erreur < 1% ✅
- Checks > 95% ✅

### Signes d'Alerte ⚠️

```
✗ http_req_duration..............: avg=1.2s p(95)=2.5s p(99)=5s
✗ http_req_failed................: 15.3%
✗ http_reqs......................: 3421 (57/s)
✗ checks.........................: 75.2%
```

**Problèmes**:
- p95 > 1s ⚠️ Trop lent
- Taux d'erreur > 10% ⚠️ Instable
- Checks < 80% ⚠️ Échecs fréquents

## Configuration des Environnements

```javascript
// tests/load/config/environments.js
export const ENVIRONMENTS = {
  local: {
    baseUrl: 'http://localhost:3000',
    maxVus: 100,
  },
  staging: {
    baseUrl: 'https://staging.huntaze.com',
    maxVus: 1000,
  },
  production: {
    baseUrl: 'https://huntaze.com',
    maxVus: 5000,
    requiresApproval: true,
  },
};
```

## Seuils de Performance

```javascript
// tests/load/config/thresholds.js
export const PERFORMANCE_BASELINES = {
  api: {
    dashboard: { p95: 300, p99: 500 },
    content: { p95: 400, p99: 800 },
    messages: { p95: 200, p99: 400 },
  },
};

export const K6_THRESHOLDS = {
  api: {
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'http_req_failed': ['rate<0.01'],
  },
  rateLimiting: {
    'http_req_duration': ['p(95)<1000'],
    'rate_limit_hits': ['count>0'],
    'rate_limit_bypass': ['count==0'],
  },
};
```

## Best Practices

### 1. Commencer Petit

```bash
# Test rapide d'abord
k6 run --vus 10 --duration 30s test.js

# Puis augmenter progressivement
k6 run --vus 50 --duration 2m test.js
k6 run --vus 100 --duration 5m test.js
```

### 2. Utiliser des Think Times

```javascript
// ✅ Bon - temps de réflexion réaliste
sleep(Math.random() * 3 + 1); // 1-4 secondes

// ❌ Mauvais - pas de pause
// Pas de sleep()
```

### 3. Grouper les Requêtes

```javascript
group('User Workflow', () => {
  group('Login', () => {
    // Login requests
  });
  
  group('Browse Content', () => {
    // Content requests
  });
});
```

### 4. Vérifier les Réponses

```javascript
// ✅ Bon - vérifier le contenu
check(response, {
  'status is 200': (r) => r.status === 200,
  'has data': (r) => JSON.parse(r.body).data !== undefined,
});

// ❌ Mauvais - seulement le status
check(response, {
  'status is 200': (r) => r.status === 200,
});
```

### 5. Nettoyer les Données

```javascript
export function teardown(data) {
  // Nettoyer les données de test
  console.log('Cleaning up test data...');
}
```

## Troubleshooting

### Taux d'erreur élevé

**Causes**: Surcharge serveur, rate limiting, bugs
**Solutions**:
- Réduire le nombre d'utilisateurs
- Vérifier les logs serveur
- Vérifier les limites de rate limiting

### Temps de réponse élevés

**Causes**: DB lente, cache inefficace, code non optimisé
**Solutions**:
- Profiler l'application
- Vérifier les requêtes DB
- Optimiser le cache

### k6 crash

**Causes**: Trop d'utilisateurs, mémoire insuffisante
**Solutions**:
- Réduire les VUs
- Utiliser k6 cloud
- Augmenter la RAM

## Ressources

- [k6 Documentation](https://k6.io/docs/)
- [k6 Examples](https://k6.io/docs/examples/)
- Tests existants dans `tests/load/`
- `tests/load/rate-limiting/README.md`

## Support

Pour questions ou problèmes:
- Consulter les tests existants
- Vérifier la documentation k6
- Créer une issue dans Linear
