# 🚀 Guide de Déploiement Variables OAuth sur AWS Amplify

## 📋 Prérequis
- AWS CLI installé et configuré
- Permissions sur l'app Amplify `d2gmcfr71gawhz`
- Accès au branch `staging`

## 🎯 Méthodes de Déploiement

### Méthode 1: Script OAuth Spécialisé (Recommandé)
```bash
./scripts/push-oauth-to-amplify.sh
```
- ✅ Déploie uniquement les variables OAuth essentielles
- ✅ JWT secret sécurisé inclus
- ✅ Gestion d'erreurs intégrée

### Méthode 2: Depuis Fichier .env
```bash
./scripts/push-env-file-to-amplify.sh
```
- ✅ Lit `STAGING_ENV_VARS_ONLY.txt`
- ✅ Déploie toutes les variables du fichier
- ✅ Ignore commentaires et lignes vides

### Méthode 3: Vérification
```bash
./scripts/verify-amplify-env-vars.sh
```
- 🔍 Vérifie que les variables sont bien déployées
- 📊 Affiche le statut du dernier build
- ⚠️ Identifie les variables manquantes

## 🔧 Variables Déployées

### 🔐 Sécurité
- `JWT_SECRET` - Token JWT sécurisé (64 bytes)
- `DATA_ENCRYPTION_KEY` - Clé de chiffrement des données
- `ENCRYPTION_KEY` - Clé de chiffrement générale
- `SESSION_SECRET` - Secret pour les sessions

### 🎵 TikTok OAuth
- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`

### 📸 Instagram/Facebook OAuth
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`
- `NEXT_PUBLIC_INSTAGRAM_APP_ID`
- `INSTAGRAM_APP_SECRET`

### 🔴 Reddit OAuth
- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_USER_AGENT`

### 🧵 Threads OAuth
- `NEXT_PUBLIC_THREADS_APP_ID`
- `THREADS_APP_SECRET`

### 🔵 Google OAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### 🔧 Support
- `REDIS_TLS=true`

## 📊 Suivi du Déploiement

1. **Console AWS Amplify**: https://console.aws.amazon.com/amplify/home#/d2gmcfr71gawhz
2. **Logs de build**: Onglet "Build settings" > "Build logs"
3. **Variables**: Onglet "Environment variables"

## 🔍 Vérification Post-Déploiement

```bash
# Vérifier les variables
./scripts/verify-amplify-env-vars.sh

# Tester l'application
curl https://staging.huntaze.com/api/health/auth
```

## 🚨 Dépannage

### Erreur: "AccessDenied"
```bash
aws configure list
aws sts get-caller-identity
```

### Variables non prises en compte
- Attendre la fin du build (5-10 minutes)
- Vérifier les logs de build
- Redémarrer le déploiement si nécessaire

### Build qui échoue
```bash
# Vérifier les erreurs
aws amplify get-job \
  --app-id d2gmcfr71gawhz \
  --branch-name staging \
  --job-id [JOB_ID]
```

## 🎯 Commandes Utiles

```bash
# Lister tous les jobs
aws amplify list-jobs --app-id d2gmcfr71gawhz --branch-name staging

# Déclencher un nouveau build
aws amplify start-job --app-id d2gmcfr71gawhz --branch-name staging --job-type RELEASE

# Voir les variables actuelles
aws amplify get-backend-environment --app-id d2gmcfr71gawhz --environment-name staging
```

## ✅ Checklist de Validation

- [ ] Variables OAuth déployées
- [ ] JWT secret mis à jour
- [ ] Build Amplify réussi
- [ ] Application accessible
- [ ] Connexions OAuth fonctionnelles
- [ ] Tokens chiffrés correctement