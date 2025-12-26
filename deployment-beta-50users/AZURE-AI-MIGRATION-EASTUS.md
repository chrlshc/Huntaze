# 🚀 Migration Azure AI vers East US

**Date**: 23 décembre 2025  
**Objectif**: Migrer les 7 modèles Azure AI de France Central vers East US  
**Raison**: Latence optimale avec Vercel (20-50ms vs 100-150ms)

---

## 📊 Situation Actuelle

### Modèles Déployés (France Central)
```
1. DeepSeek-V3       → francecentral.models.ai.azure.com
2. DeepSeek-R1       → francecentral.models.ai.azure.com
3. Phi-4 Multimodal  → francecentral.models.ai.azure.com
4. Phi-4 Mini        → francecentral.models.ai.azure.com
5. Llama 3.3-70B     → francecentral.models.ai.azure.com
6. Mistral Large     → francecentral.models.ai.azure.com
7. Azure Speech      → francecentral.api.cognitive.microsoft.com
```

### Latence Actuelle
- **France Central → Vercel (US)**: 100-150ms
- **East US → Vercel (US)**: 20-50ms
- **Gain**: 70-100ms par requête (60-70% plus rapide)

---

## ⚖️ Décision: Migrer ou Garder?

### Option 1: GARDER France Central ✅ RECOMMANDÉ

**Avantages**:
- ✅ Déjà déployé et fonctionnel
- ✅ Zéro coût de migration
- ✅ Zéro risque de downtime
- ✅ 100-150ms reste acceptable pour l'UX
- ✅ Pas de reconfiguration nécessaire

**Inconvénients**:
- ⚠️ Latence 70-100ms plus élevée
- ⚠️ Pas optimal pour temps réel

**Verdict**: **GARDE France Central** si:
- Tu veux déployer MAINTENANT sans risque
- 100-150ms de latence est acceptable
- Tu veux éviter les coûts de migration

---

### Option 2: MIGRER vers East US 🚀

**Avantages**:
- ✅ Latence optimale (20-50ms)
- ✅ Meilleure UX temps réel
- ✅ Colocation avec Vercel
- ✅ Meilleure performance globale

**Inconvénients**:
- ⚠️ Temps de migration: 2-4 heures
- ⚠️ Risque de downtime pendant migration
- ⚠️ Coût de redéploiement (temps)
- ⚠️ Reconfiguration des endpoints

**Verdict**: **MIGRE vers East US** si:
- La latence est critique pour ton UX
- Tu as le temps pour la migration
- Tu veux la meilleure performance possible

---

## 🎯 MA RECOMMANDATION

### Phase 1: DÉPLOIE MAINTENANT avec France Central

**Pourquoi?**
1. Tu as déjà tout configuré
2. 100-150ms est acceptable pour 90% des cas
3. Tu peux déployer en production AUJOURD'HUI
4. Zéro risque

**Action**:
```bash
# Utilise les endpoints France Central actuels
AZURE_DEEPSEEK_V3_ENDPOINT=https://huntaze-ai-deepseek-v3.francecentral.models.ai.azure.com
AZURE_DEEPSEEK_R1_ENDPOINT=https://huntaze-ai-deepseek-r1.francecentral.models.ai.azure.com
# ... etc
```

### Phase 2: MIGRE vers East US plus tard (optionnel)

**Quand?**
- Après avoir validé que tout fonctionne
- Quand tu as 2-4 heures de disponibilité
- Pendant une période de faible trafic

**Comment?**
- Suis le guide de migration ci-dessous
- Teste en parallèle avant de switcher
- Rollback facile si problème

---

## 📋 Guide de Migration vers East US

### Étape 1: Vérifier la Disponibilité des Modèles

Tous les modèles ne sont pas disponibles dans toutes les régions.

```bash
# Vérifier la disponibilité dans East US
az ml model list --region eastus --query "[?contains(name, 'deepseek')]"
az ml model list --region eastus --query "[?contains(name, 'phi-4')]"
az ml model list --region eastus --query "[?contains(name, 'llama')]"
az ml model list --region eastus --query "[?contains(name, 'mistral')]"
```

### Étape 2: Créer les Nouveaux Déploiements (East US)

```bash
# Script de migration
cat > deployment-beta-50users/scripts/migrate-azure-ai-eastus.sh << 'EOF'
#!/bin/bash
set -e

echo "🚀 Migration Azure AI vers East US"
echo "=================================="

REGION="eastus"
RESOURCE_GROUP="huntaze-ai"

# 1. DeepSeek-V3
echo "📦 Déploiement DeepSeek-V3..."
az ml online-deployment create \
  --name huntaze-ai-deepseek-v3-eastus \
  --model deepseek-v3 \
  --region $REGION \
  --resource-group $RESOURCE_GROUP \
  --instance-type Standard_NC24s_v3 \
  --instance-count 1

# 2. DeepSeek-R1
echo "📦 Déploiement DeepSeek-R1..."
az ml online-deployment create \
  --name huntaze-ai-deepseek-r1-eastus \
  --model deepseek-r1 \
  --region $REGION \
  --resource-group $RESOURCE_GROUP \
  --instance-type Standard_NC24s_v3 \
  --instance-count 1

# 3. Phi-4 Multimodal
echo "📦 Déploiement Phi-4 Multimodal..."
az ml online-deployment create \
  --name huntaze-ai-phi4-multimodal-eastus \
  --model phi-4-multimodal \
  --region $REGION \
  --resource-group $RESOURCE_GROUP \
  --instance-type Standard_NC6s_v3 \
  --instance-count 1

# 4. Phi-4 Mini
echo "📦 Déploiement Phi-4 Mini..."
az ml online-deployment create \
  --name huntaze-ai-phi4-mini-eastus \
  --model phi-4-mini \
  --region $REGION \
  --resource-group $RESOURCE_GROUP \
  --instance-type Standard_NC6s_v3 \
  --instance-count 1

# 5. Llama 3.3-70B
echo "📦 Déploiement Llama 3.3-70B..."
az ml online-deployment create \
  --name huntaze-ai-llama-eastus \
  --model llama-3-3-70b \
  --region $REGION \
  --resource-group $RESOURCE_GROUP \
  --instance-type Standard_NC24s_v3 \
  --instance-count 1

# 6. Mistral Large
echo "📦 Déploiement Mistral Large..."
az ml online-deployment create \
  --name huntaze-ai-mistral-eastus \
  --model mistral-large \
  --region $REGION \
  --resource-group $RESOURCE_GROUP \
  --instance-type Standard_NC24s_v3 \
  --instance-count 1

# 7. Azure Speech (East US)
echo "📦 Création Azure Speech Service..."
az cognitiveservices account create \
  --name huntaze-speech-eastus \
  --resource-group $RESOURCE_GROUP \
  --kind SpeechServices \
  --sku S0 \
  --location $REGION \
  --yes

echo ""
echo "✅ Migration terminée!"
echo ""
echo "📋 Nouveaux Endpoints:"
echo "AZURE_DEEPSEEK_V3_ENDPOINT=https://huntaze-ai-deepseek-v3-eastus.eastus.models.ai.azure.com"
echo "AZURE_DEEPSEEK_R1_ENDPOINT=https://huntaze-ai-deepseek-r1-eastus.eastus.models.ai.azure.com"
echo "AZURE_PHI4_MULTIMODAL_ENDPOINT=https://huntaze-ai-phi4-multimodal-eastus.eastus.models.ai.azure.com"
echo "AZURE_PHI4_MINI_ENDPOINT=https://huntaze-ai-phi4-mini-eastus.eastus.models.ai.azure.com"
echo "AZURE_LLAMA_ENDPOINT=https://huntaze-ai-llama-eastus.eastus.models.ai.azure.com"
echo "AZURE_MISTRAL_ENDPOINT=https://huntaze-ai-mistral-eastus.eastus.models.ai.azure.com"
echo "AZURE_SPEECH_ENDPOINT=https://eastus.api.cognitive.microsoft.com"
echo "AZURE_SPEECH_REGION=eastus"

EOF

chmod +x deployment-beta-50users/scripts/migrate-azure-ai-eastus.sh
```

### Étape 3: Tester les Nouveaux Endpoints

```bash
# Test DeepSeek-V3 (East US)
curl -X POST "https://huntaze-ai-deepseek-v3-eastus.eastus.models.ai.azure.com/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_AI_API_KEY" \
  -d '{
    "messages": [{"role": "user", "content": "Hello"}],
    "max_tokens": 10
  }'

# Test Azure Speech (East US)
curl -X POST "https://eastus.api.cognitive.microsoft.com/sts/v1.0/issuetoken" \
  -H "Ocp-Apim-Subscription-Key: $AZURE_SPEECH_KEY"
```

### Étape 4: Mettre à Jour Vercel

```bash
# Mettre à jour les variables d'environnement Vercel
vercel env rm AZURE_DEEPSEEK_V3_ENDPOINT production
vercel env add AZURE_DEEPSEEK_V3_ENDPOINT production
# Entrer: https://huntaze-ai-deepseek-v3-eastus.eastus.models.ai.azure.com

vercel env rm AZURE_DEEPSEEK_R1_ENDPOINT production
vercel env add AZURE_DEEPSEEK_R1_ENDPOINT production
# Entrer: https://huntaze-ai-deepseek-r1-eastus.eastus.models.ai.azure.com

# ... répéter pour tous les endpoints

vercel env rm AZURE_SPEECH_ENDPOINT production
vercel env add AZURE_SPEECH_ENDPOINT production
# Entrer: https://eastus.api.cognitive.microsoft.com

vercel env rm AZURE_SPEECH_REGION production
vercel env add AZURE_SPEECH_REGION production
# Entrer: eastus

# Redéployer
vercel --prod
```

### Étape 5: Supprimer les Anciens Déploiements (France Central)

**⚠️ ATTENTION**: Fais ça SEULEMENT après avoir validé que East US fonctionne!

```bash
# Supprimer les déploiements France Central
az ml online-deployment delete --name huntaze-ai-deepseek-v3 --yes
az ml online-deployment delete --name huntaze-ai-deepseek-r1 --yes
az ml online-deployment delete --name huntaze-ai-phi4-multimodal --yes
az ml online-deployment delete --name huntaze-ai-phi4-mini --yes
az ml online-deployment delete --name huntaze-ai-llama --yes
az ml online-deployment delete --name huntaze-ai-mistral --yes
az cognitiveservices account delete --name huntaze-speech-francecentral --yes
```

---

## 📝 Nouveaux Endpoints (East US)

### Variables d'Environnement Vercel (East US)

```bash
# Azure AI - East US
AZURE_DEEPSEEK_V3_ENDPOINT=https://huntaze-ai-deepseek-v3-eastus.eastus.models.ai.azure.com
AZURE_DEEPSEEK_R1_ENDPOINT=https://huntaze-ai-deepseek-r1-eastus.eastus.models.ai.azure.com
AZURE_PHI4_MULTIMODAL_ENDPOINT=https://huntaze-ai-phi4-multimodal-eastus.eastus.models.ai.azure.com
AZURE_PHI4_MINI_ENDPOINT=https://huntaze-ai-phi4-mini-eastus.eastus.models.ai.azure.com
AZURE_LLAMA_ENDPOINT=https://huntaze-ai-llama-eastus.eastus.models.ai.azure.com
AZURE_MISTRAL_ENDPOINT=https://huntaze-ai-mistral-eastus.eastus.models.ai.azure.com
AZURE_SPEECH_ENDPOINT=https://eastus.api.cognitive.microsoft.com
AZURE_SPEECH_REGION=eastus
AZURE_AI_API_KEY=<TA_CLE_AZURE_AI>
AZURE_SPEECH_KEY=<TA_CLE_AZURE_SPEECH>
```

---

## 🧪 Test de Latence

### Comparer France Central vs East US

```bash
# Test latence France Central
time curl -X POST "https://huntaze-ai-deepseek-v3.francecentral.models.ai.azure.com/v1/chat/completions" \
  -H "api-key: $AZURE_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":10}'

# Test latence East US
time curl -X POST "https://huntaze-ai-deepseek-v3-eastus.eastus.models.ai.azure.com/v1/chat/completions" \
  -H "api-key: $AZURE_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":10}'
```

### Résultats Attendus

```
France Central: 100-150ms
East US:        20-50ms
Gain:           70-100ms (60-70% plus rapide)
```

---

## 💰 Coûts de Migration

### Coûts Directs
- **Temps de migration**: 2-4 heures
- **Coût Azure**: $0 (même pricing dans toutes les régions)
- **Downtime potentiel**: 0-30 minutes

### Coûts Indirects
- **Temps développeur**: 2-4 heures
- **Risque de bugs**: Faible (changement d'endpoints seulement)
- **Tests requis**: 1-2 heures

### ROI
- **Gain de latence**: 70-100ms par requête
- **Amélioration UX**: Significative pour temps réel
- **Coût total**: ~4-6 heures de travail

---

## 🚨 Plan de Rollback

Si la migration échoue, rollback facile:

```bash
# 1. Remettre les anciens endpoints dans Vercel
vercel env add AZURE_DEEPSEEK_V3_ENDPOINT production
# Entrer: https://huntaze-ai-deepseek-v3.francecentral.models.ai.azure.com

# 2. Redéployer
vercel --prod

# 3. Supprimer les déploiements East US (optionnel)
az ml online-deployment delete --name huntaze-ai-deepseek-v3-eastus --yes
```

---

## ✅ Checklist de Migration

### Avant Migration
- [ ] Backup des endpoints actuels (France Central)
- [ ] Vérifier disponibilité des modèles dans East US
- [ ] Planifier fenêtre de maintenance (2-4h)
- [ ] Prévenir les utilisateurs (si en production)

### Pendant Migration
- [ ] Créer les nouveaux déploiements (East US)
- [ ] Tester chaque endpoint individuellement
- [ ] Mesurer la latence (avant/après)
- [ ] Mettre à jour Vercel env vars
- [ ] Redéployer l'application

### Après Migration
- [ ] Tester toutes les fonctionnalités AI
- [ ] Monitorer les erreurs (24h)
- [ ] Comparer les métriques de performance
- [ ] Supprimer les anciens déploiements (France Central)
- [ ] Documenter les nouveaux endpoints

---

## 🎯 Décision Finale

### Option A: GARDE France Central (RECOMMANDÉ pour maintenant)

**Action immédiate**:
```bash
# Utilise les endpoints actuels dans Vercel
# Copie-colle depuis deployment-beta-50users/COPY-PASTE-VERCEL.txt
# Déploie MAINTENANT
```

**Avantages**:
- ✅ Déploiement immédiat
- ✅ Zéro risque
- ✅ Latence acceptable (100-150ms)

---

### Option B: MIGRE vers East US (pour performance optimale)

**Action immédiate**:
```bash
# 1. Exécute le script de migration
./deployment-beta-50users/scripts/migrate-azure-ai-eastus.sh

# 2. Teste les nouveaux endpoints
# 3. Mets à jour Vercel
# 4. Déploie
```

**Avantages**:
- ✅ Latence optimale (20-50ms)
- ✅ Meilleure UX
- ✅ Colocation avec Vercel

---

## 🤔 Ma Recommandation Personnelle

**GARDE France Central pour l'instant**, voici pourquoi:

1. **Tu peux déployer MAINTENANT** sans attendre 2-4h de migration
2. **100-150ms est acceptable** pour 90% des cas d'usage
3. **Zéro risque** de downtime ou bugs
4. **Tu peux migrer plus tard** quand tu auras validé que tout fonctionne

**Migre vers East US plus tard** si:
- Tu constates que la latence impacte l'UX
- Tu as du temps pour une migration propre
- Tu veux optimiser au maximum

---

**Prêt à décider? Dis-moi ce que tu choisis! 🚀**
