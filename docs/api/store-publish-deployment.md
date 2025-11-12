# Store Publish API - Guide de Déploiement

## 📋 Pré-requis

### Environnement
- Node.js 18+
- PostgreSQL avec tables onboarding
- Redis (pour caching futur)
- Variables d'environnement configurées

### Base de Données
```sql
-- Vérifier que les tables existent
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'onboarding_step_definitions',
  'user_onboarding',
  'onboarding_events',
  'users'
);
```

### Variables d'Environnement
```bash
# Required
DATABASE_URL=postgresql://...
JWT_SECRET=...
NEXT_PUBLIC_API_URL=...

# Optional
REDIS_URL=...
SMTP_HOST=...
SMTP_PORT=...
```

## 🧪 Tests Pré-Déploiement

### 1. Tests Unitaires
```bash
npm run test:unit
```

### 2. Tests d'Intégration
```bash
# Démarrer le serveur de dev
npm run dev

# Dans un autre terminal
npm run test:integration tests/integration/api/store-publish.test.ts
```

### 3. Vérification TypeScript
```bash
npm run type-check
```

### 4. Linting
```bash
npm run lint
```

### 5. Build
```bash
npm run build
```

## 🚀 Déploiement Staging

### Étape 1: Préparation
```bash
# 1. Créer une branche de déploiement
git checkout -b deploy/store-publish-api

# 2. Vérifier les changements
git status

# 3. Commit
git add app/api/store/publish/
git add tests/integration/api/store-publish.test.ts
git add docs/api/store-publish-*.md
git commit -m "feat(api): optimize store publish endpoint with retry logic and comprehensive error handling"
```

### Étape 2: Push vers Staging
```bash
# Push vers staging branch
git push origin deploy/store-publish-api

# Créer PR vers staging
gh pr create --base staging --title "Store Publish API Optimization" --body "See STORE_PUBLISH_API_OPTIMIZATION.md"
```

### Étape 3: Validation Staging
```bash
# Attendre le déploiement automatique

# Tester l'endpoint
curl -X POST https://staging.huntaze.com/api/store/publish \
  -H "Authorization: Bearer STAGING_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmPublish": true}'

# Vérifier les logs
# (via dashboard de monitoring)
```

### Étape 4: Tests de Charge
```bash
# Test avec 10 requêtes concurrentes
for i in {1..10}; do
  curl -X POST https://staging.huntaze.com/api/store/publish \
    -H "Authorization: Bearer STAGING_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"confirmPublish": true}' &
done
wait
```

## 🎯 Déploiement Production

### Pré-requis Production
- [ ] Tests staging passés
- [ ] Review code approuvée
- [ ] Documentation à jour
- [ ] Monitoring configuré
- [ ] Rollback plan prêt

### Étape 1: Merge vers Main
```bash
# Merger staging vers main
git checkout main
git pull origin main
git merge staging
git push origin main
```

### Étape 2: Tag de Version
```bash
# Créer un tag
git tag -a v1.0.0-store-publish -m "Store Publish API Optimization"
git push origin v1.0.0-store-publish
```

### Étape 3: Déploiement
```bash
# Déploiement automatique via CI/CD
# Ou manuel:
npm run build
npm run deploy:production
```

### Étape 4: Validation Production
```bash
# Health check
curl https://api.huntaze.com/health

# Test endpoint (avec token de test)
curl -X POST https://api.huntaze.com/api/store/publish \
  -H "Authorization: Bearer TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"confirmPublish": true}'
```

### Étape 5: Monitoring
```bash
# Vérifier métriques
# - Response times
# - Error rates
# - Retry rates
# - Gating blocks

# Vérifier logs
# - Correlation IDs
# - Error messages
# - Retry attempts
```

## 📊 Métriques à Surveiller

### Métriques Clés
| Métrique | Seuil | Action si Dépassé |
|----------|-------|-------------------|
| Response Time (p95) | < 5s | Investiguer performance |
| Error Rate | < 1% | Rollback si > 5% |
| Retry Rate | < 10% | Investiguer causes |
| Gating Block Rate | < 20% | Vérifier onboarding flow |

### Alertes
```yaml
# Exemple de configuration d'alertes
alerts:
  - name: store_publish_high_error_rate
    condition: error_rate > 5%
    duration: 5m
    action: page_oncall
    
  - name: store_publish_slow_response
    condition: p95_response_time > 10s
    duration: 5m
    action: notify_team
    
  - name: store_publish_high_retry_rate
    condition: retry_rate > 20%
    duration: 10m
    action: notify_team
```

## 🔄 Plan de Rollback

### Rollback Automatique
```bash
# Si erreur rate > 10% pendant 5 minutes
# → Rollback automatique vers version précédente
```

### Rollback Manuel
```bash
# 1. Identifier la version précédente
git log --oneline | head -5

# 2. Revert vers version stable
git revert HEAD
git push origin main

# 3. Redéployer
npm run deploy:production

# 4. Vérifier
curl https://api.huntaze.com/health
```

### Rollback Partiel
```bash
# Si seul l'endpoint pose problème:
# 1. Désactiver temporairement via feature flag
# 2. Ou rediriger vers ancienne implémentation
# 3. Investiguer et corriger
# 4. Redéployer
```

## 🐛 Troubleshooting

### Problème: Timeout sur Requêtes
**Symptômes**: Requêtes qui timeout après 30s

**Diagnostic**:
```bash
# Vérifier logs
grep "Store Publish" /var/log/app.log | grep "timeout"

# Vérifier retry attempts
grep "Retry attempt" /var/log/app.log
```

**Solution**:
- Réduire `maxAttempts` de 3 à 2
- Réduire `maxDelay` de 5000ms à 3000ms
- Investiguer cause des timeouts

### Problème: Taux d'Erreur Élevé
**Symptômes**: Error rate > 5%

**Diagnostic**:
```bash
# Vérifier types d'erreurs
grep "Failed to publish store" /var/log/app.log | \
  jq '.error' | sort | uniq -c

# Vérifier correlation IDs
grep "correlationId" /var/log/app.log | tail -20
```

**Solution**:
- Identifier pattern d'erreurs
- Vérifier database connectivity
- Vérifier gating middleware
- Rollback si nécessaire

### Problème: Gating Blocks Excessifs
**Symptômes**: Gating block rate > 50%

**Diagnostic**:
```bash
# Vérifier événements gating
grep "Gating check blocked" /var/log/app.log | wc -l

# Vérifier étapes manquantes
grep "missingStep" /var/log/app.log | jq '.missingStep' | sort | uniq -c
```

**Solution**:
- Vérifier onboarding flow
- Améliorer UX pour complétion paiements
- Considérer assouplir gating (si approprié)

## 📝 Checklist de Déploiement

### Pré-Déploiement
- [ ] Tests unitaires passent
- [ ] Tests d'intégration passent
- [ ] TypeScript compile sans erreurs
- [ ] Linting passe
- [ ] Build réussit
- [ ] Documentation à jour
- [ ] Review code approuvée

### Déploiement Staging
- [ ] Branch déployée vers staging
- [ ] Tests manuels effectués
- [ ] Tests de charge effectués
- [ ] Logs vérifiés
- [ ] Métriques normales
- [ ] Aucune régression détectée

### Déploiement Production
- [ ] Staging validé
- [ ] Tag de version créé
- [ ] Déploiement effectué
- [ ] Health check OK
- [ ] Endpoint testé
- [ ] Monitoring actif
- [ ] Alertes configurées
- [ ] Équipe notifiée

### Post-Déploiement
- [ ] Métriques surveillées (24h)
- [ ] Logs vérifiés
- [ ] Aucune alerte déclenchée
- [ ] Performance normale
- [ ] Feedback utilisateurs positif

## 🔐 Sécurité

### Vérifications Pré-Déploiement
```bash
# 1. Scan de sécurité
npm audit

# 2. Vérifier secrets
grep -r "password\|secret\|token" app/api/store/publish/ || echo "OK"

# 3. Vérifier permissions
# - Seuls utilisateurs authentifiés
# - Pas de cross-user access
# - Gating enforced
```

### Post-Déploiement
```bash
# 1. Vérifier logs pour tentatives suspectes
grep "Unauthorized" /var/log/app.log | tail -20

# 2. Vérifier rate limiting
# (via dashboard de monitoring)

# 3. Vérifier gating analytics
# (via dashboard analytics)
```

## 📞 Support

### Contacts
- **Équipe Platform**: platform@huntaze.com
- **On-Call**: +33 X XX XX XX XX
- **Slack**: #platform-alerts

### Escalation
1. **Niveau 1**: Développeur on-call
2. **Niveau 2**: Lead Platform
3. **Niveau 3**: CTO

### Documentation
- [API Endpoint Documentation](./store-publish-endpoint.md)
- [Retry Strategies](./retry-strategies.md)
- [Integration Tests](../../tests/integration/api/README.md)
- [Gating Middleware](./gated-routes.md)

---

**Dernière mise à jour**: 2024-11-11

**Version**: 1.0.0

**Responsable**: Équipe Platform
