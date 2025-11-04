# 🚀 CONFIGURATION VARIABLES D'ENVIRONNEMENT STAGING

## Variables CRITIQUES à ajouter dans AWS Amplify Console

### 1. Base de données (PRODUCTION)
```
DATABASE_URL=postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?schema=public&sslmode=require
```

### 2. Authentification
```
JWT_SECRET=huntaze-super-secret-jwt-key-change-this-in-production-2025
NODE_ENV=production
```

### 3. Azure OpenAI (PRODUCTION)
```
AZURE_OPENAI_API_KEY=REDACTED
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-eus2-29796.openai.azure.com
AZURE_OPENAI_API_VERSION=2024-05-01-preview
AZURE_OPENAI_DEPLOYMENT=gpt-4o
```

### 4. Azure AI Team
```
AZURE_SUBSCRIPTION_ID=50dd5632-01dc-4188-b338-0da5ddd8494b
AZURE_RESOURCE_GROUP=huntaze-ai
AZURE_PROJECT_NAME=huntaze-agents
AZURE_AI_PROJECT_ENDPOINT=https://eastus.api.azureml.ms
ENABLE_AZURE_AI_TEAM=1
ENABLE_AZURE_AI=1
USE_AZURE_RESPONSES=1
LLM_PROVIDER=azure
```

### 5. Application URLs
```
NEXT_PUBLIC_APP_URL=https://staging.d1234567890.amplifyapp.com
FROM_EMAIL=noreply@huntaze.com
```

### 6. Redis & Cache
```
REDIS_URL=redis://localhost:6379
```

### 7. AWS Configuration
```
AWS_REGION=us-east-1
```

### 8. Feature Flags
```
ENABLE_EVENTBRIDGE_HOOKS=0
ENABLE_AGENTS_PROXY=0
TOKEN_ENCRYPTION_KEY=LJz2qNC7qwUCIWO7ow8krpoOtJP1tDXLg8bIav8LnLY=
```

### 9. Social Media OAuth (PRODUCTION)
```
TIKTOK_CLIENT_KEY=your-tiktok-client-key
TIKTOK_CLIENT_SECRET=your-tiktok-client-secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://staging.d1234567890.amplifyapp.com/api/auth/tiktok/callback

FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://staging.d1234567890.amplifyapp.com/api/auth/instagram/callback
```

## 📋 ÉTAPES DANS AWS AMPLIFY CONSOLE

1. **Aller sur AWS Amplify Console**
   - https://console.aws.amazon.com/amplify/

2. **Sélectionner l'app Huntaze**

3. **Aller dans "Hosting environments"**

4. **Cliquer sur "staging"**

5. **Cliquer sur "Environment variables"**

6. **Cliquer "Manage variables"**

7. **Ajouter TOUTES les variables ci-dessus**

8. **Cliquer "Save"**

9. **Redéployer l'environnement staging**

## ✅ VALIDATION

Après le déploiement, tester :
```bash
curl -s "https://staging.d1234567890.amplifyapp.com/api/health/overall" | jq .
```

Le résultat devrait être `"status": "healthy"` pour tous les services.