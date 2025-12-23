# 🚀 Démarrage Rapide - 5 Minutes

**Version**: 2.0 (Azure Functions)  
**Temps**: ~5 minutes pour setup, ~15 minutes pour déploiement

---

## ⚡ Quick Start

### 1️⃣ Login Azure (30 secondes)

```bash
# Se connecter à Azure
az login

# Vérifier la connexion
az account show
```

### 2️⃣ Exports Minimum (30 secondes)

```bash
# Subscription ID (requis)
export AZ_SUBSCRIPTION_ID="your-subscription-id-here"

# Région (optionnel, défaut: eastus2)
export AZ_LOCATION="eastus2"

# Resource Group (optionnel, défaut: huntaze-beta-rg)
export AZ_RG="huntaze-beta-rg"

# Storage unique (optionnel, généré automatiquement si non fourni)
export STORAGE="sthzworkerseus2$RANDOM"
```

**Note**: Le script génère automatiquement des noms uniques si tu ne fournis pas `STORAGE`, `FUNCAPP`, etc.

### 3️⃣ Deploy Infrastructure (10-15 minutes)

```bash
cd deployment-beta-50users/scripts
./deploy-azure-workers.sh
```

**Ce qui est créé**:
- ✅ Resource Group
- ✅ Storage Account
- ✅ Premium Plan (EP1)
- ✅ Function App
- ✅ Service Bus Namespace
- ✅ Topics (huntaze-jobs, huntaze-events)
- ✅ Subscriptions avec SQL filters
- ✅ Authorization Rules

**Output important**:
```
SERVICEBUS_CONNECTION_SEND="Endpoint=sb://..."
SERVICEBUS_CONNECTION="Endpoint=sb://..."
```

**💾 Sauvegarde ces connection strings !**

### 4️⃣ Test Enqueue Job (30 secondes)

**Option A: Test avec curl (sans Vercel)**

```bash
# Tester directement Service Bus
cd deployment-beta-50users/scripts

# Configurer les variables
export AZURE_SB_NAMESPACE="huntaze-sb-xxx"  # Remplacer par ton namespace
export AZURE_FUNCAPP="huntaze-workers-xxx"  # Remplacer par ton function app
export AZURE_RG="huntaze-beta-rg"

# Exécuter le test
./test-workers.sh
```

**Option B: Test avec Vercel (après déploiement API)**

```bash
# Configurer Vercel URL
export VERCEL_URL="https://your-app.vercel.app"

# Tester
./test-workers.sh
```

---

## 📋 Checklist Rapide

- [ ] Azure CLI installé (`az --version`)
- [ ] Connecté à Azure (`az login`)
- [ ] Subscription ID récupéré
- [ ] Script déployé (`./deploy-azure-workers.sh`)
- [ ] Connection strings sauvegardés
- [ ] Test exécuté (`./test-workers.sh`)

---

## 🐛 Problèmes Fréquents

### "Azure CLI not installed"

```bash
# macOS
brew install azure-cli

# Vérifier
az --version
```

### "Not logged in"

```bash
az login
```

### "Subscription not found"

```bash
# Lister les subscriptions
az account list --output table

# Sélectionner une subscription
az account set --subscription "your-subscription-id"
```

### "Resource already exists"

Le script génère des noms uniques automatiquement. Si tu veux forcer un nouveau déploiement:

```bash
# Supprimer le resource group existant
az group delete --name huntaze-beta-rg --yes

# Redéployer
./deploy-azure-workers.sh
```

---

## 📊 Coût

**Infrastructure déployée**: ~$156.88/mois
- Premium EP1: $146.88/mois
- Service Bus Standard: $10/mois

**Note**: Aucun coût pendant les 30 premiers jours si tu utilises les crédits Azure gratuits.

---

## 🎯 Prochaines Étapes

### Après le déploiement infrastructure:

1. **Créer le projet Azure Functions** (30 minutes)
   ```bash
   mkdir huntaze-workers
   cd huntaze-workers
   func init --typescript
   npm install @azure/functions @azure/service-bus @prisma/client
   ```

2. **Copier le code des workers** (15 minutes)
   - Voir: [AZURE-WORKERS-GUIDE.md](../AZURE-WORKERS-GUIDE.md)
   - Section "Implémentation Code"

3. **Déployer les functions** (5 minutes)
   ```bash
   npm run build
   func azure functionapp publish huntaze-workers-xxx
   ```

4. **Configurer Vercel** (10 minutes)
   - Ajouter `SERVICEBUS_CONNECTION_SEND` dans Vercel
   - Créer API routes (voir guide)

5. **Tester end-to-end** (5 minutes)
   ```bash
   export VERCEL_URL="https://your-app.vercel.app"
   ./test-workers.sh
   ```

---

## 📚 Documentation Complète

- **[AZURE-WORKERS-GUIDE.md](../AZURE-WORKERS-GUIDE.md)** - Guide complet
- **[AZURE-WORKERS-RESUME.md](../AZURE-WORKERS-RESUME.md)** - Résumé décision
- **[README.md](../README.md)** - Budget et architecture
- **[LISEZMOI.md](../LISEZMOI.md)** - Guide rapide français

---

## 💡 Tips

### Générer un nom unique pour Storage

```bash
# Méthode 1: Random
export STORAGE="sthzworkerseus2$RANDOM"

# Méthode 2: Date
export STORAGE="sthzworkerseus2$(date +%s)"

# Méthode 3: UUID (macOS)
export STORAGE="sthzworkerseus2$(uuidgen | cut -d'-' -f1 | tr '[:upper:]' '[:lower:]')"
```

### Vérifier les ressources créées

```bash
# Lister les ressources dans le resource group
az resource list --resource-group huntaze-beta-rg --output table

# Vérifier Function App
az functionapp show --name huntaze-workers-xxx --resource-group huntaze-beta-rg

# Vérifier Service Bus
az servicebus namespace show --name huntaze-sb-xxx --resource-group huntaze-beta-rg
```

### Monitoring

```bash
# Logs Function App
az functionapp log tail --name huntaze-workers-xxx --resource-group huntaze-beta-rg

# Métriques Service Bus
az monitor metrics list \
  --resource /subscriptions/.../resourceGroups/huntaze-beta-rg/providers/Microsoft.ServiceBus/namespaces/huntaze-sb-xxx \
  --metric ActiveMessages
```

---

## ✅ Résumé

**Commandes essentielles**:
```bash
# 1. Login
az login

# 2. Exports
export AZ_SUBSCRIPTION_ID="..."

# 3. Deploy
cd deployment-beta-50users/scripts
./deploy-azure-workers.sh

# 4. Test
export AZURE_SB_NAMESPACE="huntaze-sb-xxx"
./test-workers.sh
```

**Durée totale**: ~20 minutes (infrastructure + test)

**Coût**: ~$156.88/mois (production-ready avec SLA 99.95%)

**Prochaine étape**: Créer le projet Azure Functions et déployer les workers

---

**Version**: 2.0  
**Dernière mise à jour**: 2025-12-22  
**Statut**: ✅ Prêt pour déploiement

