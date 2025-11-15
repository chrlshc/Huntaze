# 🚨 STAGING 500 ERROR - Action Immédiate

**URL:** https://staging.huntaze.com/  
**Error:** Internal Server Error (500)  
**Status:** 🔴 SITE DOWN

---

## 🔍 Diagnostic Rapide

### Causes Probables du 500

1. **Variables d'environnement manquantes** (le plus probable)
   - DATABASE_URL
   - NEXTAUTH_SECRET
   - AZURE_OPENAI_API_KEY
   
2. **Database connection failed**
   - PostgreSQL non accessible
   - Credentials invalides
   
3. **Build/Runtime error**
   - Code cassé
   - Dépendance manquante

---

## ⚡ Actions Immédiates

### 1. Vérifier les logs Amplify

```bash
# Via AWS Console
aws amplify get-app --app-id <APP_ID>

# Ou via console web
https://console.aws.amazon.com/amplify/
→ Huntaze staging
→ Deployments
→ Logs
```

### 2. Vérifier les variables d'environnement

**Variables CRITIQUES manquantes:**
```bash
❌ DATABASE_URL
❌ NEXTAUTH_SECRET  
❌ NEXTAUTH_URL
❌ JWT_SECRET
❌ AZURE_OPENAI_API_KEY
❌ AZURE_OPENAI_ENDPOINT
❌ AZURE_OPENAI_API_VERSION
❌ AZURE_OPENAI_DEPLOYMENT
```

### 3. Configurer les variables dans Amplify

```bash
# Via AWS CLI avec credentials IAM
export AWS_ACCESS_KEY_ID="<your-access-key>"
export AWS_SECRET_ACCESS_KEY="<your-secret-key>"
export AWS_SESSION_TOKEN="<your-session-token>"

# Lister les apps
aws amplify list-apps --region us-east-1

# Configurer les variables
aws amplify update-app \
  --app-id <APP_ID> \
  --environment-variables \
    DATABASE_URL="<value>" \
    NEXTAUTH_SECRET="<value>" \
    NEXTAUTH_URL="https://staging.huntaze.com" \
  --region us-east-1
```

---

## 🔧 Fix Rapide

### Option 1: Via AWS Console (RECOMMANDÉ)

1. Aller sur https://console.aws.amazon.com/amplify/
2. Sélectionner l'app Huntaze
3. Aller dans "Environment variables"
4. Ajouter les variables manquantes
5. Redéployer

### Option 2: Via Script

```bash
# Utiliser le script existant
tsx scripts/setup-production-environment.ts --env staging
```

---

## 📋 Variables à Configurer

### CRITIQUES (App ne démarre pas sans)

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"
NEXTAUTH_SECRET="<32+ chars random string>"
NEXTAUTH_URL="https://staging.huntaze.com"
JWT_SECRET="<32+ chars random string>"
NODE_ENV="production"
```

### AI (Features principales)

```bash
AZURE_OPENAI_API_KEY="<64 chars>"
AZURE_OPENAI_ENDPOINT="https://<name>.openai.azure.com"
AZURE_OPENAI_API_VERSION="2024-02-15-preview"
AZURE_OPENAI_DEPLOYMENT="<deployment-name>"
```

### AWS (Déjà configuré)

```bash
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="<from IAM>"
AWS_SECRET_ACCESS_KEY="<from IAM>"
```

---

## 🚀 Commandes de Debug

### Voir les logs en temps réel

```bash
# Via AWS CLI
aws logs tail /aws/amplify/<app-id> --follow --region us-east-1

# Ou via Amplify CLI
amplify console
```

### Tester localement avec les mêmes variables

```bash
# Créer .env.local avec les variables staging
cp .env.staging .env.local

# Tester
npm run build
npm run start
```

---

## ✅ Checklist de Résolution

- [ ] Vérifier les logs Amplify
- [ ] Identifier l'erreur exacte (DATABASE_URL? NEXTAUTH?)
- [ ] Configurer les variables manquantes
- [ ] Redéployer l'app
- [ ] Tester https://staging.huntaze.com/
- [ ] Vérifier les routes principales
- [ ] Tester l'authentification

---

## 🎯 Prochaines Étapes

1. **Immédiat:** Configurer DATABASE_URL et NEXTAUTH_SECRET
2. **Court terme:** Configurer toutes les variables critiques
3. **Moyen terme:** Setup monitoring pour éviter ça

---

**Status:** 🔴 ACTION REQUISE  
**Priorité:** P0 - CRITIQUE  
**Impact:** Site staging inaccessible
