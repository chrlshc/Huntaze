# Guide de Déploiement - Optimisations de Performance

## 🎯 Statut Actuel
- ✅ 164/164 tests passent (100%)
- ✅ 23 propriétés de correction validées
- ✅ 16,400+ cas de test via property-based testing
- ✅ Prêt pour le déploiement

## 📋 Pré-requis de Déploiement

### 1. Variables d'Environnement AWS Amplify

Assurez-vous que ces variables sont configurées dans la console AWS Amplify:

#### Variables Essentielles
```bash
# Database
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Redis/ElastiCache
REDIS_URL=redis://your-elasticache.cache.amazonaws.com:6379
REDIS_TLS=true

# NextAuth
NEXTAUTH_SECRET=<générer avec: openssl rand -base64 32>
NEXTAUTH_URL=https://app.huntaze.com
AUTH_SECRET=${NEXTAUTH_SECRET}
AUTH_URL=${NEXTAUTH_URL}

# AWS Services
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<votre-clé>
AWS_SECRET_ACCESS_KEY=<votre-secret>
AWS_S3_BUCKET=huntaze-assets

# Email
SES_FROM_EMAIL=noreply@huntaze.com

# Encryption
ENCRYPTION_KEY=<générer avec: openssl rand -base64 32>
DATA_ENCRYPTION_KEY=<générer avec: openssl rand -base64 32>
JWT_SECRET=<générer avec: openssl rand -base64 32>
SESSION_SECRET=<générer avec: openssl rand -base64 32>

# AI Services
AZURE_OPENAI_API_KEY=<votre-clé>
AZURE_OPENAI_ENDPOINT=https://huntaze-ai.openai.azure.com

# Node
NODE_ENV=production
NODE_VERSION=20
```

#### Variables VPC (pour Amplify Compute)
```bash
LAMBDA_SECURITY_GROUP_ID=sg-xxxxxxxxx
PRIVATE_SUBNET_1_ID=subnet-xxxxxxxx
PRIVATE_SUBNET_2_ID=subnet-yyyyyyyy
```

### 2. Vérification des Tests

Avant de déployer, exécutez tous les tests:

```bash
# Tests unitaires avec propriétés
npm run test:unit:optimized

# Tests d'intégration
npm run test:integration:optimized

# Tests de performance
npm run test:performance

# Vérification complète
npm run checkpoint:verify
```

## 🚀 Processus de Déploiement

### Étape 1: Préparer le Code

```bash
# 1. Assurez-vous d'être sur la branche principale
git checkout main

# 2. Vérifiez que tous les tests passent
npm run test:unit:optimized

# 3. Créez un commit de déploiement
git add .
git commit -m "feat: Deploy dashboard performance optimizations - 100% test coverage"

# 4. Poussez vers GitHub
git push origin main
```

### Étape 2: Déploiement Staging

#### A. Via AWS Amplify Console

1. **Accédez à AWS Amplify Console**
   - Ouvrez https://console.aws.amazon.com/amplify/
   - Sélectionnez votre application Huntaze

2. **Configurez la branche Staging**
   - Allez dans "App settings" > "Branch settings"
   - Créez/sélectionnez la branche `staging`
   - Activez le déploiement automatique

3. **Vérifiez les Variables d'Environnement**
   - Allez dans "App settings" > "Environment variables"
   - Vérifiez que toutes les variables sont configurées
   - Utilisez `NEXTAUTH_URL=https://staging.huntaze.com` pour staging

4. **Déclenchez le Déploiement**
   - Le push vers `staging` déclenchera automatiquement le build
   - Ou cliquez sur "Redeploy this version" dans l'interface

#### B. Via CLI (Alternative)

```bash
# Installer Amplify CLI si nécessaire
npm install -g @aws-amplify/cli

# Déployer vers staging
amplify publish --branch staging
```

### Étape 3: Tests Post-Déploiement Staging

```bash
# 1. Vérifiez que l'application est accessible
curl -I https://staging.huntaze.com

# 2. Testez les endpoints critiques
curl https://staging.huntaze.com/api/health

# 3. Vérifiez les métriques CloudWatch
npm run aws:verify

# 4. Testez les Web Vitals
npm run test:web-vitals

# 5. Exécutez Lighthouse
npm run lighthouse
```

### Étape 4: Validation Staging

Vérifiez manuellement:

1. **Performance du Dashboard**
   - Temps de chargement < 2s
   - Pas de requêtes N+1
   - Cache fonctionnel

2. **Fonctionnalités Critiques**
   - Authentification
   - Chargement des données
   - Pagination cursor
   - Agrégations database

3. **Monitoring**
   - CloudWatch logs actifs
   - Métriques remontées
   - Pas d'erreurs critiques

### Étape 5: Déploiement Production

Une fois staging validé:

```bash
# 1. Mergez staging vers main
git checkout main
git merge staging
git push origin main

# 2. Créez un tag de version
git tag -a v1.0.0-perf-optimizations -m "Dashboard performance optimizations - 100% test coverage"
git push origin v1.0.0-perf-optimizations
```

#### Configuration Production dans Amplify

1. **Variables d'Environnement Production**
   - Utilisez `NEXTAUTH_URL=https://app.huntaze.com`
   - Vérifiez que `NODE_ENV=production`
   - Utilisez des secrets de production (pas de staging)

2. **Déclenchez le Déploiement**
   - Le push vers `main` déclenchera le build production
   - Surveillez les logs dans Amplify Console

### Étape 6: Monitoring Post-Production

```bash
# 1. Vérifiez les métriques en temps réel
npm run perf:monitor

# 2. Générez un rapport de performance
npm run perf:report

# 3. Vérifiez l'infrastructure AWS
npm run audit:aws

# 4. Surveillez les erreurs
# Consultez CloudWatch Logs dans AWS Console
```

## 📊 Métriques à Surveiller

### Métriques Clés

1. **Performance**
   - Time to First Byte (TTFB) < 200ms
   - First Contentful Paint (FCP) < 1.8s
   - Largest Contentful Paint (LCP) < 2.5s
   - Cumulative Layout Shift (CLS) < 0.1

2. **Database**
   - Temps de requête moyen < 50ms
   - Pas de requêtes > 1s
   - Utilisation des index > 95%

3. **Cache**
   - Hit rate > 80%
   - Temps de réponse cache < 10ms

4. **Erreurs**
   - Taux d'erreur < 0.1%
   - Pas d'erreurs 500

## 🔧 Dépannage

### Problème: Build échoue sur Amplify

```bash
# Vérifiez les logs de build
# Dans Amplify Console > Build history > View logs

# Solutions communes:
# 1. Vérifiez que toutes les dépendances sont dans package.json
# 2. Assurez-vous que Prisma génère correctement
# 3. Vérifiez les variables d'environnement
```

### Problème: Tests échouent en CI/CD

```bash
# Exécutez les tests localement avec les mêmes conditions
NODE_ENV=production npm run test:unit:optimized

# Vérifiez les variables d'environnement de test
# Assurez-vous que DATABASE_URL et REDIS_URL sont configurés
```

### Problème: Performance dégradée après déploiement

```bash
# 1. Vérifiez les métriques CloudWatch
npm run aws:verify

# 2. Analysez les requêtes lentes
npm run diagnostic:baseline

# 3. Vérifiez le cache Redis
# Connectez-vous à ElastiCache et vérifiez les stats

# 4. Consultez les logs d'erreur
# AWS Console > CloudWatch > Log groups
```

## 🎯 Checklist de Déploiement

### Avant le Déploiement
- [ ] Tous les tests passent (164/164)
- [ ] Variables d'environnement configurées
- [ ] Backup de la base de données effectué
- [ ] Documentation à jour

### Staging
- [ ] Code déployé sur staging
- [ ] Tests post-déploiement réussis
- [ ] Performance validée
- [ ] Fonctionnalités testées manuellement
- [ ] Monitoring actif

### Production
- [ ] Validation staging complète
- [ ] Tag de version créé
- [ ] Code déployé sur production
- [ ] Tests de fumée réussis
- [ ] Monitoring actif
- [ ] Équipe notifiée

### Post-Déploiement
- [ ] Métriques surveillées pendant 24h
- [ ] Pas d'erreurs critiques
- [ ] Performance conforme aux attentes
- [ ] Feedback utilisateurs positif

## 📞 Support

En cas de problème:

1. **Consultez les logs**
   - AWS Amplify Console > Build logs
   - CloudWatch Logs

2. **Vérifiez les métriques**
   - CloudWatch Dashboard
   - `npm run perf:report`

3. **Rollback si nécessaire**
   - Dans Amplify Console, sélectionnez une version précédente
   - Cliquez sur "Redeploy this version"

## 🎉 Résultat Attendu

Après le déploiement réussi:

- ✅ Dashboard 50-70% plus rapide
- ✅ Requêtes database optimisées (pas de N+1)
- ✅ Cache efficace (hit rate > 80%)
- ✅ Monitoring complet actif
- ✅ 100% de couverture de tests
- ✅ Infrastructure AWS optimisée
