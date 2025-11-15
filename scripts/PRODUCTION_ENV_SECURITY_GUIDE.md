# 🔐 Guide de Sécurisation Production - Huntaze

**Date:** 2025-11-14  
**Spec:** production-env-security  
**Priorité:** P0 - CRITIQUE  
**Temps estimé:** 2-3 jours

---

## 🎯 Objectif

Sécuriser tous les tokens et credentials OAuth pour le lancement beta en production.

---

## ✅ Étape 1: Générer les Tokens Sécurisés (30 min)

### 1.1 Générer ADMIN_TOKEN et DEBUG_TOKEN

```bash
# Exécuter le script de génération
node scripts/generate-security-tokens.js
```

**Actions dans le script:**
1. Choisir option "1. Generate new security tokens"
2. Si tokens existants, créer backup (recommandé: y)
3. Copier les tokens générés
4. Sauvegarder dans .env (y)
5. Créer backup (y)

**Résultat attendu:**
```
🔑 Generated Security Tokens:
Admin Token: [64 caractères hexadécimaux]
Debug Token: [64 caractères hexadécimaux]
Entropy: 256.00 bits
✅ Tokens saved to .env file
✅ Backup created with ID: backup-xxx
```

### 1.2 Valider les Tokens

```bash
# Valider que les tokens sont sécurisés
node scripts/validate-security-tokens.js
```

**Résultat attendu:**
```
✅ Admin Token: Valid (Length: 64, Entropy: 256 bits)
✅ Debug Token: Valid (Length: 64, Entropy: 256 bits)
✅ All tokens are valid and secure
```

---

## 🔑 Étape 2: Obtenir les Credentials OAuth (2-3 heures)

### 2.1 TikTok OAuth Credentials

**Où obtenir:**
1. Aller sur https://developers.tiktok.com/
2. Se connecter avec compte TikTok
3. Créer une nouvelle app ou utiliser app existante
4. Aller dans "Manage apps" → Votre app → "Credentials"

**Credentials nécessaires:**
```bash
TIKTOK_CLIENT_KEY=awxxxxxxxxxxxxxxxxxx
TIKTOK_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/api/auth/callback/tiktok
```

**Configuration requise:**
- Redirect URI: Ajouter `https://huntaze.com/api/auth/callback/tiktok`
- Scopes: `user.info.basic`, `video.upload`, `video.list`
- App Review: Soumettre pour review si nécessaire

**Validation:**
```bash
# Tester les credentials TikTok
curl -X POST https://open.tiktokapis.com/v2/oauth/token/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_key=YOUR_CLIENT_KEY" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "grant_type=client_credentials"
```

---

### 2.2 Instagram/Facebook OAuth Credentials

**Où obtenir:**
1. Aller sur https://developers.facebook.com/
2. Se connecter avec compte Facebook
3. Créer une nouvelle app ou utiliser app existante
4. Aller dans "Settings" → "Basic"

**Credentials nécessaires:**
```bash
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://huntaze.com/api/auth/callback/instagram
```

**Configuration requise:**
- App Type: Business
- Products: Instagram Basic Display API
- Redirect URI: Ajouter `https://huntaze.com/api/auth/callback/instagram`
- Permissions: `instagram_basic`, `instagram_content_publish`, `pages_show_list`
- App Review: Soumettre pour review

**Validation:**
```bash
# Tester les credentials Facebook
curl "https://graph.facebook.com/v18.0/oauth/access_token?client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&grant_type=client_credentials"
```

---

### 2.3 Reddit OAuth Credentials

**Où obtenir:**
1. Aller sur https://www.reddit.com/prefs/apps
2. Se connecter avec compte Reddit
3. Cliquer "create another app..."
4. Type: "web app"

**Credentials nécessaires:**
```bash
REDDIT_CLIENT_ID=xxxxxxxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://huntaze.com/api/auth/callback/reddit
REDDIT_USER_AGENT=Huntaze/1.0.0 (by /u/your_reddit_username)
```

**Configuration requise:**
- App type: web app
- Redirect URI: `https://huntaze.com/api/auth/callback/reddit`
- Permissions: `identity`, `submit`, `edit`, `read`, `mysubreddits`

**Validation:**
```bash
# Tester les credentials Reddit
curl -X POST https://www.reddit.com/api/v1/access_token \
  -u "CLIENT_ID:CLIENT_SECRET" \
  -H "User-Agent: Huntaze/1.0.0" \
  -d "grant_type=client_credentials"
```

---

## 🔧 Étape 3: Configurer AWS Amplify (30 min)

### 3.1 Ajouter les Variables d'Environnement

**Via AWS Console:**
1. Aller sur AWS Amplify Console
2. Sélectionner l'app Huntaze
3. Aller dans "Environment variables"
4. Ajouter/Mettre à jour:

```bash
# Security Tokens
ADMIN_TOKEN=[token généré à l'étape 1]
DEBUG_TOKEN=[token généré à l'étape 1]

# TikTok OAuth
TIKTOK_CLIENT_KEY=[obtenu à l'étape 2.1]
TIKTOK_CLIENT_SECRET=[obtenu à l'étape 2.1]
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/api/auth/callback/tiktok

# Instagram/Facebook OAuth
FACEBOOK_APP_ID=[obtenu à l'étape 2.2]
FACEBOOK_APP_SECRET=[obtenu à l'étape 2.2]
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://huntaze.com/api/auth/callback/instagram

# Reddit OAuth
REDDIT_CLIENT_ID=[obtenu à l'étape 2.3]
REDDIT_CLIENT_SECRET=[obtenu à l'étape 2.3]
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://huntaze.com/api/auth/callback/reddit
REDDIT_USER_AGENT=Huntaze/1.0.0

# Rate Limiting (déjà configuré via api-rate-limiting spec)
AI_AGENT_TIMEOUT=30000
AI_AGENT_MAX_REQUESTS_PER_MINUTE=10
```

**Via AWS CLI:**
```bash
# Script pour mettre à jour toutes les variables
aws amplify update-app \
  --app-id YOUR_APP_ID \
  --environment-variables \
    ADMIN_TOKEN="[token]" \
    DEBUG_TOKEN="[token]" \
    TIKTOK_CLIENT_KEY="[key]" \
    # ... etc
```

### 3.2 Redéployer l'Application

```bash
# Trigger un nouveau déploiement
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE
```

---

## ✅ Étape 4: Validation (1 heure)

### 4.1 Valider les Tokens

```bash
# Exécuter le script de validation
node scripts/validate-security-tokens.js
```

**Résultat attendu:**
```
✅ Admin Token: Valid (Length: 64, Entropy: 256 bits)
✅ Debug Token: Valid (Length: 64, Entropy: 256 bits)
✅ All tokens are valid and secure
```

### 4.2 Tester les Intégrations OAuth

**Instagram:**
```bash
# Test manuel
1. Aller sur https://huntaze.com/connect/instagram
2. Cliquer "Connect Instagram"
3. Autoriser l'app Facebook
4. Vérifier la redirection et connexion réussie
```

**TikTok:**
```bash
# Test manuel
1. Aller sur https://huntaze.com/connect/tiktok
2. Cliquer "Connect TikTok"
3. Autoriser l'app TikTok
4. Vérifier la redirection et connexion réussie
```

**Reddit:**
```bash
# Test manuel
1. Aller sur https://huntaze.com/connect/reddit
2. Cliquer "Connect Reddit"
3. Autoriser l'app Reddit
4. Vérifier la redirection et connexion réussie
```

### 4.3 Valider avec les Services Optimisés

```typescript
// Test programmatique
import { instagramOAuthOptimized } from '@/lib/services/instagramOAuth-optimized';
import { tiktokOAuthOptimized } from '@/lib/services/tiktokOAuth-optimized';
import { redditOAuthOptimized } from '@/lib/services/redditOAuth-optimized';

// Test Instagram
const igUrl = await instagramOAuthOptimized.getAuthorizationUrl();
console.log('Instagram URL:', igUrl.url);

// Test TikTok
const ttUrl = await tiktokOAuthOptimized.getAuthorizationUrl();
console.log('TikTok URL:', ttUrl.url);

// Test Reddit
const rdUrl = await redditOAuthOptimized.getAuthorizationUrl();
console.log('Reddit URL:', rdUrl.url);
```

---

## 📋 Checklist de Complétion

### Tokens Sécurisés
- [ ] ADMIN_TOKEN généré (64 chars, 256 bits entropy)
- [ ] DEBUG_TOKEN généré (64 chars, 256 bits entropy)
- [ ] Backup créé
- [ ] Tokens validés
- [ ] Tokens configurés dans Amplify

### OAuth Credentials - TikTok
- [ ] App TikTok créée sur developers.tiktok.com
- [ ] TIKTOK_CLIENT_KEY obtenu
- [ ] TIKTOK_CLIENT_SECRET obtenu
- [ ] Redirect URI configuré
- [ ] Scopes configurés
- [ ] Credentials testés
- [ ] Credentials configurés dans Amplify

### OAuth Credentials - Instagram
- [ ] App Facebook créée sur developers.facebook.com
- [ ] FACEBOOK_APP_ID obtenu
- [ ] FACEBOOK_APP_SECRET obtenu
- [ ] Instagram Basic Display API activé
- [ ] Redirect URI configuré
- [ ] Permissions configurées
- [ ] Credentials testés
- [ ] Credentials configurés dans Amplify

### OAuth Credentials - Reddit
- [ ] App Reddit créée sur reddit.com/prefs/apps
- [ ] REDDIT_CLIENT_ID obtenu
- [ ] REDDIT_CLIENT_SECRET obtenu
- [ ] Redirect URI configuré
- [ ] User Agent configuré
- [ ] Credentials testés
- [ ] Credentials configurés dans Amplify

### Validation Finale
- [ ] Tous les credentials validés
- [ ] Déploiement Amplify réussi
- [ ] Tests OAuth manuels passés
- [ ] Tests automatisés passés
- [ ] Monitoring configuré
- [ ] Documentation à jour

---

## 🚨 Troubleshooting

### Problème: Token generation échoue

**Symptômes:**
- Script plante
- Erreur "crypto module not found"

**Solution:**
```bash
# Vérifier Node.js version
node --version  # Doit être >= 18

# Réinstaller dépendances
npm install
```

### Problème: OAuth credentials invalides

**Symptômes:**
- Erreur "invalid_client"
- Erreur "unauthorized"

**Solution:**
1. Vérifier que les credentials sont corrects (copier/coller)
2. Vérifier que l'app est en mode "Live" (pas "Development")
3. Vérifier que les redirect URIs correspondent exactement
4. Vérifier que les permissions/scopes sont approuvés

### Problème: Amplify ne met pas à jour les variables

**Symptômes:**
- Variables pas prises en compte
- Anciennes valeurs utilisées

**Solution:**
```bash
# Forcer un redéploiement
aws amplify start-job \
  --app-id YOUR_APP_ID \
  --branch-name main \
  --job-type RELEASE

# Vérifier les variables
aws amplify get-app --app-id YOUR_APP_ID
```

---

## 📊 Temps Estimé Total

| Étape | Temps | Responsable |
|-------|-------|-------------|
| 1. Générer tokens | 30 min | DevOps |
| 2.1 TikTok credentials | 1h | DevOps |
| 2.2 Instagram credentials | 1h | DevOps |
| 2.3 Reddit credentials | 1h | DevOps |
| 3. Configurer Amplify | 30 min | DevOps |
| 4. Validation | 1h | QA |
| **TOTAL** | **5 heures** | - |

**Note:** Temps réel peut être plus long si:
- Apps OAuth nécessitent review (1-7 jours)
- Problèmes de configuration
- Tests révèlent des bugs

---

## 🎯 Critères de Succès

### Sécurité
- ✅ Aucun token par défaut en production
- ✅ Tous les tokens >= 256 bits entropy
- ✅ Backup des tokens créé

### OAuth
- ✅ Instagram OAuth fonctionne (test manuel)
- ✅ TikTok OAuth fonctionne (test manuel)
- ✅ Reddit OAuth fonctionne (test manuel)
- ✅ Aucune erreur "invalid_client"

### Configuration
- ✅ Toutes les variables configurées dans Amplify
- ✅ Déploiement réussi
- ✅ Application démarre sans erreur

### Validation
- ✅ Script de validation passe
- ✅ Tests automatisés passent
- ✅ Monitoring actif

---

## 📝 Notes Importantes

### Sécurité
- ⚠️ **NE JAMAIS** commiter les tokens dans Git
- ⚠️ **NE JAMAIS** partager les tokens publiquement
- ⚠️ Utiliser des tokens différents pour staging et production
- ⚠️ Créer des backups réguliers

### OAuth Apps
- Les apps peuvent nécessiter une review (1-7 jours)
- Commencer les demandes de review tôt
- Avoir un plan B (mode démo) si review retardée

### Amplify
- Les variables d'environnement nécessitent un redéploiement
- Vérifier que les variables sont bien prises en compte
- Tester après chaque changement

---

## 🚀 Après Complétion

Une fois cette spec complète:
- ✅ Marquer la tâche 2 comme complète (OAuth validators déjà faits)
- ✅ Marquer les tâches 3-8 comme complètes
- ✅ Mettre à jour le status de la spec à 100%
- ✅ Passer à production-launch-fixes

**Spec passera de 12.5% → 100%**

---

**Guide créé par:** Kiro AI Assistant  
**Date:** 2025-11-14  
**Version:** 1.0.0
