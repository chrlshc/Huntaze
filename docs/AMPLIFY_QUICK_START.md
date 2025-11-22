# 🚀 Guide Rapide - Déploiement Amplify

## ✅ Ce Qui Est Déjà Fait

1. ✅ Design system intégré dans `app/layout.tsx`
2. ✅ 335 tests passent
3. ✅ 19 propriétés de correctness validées
4. ✅ AWS credentials configurées localement

## 📋 Variables d'Environnement à Configurer

### Dans AWS Amplify Console

1. **Ouvrir Amplify Console:**
   ```
   https://console.aws.amazon.com/amplify
   ```

2. **Sélectionner votre app "Huntaze"**

3. **Aller à "Environment variables"**

4. **Ajouter ces variables:**

#### Essentielles (REQUIS)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Authentication
NEXTAUTH_URL=https://app.huntaze.com
NEXTAUTH_SECRET=<générer 32+ caractères aléatoires>
ENCRYPTION_KEY=<générer 32 caractères aléatoires>

# AWS Services
AWS_ACCESS_KEY_ID=<votre clé IAM>
AWS_SECRET_ACCESS_KEY=<votre secret IAM>
AWS_REGION=us-east-1
AWS_S3_BUCKET=huntaze-beta-assets

# Application
NEXT_PUBLIC_APP_URL=https://app.huntaze.com
NODE_ENV=production
```

#### Optionnelles (Recommandées)

```bash
# CloudFront CDN
CDN_URL=https://d1234567890.cloudfront.net

# OAuth Providers (si utilisés)
INSTAGRAM_CLIENT_ID=<votre ID>
INSTAGRAM_CLIENT_SECRET=<votre secret>
TIKTOK_CLIENT_KEY=<votre clé>
TIKTOK_CLIENT_SECRET=<votre secret>
REDDIT_CLIENT_ID=<votre ID>
REDDIT_CLIENT_SECRET=<votre secret>

# Monitoring
ALERT_EMAIL=ops@huntaze.com
```

### Générer des Secrets Sécurisés

```bash
# NEXTAUTH_SECRET (32+ caractères)
openssl rand -base64 32

# ENCRYPTION_KEY (32 caractères exactement)
openssl rand -hex 16
```

## 🔧 Configuration CloudWatch (Optionnel - 15 min)

### Prérequis

Les credentials AWS sont déjà configurés localement ✅

### Exécuter la Configuration

```bash
# Configurer CloudWatch monitoring
npm run setup:cloudwatch

# Tester les alarmes
npm run test:cloudwatch
```

### Ce Qui Sera Créé

- ✅ Log groups pour erreurs application
- ✅ Alarmes pour taux d'erreur > 1%
- ✅ Alarmes pour latence API > 1s
- ✅ Alarmes pour cache hit ratio < 80%
- ✅ Dashboard CloudWatch avec métriques clés
- ✅ SNS topic pour alertes critiques

### Accéder au Dashboard

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-beta-production
```

## 🚀 Déployer sur Amplify

### Option 1: Déploiement Automatique (Recommandé)

```bash
# Commit et push
git add .
git commit -m "feat: integrate Beta Launch UI System with CloudWatch monitoring"
git push origin main
```

**Amplify va automatiquement:**
1. ✅ Détecter le push
2. ✅ Builder l'application (~5-10 min)
3. ✅ Déployer en production
4. ✅ Mettre à jour le CDN

### Option 2: Déploiement Manuel

1. Ouvrir Amplify Console
2. Aller à "Deployments"
3. Cliquer "Deploy" sur la branche main

## 📊 Monitorer le Déploiement

### 1. Build Amplify

```
https://console.aws.amazon.com/amplify
→ Votre app → Deployments
```

**Phases du build:**
- Provision (~1 min)
- Build (~5-8 min)
- Deploy (~1-2 min)
- Verify (~1 min)

### 2. CloudWatch Metrics

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=huntaze-beta-production
```

**Métriques à surveiller:**
- Taux d'erreur (< 1%)
- Latence API (< 500ms)
- Taux de cache (> 80%)
- Nombre de requêtes

### 3. Logs Application

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups
```

## ✅ Vérification Post-Déploiement

### Tests Automatiques

```bash
# Tester l'endpoint de production
curl -I https://app.huntaze.com

# Vérifier les headers de sécurité
curl -I https://app.huntaze.com | grep -E "(CSP|HSTS)"

# Tester l'API
curl https://app.huntaze.com/api/csrf/token
```

### Tests Manuels

1. **Ouvrir l'application:**
   ```
   https://app.huntaze.com
   ```

2. **Tester l'authentification:**
   - Créer un compte
   - Se connecter
   - Vérifier l'email

3. **Tester les intégrations:**
   - Connecter Instagram/TikTok/Reddit
   - Vérifier le statut des connexions

4. **Vérifier les performances:**
   - Lighthouse audit
   - Core Web Vitals
   - Temps de chargement

## 🔄 Rollback (Si Nécessaire)

### Via Amplify Console (2-3 min)

1. Amplify Console → Deployments
2. Trouver le déploiement stable précédent
3. Cliquer "Redeploy this version"

### Via Git (5-10 min)

```bash
# Revert le commit problématique
git revert HEAD
git push origin main
```

## 📞 Support

### Documentation

- **Guide Complet:** `docs/AMPLIFY_DEPLOYMENT_GUIDE.md`
- **Monitoring:** `docs/MONITORING_ALERTING.md`
- **Rollback:** `docs/ROLLBACK_PROCEDURE.md`

### AWS Support

- **Console:** https://console.aws.amazon.com/support
- **Documentation:** https://docs.aws.amazon.com/amplify/

## 🎯 Checklist Finale

### Avant Déploiement

- [x] Design system intégré
- [x] Tests passent (335 tests)
- [x] AWS credentials configurées
- [ ] Variables d'environnement Amplify configurées
- [ ] CloudWatch configuré (optionnel)

### Pendant Déploiement

- [ ] Code pushé vers main
- [ ] Build Amplify en cours
- [ ] Logs de build vérifiés
- [ ] Aucune erreur de build

### Après Déploiement

- [ ] Application accessible
- [ ] Tests smoke passent
- [ ] CloudWatch reçoit des métriques
- [ ] Alarmes en état OK
- [ ] Performance validée

## 🎉 Résumé

**Temps Total:** ~30-45 minutes

1. **Configurer variables Amplify** (10 min)
2. **Configurer CloudWatch** (15 min) - Optionnel
3. **Déployer** (5-10 min automatique)
4. **Vérifier** (10 min)

**Votre application Huntaze Beta sera en production! 🚀**
