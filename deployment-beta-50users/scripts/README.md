# 🔧 Scripts de Déploiement

**Date**: 23 décembre 2025  
**Objectif**: Automatiser la récupération des clés et le déploiement

---

## 📋 Scripts Disponibles

### 1️⃣ get-all-keys.sh (RECOMMANDÉ) ⚡

**Récupère TOUTES les clés automatiquement**

```bash
./deployment-beta-50users/scripts/get-all-keys.sh
```

**Ce qu'il fait**:
- ✅ Récupère les clés Azure AI
- ✅ Récupère les clés Azure Speech
- ✅ Récupère les clés AWS
- ✅ Fusionne toutes les clés
- ✅ Crée un fichier prêt pour Vercel
- ✅ Teste les connexions

**Fichiers créés**:
- `azure-keys.env` - Clés Azure
- `aws-keys.env` - Clés AWS
- `all-keys.env` - Toutes les clés fusionnées
- `VERCEL-READY.txt` - Prêt pour Vercel

**Temps**: 5-10 minutes

---

### 2️⃣ get-azure-keys.sh

**Récupère uniquement les clés Azure**

```bash
./deployment-beta-50users/scripts/get-azure-keys.sh
```

**Ce qu'il fait**:
- Se connecte à Azure
- Trouve le resource group automatiquement
- Récupère la clé Azure AI
- Récupère la clé Azure Speech
- Détecte les endpoints des modèles
- Teste les connexions

**Fichiers créés**:
- `azure-keys.env`

**Temps**: 2-3 minutes

---

### 3️⃣ get-aws-keys.sh

**Récupère uniquement les clés AWS**

```bash
./deployment-beta-50users/scripts/get-aws-keys.sh
```

**Ce qu'il fait**:
- Se connecte à AWS
- Vérifie les access keys existantes
- Crée une nouvelle access key (si nécessaire)
- Récupère la configuration infrastructure
- Teste les connexions

**Fichiers créés**:
- `aws-keys.env`

**Temps**: 2-3 minutes

---

### 4️⃣ deploy-aws-infrastructure.sh

**Déploie l'infrastructure AWS** (déjà exécuté)

```bash
./deployment-beta-50users/scripts/deploy-aws-infrastructure.sh
```

**Ce qu'il fait**:
- Crée le VPC et subnets
- Déploie PostgreSQL RDS
- Déploie Redis Serverless
- Crée le bucket S3
- Configure les Security Groups

**Statut**: ✅ Déjà exécuté

---

### 5️⃣ finalize-aws-setup.sh

**Finalise la configuration AWS** (déjà exécuté)

```bash
./deployment-beta-50users/scripts/finalize-aws-setup.sh
```

**Ce qu'il fait**:
- Génère un mot de passe RDS sécurisé
- Stocke les secrets dans AWS Secrets Manager
- Crée les URLs de connexion
- Sauvegarde la configuration

**Statut**: ✅ Déjà exécuté

---

## 🔧 Prérequis

### Azure CLI

```bash
# Vérifier
az --version

# Installer (macOS)
brew install azure-cli

# Installer (Linux)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

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

# Installer (Linux)
pip install awscli

# Se connecter
aws configure
```

---

## 🚀 Workflow Recommandé

### Déploiement Complet

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

## 📁 Fichiers Créés

Après exécution des scripts:

```
deployment-beta-50users/
├── azure-keys.env           # Clés Azure uniquement
├── aws-keys.env             # Clés AWS uniquement
├── all-keys.env             # TOUTES les clés fusionnées
├── VERCEL-READY.txt         # Prêt à copier dans Vercel
├── COPY-PASTE-VERCEL.txt    # Mis à jour avec les vraies clés
└── aws-infrastructure-config.env  # Configuration AWS (déjà créé)
```

---

## 🔐 Sécurité

### Fichiers Protégés

Les scripts ajoutent automatiquement au `.gitignore`:
```
azure-keys.env
aws-keys.env
all-keys.env
VERCEL-READY.txt
```

### Bonnes Pratiques

- ❌ **NE COMMITE PAS** les fichiers `*-keys.env` dans Git
- ❌ **NE PARTAGE PAS** les clés publiquement
- ✅ **SAUVEGARDE** `all-keys.env` en lieu sûr
- ✅ **ROTATE** les clés régulièrement
- ✅ **UTILISE** des secrets managers en production

---

## 🆘 Dépannage

### Script non exécutable

```bash
# Rendre le script exécutable
chmod +x deployment-beta-50users/scripts/get-all-keys.sh
```

---

### Azure CLI non trouvé

```bash
# Installer Azure CLI
brew install azure-cli  # macOS
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash  # Linux
```

---

### AWS CLI non trouvé

```bash
# Installer AWS CLI
brew install awscli  # macOS
pip install awscli  # Linux
```

---

### Non connecté à Azure

```bash
# Se connecter
az login

# Vérifier
az account show
```

---

### Non connecté à AWS

```bash
# Configurer
aws configure

# Vérifier
aws sts get-caller-identity
```

---

## 📚 Documentation

- **CLI-GUIDE.md** - Guide complet CLI
- **QUICK-START-CLI.md** - Démarrage rapide
- **NEXT-STEP.md** - Guide manuel détaillé

---

## 🎯 Résumé

| Script | Fonction | Temps | Statut |
|--------|----------|-------|--------|
| `get-all-keys.sh` | Récupère TOUT | 5-10 min | ⚡ RECOMMANDÉ |
| `get-azure-keys.sh` | Clés Azure | 2-3 min | ✅ Disponible |
| `get-aws-keys.sh` | Clés AWS | 2-3 min | ✅ Disponible |
| `deploy-aws-infrastructure.sh` | Infrastructure AWS | - | ✅ Déjà exécuté |
| `finalize-aws-setup.sh` | Finalisation AWS | - | ✅ Déjà exécuté |

---

**Prêt? Exécute `get-all-keys.sh` et go! 🚀**

```bash
./deployment-beta-50users/scripts/get-all-keys.sh
```
