# 🔑 Guide CLI - Récupération Automatique des Clés

**Date**: 23 décembre 2025  
**Objectif**: Récupérer toutes les clés automatiquement via CLI

---

## 🚀 Méthode Rapide (RECOMMANDÉ)

### Un seul script pour tout récupérer

```bash
# Exécute le script master
./deployment-beta-50users/scripts/get-all-keys.sh
```

**Ce script fait tout**:
1. ✅ Récupère les clés Azure AI
2. ✅ Récupère les clés Azure Speech
3. ✅ Récupère les clés AWS
4. ✅ Fusionne toutes les clés
5. ✅ Crée un fichier prêt pour Vercel
6. ✅ Met à jour COPY-PASTE-VERCEL.txt

**Temps**: 5-10 minutes

---

## 📋 Méthode Détaillée (Étape par Étape)

### Étape 1: Récupérer les Clés Azure

```bash
# Exécute le script Azure
./deployment-beta-50users/scripts/get-azure-keys.sh
```

**Ce que fait le script**:
- Se connecte à Azure (si pas déjà connecté)
- Trouve ton resource group automatiquement
- Récupère la clé Azure AI
- Récupère la clé Azure Speech
- Détecte les endpoints des modèles
- Sauvegarde dans `azure-keys.env`
- Met à jour `COPY-PASTE-VERCEL.txt`
- Teste les clés

**Fichiers créés**:
- `deployment-beta-50users/azure-keys.env`

---

### Étape 2: Récupérer les Clés AWS

```bash
# Exécute le script AWS
./deployment-beta-50users/scripts/get-aws-keys.sh
```

**Ce que fait le script**:
- Se connecte à AWS (si pas déjà connecté)
- Vérifie les access keys existantes
- Crée une nouvelle access key (si nécessaire)
- Récupère la configuration infrastructure
- Sauvegarde dans `aws-keys.env`
- Met à jour `COPY-PASTE-VERCEL.txt`
- Teste les clés

**Fichiers créés**:
- `deployment-beta-50users/aws-keys.env`

---

## 📁 Fichiers Créés

Après exécution, tu auras:

```
deployment-beta-50users/
├── azure-keys.env           # Clés Azure uniquement
├── aws-keys.env             # Clés AWS uniquement
├── all-keys.env             # TOUTES les clés fusionnées
├── VERCEL-READY.txt         # Prêt à copier dans Vercel
└── COPY-PASTE-VERCEL.txt    # Mis à jour avec les vraies clés
```

---

## 🔧 Prérequis

### Azure CLI

**Vérifier l'installation**:
```bash
az --version
```

**Installer si nécessaire**:
```bash
# macOS
brew install azure-cli

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Windows
# https://aka.ms/installazurecliwindows
```

**Se connecter**:
```bash
az login
```

---

### AWS CLI

**Vérifier l'installation**:
```bash
aws --version
```

**Installer si nécessaire**:
```bash
# macOS
brew install awscli

# Linux
pip install awscli

# Windows
# https://aws.amazon.com/cli/
```

**Se connecter**:
```bash
aws configure
```

---

## 📋 Utilisation des Clés Récupérées

### Option 1: Copier dans Vercel (Interface Web)

```bash
# 1. Affiche les clés prêtes pour Vercel
cat deployment-beta-50users/VERCEL-READY.txt

# 2. Copie TOUT le contenu

# 3. Va sur vercel.com
#    → Ton projet
#    → Settings
#    → Environment Variables
#    → Colle les variables
#    → Sélectionne: Production, Preview, Development
#    → Save
```

---

### Option 2: Copier dans Vercel (CLI)

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Importer les variables
vercel env pull

# Ou ajouter manuellement
vercel env add DATABASE_URL production
# ... etc
```

---

### Option 3: Utiliser Localement

```bash
# Charger les variables dans ton shell
source deployment-beta-50users/all-keys.env

# Ou exporter individuellement
export DATABASE_URL=$(grep DATABASE_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
export REDIS_URL=$(grep REDIS_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
# ... etc
```

---

## 🧪 Tester les Clés

### Test PostgreSQL

```bash
# Charger DATABASE_URL
export DATABASE_URL=$(grep DATABASE_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2-)

# Tester la connexion
psql "$DATABASE_URL" -c "SELECT 1;"
```

---

### Test Redis

```bash
# Extraire l'endpoint Redis
REDIS_HOST=$(grep REDIS_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2- | sed 's|redis://||' | cut -d':' -f1)

# Tester la connexion
redis-cli -h "$REDIS_HOST" -p 6379 ping
```

---

### Test S3

```bash
# Charger les variables AWS
export AWS_ACCESS_KEY_ID=$(grep AWS_ACCESS_KEY_ID deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
export AWS_SECRET_ACCESS_KEY=$(grep AWS_SECRET_ACCESS_KEY deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
export AWS_REGION=$(grep AWS_REGION deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
S3_BUCKET=$(grep AWS_S3_BUCKET deployment-beta-50users/all-keys.env | cut -d'=' -f2-)

# Tester S3
aws s3 ls "s3://$S3_BUCKET" --region "$AWS_REGION"
```

---

### Test Azure AI

```bash
# Charger les variables Azure
AZURE_AI_KEY=$(grep AZURE_AI_API_KEY deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
AZURE_ENDPOINT=$(grep AZURE_DEEPSEEK_V3_ENDPOINT deployment-beta-50users/all-keys.env | cut -d'=' -f2-)

# Tester Azure AI
curl -X POST "$AZURE_ENDPOINT/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_AI_KEY" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":10}'
```

---

## 🆘 Dépannage

### Erreur: "Azure CLI not found"

```bash
# Installer Azure CLI
brew install azure-cli  # macOS
# ou
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux
```

---

### Erreur: "AWS CLI not found"

```bash
# Installer AWS CLI
brew install awscli  # macOS
# ou
pip install awscli  # Linux
```

---

### Erreur: "Not logged in to Azure"

```bash
# Se connecter à Azure
az login

# Vérifier la connexion
az account show
```

---

### Erreur: "Not logged in to AWS"

```bash
# Configurer AWS
aws configure

# Vérifier la connexion
aws sts get-caller-identity
```

---

### Erreur: "Resource group not found"

Le script te demandera de choisir manuellement:

```bash
# Lister les resource groups
az group list --query "[].name" -o tsv

# Le script te demandera d'entrer le nom
```

---

### Erreur: "Access key limit reached (2 keys)"

AWS limite à 2 access keys par utilisateur:

```bash
# Lister les clés existantes
aws iam list-access-keys --user-name ton-user

# Supprimer une clé
aws iam delete-access-key --user-name ton-user --access-key-id AKIAXXXXXXXX

# Créer une nouvelle clé
aws iam create-access-key --user-name ton-user
```

---

## 🔐 Sécurité

### ⚠️ IMPORTANT

- ❌ **NE COMMITE PAS** les fichiers `*-keys.env` dans Git
- ❌ **NE PARTAGE PAS** les clés publiquement
- ✅ **SAUVEGARDE** `all-keys.env` en lieu sûr
- ✅ **ROTATE** les clés régulièrement
- ✅ **UTILISE** des secrets managers en production

### Fichiers Protégés

Les scripts ajoutent automatiquement au `.gitignore`:
```
azure-keys.env
aws-keys.env
all-keys.env
VERCEL-READY.txt
```

---

## 📊 Résumé des Scripts

| Script | Fonction | Temps |
|--------|----------|-------|
| `get-all-keys.sh` | Récupère TOUT automatiquement | 5-10 min |
| `get-azure-keys.sh` | Récupère clés Azure uniquement | 2-3 min |
| `get-aws-keys.sh` | Récupère clés AWS uniquement | 2-3 min |

---

## 🎯 Workflow Complet

```bash
# 1. Récupérer toutes les clés
./deployment-beta-50users/scripts/get-all-keys.sh

# 2. Vérifier les clés
cat deployment-beta-50users/all-keys.env

# 3. Copier dans Vercel
cat deployment-beta-50users/VERCEL-READY.txt
# → Colle dans Vercel

# 4. Initialiser la base de données
export DATABASE_URL=$(grep DATABASE_URL deployment-beta-50users/all-keys.env | cut -d'=' -f2-)
npx prisma db push

# 5. Déployer
vercel --prod
```

**Temps total**: 15-20 minutes

---

**Prêt? Exécute `./deployment-beta-50users/scripts/get-all-keys.sh` et go! 🚀**
