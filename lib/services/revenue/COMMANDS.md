# Revenue API - Commandes Utiles

## 🧪 Tests

### Exécuter tous les tests
```bash
npm test lib/services/revenue
```

### Exécuter les tests d'optimisation
```bash
npm test tests/integration/revenue/api-optimization.test.ts
```

### Exécuter avec coverage
```bash
npm test -- --coverage lib/services/revenue
```

### Watch mode
```bash
npm test -- --watch lib/services/revenue
```

---

## 📊 Monitoring

### Vérifier les métriques en dev
```typescript
// Dans la console du navigateur
import { revenueAPIMonitor } from '@/lib/services/revenue/api-monitoring';

// Résumé
revenueAPIMonitor.getSummary();

// Requêtes lentes (> 2s)
revenueAPIMonitor.getSlowQueries();

// Requêtes échouées
revenueAPIMonitor.getFailedRequests();
```

### Logs en production
```bash
# CloudWatch
aws logs tail /aws/lambda/revenue-api --follow

# Grep par correlation ID
grep "rev-1699876543210-k3j5h8m2p" logs/*.log

# Erreurs uniquement
grep "ERROR" logs/revenue-api.log | tail -n 50
```

---

## 🔍 Debugging

### Tracer une requête complète
```bash
# 1. Récupérer le correlation ID de l'erreur
# Exemple: rev-1699876543210-k3j5h8m2p

# 2. Chercher dans tous les logs
grep -r "rev-1699876543210-k3j5h8m2p" logs/

# 3. Analyser la timeline
grep "rev-1699876543210-k3j5h8m2p" logs/*.log | sort
```

### Vérifier les performances
```bash
# Temps de réponse par endpoint
grep "Revenue API" logs/api.log | \
  awk '{print $5, $7}' | \
  sort | uniq -c

# Requêtes lentes
grep "duration.*[2-9][0-9][0-9][0-9]ms" logs/api.log
```

### Analyser les erreurs
```bash
# Taux d'erreur par endpoint
grep "Revenue API" logs/api.log | \
  grep -E "(❌|status: [45])" | \
  awk '{print $5}' | \
  sort | uniq -c

# Erreurs par type
grep "RevenueError" logs/api.log | \
  awk '{print $3}' | \
  sort | uniq -c
```

---

## 🚀 Déploiement

### Build de production
```bash
npm run build
```

### Vérifier le build
```bash
npm run build && npm run start
```

### Déployer en staging
```bash
# Amplify
git push origin staging

# Vérifier le déploiement
curl https://staging.huntaze.com/api/revenue/health
```

### Déployer en production
```bash
# Merge vers main
git checkout main
git merge staging
git push origin main

# Vérifier
curl https://huntaze.com/api/revenue/health
```

---

## 🧹 Maintenance

### Nettoyer les métriques
```typescript
// Dans la console
import { revenueAPIMonitor } from '@/lib/services/revenue/api-monitoring';
revenueAPIMonitor.clear();
```

### Vérifier les dépendances
```bash
npm outdated
npm audit
```

### Mettre à jour les dépendances
```bash
npm update
npm audit fix
```

---

## 📈 Performance

### Analyser le bundle
```bash
npm run build
npm run analyze
```

### Lighthouse audit
```bash
npm run lighthouse -- https://huntaze.com/creator/revenue/pricing
```

### Load testing
```bash
# k6
k6 run tests/load/revenue-api.js

# Artillery
artillery run tests/load/revenue-api.yml
```

---

## 🔐 Sécurité

### Vérifier les vulnérabilités
```bash
npm audit
npm audit fix
```

### Scan de sécurité
```bash
# Snyk
snyk test

# OWASP Dependency Check
dependency-check --project revenue-api --scan .
```

---

## 📝 Documentation

### Générer la documentation TypeScript
```bash
npx typedoc lib/services/revenue
```

### Vérifier les types
```bash
npx tsc --noEmit
```

### Linter
```bash
npm run lint
npm run lint:fix
```

---

## 🎯 Validation

### Checklist pré-déploiement
```bash
# 1. Tests
npm test

# 2. Build
npm run build

# 3. Types
npx tsc --noEmit

# 4. Lint
npm run lint

# 5. Audit
npm audit

# 6. Performance
npm run lighthouse
```

### Validation post-déploiement
```bash
# 1. Health check
curl https://huntaze.com/api/revenue/health

# 2. Vérifier les métriques
# Ouvrir https://huntaze.com/admin/revenue/monitoring

# 3. Vérifier les logs
# CloudWatch ou DataDog

# 4. Tester un endpoint
curl -X GET "https://huntaze.com/api/revenue/pricing?creatorId=test" \
  -H "Cookie: next-auth.session-token=..."
```

---

## 🆘 Troubleshooting

### Problème : Requêtes lentes
```bash
# 1. Identifier les slow queries
grep "duration.*[2-9][0-9][0-9][0-9]ms" logs/api.log

# 2. Analyser le endpoint
# Vérifier la base de données, le cache, etc.

# 3. Optimiser
# Ajouter des index, améliorer les requêtes, etc.
```

### Problème : Taux d'erreur élevé
```bash
# 1. Identifier les erreurs
grep "ERROR" logs/revenue-api.log | tail -n 100

# 2. Grouper par type
grep "RevenueError" logs/api.log | \
  awk '{print $3}' | \
  sort | uniq -c

# 3. Corriger la cause racine
```

### Problème : Cache inefficace
```typescript
// Vérifier le cache hit rate
const summary = revenueAPIMonitor.getSummary();
console.log('Cache hit rate:', summary.cacheHitRate);

// Si < 50%, ajuster les TTL dans les hooks
```

---

## 📚 Ressources

### Documentation
- [API Integration Guide](./API_INTEGRATION_GUIDE.md)
- [Optimization Summary](./OPTIMIZATION_SUMMARY.md)
- [Main Report](../../../REVENUE_API_OPTIMIZATION_REPORT.md)

### Monitoring
- CloudWatch: https://console.aws.amazon.com/cloudwatch
- DataDog: https://app.datadoghq.com
- Sentry: https://sentry.io

### Support
- Slack: #revenue-optimization
- Email: tech@huntaze.com
- Documentation: https://docs.huntaze.com/revenue-api

---

**Dernière mise à jour :** 14 janvier 2025  
**Maintenu par :** Équipe Revenue Optimization
