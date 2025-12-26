# 🚀 Quick Start CLI - Déploiement en 5 Minutes

**Date**: 23 décembre 2025  
**Méthode**: Récupération automatique via CLI

---

## ⚡ Déploiement Ultra-Rapide

### 1️⃣ Récupère TOUTES les clés automatiquement

```bash
./deployment-beta-50users/scripts/get-all-keys.sh
```

**Temps**: 5-10 minutes

---

### 2️⃣ Copie dans Vercel

```bash
# Affiche les variables prêtes pour Vercel
cat deployment-beta-50users/VERCEL-READY.txt
```

**Action**:
1. Copie TOUT le contenu
2. Va sur [vercel.com](https://vercel.com) → Ton projet → Settings → Environment Variables
3. Colle les variables
4. Sélectionne: Production, Preview, Development
5. Clique "Save"

**Temps**: 5 minutes

---

### 3️⃣ Initialise la base de données

```bash
# Charge DATABASE_URL
export DATABASE_URL=$(grep DATABASE_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2-)

# Initialise Prisma
npx prisma db push
```

**Temps**: 2 minutes

---

### 4️⃣ Déploie sur Vercel

```bash
vercel --prod
```

**Temps**: 3-5 minutes

---

## ✅ C'est Tout!

**Temps total**: 15-20 minutes

Ton app est maintenant en production! 🎉

---

## 🔧 Prérequis

### Azure CLI

```bash
# Vérifier
az --version

# Installer (macOS)
brew install azure-cli

# Se connecter
az login
```

---

### AWS CLI

```bash
# Vérifier
aws --version

# Installer (macOS)
brew install awscli

# Se connecter
aws configure
```

---

## 📋 Commandes Complètes

```bash
# 1. Récupérer toutes les clés
./deployment-beta-50users/scripts/get-all-keys.sh

# 2. Vérifier les clés
cat deployment-beta-50users/all-keys.env

# 3. Copier dans Vercel
cat deployment-beta-50users/VERCEL-READY.txt
# → Colle dans Vercel (Settings → Environment Variables)

# 4. Initialiser la base de données
export DATABASE_URL=$(grep DATABASE_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
npx prisma db push

# 5. Déployer
vercel --prod

# 6. Tester
vercel logs --prod
```

---

## 🧪 Tests Optionnels

### Test PostgreSQL

```bash
export DATABASE_URL=$(grep DATABASE_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
psql "$DATABASE_URL" -c "SELECT 1;"
```

---

### Test Redis

```bash
REDIS_HOST=$(grep REDIS_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2- | sed 's|redis://||' | cut -d':' -f1)
redis-cli -h "$REDIS_HOST" -p 6379 ping
```

---

### Test S3

```bash
export AWS_ACCESS_KEY_ID=$(grep AWS_ACCESS_KEY_ID deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
export AWS_SECRET_ACCESS_KEY=$(grep AWS_SECRET_ACCESS_KEY deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
export AWS_REGION=$(grep AWS_REGION deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
S3_BUCKET=$(grep AWS_S3_BUCKET deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
aws s3 ls "s3://$S3_BUCKET" --region "$AWS_REGION"
```

---

### Test Azure AI

```bash
AZURE_AI_KEY=$(grep AZURE_AI_API_KEY deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
AZURE_ENDPOINT=$(grep AZURE_DEEPSEEK_V3_ENDPOINT deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
curl -X POST "$AZURE_ENDPOINT/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_AI_KEY" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":10}'
```

---

## 🆘 Problèmes?

### Azure CLI non installé

```bash
# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

---

### AWS CLI non installé

```bash
# macOS
brew install awscli

# Linux
pip install awscli
```

---

### Non connecté à Azure

```bash
az login
```

---

### Non connecté à AWS

```bash
aws configure
```

---

## 📚 Documentation Complète

- **CLI-GUIDE.md** - Guide complet CLI
- **NEXT-STEP.md** - Guide manuel détaillé
- **START-HERE-AWS.md** - Point de départ principal

---

## 🔐 Sécurité

- ✅ Les fichiers `*-keys.env` sont dans `.gitignore`
- ✅ Ne commite PAS ces fichiers dans Git
- ✅ Sauvegarde `all-keys.env` en lieu sûr

---

**Prêt? Exécute la première commande et go! 🚀**

```bash
./deployment-beta-50users/scripts/get-all-keys.sh
```
