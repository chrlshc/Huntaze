# 🎯 HUNTAZE AZURE OPENAI - PRÊT À DÉPLOYER

**Status:** ✅ Infrastructure Terraform prête  
**Date:** 1er décembre 2025  
**Durée estimée:** 10 minutes

---

## 🚀 DÉPLOIEMENT EN 1 COMMANDE

Tu as 2 options pour déployer :

### Option 1 : Script automatisé (RECOMMANDÉ)

```bash
cd infra/terraform/azure-ai
./deploy-simple.sh
```

Le script va :
1. ✅ Vérifier les prérequis (Azure CLI, Terraform)
2. ✅ Te connecter à Azure si nécessaire
3. ✅ Enregistrer les providers Azure
4. ✅ Initialiser Terraform
5. ✅ Créer l'infrastructure
6. ✅ Récupérer automatiquement les clés
7. ✅ Afficher toutes les infos de connexion
8. ✅ Sauvegarder les credentials dans `.azure-credentials.txt`

### Option 2 : Manuelle (étape par étape)

```bash
cd infra/terraform/azure-ai

# 1. Connexion
az login

# 2. Initialisation
terraform init

# 3. Prévisualisation
terraform plan

# 4. Déploiement
terraform apply

# 5. Récupération des clés
terraform output -raw openai_primary_endpoint
az cognitiveservices account keys list \
  --name huntaze-ai-production-openai-primary \
  --resource-group huntaze-ai-production-rg
```

---

## 📦 CE QUI VA ÊTRE CRÉÉ

### Infrastructure Azure

| Ressource | Nom | Description |
|-----------|-----|-------------|
| **Resource Group** | huntaze-ai-production-rg | Conteneur pour toutes les ressources |
| **Azure OpenAI** | huntaze-ai-production-openai-primary | Service IA principal |
| **Key Vault** | huntaze-ai-production-kv | Stockage sécurisé des secrets |
| **Cognitive Search** | huntaze-ai-production-search | Recherche vectorielle |
| **Application Insights** | huntaze-ai-production-insights | Monitoring et logs |
| **Log Analytics** | huntaze-ai-production-logs | Workspace de logs |

### Modèles IA déployés

| Modèle | Déploiement | Capacité | Usage |
|--------|-------------|----------|-------|
| GPT-4 Turbo | gpt-4-turbo-prod | 100 TPU | Tâches complexes |
| GPT-4 | gpt-4-standard-prod | 50 TPU | Qualité premium |
| GPT-3.5 Turbo | gpt-35-turbo-prod | 100 TPU | Rapide & économique |
| GPT-4 Vision | gpt-4-vision-prod | 30 TPU | Analyse d'images |
| Embeddings | text-embedding-ada-002-prod | 50 TPU | Vecteurs |

**TPU** = Tokens Per Unit (unités de débit provisionné)

---

## 💰 COÛTS ESTIMÉS

### Coûts mensuels (estimation)

| Service | Coût estimé/mois |
|---------|------------------|
| Azure OpenAI (pay-per-use) | $20-100 |
| Cognitive Search (Standard) | $250 |
| Key Vault (Premium) | $5 |
| Application Insights | $10-50 |
| **TOTAL** | **$285-405/mois** |

**Note:** Les coûts Azure OpenAI dépendent de ton utilisation réelle (pay-per-use).

### Optimisation des coûts

Pour réduire les coûts :
1. Utilise GPT-3.5 Turbo pour les tâches simples (~$0.50/1M tokens)
2. Réduis la capacité Cognitive Search si peu utilisé
3. Configure des alertes de budget
4. Utilise le cache pour éviter les appels répétés

---

## 🔐 SÉCURITÉ

### Ce qui est déjà configuré

- ✅ **Key Vault** : Toutes les clés sont stockées de manière sécurisée
- ✅ **RBAC** : Contrôle d'accès basé sur les rôles
- ✅ **Managed Identity** : Authentification sans mot de passe
- ✅ **Purge Protection** : Protection contre la suppression accidentelle

### À configurer en production

- [ ] **Private Endpoints** : Isoler le réseau (actuellement public)
- [ ] **Network ACLs** : Restreindre les IPs autorisées
- [ ] **Azure AD Integration** : Authentification entreprise
- [ ] **Audit Logs** : Activer les logs d'audit complets

---

## 📊 MONITORING

### Application Insights

Après le déploiement, tu auras accès à :
- 📈 Métriques en temps réel
- 🔍 Logs détaillés
- ⚡ Performance tracking
- 🚨 Alertes automatiques

### Accès au monitoring

```bash
# Via Azure Portal
open https://portal.azure.com/#@/resource/subscriptions/[SUBSCRIPTION-ID]/resourceGroups/huntaze-ai-production-rg/providers/microsoft.insights/components/huntaze-ai-production-insights

# Via CLI
az monitor metrics list \
  --resource huntaze-ai-production-openai-primary \
  --resource-group huntaze-ai-production-rg \
  --resource-type Microsoft.CognitiveServices/accounts \
  --metric TotalCalls
```

---

## 🔗 INTÉGRATION AVEC AWS

### Variables d'environnement à ajouter

Après le déploiement, ajoute ces variables dans AWS Amplify :

```bash
AZURE_OPENAI_ENDPOINT="https://huntaze-ai-production-eastus.openai.azure.com/"
AZURE_OPENAI_API_KEY="[sera-généré-après-déploiement]"
AZURE_API_VERSION="2024-05-01-preview"
AZURE_DEPLOYMENT_PREMIUM="gpt-4-turbo-prod"
AZURE_DEPLOYMENT_STANDARD="gpt-35-turbo-prod"
AZURE_DEPLOYMENT_VISION="gpt-4-vision-prod"
AZURE_DEPLOYMENT_EMBEDDING="text-embedding-ada-002-prod"
```

### Code d'intégration (déjà présent)

Tu as déjà le code d'intégration dans :
- `lib/ai/azure/azure-openai.service.ts`
- `lib/ai/azure/azure-openai-router.ts`
- Tests dans `tests/unit/ai/azure-*.test.ts`

---

## 🧪 TEST DE CONNEXION

Après le déploiement, teste la connexion :

```bash
# Test simple avec curl
curl https://huntaze-ai-production-eastus.openai.azure.com/openai/deployments/gpt-35-turbo-prod/chat/completions?api-version=2024-05-01-preview \
  -H "Content-Type: application/json" \
  -H "api-key: [TA-CLÉ]" \
  -d '{
    "messages": [{"role": "user", "content": "Hello Azure!"}],
    "max_tokens": 50
  }'

# Test avec ton code
npm run test:azure-connection
```

---

## 📚 DOCUMENTATION

### Guides créés

1. **AZURE-DEPLOYMENT-GUIDE-SIMPLE.md** : Guide détaillé étape par étape
2. **AWS-INFRASTRUCTURE-AUDIT-2025-12-01.md** : Audit de ton infra AWS
3. **Ce fichier** : Vue d'ensemble et démarrage rapide

### Documentation Azure

- [Azure OpenAI Service](https://learn.microsoft.com/azure/ai-services/openai/)
- [Terraform Azure Provider](https://registry.terraform.io/providers/hashicorp/azurerm/latest/docs)
- [Azure CLI Reference](https://learn.microsoft.com/cli/azure/)

---

## 🐛 DÉPANNAGE RAPIDE

### Erreur : "Subscription not registered"

```bash
az provider register --namespace Microsoft.CognitiveServices --wait
az provider register --namespace Microsoft.KeyVault --wait
az provider register --namespace Microsoft.Search --wait
```

### Erreur : "Quota exceeded"

Azure OpenAI a des quotas par défaut. Demande une augmentation :
1. Va sur portal.azure.com
2. Cherche "Quotas"
3. Demande une augmentation pour "Azure OpenAI"

### Erreur : "Authentication failed"

```bash
az logout
az login
```

### Voir les ressources créées

```bash
az resource list --resource-group huntaze-ai-production-rg --output table
```

---

## ✅ CHECKLIST PRÉ-DÉPLOIEMENT

Avant de lancer le déploiement, vérifie :

- [ ] Azure CLI installé (`az --version`)
- [ ] Terraform installé (`terraform --version`)
- [ ] Compte Azure créé (gratuit ou payant)
- [ ] Budget Azure configuré (recommandé)
- [ ] Backup de ton code AWS (par précaution)

---

## 🎯 APRÈS LE DÉPLOIEMENT

1. **Copie les credentials** générés dans `.azure-credentials.txt`
2. **Ajoute les variables** dans AWS Amplify Console
3. **Teste la connexion** avec curl ou ton code
4. **Configure le monitoring** dans Azure Portal
5. **Active les alertes** de coûts et de performance
6. **Documente** les endpoints pour ton équipe

---

## 🚀 COMMANDE RAPIDE

```bash
# Tout en une commande
cd infra/terraform/azure-ai && ./deploy-simple.sh
```

C'est tout ! Le script s'occupe de tout et t'affiche les credentials à la fin.

---

**Questions ?** Consulte `AZURE-DEPLOYMENT-GUIDE-SIMPLE.md` pour plus de détails.
