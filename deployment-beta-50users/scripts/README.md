# 🚀 Scripts de Déploiement Azure Workers

Ce dossier contient les scripts pour déployer et tester l'infrastructure Azure Functions + Service Bus.

---

## 📁 Scripts Disponibles

### 1. deploy-azure-workers.sh

**Description**: Déploiement automatique complet de l'infrastructure Azure Workers

**Ce qu'il fait**:
- ✅ Crée Resource Group
- ✅ Crée Storage Account
- ✅ Crée Premium Plan (EP1)
- ✅ Crée Function App
- ✅ Crée Service Bus Namespace (Standard)
- ✅ Crée Topics (huntaze-jobs, huntaze-events)
- ✅ Crée Subscriptions avec retry policies
- ✅ Crée SQL Filters pour routing
- ✅ Crée Authorization Rules (send-only, listen+send)
- ✅ Configure Function App Settings
- ✅ Déploie les Functions (si code existe)

**Prérequis**:
- Azure CLI installé (`az --version`)
- Connecté à Azure (`az login`)
- Variables d'environnement (optionnel):
  - `AZURE_DEEPSEEK_V3_ENDPOINT`
  - `AZURE_DEEPSEEK_R1_ENDPOINT`
  - `AZURE_PHI4_MULTIMODAL_ENDPOINT`
  - `AZURE_SPEECH_KEY`
  - `DATABASE_URL`
  - `REDIS_URL`

**Usage**:
```bash
cd deployment-beta-50users/scripts
./deploy-azure-workers.sh
```

**Durée**: ~10-15 minutes

**Coût**: ~$156.88/mois (Premium EP1 + Service Bus Standard)

**Output**:
- Resource Group name
- Function App name
- Service Bus namespace
- Connection strings (Functions + Vercel)

---

### 2. test-workers.sh

**Description**: Tests d'intégration pour vérifier le déploiement

**Ce qu'il fait**:
- ✅ Teste video analysis job
- ✅ Teste chat suggestions job
- ✅ Vérifie job status
- ✅ Vérifie Service Bus metrics
- ✅ Vérifie Function App health

**Prérequis**:
- Déploiement effectué (`deploy-azure-workers.sh`)
- Vercel déployé avec API routes
- Variables d'environnement:
  - `VERCEL_URL` (URL de votre app Vercel)
  - `AZURE_SB_NAMESPACE` (nom du Service Bus)
  - `AZURE_FUNCAPP` (nom de la Function App)
  - `TEST_CREATOR_ID` (optionnel, défaut: 123)

**Usage**:
```bash
cd deployment-beta-50users/scripts

# Configurer les variables
export VERCEL_URL="https://your-app.vercel.app"
export AZURE_SB_NAMESPACE="huntaze-sb-xxx"
export AZURE_FUNCAPP="huntaze-workers-xxx"

# Exécuter les tests
./test-workers.sh
```

**Durée**: ~30 secondes

**Output**:
- Job IDs créés
- Job status
- Service Bus metrics (active messages, DLQ)
- Function App health

---

## 🔧 Configuration

### Variables d'Environnement

**Pour deploy-azure-workers.sh**:
```bash
# Azure AI Endpoints (optionnel, peut être configuré après)
export AZURE_DEEPSEEK_V3_ENDPOINT="https://..."
export AZURE_DEEPSEEK_R1_ENDPOINT="https://..."
export AZURE_PHI4_MULTIMODAL_ENDPOINT="https://..."
export AZURE_SPEECH_KEY="..."

# Database et Cache (optionnel, peut être configuré après)
export DATABASE_URL="postgresql://..."
export REDIS_URL="redis://..."
```

**Pour test-workers.sh**:
```bash
# Vercel URL (requis)
export VERCEL_URL="https://your-app.vercel.app"

# Azure Resources (optionnel, pour metrics)
export AZURE_SB_NAMESPACE="huntaze-sb-xxx"
export AZURE_FUNCAPP="huntaze-workers-xxx"
export AZURE_RG="huntaze-beta-rg"

# Test Creator ID (optionnel)
export TEST_CREATOR_ID="123"
```

---

## 📋 Workflow Complet

### Étape 1: Déploiement Infrastructure

```bash
# 1. Se connecter à Azure
az login

# 2. Configurer les variables (optionnel)
export AZURE_DEEPSEEK_V3_ENDPOINT="https://..."
export DATABASE_URL="postgresql://..."

# 3. Déployer
cd deployment-beta-50users/scripts
./deploy-azure-workers.sh

# 4. Noter les outputs
# - Resource Group: huntaze-beta-rg
# - Function App: huntaze-workers-xxx
# - Service Bus: huntaze-sb-xxx
# - Connection Strings: SERVICEBUS_CONNECTION_SEND, SERVICEBUS_CONNECTION
```

### Étape 2: Création Projet Functions

```bash
# 1. Installer Azure Functions Core Tools
npm install -g azure-functions-core-tools@4

# 2. Créer le projet
mkdir huntaze-workers
cd huntaze-workers
func init --typescript

# 3. Installer dépendances
npm install @azure/functions @azure/service-bus @prisma/client applicationinsights

# 4. Copier le code des workers
# Voir: ../AZURE-WORKERS-GUIDE.md

# 5. Configurer local.settings.json
cat > local.settings.json <<EOF
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "SERVICEBUS_CONNECTION": "Endpoint=sb://...",
    "TOPIC_JOBS": "huntaze-jobs",
    "TOPIC_EVENTS": "huntaze-events"
  }
}
EOF
```

### Étape 3: Déploiement Functions

```bash
# 1. Build
npm run build

# 2. Deploy
func azure functionapp publish huntaze-workers-xxx

# 3. Vérifier
func azure functionapp list-functions huntaze-workers-xxx
```

### Étape 4: Configuration Vercel

```bash
# 1. Ajouter variables d'environnement dans Vercel
# SERVICEBUS_CONNECTION_SEND=Endpoint=sb://...
# TOPIC_JOBS=huntaze-jobs
# TOPIC_EVENTS=huntaze-events

# 2. Créer API routes
# app/api/jobs/video-analysis/route.ts
# app/api/jobs/chat-suggestions/route.ts

# 3. Déployer Vercel
vercel --prod
```

### Étape 5: Testing

```bash
# 1. Configurer variables
export VERCEL_URL="https://your-app.vercel.app"
export AZURE_SB_NAMESPACE="huntaze-sb-xxx"
export AZURE_FUNCAPP="huntaze-workers-xxx"

# 2. Exécuter tests
cd deployment-beta-50users/scripts
./test-workers.sh

# 3. Vérifier logs
az monitor app-insights component show --app huntaze-workers-xxx
```

---

## 🐛 Troubleshooting

### Erreur: "Azure CLI not installed"

**Solution**:
```bash
# macOS
brew install azure-cli

# Windows
winget install Microsoft.AzureCLI

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Erreur: "Not logged in to Azure"

**Solution**:
```bash
az login
```

### Erreur: "Function deployment failed"

**Solution**:
```bash
# Vérifier que le projet est bien build
cd huntaze-workers
npm run build

# Vérifier que le Function App existe
az functionapp show --name huntaze-workers-xxx --resource-group huntaze-beta-rg

# Redéployer
func azure functionapp publish huntaze-workers-xxx --force
```

### Erreur: "Service Bus connection failed"

**Solution**:
```bash
# Vérifier la connection string
az servicebus namespace authorization-rule keys list \
  --resource-group huntaze-beta-rg \
  --namespace-name huntaze-sb-xxx \
  --name RootManageSharedAccessKey

# Vérifier que le namespace existe
az servicebus namespace show \
  --resource-group huntaze-beta-rg \
  --name huntaze-sb-xxx
```

### Erreur: "DLQ messages detected"

**Solution**:
```bash
# Lire les messages DLQ
az servicebus topic subscription show \
  --resource-group huntaze-beta-rg \
  --namespace-name huntaze-sb-xxx \
  --topic-name huntaze-jobs \
  --subscription-name video-analysis

# Analyser les erreurs dans Application Insights
az monitor app-insights component show --app huntaze-workers-xxx
```

---

## 📊 Monitoring

### Application Insights

**Voir les logs**:
```bash
az monitor app-insights component show --app huntaze-workers-xxx
```

**Voir les métriques**:
```bash
az monitor metrics list \
  --resource /subscriptions/.../resourceGroups/huntaze-beta-rg/providers/Microsoft.Web/sites/huntaze-workers-xxx \
  --metric FunctionExecutionCount
```

### Service Bus

**Voir les métriques**:
```bash
# Active messages
az servicebus topic subscription show \
  --resource-group huntaze-beta-rg \
  --namespace-name huntaze-sb-xxx \
  --topic-name huntaze-jobs \
  --subscription-name video-analysis \
  --query "countDetails.activeMessageCount"

# Dead-letter messages
az servicebus topic subscription show \
  --resource-group huntaze-beta-rg \
  --namespace-name huntaze-sb-xxx \
  --topic-name huntaze-jobs \
  --subscription-name video-analysis \
  --query "countDetails.deadLetterMessageCount"
```

---

## 💰 Coûts

### Infrastructure Déployée

**Premium EP1**: $146.88/mois
- 1 vCPU + 3.5 GB RAM
- 400,000 GB-s execution inclus
- Auto-scaling

**Service Bus Standard**: $10/mois
- 13M operations incluses
- Topics + Subscriptions
- DLQ natifs

**Total**: $156.88/mois

### Optimisations

**Option 1: Consumption Plan** ($5-10/mois)
- ⚠️ Cold starts
- ⚠️ Pas de VNET
- ✅ OK pour beta

**Option 2: Premium EP1** ($156.88/mois) ⭐ RECOMMANDÉ
- ✅ Production-ready
- ✅ SLA 99.95%
- ✅ Pas de cold starts

---

## 📚 Ressources

### Documentation
- [AZURE-WORKERS-GUIDE.md](../AZURE-WORKERS-GUIDE.md) - Guide complet
- [AZURE-WORKERS-RESUME.md](../AZURE-WORKERS-RESUME.md) - Résumé décision
- [README.md](../README.md) - Budget et architecture

### Scripts
- [deploy-azure-workers.sh](deploy-azure-workers.sh) - Déploiement
- [test-workers.sh](test-workers.sh) - Tests

### Microsoft Docs
- [Azure Functions](https://learn.microsoft.com/en-us/azure/azure-functions/)
- [Azure Service Bus](https://learn.microsoft.com/en-us/azure/service-bus-messaging/)
- [Application Insights](https://learn.microsoft.com/en-us/azure/azure-monitor/app/app-insights-overview)

---

## ✅ Checklist

- [ ] Azure CLI installé
- [ ] Connecté à Azure (`az login`)
- [ ] Variables d'environnement configurées
- [ ] Exécuté `deploy-azure-workers.sh`
- [ ] Créé projet huntaze-workers
- [ ] Copié le code des workers
- [ ] Déployé les functions
- [ ] Configuré Vercel
- [ ] Exécuté `test-workers.sh`
- [ ] Vérifié monitoring
- [ ] Configuré alertes

---

**Dernière mise à jour**: 2025-12-22  
**Version**: 2.0  
**Statut**: ✅ Prêt pour déploiement

