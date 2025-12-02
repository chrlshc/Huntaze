# 🚀 GUIDE DE DÉPLOIEMENT AZURE OPENAI - HUNTAZE
**Date:** 1er décembre 2025  
**Durée estimée:** 10-15 minutes

---

## ✅ PRÉREQUIS

Avant de commencer, assure-toi d'avoir :
- [ ] Un compte Azure (gratuit ou payant)
- [ ] Azure CLI installé (`az --version` pour vérifier)
- [ ] Terraform installé (`terraform --version` pour vérifier)

**Installation rapide si nécessaire:**
```bash
# macOS
brew install azure-cli terraform

# Vérification
az --version
terraform --version
```

---

## 📋 ÉTAPE 1 : CONNEXION À AZURE

Ouvre ton terminal et connecte-toi à Azure :

```bash
az login
```

Une page web va s'ouvrir. Connecte-toi avec ton compte Microsoft/Azure.

**Vérification:**
```bash
az account show
```

Tu devrais voir ton compte et ton subscription ID.

---

## 📋 ÉTAPE 2 : INITIALISATION TERRAFORM

Va dans le dossier Terraform :

```bash
cd infra/terraform/azure-ai
```

Initialise Terraform (télécharge les providers nécessaires) :

```bash
terraform init
```

**Résultat attendu:**
```
Terraform has been successfully initialized!
```

---

## 📋 ÉTAPE 3 : PRÉVISUALISATION

Avant de créer quoi que ce soit, regarde ce que Terraform va faire :

```bash
terraform plan
```

**Ce qui va être créé:**
- 1 Resource Group (huntaze-ai-production-rg)
- 1 Azure OpenAI Service (avec 5 modèles)
  - GPT-4 Turbo (premium)
  - GPT-4 Standard
  - GPT-3.5 Turbo (économique)
  - GPT-4 Vision (images)
  - Text Embedding (vecteurs)
- 1 Key Vault (pour les secrets)
- 1 Cognitive Search (pour les vecteurs)
- 1 Application Insights (monitoring)

**Coût estimé:** ~50-100 USD/mois (pay-per-use, tu paies seulement ce que tu utilises)

---

## 📋 ÉTAPE 4 : DÉPLOIEMENT

Si tout te semble bon, lance le déploiement :

```bash
terraform apply
```

Terraform va te demander confirmation. Tape **`yes`** et appuie sur Entrée.

**Durée:** 3-5 minutes

**Résultat attendu:**
```
Apply complete! Resources: 12 added, 0 changed, 0 destroyed.

Outputs:

openai_primary_endpoint = "https://huntaze-ai-production-eastus.openai.azure.com/"
cognitive_search_endpoint = "https://huntaze-ai-production-search.search.windows.net"
key_vault_uri = "https://huntaze-ai-production-kv.vault.azure.net/"
```

---

## 📋 ÉTAPE 5 : RÉCUPÉRATION DES CLÉS

Une fois le déploiement terminé, récupère ta clé API Azure OpenAI :

```bash
# Méthode 1 : Via Terraform
terraform output -raw openai_primary_endpoint

# Méthode 2 : Via Azure CLI
az cognitiveservices account keys list \
  --name huntaze-ai-production-openai-primary \
  --resource-group huntaze-ai-production-rg
```

**Copie ces informations :**
- Endpoint : `https://huntaze-ai-production-eastus.openai.azure.com/`
- Key 1 : `[ta-clé-secrète]`

---

## 📋 ÉTAPE 6 : CONFIGURATION AWS

Maintenant, connecte Azure à ton infrastructure AWS existante.

### Option A : Via AWS Amplify Console

1. Va sur AWS Amplify Console
2. Sélectionne ton app Huntaze
3. Va dans "Environment variables"
4. Ajoute ces 5 variables :

```
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-production-eastus.openai.azure.com/
AZURE_OPENAI_API_KEY=[ta-clé-copiée-ci-dessus]
AZURE_API_VERSION=2024-05-01-preview
AZURE_DEPLOYMENT_PREMIUM=gpt-4-turbo-prod
AZURE_DEPLOYMENT_STANDARD=gpt-35-turbo-prod
```

### Option B : Via fichier .env local (pour tests)

Crée/modifie ton fichier `.env.local` :

```bash
# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT="https://huntaze-ai-production-eastus.openai.azure.com/"
AZURE_OPENAI_API_KEY="[ta-clé-copiée-ci-dessus]"
AZURE_API_VERSION="2024-05-01-preview"
AZURE_DEPLOYMENT_PREMIUM="gpt-4-turbo-prod"
AZURE_DEPLOYMENT_STANDARD="gpt-35-turbo-prod"
AZURE_DEPLOYMENT_VISION="gpt-4-vision-prod"
AZURE_DEPLOYMENT_EMBEDDING="text-embedding-ada-002-prod"
```

---

## 📋 ÉTAPE 7 : TEST DE CONNEXION

Teste que tout fonctionne :

```bash
# Retourne à la racine du projet
cd ../../..

# Lance un test rapide
npm run test:azure-connection
```

Ou teste manuellement avec curl :

```bash
curl https://huntaze-ai-production-eastus.openai.azure.com/openai/deployments/gpt-35-turbo-prod/chat/completions?api-version=2024-05-01-preview \
  -H "Content-Type: application/json" \
  -H "api-key: [TA-CLÉ]" \
  -d '{
    "messages": [{"role": "user", "content": "Hello Azure!"}],
    "max_tokens": 50
  }'
```

**Résultat attendu:**
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you today?"
    }
  }]
}
```

---

## 🎯 ARCHITECTURE FINALE

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS (EXISTANT)                            │
│  • ECS Fargate (app principale)                              │
│  • PostgreSQL RDS (données)                                  │
│  • Redis ElastiCache (cache)                                 │
│  • S3 (assets)                                               │
│  • Lambda (jobs async)                                       │
│  • SQS (messaging)                                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS API Call
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                 AZURE (NOUVEAU - IA)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Azure OpenAI Service (US East)                       │   │
│  │  • GPT-4 Turbo (premium, 100 TPU)                    │   │
│  │  • GPT-4 Standard (50 TPU)                           │   │
│  │  • GPT-3.5 Turbo (économique, 100 TPU)              │   │
│  │  • GPT-4 Vision (images, 30 TPU)                     │   │
│  │  • Text Embedding (vecteurs, 50 TPU)                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Azure Cognitive Search                               │   │
│  │  • Vector storage (embeddings)                       │   │
│  │  • Semantic search                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Azure Key Vault                                      │   │
│  │  • API keys storage                                  │   │
│  │  • Secrets management                                │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Application Insights                                 │   │
│  │  • Monitoring & logs                                 │   │
│  │  • Performance metrics                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 MODÈLES DISPONIBLES

| Modèle | Nom de déploiement | Usage | Coût/1M tokens |
|--------|-------------------|-------|----------------|
| GPT-4 Turbo | `gpt-4-turbo-prod` | Tâches complexes, raisonnement | ~$10 |
| GPT-4 Standard | `gpt-4-standard-prod` | Qualité premium | ~$30 |
| GPT-3.5 Turbo | `gpt-35-turbo-prod` | Tâches simples, rapide | ~$0.50 |
| GPT-4 Vision | `gpt-4-vision-prod` | Analyse d'images | ~$10 |
| Embedding | `text-embedding-ada-002-prod` | Vecteurs, recherche | ~$0.10 |

---

## 🔧 COMMANDES UTILES

### Voir l'état de l'infrastructure
```bash
cd infra/terraform/azure-ai
terraform show
```

### Mettre à jour l'infrastructure
```bash
terraform apply
```

### Détruire l'infrastructure (⚠️ ATTENTION)
```bash
terraform destroy
```

### Voir les outputs
```bash
terraform output
```

### Récupérer une clé spécifique
```bash
terraform output -raw openai_primary_endpoint
```

---

## 🐛 DÉPANNAGE

### Erreur : "Subscription not registered"
```bash
az provider register --namespace Microsoft.CognitiveServices
az provider register --namespace Microsoft.KeyVault
az provider register --namespace Microsoft.Search
```

### Erreur : "Quota exceeded"
Contacte le support Azure pour augmenter tes quotas OpenAI.

### Erreur : "Authentication failed"
```bash
az logout
az login
```

### Vérifier les ressources créées
```bash
az resource list --resource-group huntaze-ai-production-rg --output table
```

---

## 📈 MONITORING

### Via Azure Portal
1. Va sur portal.azure.com
2. Cherche "huntaze-ai-production-insights"
3. Consulte les métriques en temps réel

### Via CLI
```bash
az monitor metrics list \
  --resource /subscriptions/[SUBSCRIPTION-ID]/resourceGroups/huntaze-ai-production-rg/providers/Microsoft.CognitiveServices/accounts/huntaze-ai-production-openai-primary \
  --metric TotalCalls
```

---

## 💰 GESTION DES COÛTS

### Voir les coûts actuels
```bash
az consumption usage list \
  --start-date 2025-12-01 \
  --end-date 2025-12-31 \
  --query "[?contains(instanceName, 'huntaze-ai')]"
```

### Configurer des alertes de budget
1. Va sur portal.azure.com
2. Cherche "Cost Management + Billing"
3. Crée un budget avec alerte à 80%

---

## ✅ CHECKLIST FINALE

- [ ] Azure CLI installé et connecté
- [ ] Terraform installé
- [ ] Infrastructure déployée (`terraform apply`)
- [ ] Clés API récupérées
- [ ] Variables d'environnement configurées sur AWS
- [ ] Test de connexion réussi
- [ ] Monitoring configuré
- [ ] Alertes de budget configurées

---

## 🎉 PROCHAINES ÉTAPES

1. **Intégration dans le code** : Utilise les services Azure dans ton app
2. **Migration progressive** : Commence par 10% du trafic sur Azure
3. **Monitoring** : Surveille les performances et les coûts
4. **Optimisation** : Ajuste les capacités selon l'usage réel

---

**Besoin d'aide ?**
- Documentation Azure OpenAI : https://learn.microsoft.com/azure/ai-services/openai/
- Support Terraform : https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs
