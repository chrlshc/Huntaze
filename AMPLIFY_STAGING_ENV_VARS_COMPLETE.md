# 🚀 VARIABLES D'ENVIRONNEMENT COMPLÈTES POUR AWS AMPLIFY STAGING

## 📋 TOUTES LES VARIABLES CRITIQUES À CONFIGURER

### 1. 🗄️ BASE DE DONNÉES (PRODUCTION)
```bash
DATABASE_URL=postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?schema=public&sslmode=require
```

### 2. 🔐 AUTHENTIFICATION & SÉCURITÉ
```bash
JWT_SECRET=huntaze-super-secret-jwt-key-change-this-in-production-2025
NODE_ENV=production
TOKEN_ENCRYPTION_KEY=LJz2qNC7qwUCIWO7ow8krpoOtJP1tDXLg8bIav8LnLY=
```

### 3. 🤖 AZURE OPENAI (PRODUCTION)
```bash
AZURE_OPENAI_API_KEY=9YrdPSyu9StY896EE9Csqx6UBPhnYMpiTLgg6KK5aIqaLrGz5558JQQJ99BJACHYHv6XJ3w3AAABACOGfXiX
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-eus2-29796.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-05-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o
DEFAULT_AI_MODEL=gpt-4o
DEFAULT_AI_PROVIDER=azure
LLM_PROVIDER=azure
```

### 4. 🎯 AZURE AI TEAM (MULTI-AGENTS)
```bash
AZURE_SUBSCRIPTION_ID=50dd5632-01dc-4188-b338-0da5ddd8494b
AZURE_RESOURCE_GROUP=huntaze-ai
AZURE_PROJECT_NAME=huntaze-agents
AZURE_AI_PROJECT_ENDPOINT=https://eastus.api.azureml.ms
ENABLE_AZURE_AI_TEAM=1
ENABLE_AZURE_AI=1
USE_AZURE_RESPONSES=1
```

### 5. 🌐 APPLICATION URLS
```bash
NEXT_PUBLIC_APP_URL=https://staging.d1234567890.amplifyapp.com
FROM_EMAIL=noreply@huntaze.com
HUNTAZE_LOGO_BASE64=data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iaHVudGF6ZS1ncmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiM5MzMzRUE7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0VDNDg5OTtzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIAogIDwhLS0gQmFja2dyb3VuZCBzaGFwZSAtLT4KICA8cGF0aCBkPSJNMjAgMEM4Ljk1IDAgMCA4Ljk1IDAgMjBDMCAzMS4wNSA4Ljk1IDQwIDIwIDQwQzMxLjA1IDQwIDQwIDMxLjA1IDQwIDIwQzQwIDguOTUgMzEuMDUgMCAyMCAwWiIgZmlsbD0idXJsKCNodW50YXplLWdyYWRpZW50KSIgb3BhY2l0eT0iMC4xIi8+CiAgCiAgPCEtLSBIIG1vbm9ncmFtIC0tPgogIDxwYXRoIGQ9Ik0xMiAxMFYzME0xMiAyMEgyOE0yOCAxMFYzMCIgc3Ryb2tlPSJ1cmwoI2h1bnRhemUtZ3JhZGllbnQpIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgogIAogIDwhLS0gRGVjb3JhdGl2ZSBkb3RzIC0tPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTAiIHI9IjIiIGZpbGw9InVybCgjaHVudGF6ZS1ncmFkaWVudCkiLz4KICA8Y2lyY2xlIGN4PSIyOCIgY3k9IjEwIiByPSIyIiBmaWxsPSJ1cmwoI2h1bnRhemUtZ3JhZGllbnQpIi8+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIzMCIgcj0iMiIgZmlsbD0idXJsKCNodW50YXplLWdyYWRpZW50KSIvPgogIDxjaXJjbGUgY3g9IjI4IiBjeT0iMzAiIHI9IjIiIGZpbGw9InVybCgjaHVudGF6ZS1ncmFkaWVudCkiLz4KPC9zdmc+
```

### 6. 🔄 REDIS & CACHE
```bash
REDIS_URL=redis://localhost:6379
```

### 7. ☁️ AWS CONFIGURATION
```bash
AWS_REGION=us-east-1
```

### 8. 🚩 FEATURE FLAGS
```bash
ENABLE_EVENTBRIDGE_HOOKS=0
ENABLE_AGENTS_PROXY=0
```

### 9. 📱 SOCIAL MEDIA OAUTH (À REMPLACER PAR VOS VRAIES CLÉS)
```bash
# TikTok OAuth
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://staging.d1234567890.amplifyapp.com/api/auth/tiktok/callback

# Instagram/Facebook OAuth
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://staging.d1234567890.amplifyapp.com/api/auth/instagram/callback

# Reddit OAuth
REDDIT_CLIENT_ID=your-reddit-client-id
REDDIT_CLIENT_SECRET=your-reddit-client-secret
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://staging.d1234567890.amplifyapp.com/api/auth/reddit/callback
```

### 10. 🔧 ADMIN & DEBUG
```bash
ADMIN_TOKEN=huntaze-admin-token-change-this
DEBUG_TOKEN=huntaze-debug-token-change-this
```

### 11. 🤖 AI AGENT SYSTEM
```bash
AI_AGENT_RATE_LIMIT=60
AI_AGENT_TIMEOUT=30000
```

### 12. 📊 PIPELINE MODES
```bash
PIPELINE_MODE_INSTAGRAM=shadow
PIPELINE_MODE_TIKTOK=shadow
PIPELINE_MODE_REDDIT=shadow
PIPELINE_MODE_TWITTER=shadow
```

### 13. 🚀 PUBLISH SETTINGS
```bash
PUBLISH_ENABLED_INSTAGRAM=true
PUBLISH_ENABLED_TIKTOK=true
PUBLISH_ENABLED_REDDIT=true
MAX_POSTS_IG=20
MAX_POSTS_TT=10
MAX_POSTS_REDDIT=50
```

### 14. 🔒 ONLYFANS RATE LIMITER (AWS INFRASTRUCTURE)
```bash
RATE_LIMITER_ENABLED=true
SQS_RATE_LIMITER_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue
SQS_RATE_LIMITER_DLQ_URL=https://sqs.us-east-1.amazonaws.com/317805897534/huntaze-rate-limiter-queue-dlq
REDIS_ENDPOINT=huntaze-redis-production.xxxxx.use1.cache.amazonaws.com:6379
CLOUDWATCH_NAMESPACE=Huntaze/OnlyFans
```

---

## 🛠️ ÉTAPES DANS AWS AMPLIFY CONSOLE

### 1. Accéder à AWS Amplify Console
```
https://console.aws.amazon.com/amplify/
```

### 2. Sélectionner l'application Huntaze

### 3. Aller dans "Hosting environments"

### 4. Cliquer sur "staging"

### 5. Cliquer sur "Environment variables"

### 6. Cliquer "Manage variables"

### 7. Ajouter TOUTES les variables ci-dessus une par une

### 8. Cliquer "Save"

### 9. Redéployer l'environnement staging

---

## ✅ VALIDATION POST-DÉPLOIEMENT

### Tester les endpoints de santé :
```bash
# Test général
curl -s "https://staging.d1234567890.amplifyapp.com/api/health/overall" | jq .

# Test base de données
curl -s "https://staging.d1234567890.amplifyapp.com/api/health/database" | jq .

# Test authentification
curl -s "https://staging.d1234567890.amplifyapp.com/api/health/auth" | jq .

# Test configuration
curl -s "https://staging.d1234567890.amplifyapp.com/api/health/config" | jq .
```

### Tester l'endpoint de login :
```bash
curl -X POST "https://staging.d1234567890.amplifyapp.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | jq .
```

### Résultats attendus :
- ✅ Tous les endpoints de santé retournent `"status": "healthy"`
- ✅ L'endpoint de login retourne `401 "Invalid email or password"` (pas 500)
- ✅ Aucun message "Internal server error"

---

## 🚨 VARIABLES CRITIQUES À VÉRIFIER ABSOLUMENT

1. **DATABASE_URL** - Doit avoir `sslmode=require` pour la production
2. **JWT_SECRET** - Doit être identique à la production
3. **NODE_ENV** - Doit être `production` pour staging
4. **AZURE_OPENAI_API_KEY** - Clé de production Azure OpenAI
5. **NEXT_PUBLIC_APP_URL** - URL correcte du staging Amplify

---

## ⏱️ TIMELINE ESTIMÉE

- Configuration des variables : **10-15 minutes**
- Redéploiement Amplify : **3-5 minutes**
- Tests de validation : **2-3 minutes**
- **Total : 15-23 minutes**

---

## 🔄 PLAN DE ROLLBACK (SI ÉCHEC)

### Option 1 : Restaurer les variables
1. Sauvegarder les variables actuelles
2. Restaurer depuis une sauvegarde connue
3. Redéployer

### Option 2 : Rollback du code
```bash
git log --oneline -10  # Trouver le commit avant Smart Onboarding
git checkout [commit-précédent]
git push huntaze staging --force
```

### Option 3 : Revert complet
```bash
git revert d9d4ca36a  # Revert Smart Onboarding
git push huntaze staging
```

---

## 📞 SUPPORT

Si vous rencontrez des problèmes :
1. Vérifiez les logs AWS Amplify
2. Testez les endpoints de santé
3. Vérifiez que toutes les variables sont bien configurées
4. Contactez l'équipe DevOps si nécessaire

**Une fois ces variables configurées, le staging devrait fonctionner parfaitement ! 🚀**