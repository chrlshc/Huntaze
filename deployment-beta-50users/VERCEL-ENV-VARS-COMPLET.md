# 📋 Variables d'Environnement Vercel - COMPLET

**Date**: 23 décembre 2025  
**Statut**: ✅ Prêt à copier-coller

---

## 🚀 COPIE-COLLE DIRECT DANS VERCEL

### 1️⃣ Database & Redis (AWS)
```bash
DATABASE_URL=postgresql://huntaze_admin:ernMIVqqb7F0DuHYSje8ZsCpD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production
REDIS_URL=redis://huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com:6379
```

### 2️⃣ AWS Configuration
```bash
AWS_REGION=us-east-2
AWS_S3_BUCKET=huntaze-beta-storage-1766460248
AWS_ACCESS_KEY_ID=<TON_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<TON_SECRET_ACCESS_KEY>
```

### 3️⃣ NextAuth & Security
```bash
NEXTAUTH_URL=https://ton-app.vercel.app
NEXTAUTH_SECRET=nMvt98/qqyHFdsA/1RRKtWcl4WtakW8K8WM7htUgWnA=
ENCRYPTION_KEY=08c54a4db8f3d3f479a499e345d8b6ba65a616827d177645d76bfb674f5acd11
```

### 4️⃣ Azure Service Bus (Workers)
```bash
SERVICEBUS_CONNECTION_SEND=Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED
```

### 5️⃣ Azure AI - Tous les Modèles (France Central)
```bash
# DeepSeek-V3 (Génération de contenu)
AZURE_DEEPSEEK_V3_ENDPOINT=https://huntaze-ai-deepseek-v3.francecentral.models.ai.azure.com
AZURE_DEEPSEEK_V3_API_KEY=<TA_CLE_AZURE_AI>
AZURE_DEEPSEEK_V3_DEPLOYMENT=deepseek-v3

# DeepSeek-R1 (Raisonnement profond)
AZURE_DEEPSEEK_R1_ENDPOINT=https://huntaze-ai-deepseek-r1.francecentral.models.ai.azure.com
AZURE_DEEPSEEK_R1_API_KEY=<TA_CLE_AZURE_AI>
AZURE_DEEPSEEK_R1_DEPLOYMENT=deepseek-r1

# Phi-4 Multimodal (Vision + Audio)
AZURE_PHI4_MULTIMODAL_ENDPOINT=https://huntaze-ai-phi4-multimodal.francecentral.models.ai.azure.com
AZURE_PHI4_MULTIMODAL_API_KEY=<TA_CLE_AZURE_AI>
AZURE_PHI4_MULTIMODAL_DEPLOYMENT=phi-4-multimodal

# Phi-4 Mini (Classification rapide)
AZURE_PHI4_MINI_ENDPOINT=https://huntaze-ai-phi4-mini.francecentral.models.ai.azure.com
AZURE_PHI4_MINI_API_KEY=<TA_CLE_AZURE_AI>
AZURE_PHI4_MINI_DEPLOYMENT=phi-4-mini

# Llama 3.3-70B (Fallback)
AZURE_LLAMA_ENDPOINT=https://huntaze-ai-llama.francecentral.models.ai.azure.com
AZURE_LLAMA_API_KEY=<TA_CLE_AZURE_AI>
AZURE_LLAMA_DEPLOYMENT=llama-3-3-70b

# Mistral Large (Créativité)
AZURE_MISTRAL_ENDPOINT=https://huntaze-ai-mistral.francecentral.models.ai.azure.com
AZURE_MISTRAL_API_KEY=<TA_CLE_AZURE_AI>
AZURE_MISTRAL_DEPLOYMENT=mistral-large

# Azure Speech (Transcription audio)
AZURE_SPEECH_ENDPOINT=https://francecentral.api.cognitive.microsoft.com
AZURE_SPEECH_KEY=<TA_CLE_AZURE_SPEECH>
AZURE_SPEECH_REGION=francecentral

# Clé API partagée (si tu utilises la même pour tous)
AZURE_AI_API_KEY=<TA_CLE_AZURE_AI>
```

### 6️⃣ Google Gemini (Optionnel)
```bash
GEMINI_API_KEY=<TA_CLE_GEMINI>
```

### 7️⃣ Intégrations Sociales (Optionnel - Moyenne Priorité)
```bash
# TikTok
TIKTOK_CLIENT_KEY=<ta_cle>
TIKTOK_CLIENT_SECRET=<ton_secret>

# Instagram
INSTAGRAM_APP_ID=<ton_app_id>
INSTAGRAM_APP_SECRET=<ton_secret>

# Reddit
REDDIT_CLIENT_ID=<ton_client_id>
REDDIT_CLIENT_SECRET=<ton_secret>
```

### 8️⃣ Monitoring (Optionnel - Basse Priorité)
```bash
# Google Analytics
NEXT_PUBLIC_GA_ID=<ton_ga_id>

# Sentry
SENTRY_DSN=<ton_sentry_dsn>

# Stripe (si utilisé)
STRIPE_SECRET_KEY=<ta_cle_stripe>
STRIPE_WEBHOOK_SECRET=<ton_webhook_secret>
```

---

## 🎯 Variables CRITIQUES (À configurer EN PREMIER)

Ces variables sont **OBLIGATOIRES** pour que l'app fonctionne:

```bash
# 1. Database & Redis
DATABASE_URL=postgresql://huntaze_admin:ernMIVqqb7F0DuHYSje8ZsCpD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production
REDIS_URL=redis://huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com:6379

# 2. AWS
AWS_REGION=us-east-2
AWS_S3_BUCKET=huntaze-beta-storage-1766460248
AWS_ACCESS_KEY_ID=<TON_ACCESS_KEY_ID>
AWS_SECRET_ACCESS_KEY=<TON_SECRET_ACCESS_KEY>

# 3. NextAuth
NEXTAUTH_URL=https://ton-app.vercel.app
NEXTAUTH_SECRET=nMvt98/qqyHFdsA/1RRKtWcl4WtakW8K8WM7htUgWnA=
ENCRYPTION_KEY=08c54a4db8f3d3f479a499e345d8b6ba65a616827d177645d76bfb674f5acd11

# 4. Azure Service Bus
SERVICEBUS_CONNECTION_SEND=Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED

# 5. Azure AI (au minimum DeepSeek-V3)
AZURE_DEEPSEEK_V3_ENDPOINT=https://huntaze-ai-deepseek-v3.francecentral.models.ai.azure.com
AZURE_AI_API_KEY=<TA_CLE_AZURE_AI>
```

---

## 📝 Comment Obtenir les Clés Manquantes

### AWS Access Keys
```bash
# Si tu n'as pas encore créé d'access keys:
aws iam create-access-key --user-name ton-user

# Ou récupère-les depuis AWS Console:
# https://console.aws.amazon.com/iam/home#/security_credentials
```

### Azure AI API Key
```bash
# Depuis Azure Portal:
# 1. Va sur https://portal.azure.com
# 2. Cherche "Azure AI Services"
# 3. Sélectionne ton resource group "huntaze-ai"
# 4. Clique sur "Keys and Endpoint"
# 5. Copie "KEY 1"
```

### Azure Speech Key
```bash
# Depuis Azure Portal:
# 1. Va sur https://portal.azure.com
# 2. Cherche "Speech Services"
# 3. Sélectionne ton service
# 4. Clique sur "Keys and Endpoint"
# 5. Copie "KEY 1"
```

---

## 🔧 Configuration dans Vercel

### Méthode 1: Via l'Interface Web (RECOMMANDÉ)

1. Va sur [vercel.com](https://vercel.com)
2. Ouvre ton projet
3. Va dans **Settings → Environment Variables**
4. Pour chaque variable:
   - Clique sur "Add New"
   - Name: `DATABASE_URL`
   - Value: `postgresql://...`
   - Environment: Sélectionne **Production**, **Preview**, **Development**
   - Clique "Save"

### Méthode 2: Via CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Login
vercel login

# Ajouter les variables
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add AWS_REGION production
vercel env add AWS_S3_BUCKET production
vercel env add AWS_ACCESS_KEY_ID production
vercel env add AWS_SECRET_ACCESS_KEY production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add ENCRYPTION_KEY production
vercel env add SERVICEBUS_CONNECTION_SEND production
vercel env add AZURE_DEEPSEEK_V3_ENDPOINT production
vercel env add AZURE_AI_API_KEY production

# Redéployer
vercel --prod
```

### Méthode 3: Import depuis fichier .env

```bash
# Créer un fichier .env.production
cat > .env.production << 'EOF'
DATABASE_URL=postgresql://huntaze_admin:ernMIVqqb7F0DuHYSje8ZsCpD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production
REDIS_URL=redis://huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com:6379
AWS_REGION=us-east-2
AWS_S3_BUCKET=huntaze-beta-storage-1766460248
NEXTAUTH_SECRET=nMvt98/qqyHFdsA/1RRKtWcl4WtakW8K8WM7htUgWnA=
ENCRYPTION_KEY=08c54a4db8f3d3f479a499e345d8b6ba65a616827d177645d76bfb674f5acd11
EOF

# Importer dans Vercel
vercel env pull .env.production
```

---

## ✅ Checklist de Vérification

Avant de déployer, vérifie que tu as configuré:

### Critiques (OBLIGATOIRES)
- [ ] `DATABASE_URL` - PostgreSQL RDS
- [ ] `REDIS_URL` - ElastiCache Redis
- [ ] `AWS_REGION` - us-east-2
- [ ] `AWS_S3_BUCKET` - huntaze-beta-storage-1766460248
- [ ] `AWS_ACCESS_KEY_ID` - Credentials AWS
- [ ] `AWS_SECRET_ACCESS_KEY` - Credentials AWS
- [ ] `NEXTAUTH_URL` - URL de ton app Vercel
- [ ] `NEXTAUTH_SECRET` - Secret généré
- [ ] `ENCRYPTION_KEY` - Clé de chiffrement
- [ ] `SERVICEBUS_CONNECTION_SEND` - Azure Service Bus
- [ ] `AZURE_DEEPSEEK_V3_ENDPOINT` - Endpoint DeepSeek-V3
- [ ] `AZURE_AI_API_KEY` - Clé API Azure AI

### Haute Priorité (Recommandées)
- [ ] `AZURE_DEEPSEEK_R1_ENDPOINT` - Endpoint DeepSeek-R1
- [ ] `AZURE_PHI4_MULTIMODAL_ENDPOINT` - Endpoint Phi-4
- [ ] `AZURE_SPEECH_ENDPOINT` - Endpoint Azure Speech
- [ ] `AZURE_SPEECH_KEY` - Clé Azure Speech
- [ ] `GEMINI_API_KEY` - Clé Google Gemini

### Moyenne Priorité (Optionnelles)
- [ ] `TIKTOK_CLIENT_KEY` - TikTok API
- [ ] `INSTAGRAM_APP_ID` - Instagram API
- [ ] `REDDIT_CLIENT_ID` - Reddit API

### Basse Priorité (Monitoring)
- [ ] `NEXT_PUBLIC_GA_ID` - Google Analytics
- [ ] `SENTRY_DSN` - Sentry monitoring
- [ ] `STRIPE_SECRET_KEY` - Stripe payments

---

## 🧪 Tester les Variables

Après configuration, teste que tout fonctionne:

```bash
# 1. Test Database
export DATABASE_URL="postgresql://huntaze_admin:ernMIVqqb7F0DuHYSje8ZsCpD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"
psql "$DATABASE_URL" -c "SELECT 1;"

# 2. Test Redis
redis-cli -h huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com -p 6379 ping

# 3. Test S3
aws s3 ls s3://huntaze-beta-storage-1766460248 --region us-east-2

# 4. Test Azure AI
curl -X POST "https://huntaze-ai-deepseek-v3.francecentral.models.ai.azure.com/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_AI_API_KEY" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"max_tokens":10}'
```

---

## 🚨 Sécurité

### ⚠️ NE JAMAIS:
- ❌ Commiter les fichiers `.env` dans Git
- ❌ Partager les clés API publiquement
- ❌ Utiliser les mêmes clés en dev et prod
- ❌ Laisser les clés dans le code source

### ✅ TOUJOURS:
- ✅ Utiliser des variables d'environnement
- ✅ Rotate les clés régulièrement
- ✅ Utiliser des secrets managers (AWS Secrets Manager)
- ✅ Limiter les permissions IAM au minimum
- ✅ Activer MFA sur les comptes AWS/Azure

---

## 📚 Documentation

- **AWS RDS**: [Documentation](https://docs.aws.amazon.com/rds/)
- **ElastiCache Redis**: [Documentation](https://docs.aws.amazon.com/elasticache/)
- **Azure AI**: [Documentation](https://learn.microsoft.com/azure/ai-services/)
- **Vercel Env Vars**: [Documentation](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 🆘 Problèmes Courants

### Erreur: "Cannot connect to database"
```bash
# Vérifier que DATABASE_URL est correct
echo $DATABASE_URL

# Tester la connexion
psql "$DATABASE_URL" -c "SELECT 1;"

# Vérifier le Security Group RDS (port 5432 ouvert)
aws ec2 describe-security-groups --region us-east-2 --group-ids sg-0d2f753f72c2046e1
```

### Erreur: "Redis connection timeout"
```bash
# Vérifier que REDIS_URL est correct
echo $REDIS_URL

# Tester la connexion
redis-cli -h huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com -p 6379 ping

# Redis Serverless peut prendre 1-2 min pour "wake up"
```

### Erreur: "Azure AI 401 Unauthorized"
```bash
# Vérifier que la clé API est correcte
echo $AZURE_AI_API_KEY

# Tester l'endpoint
curl -X POST "$AZURE_DEEPSEEK_V3_ENDPOINT/v1/chat/completions" \
  -H "api-key: $AZURE_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"test"}]}'
```

---

**Prêt à configurer Vercel? Go! 🚀**
