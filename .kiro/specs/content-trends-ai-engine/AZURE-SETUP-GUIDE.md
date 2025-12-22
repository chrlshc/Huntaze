# Content Trends AI Engine - Azure AI Foundry Setup Guide

## 🎯 Quick Start

Tu as déjà DeepSeek-R1 déployé. Voici comment activer le pipeline complet avec la nouvelle stack Phi-4 + Azure Speech.

## 📋 Modèles Requis

| Modèle | Usage | Pricing |
|--------|-------|---------|
| **DeepSeek-R1** | Analyse virale, raisonnement | $0.00135/1K in, $0.0054/1K out |
| **DeepSeek-V3** | Génération (hooks, scripts) | $0.00114/1K in, $0.00456/1K out |
| **Phi-4-multimodal-instruct** | Analyse frames + audio (128K context) | ~$0.0004/1K tokens |
| **Azure Speech Batch** | Transcription audio | $0.18/heure |

### Migration depuis Llama Vision

Le système utilise maintenant **Phi-4-multimodal-instruct** au lieu de Llama 3.2 Vision:
- ✅ Contexte 128K (vs 128K Llama)
- ✅ Analyse unifiée texte + images + audio en un seul appel
- ✅ Disponible via Azure Foundry Partners & Community
- ✅ Support natif de l'analyse "timeline seconde par seconde"

## 🔧 Configuration .env.local

```bash
# DeepSeek R1 - Tu l'as déjà!
AZURE_DEEPSEEK_R1_ENDPOINT=https://ton-endpoint-r1.eastus2.models.ai.azure.com
AZURE_DEEPSEEK_R1_DEPLOYMENT=deepseek-r1-reasoning

# DeepSeek V3 - À déployer sur Azure Marketplace
AZURE_DEEPSEEK_V3_ENDPOINT=https://ton-endpoint-v3.eastus2.models.ai.azure.com
AZURE_DEEPSEEK_V3_DEPLOYMENT=deepseek-v3-generation

# Phi-4 Multimodal - NOUVEAU (remplace Llama Vision)
AZURE_PHI4_MULTIMODAL_ENDPOINT=https://ton-endpoint-phi4.eastus2.models.ai.azure.com
AZURE_PHI4_MULTIMODAL_DEPLOYMENT=phi-4-multimodal-instruct

# Azure Speech Batch Transcription - NOUVEAU
AZURE_SPEECH_ENDPOINT=https://eastus2.api.cognitive.microsoft.com
AZURE_SPEECH_KEY=REDACTED-cle-speech
AZURE_SPEECH_REGION=eastus2

# Llama Vision (LEGACY - fallback si Phi-4 non configuré)
AZURE_LLAMA_VISION_ENDPOINT=https://ton-endpoint-vision.eastus2.models.ai.azure.com
AZURE_LLAMA_VISION_DEPLOYMENT=llama-32-vision

# Clé API partagée
AZURE_AI_API_KEY=REDACTED-cle-api

# Région
AZURE_AI_REGION=eastus2
```

## 🚀 Déployer les modèles sur Azure

### 1. DeepSeek-V3 (si pas encore déployé)

```bash
# Via Azure Portal
1. Azure AI Foundry → Model Catalog
2. Chercher "DeepSeek-V3"
3. Deploy → Serverless API
4. Copier l'endpoint et la clé
```

### 2. Phi-4-multimodal-instruct (NOUVEAU)

```bash
# Via Azure Portal
1. Azure AI Foundry → Model Catalog → Partners & Community
2. Chercher "Phi-4-multimodal-instruct"
3. Deploy → Serverless API
4. Copier l'endpoint et la clé
```

**Avantages Phi-4:**
- Analyse unifiée texte + images + audio via Chat Completions
- Contexte 128K pour analyse complète de shorts
- Meilleure compréhension du contexte multimodal

### 3. Azure Speech Batch Transcription (NOUVEAU)

```bash
# Via Azure Portal
1. Azure Portal → Create Resource → Speech Services
2. Choisir région (eastus2 recommandé)
3. Copier la clé et l'endpoint
4. Configurer dans .env.local
```

**Pricing:** $0.18/heure de transcription batch
- Idéal pour traitement en volume
- Speaker diarization inclus
- Timestamps alignés pour timeline analysis

## 📡 Tester la Configuration

```bash
# Vérifier la config
npx ts-node scripts/test-content-trends-config.ts

# Ou via l'API
curl http://localhost:3000/api/ai/content-trends/analyze
```

## 🎬 Pipeline d'Analyse Vidéo (Mis à jour)

```
Vidéo → FFmpeg (1 fps) → Phi-4 Multimodal → DeepSeek R1 → DeepSeek V3
  ↓           ↓                  ↓                ↓              ↓
Audio → Azure Speech      Timeline JSON     Viral Score    Hooks/Scripts
         ($0.18/h)         + Audio Context
```

### Nouveau: Analyse Timeline Seconde par Seconde

Le pipeline permet maintenant une analyse "timeline seconde par seconde" pour les shorts:
1. **Extraction keyframes** - FFmpeg extrait les frames clés
2. **Transcription audio** - Azure Speech transcrit avec timestamps
3. **Analyse unifiée** - Phi-4 corrèle frames + audio
4. **Diagnostic viral** - DeepSeek R1 identifie les mécanismes
5. **Génération** - DeepSeek V3 produit hooks et scripts

### Exemple d'appel API

```bash
curl -X POST http://localhost:3000/api/ai/content-trends/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "frameUrls": [
      "https://storage.blob.core.windows.net/frames/frame-0.jpg",
      "https://storage.blob.core.windows.net/frames/frame-1.jpg"
    ],
    "audioUrl": "https://storage.blob.core.windows.net/audio/video-audio.wav",
    "transcript": "Hey guys, check this out...",
    "engagementMetrics": {
      "views": 100000,
      "likes": 5000,
      "shares": 200,
      "comments": 150
    },
    "brandContext": {
      "industry": "fitness",
      "tone": "energetic",
      "targetAudience": "18-35 fitness enthusiasts"
    },
    "analysisOptions": {
      "timelineAnalysis": true,
      "secondBySecond": true
    }
  }'
```

### Réponse (avec Timeline Analysis)

```json
{
  "success": true,
  "data": {
    "timeline": [
      {
        "second": 0,
        "action": "Person appears with surprised expression",
        "audioContent": "Hey guys, check this out",
        "emotions": ["surprise", "excitement"],
        "textOnScreen": "WAIT FOR IT...",
        "hookScore": 92,
        "patternInterrupts": ["zoom_in", "text_overlay"],
        "engagementPeak": true
      },
      {
        "second": 3,
        "action": "Transition to product reveal",
        "audioContent": "I've been using this for 30 days",
        "emotions": ["anticipation"],
        "retentionRisk": "low"
      }
    ],
    "viralAnalysis": {
      "score": 78,
      "retentionPrediction": 65,
      "mechanisms": ["curiosity_gap", "pattern_interrupt", "emotional_hook"],
      "emotionalTriggers": ["surprise", "FOMO"],
      "audioImpact": {
        "voiceTone": "energetic",
        "pacing": "fast",
        "hookEffectiveness": 85
      },
      "recommendations": [
        "Ajouter un hook textuel dans les 2 premières secondes",
        "Augmenter le rythme des cuts après la 5ème seconde",
        "Le ton vocal est efficace - maintenir l'énergie"
      ]
    },
    "assets": {
      "hooks": [
        "Tu ne vas pas croire ce qui se passe ensuite...",
        "J'ai testé pendant 30 jours et voilà le résultat",
        "Personne ne parle de cette technique"
      ],
      "script": "Script optimisé de 150 mots...",
      "captions": ["Caption avec emojis 🔥"],
      "hashtags": ["#viral", "#fitness", "#transformation"],
      "callToAction": "Abonne-toi pour plus de tips!"
    }
  },
  "meta": {
    "framesAnalyzed": 2,
    "audioDurationSeconds": 35,
    "estimatedCostUsd": 0.0045,
    "pipeline": ["azure-speech", "phi-4-multimodal", "deepseek-r1", "deepseek-v3"]
  }
}
```

## 💰 Optimisation des Coûts

| Paramètre | Valeur | Raison |
|-----------|--------|--------|
| FPS | 1 | 1 frame/seconde suffit |
| MAX_FRAMES | 40 | Cap pour shorts 35s |
| scale_width | 512 | Réduire taille images |
| Audio batch | Oui | $0.18/h vs temps réel |
| Phi-4 context | 128K | Tout en un seul appel |

### Comparaison des coûts

| Modèle | Coût pour 1 short (35s) |
|--------|-------------------------|
| DeepSeek R1 | ~$0.002 |
| DeepSeek V3 | ~$0.001 |
| Phi-4 Multimodal | ~$0.001 |
| Azure Speech | ~$0.001 (35s = 0.01h) |
| **Total** | **~$0.005** |

## ⚠️ Points Critiques

1. **Ne jamais afficher le reasoning R1** - Les tags `<think>` sont extraits mais jamais montrés en prod
2. **Phi-4 vs Llama Vision** - Phi-4 est préféré, Llama Vision reste en fallback
3. **Azure Speech batch** - Utiliser le mode batch pour les coûts, pas le temps réel
4. **Timeline analysis** - Activer `secondBySecond: true` pour l'analyse détaillée

## 🔗 Fichiers Clés

- `lib/ai/content-trends/azure-inference-client.ts` - Client unifié
- `lib/ai/content-trends/azure-foundry-config.ts` - Configuration (mis à jour pour Phi-4)
- `lib/ai/content-trends/ai-router.ts` - Routage intelligent (mis à jour)
- `lib/ai/content-trends/phi4-multimodal-service.ts` - Service Phi-4 (à créer)
- `lib/ai/content-trends/audio-transcription-service.ts` - Service Azure Speech (à créer)
- `app/api/ai/content-trends/analyze/route.ts` - API endpoint
- `lib/ai/content-trends/video-processor.ts` - Extraction FFmpeg

## 🔄 Migration depuis Llama Vision

Si tu as déjà Llama Vision configuré:
1. Le système utilise automatiquement Phi-4 si configuré
2. Llama Vision reste en fallback si `AZURE_PHI4_MULTIMODAL_ENDPOINT` n'est pas défini
3. Aucune modification de code nécessaire - le routeur gère automatiquement

```typescript
// Le routeur choisit automatiquement
const model = getPreferredMultimodalModel(); // phi-4-multimodal ou llama-vision
```
