# 🔑 Variables d'Environnement Vercel - Huntaze Beta

**Date**: 2025-12-23  
**Statut**: Guide complet pour configuration Vercel

---

## 🎯 Variables par Priorité

### ⚠️ CRITIQUE (Obligatoires pour démarrer)

Ces variables sont **absolument nécessaires** pour que l'app fonctionne:

```bash
# ============================================================================
# DATABASE (CRITIQUE)
# ============================================================================
DATABASE_URL="postgresql://huntaze:PASSWORD@huntaze-beta-db.xxx.us-east-2.rds.amazonaws.com:5432/huntaze"

# ============================================================================
# CACHE (CRITIQUE)
# ============================================================================
REDIS_URL="redis://huntaze-beta-redis.xxx.cache.amazonaws.com:6379"

# ============================================================================
# AUTHENTICATION (CRITIQUE)
# ============================================================================
NEXTAUTH_URL="https://ton-app.vercel.app"
NEXTAUTH_SECRET="ton-secret-nextauth-genere-avec-openssl-rand-base64-32"

# ============================================================================
# ENCRYPTION (CRITIQUE)
# ============================================================================
ENCRYPTION_KEY="ton-encryption-key-32-caracteres-openssl-rand-hex-32"
TOKEN_ENCRYPTION_KEY="ton-token-encryption-key-32-caracteres"

# ============================================================================
# AZURE SERVICE BUS (CRITIQUE - NOUVEAU)
# ============================================================================
SERVICEBUS_CONNECTION_SEND="Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED"
```

---

### 🔥 HAUTE PRIORITÉ (Nécessaires pour features principales)

Ces variables sont requises pour les fonctionnalités principales de l'app:

```bash
# ============================================================================
# AWS SERVICES (HAUTE PRIORITÉ)
# ============================================================================
AWS_REGION="us-east-2"
AWS_ACCESS_KEY_ID="ton-access-key-id"
AWS_SECRET_ACCESS_KEY="ton-secret-access-key"

# S3 pour assets/vidéos
AWS_S3_BUCKET="huntaze-beta-assets"
S3_BUCKET="huntaze-content"
S3_REGION="us-east-2"
CDN_URL="https://huntaze-beta-assets.s3.us-east-2.amazonaws.com"
CLOUDFRONT_DOMAIN="d1234567890.cloudfront.net"

# ============================================================================
# AZURE AI FOUNDRY (HAUTE PRIORITÉ)
# ============================================================================
# DeepSeek-V3 (Génération de contenu)
AZURE_DEEPSEEK_V3_ENDPOINT="https://deepseek-v3.eastus2.models.ai.azure.com"
AZURE_DEEPSEEK_V3_DEPLOYMENT="deepseek-v3-generation"

# DeepSeek-R1 (Raisonnement)
AZURE_DEEPSEEK_R1_ENDPOINT="https://deepseek-r1.eastus2.models.ai.azure.com"
AZURE_DEEPSEEK_R1_DEPLOYMENT="deepseek-r1-reasoning"

# Phi-4 Multimodal (Analyse vidéo/image)
AZURE_PHI4_MULTIMODAL_ENDPOINT="https://phi-4-multimodal.eastus2.models.ai.azure.com"
AZURE_PHI4_MULTIMODAL_KEY="ton-phi4-multimodal-api-key"
AZURE_PHI4_MULTIMODAL_DEPLOYMENT="phi-4-multimodal-instruct"

# Azure Speech (Transcription audio)
AZURE_SPEECH_KEY="ton-azure-speech-key"
AZURE_SPEECH_REGION="eastus2"
AZURE_SPEECH_ENDPOINT="https://eastus2.api.cognitive.microsoft.com/"

# Clé API partagée
AZURE_AI_API_KEY="ton-azure-ai-api-key"
AZURE_AI_REGION="eastus2"

# ============================================================================
# AI ROUTER (HAUTE PRIORITÉ)
# ============================================================================
# URL du router Python (Lambda ou ECS)
AI_ROUTER_URL="https://xxx.execute-api.us-east-2.amazonaws.com"

# Azure AI Chat Endpoint (utilisé par le router)
AZURE_AI_CHAT_ENDPOINT="https://ton-endpoint.eastus2.inference.ai.azure.com"
AZURE_AI_CHAT_KEY="ton-azure-ai-chat-key"

# ============================================================================
# GOOGLE GEMINI (HAUTE PRIORITÉ - AI Primaire)
# ============================================================================
GEMINI_API_KEY="ton-gemini-api-key-from-google-ai-studio"
GEMINI_MODEL="gemini-2.0-flash-exp"
```

---

### 📱 MOYENNE PRIORITÉ (Intégrations sociales)

Ces variables sont nécessaires pour les intégrations avec les plateformes sociales:

```bash
# ============================================================================
# TIKTOK
# ============================================================================
TIKTOK_CLIENT_KEY="ton-tiktok-client-key"
TIKTOK_CLIENT_SECRET="ton-tiktok-client-secret"
TIKTOK_REDIRECT_URI="https://ton-app.vercel.app/auth/tiktok/callback"
NEXT_PUBLIC_TIKTOK_REDIRECT_URI="https://ton-app.vercel.app/auth/tiktok/callback"
TIKTOK_WEBHOOK_SECRET="ton-tiktok-webhook-secret"
TIKTOK_SANDBOX_MODE="false"

# ============================================================================
# INSTAGRAM/FACEBOOK
# ============================================================================
FACEBOOK_APP_ID="ton-facebook-app-id"
FACEBOOK_APP_SECRET="ton-facebook-app-secret"
FACEBOOK_CLIENT_TOKEN="ton-facebook-client-token"

INSTAGRAM_CLIENT_ID="ton-instagram-client-id"
INSTAGRAM_CLIENT_SECRET="ton-instagram-client-secret"
INSTAGRAM_REDIRECT_URI="https://ton-app.vercel.app/auth/instagram/callback"
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI="https://ton-app.vercel.app/auth/instagram/callback"
INSTAGRAM_WEBHOOK_SECRET="ton-instagram-webhook-secret"
INSTAGRAM_WEBHOOK_VERIFY_TOKEN="ton-instagram-webhook-verify-token"

# ============================================================================
# REDDIT
# ============================================================================
REDDIT_CLIENT_ID="ton-reddit-client-id"
REDDIT_CLIENT_SECRET="ton-reddit-client-secret"
REDDIT_USER_AGENT="Huntaze:v1.0.0 (by /u/TonUsername)"
REDDIT_REDIRECT_URI="https://ton-app.vercel.app/auth/reddit/callback"
NEXT_PUBLIC_REDDIT_REDIRECT_URI="https://ton-app.vercel.app/auth/reddit/callback"

# ============================================================================
# GOOGLE (YouTube, etc.)
# ============================================================================
GOOGLE_CLIENT_ID="ton-google-client-id"
GOOGLE_CLIENT_SECRET="ton-google-client-secret"
NEXT_PUBLIC_GOOGLE_REDIRECT_URI="https://ton-app.vercel.app/auth/google/callback"

# ============================================================================
# TWITTER/X
# ============================================================================
TWITTER_BEARER_TOKEN="ton-twitter-bearer-token"

# ============================================================================
# ONLYFANS
# ============================================================================
ONLYFANS_API_KEY="ton-onlyfans-api-key"
ONLYFANS_WEBHOOK_SECRET="ton-onlyfans-webhook-secret"

# ============================================================================
# APIFY (Scraping)
# ============================================================================
APIFY_API_TOKEN="apify_api_ton-token-here"
APIFY_WEBHOOK_SECRET="ton-apify-webhook-secret"

# ============================================================================
# BRIGHT DATA (Proxies pour OnlyFans)
# ============================================================================
BRIGHT_DATA_CUSTOMER="ton-bright-data-customer"
BRIGHT_DATA_PASSWORD="ton-bright-data-password"
BRIGHT_DATA_ZONE="residential"
```

---

### 📊 BASSE PRIORITÉ (Monitoring & Analytics)

Ces variables sont optionnelles mais recommandées pour le monitoring:

```bash
# ============================================================================
# MONITORING
# ============================================================================
# CloudWatch
CLOUDWATCH_LOG_GROUP="/aws/huntaze/production"
CLOUDWATCH_NAMESPACE="Huntaze/Production"

# Alerts
ALERT_EMAIL="alerts@huntaze.com"
SLACK_WEBHOOK_URL="https://hooks.slack.com/services/XXX/YYY/ZZZ"

# ============================================================================
# ANALYTICS
# ============================================================================
# Google Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Sentry Error Tracking
SENTRY_DSN="ton-sentry-dsn"

# ============================================================================
# PAYMENT (Stripe)
# ============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_ton-stripe-publishable-key"
STRIPE_SECRET_KEY="sk_live_ton-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_ton-stripe-webhook-secret"
```

---

### ⚙️ CONFIGURATION (Feature flags & settings)

```bash
# ============================================================================
# APPLICATION SETTINGS
# ============================================================================
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://ton-app.vercel.app"
NEXT_PUBLIC_API_URL="https://ton-app.vercel.app"

# Feature Flags
ENABLE_RATE_LIMITING="true"
ENABLE_CACHING="true"
NEXT_PUBLIC_DEBUG="false"

# API Mode (real ou mock)
API_MODE="real"

# Logging
LOG_LEVEL="info"
```

---

## 📋 Checklist de Configuration

### Étape 1: Variables CRITIQUES (Obligatoires)
- [ ] `DATABASE_URL` - Connection PostgreSQL RDS
- [ ] `REDIS_URL` - Connection ElastiCache Redis
- [ ] `NEXTAUTH_URL` - URL de ton app Vercel
- [ ] `NEXTAUTH_SECRET` - Généré avec `openssl rand -base64 32`
- [ ] `ENCRYPTION_KEY` - Généré avec `openssl rand -hex 32`
- [ ] `TOKEN_ENCRYPTION_KEY` - Généré avec `openssl rand -hex 32`
- [ ] `SERVICEBUS_CONNECTION_SEND` - Connection string Azure Service Bus

### Étape 2: Variables HAUTE PRIORITÉ (Features principales)
- [ ] `AWS_REGION` - us-east-2
- [ ] `AWS_ACCESS_KEY_ID` - Credentials AWS
- [ ] `AWS_SECRET_ACCESS_KEY` - Credentials AWS
- [ ] `AWS_S3_BUCKET` - huntaze-beta-assets
- [ ] `AZURE_DEEPSEEK_V3_ENDPOINT` - Endpoint DeepSeek-V3
- [ ] `AZURE_DEEPSEEK_R1_ENDPOINT` - Endpoint DeepSeek-R1
- [ ] `AZURE_PHI4_MULTIMODAL_ENDPOINT` - Endpoint Phi-4
- [ ] `AZURE_AI_API_KEY` - Clé API Azure AI
- [ ] `GEMINI_API_KEY` - Clé API Google Gemini

### Étape 3: Variables MOYENNE PRIORITÉ (Intégrations)
- [ ] TikTok credentials (si utilisé)
- [ ] Instagram/Facebook credentials (si utilisé)
- [ ] Reddit credentials (si utilisé)
- [ ] Autres intégrations sociales

### Étape 4: Variables BASSE PRIORITÉ (Monitoring)
- [ ] Google Analytics ID
- [ ] Sentry DSN
- [ ] Stripe keys (si paiements activés)

---

## 🚀 Comment Ajouter sur Vercel

### Via Dashboard (Recommandé)

1. Va sur https://vercel.com/[team]/[project]/settings/environment-variables
2. Pour chaque variable:
   - Clique **"Add New"**
   - Name: `DATABASE_URL`
   - Value: `postgresql://...`
   - Environments: Sélectionne **Production**, **Preview**, **Development**
   - Clique **"Save"**

### Via CLI (Alternatif)

```bash
# Ajouter une variable
vercel env add DATABASE_URL production

# Importer depuis un fichier
vercel env pull .env.local
```

---

## 🔒 Sécurité

### Secrets à JAMAIS Commiter
- ❌ `DATABASE_URL`
- ❌ `REDIS_URL`
- ❌ `NEXTAUTH_SECRET`
- ❌ `ENCRYPTION_KEY`
- ❌ `AWS_SECRET_ACCESS_KEY`
- ❌ `AZURE_AI_API_KEY`
- ❌ Tous les `*_SECRET` et `*_KEY`

### Génération de Secrets Forts

```bash
# NextAuth Secret (32 bytes base64)
openssl rand -base64 32

# Encryption Key (32 bytes hex)
openssl rand -hex 32

# Webhook Secret (64 bytes hex)
openssl rand -hex 64
```

---

## 📝 Notes Importantes

### 1. Environnements Vercel
- **Production**: Variables utilisées sur `ton-app.vercel.app`
- **Preview**: Variables utilisées sur les preview deployments (PRs)
- **Development**: Variables utilisées en local avec `vercel dev`

**Recommandation**: Ajouter toutes les variables CRITIQUES et HAUTE PRIORITÉ aux 3 environnements

### 2. Variables Publiques (NEXT_PUBLIC_*)
Ces variables sont exposées au client (browser):
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_TIKTOK_REDIRECT_URI`
- `NEXT_PUBLIC_GA_ID`
- etc.

**⚠️ Ne JAMAIS mettre de secrets dans `NEXT_PUBLIC_*`**

### 3. Redéploiement Requis
Après avoir ajouté/modifié des variables d'environnement:
1. Va sur Vercel Dashboard → Deployments
2. Clique sur le dernier deployment
3. Clique **"Redeploy"**

Ou via CLI:
```bash
vercel --prod --force
```

---

## ✅ Validation

### Test 1: Variables Critiques
```bash
# Tester que l'app démarre
curl https://ton-app.vercel.app/api/health

# Réponse attendue:
# { "status": "ok", "database": "connected", "redis": "connected" }
```

### Test 2: Azure Service Bus
```bash
# Tester l'envoi d'un job
curl -X POST https://ton-app.vercel.app/api/jobs/video-analysis \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://test.mp4", "creatorId": "test-123"}'

# Réponse attendue:
# { "success": true, "jobId": "job_..." }
```

### Test 3: AI Services
```bash
# Tester Gemini
curl -X POST https://ton-app.vercel.app/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'

# Réponse attendue:
# { "response": "..." }
```

---

## 🆘 Troubleshooting

### Erreur: "DATABASE_URL is not defined"
→ Variable manquante, ajoute-la dans Vercel Dashboard puis redéploie

### Erreur: "NEXTAUTH_SECRET must be provided"
→ Génère un secret: `openssl rand -base64 32` puis ajoute-le

### Erreur: "Failed to connect to Azure Service Bus"
→ Vérifie que `SERVICEBUS_CONNECTION_SEND` est correcte

### Erreur: "Redis connection failed"
→ Vérifie que `REDIS_URL` pointe vers ElastiCache et que le security group autorise Vercel

---

**Dernière mise à jour**: 2025-12-23 00:30 UTC  
**Statut**: ✅ GUIDE COMPLET - PRÊT POUR CONFIGURATION
