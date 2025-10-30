# 🔍 Infrastructure AWS Réelle - Huntaze

## ✅ Ce Qui Est VRAIMENT Déployé sur AWS

### 1. AWS Amplify (Production) ✅

**App Details:**
- **Name:** huntaze
- **App ID:** d2gmcfr71gawhz
- **Domain:** d2gmcfr71gawhz.amplifyapp.com
- **Platform:** WEB
- **Branch:** main (PRODUCTION)
- **Auto Build:** Enabled

**Environment Variables Configurées:**
```bash
NEXT_DISABLE_ESLINT=1
NEXT_PRIVATE_SKIP_TYPECHECK=true
NEXT_PUBLIC_API_URL=https://app.huntaze.com/api
NEXT_PUBLIC_APP_URL=https://app.huntaze.com
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://huntaze.com/auth/reddit/callback
NEXT_TELEMETRY_DISABLED=1
```

**Status:** ✅ App déployée et fonctionnelle

### 2. AWS S3 Buckets ✅

**Buckets Existants:**
```
1. cdk-hnb659fds-assets-317805897534-us-east-1
   - CDK assets bucket
   - Created: 2025-10-12

2. cdk-ofq1abcde-assets-317805897534-us-east-1
   - CDK assets bucket
   - Created: 2025-10-12

3. huntaze-of-traces-317805897534-us-east-1
   - OnlyFans traces/logs
   - Created: 2025-10-11

4. huntaze-playwright-artifacts-317805897534-us-east-1
   - Playwright test artifacts
   - Created: 2025-10-11

5. huntazeofcistack-ofpipelineartifactsbucket2e105862-yvpqdiogwdmu
   - CI/CD pipeline artifacts
   - Created: 2025-10-11

6. huntazeofcistack-ofsourcebuckete857dca2-sit7ku08virm
   - Source code bucket
   - Created: 2025-10-11
```

**Status:** ✅ 6 buckets actifs

### 3. AWS Secrets Manager ✅

**Secrets Configurés:**
```
events!connection/huntaze-api-auth/93790482-97e3-41e5-a2c3-ac7917d4b05e
- API authentication secret
- EventBridge connection
```

**Status:** ✅ 1 secret configuré

### 4. AWS Account Info ✅

**Account Details:**
- **Account ID:** 317805897534
- **User:** huntaze
- **Role:** AWSReservedSSO_AdministratorAccess
- **Access:** Full Administrator
- **Region:** us-east-1

---

## ❌ Ce Qui N'Est PAS Déployé

### 1. RDS Database ❌

**Status:** Aucune instance RDS trouvée

**Implications:**
- Pas de PostgreSQL managé sur AWS
- Probablement base de données externe (Supabase?) ou locale

**Action Requise:**
```bash
# Option 1: Vérifier si DATABASE_URL pointe vers Supabase
echo $DATABASE_URL

# Option 2: Créer RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier huntaze-prod \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username huntaze \
  --master-user-password <password> \
  --allocated-storage 20
```

### 2. Secrets Stripe/Azure ❌

**Status:** Pas de secrets pour Stripe ou Azure OpenAI dans Secrets Manager

**Action Requise:**
```bash
# Créer secret Stripe
aws secretsmanager create-secret \
  --name huntaze/stripe \
  --secret-string '{
    "STRIPE_SECRET_KEY":"sk_live_...",
    "STRIPE_WEBHOOK_SECRET":"whsec_..."
  }'

# Créer secret Azure
aws secretsmanager create-secret \
  --name huntaze/azure \
  --secret-string '{
    "AZURE_OPENAI_API_KEY":"...",
    "AZURE_OPENAI_ENDPOINT":"https://huntaze-ai-eus2-29796.openai.azure.com"
  }'
```

### 3. CloudFront CDN ❌

**Status:** Pas de distribution CloudFront

**Action Requise:**
```bash
# Créer distribution CloudFront pour S3
aws cloudfront create-distribution \
  --origin-domain-name huntaze-media.s3.amazonaws.com \
  --default-root-object index.html
```

### 4. Lambda Functions ❌

**Status:** Pas de fonctions Lambda

**Implications:**
- Pas de serverless functions
- Tout tourne sur Amplify

### 5. API Gateway ❌

**Status:** Pas d'API Gateway

**Implications:**
- API routes via Next.js sur Amplify uniquement

---

## 🎯 Architecture Actuelle

```
┌─────────────────────────────────────────────────────────┐
│                    UTILISATEURS                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              AWS Amplify (huntaze)                       │
│  • App ID: d2gmcfr71gawhz                               │
│  • Domain: d2gmcfr71gawhz.amplifyapp.com                │
│  • Branch: main (PRODUCTION)                             │
│  • Next.js App + API Routes                              │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┼────────────┬────────────┐
        │            │            │            │
        ▼            ▼            ▼            ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ S3 (6)   │  │ Secrets  │  │  Azure   │  │ External │
│          │  │ Manager  │  │  OpenAI  │  │    DB    │
│ • Traces │  │          │  │          │  │          │
│ • Tests  │  │ • API    │  │ • GPT-4o │  │ Supabase?│
│ • CI/CD  │  │   Auth   │  │ • Mini   │  │          │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
```

---

## 📊 Variables d'Environnement Manquantes

### Dans Amplify

**Actuellement configuré:**
- ✅ NEXT_PUBLIC_API_URL
- ✅ NEXT_PUBLIC_APP_URL
- ✅ NEXT_PUBLIC_REDDIT_REDIRECT_URI

**Manquant (critique):**
- ❌ DATABASE_URL
- ❌ AZURE_OPENAI_API_KEY
- ❌ AZURE_OPENAI_ENDPOINT
- ❌ STRIPE_SECRET_KEY
- ❌ STRIPE_WEBHOOK_SECRET
- ❌ NEXTAUTH_SECRET
- ❌ NEXTAUTH_URL

**Action Requise:**
```bash
# Ajouter les variables manquantes
aws amplify update-branch \
  --app-id d2gmcfr71gawhz \
  --branch-name main \
  --environment-variables \
    DATABASE_URL="postgresql://..." \
    AZURE_OPENAI_API_KEY="..." \
    AZURE_OPENAI_ENDPOINT="https://huntaze-ai-eus2-29796.openai.azure.com" \
    STRIPE_SECRET_KEY="sk_live_..." \
    NEXTAUTH_SECRET="..." \
    NEXTAUTH_URL="https://app.huntaze.com"
```

---

## 🚀 Plan d'Action Immédiat

### Phase 1: Configurer les Variables d'Environnement (30 min)

```bash
# 1. Récupérer les credentials depuis .env local
cat .env | grep -E "(DATABASE_URL|AZURE|STRIPE|NEXTAUTH)"

# 2. Créer un fichier avec toutes les variables
cat > amplify-env-vars.json << EOF
{
  "DATABASE_URL": "postgresql://...",
  "AZURE_OPENAI_API_KEY": "...",
  "AZURE_OPENAI_ENDPOINT": "https://huntaze-ai-eus2-29796.openai.azure.com",
  "AZURE_OPENAI_DEPLOYMENT": "gpt-4o",
  "STRIPE_SECRET_KEY": "sk_live_...",
  "STRIPE_WEBHOOK_SECRET": "whsec_...",
  "NEXTAUTH_SECRET": "...",
  "NEXTAUTH_URL": "https://app.huntaze.com"
}
EOF

# 3. Mettre à jour Amplify
aws amplify update-branch \
  --app-id d2gmcfr71gawhz \
  --branch-name main \
  --environment-variables file://amplify-env-vars.json
```

### Phase 2: Créer les Secrets AWS (15 min)

```bash
# Stripe
aws secretsmanager create-secret \
  --name huntaze/stripe \
  --description "Stripe API keys for Huntaze" \
  --secret-string file://stripe-secrets.json

# Azure
aws secretsmanager create-secret \
  --name huntaze/azure \
  --description "Azure OpenAI credentials" \
  --secret-string file://azure-secrets.json

# Database
aws secretsmanager create-secret \
  --name huntaze/database \
  --description "Database connection string" \
  --secret-string '{"DATABASE_URL":"postgresql://..."}'
```

### Phase 3: Vérifier le Déploiement (10 min)

```bash
# 1. Trigger un nouveau build
aws amplify start-job \
  --app-id d2gmcfr71gawhz \
  --branch-name main \
  --job-type RELEASE

# 2. Vérifier le status
aws amplify list-jobs \
  --app-id d2gmcfr71gawhz \
  --branch-name main \
  --max-results 1

# 3. Tester l'app
curl https://d2gmcfr71gawhz.amplifyapp.com/api/health
```

---

## 💡 Recommandations

### Court Terme (Cette Semaine)

1. **Ajouter toutes les variables d'environnement** dans Amplify
2. **Créer les secrets** dans Secrets Manager
3. **Documenter le DATABASE_URL** (où est la DB?)
4. **Tester le déploiement** avec les nouvelles variables

### Moyen Terme (Ce Mois)

1. **Créer RDS PostgreSQL** si pas de DB externe
2. **Setup CloudFront** pour CDN
3. **Configurer CloudWatch** pour monitoring
4. **Setup alertes** SNS pour erreurs

### Long Terme (Trimestre)

1. **Migration vers ECS/Fargate** pour plus de contrôle
2. **Setup multi-région** pour HA
3. **Implement WAF** pour sécurité
4. **Setup backup automatique** RDS

---

## 📝 Checklist de Vérification

### Infrastructure
- [x] AWS Amplify déployé
- [x] S3 buckets créés
- [x] Secrets Manager configuré (partiel)
- [ ] RDS Database
- [ ] CloudFront CDN
- [ ] CloudWatch monitoring
- [ ] SNS alertes

### Configuration
- [x] Variables publiques Amplify
- [ ] Variables privées Amplify
- [ ] Secrets Stripe
- [ ] Secrets Azure
- [ ] Database URL
- [ ] NextAuth config

### Sécurité
- [x] IAM roles configurés
- [ ] Secrets dans Secrets Manager
- [ ] SSL/TLS configuré
- [ ] WAF rules
- [ ] Backup strategy

---

## 🎯 Conclusion

**Infrastructure Existante:**
- ✅ AWS Amplify (production)
- ✅ 6 S3 buckets
- ✅ Secrets Manager (partiel)
- ✅ Admin access configuré

**Ce Qui Manque:**
- ❌ Variables d'environnement complètes
- ❌ RDS Database (ou documentation de la DB externe)
- ❌ Secrets complets (Stripe, Azure)
- ❌ CloudFront CDN
- ❌ Monitoring/Alertes

**Prochaine Action:**
```bash
# Configurer les variables d'environnement Amplify
aws amplify update-branch --app-id d2gmcfr71gawhz --branch-name main --environment-variables ...
```

**Temps Estimé:** 1-2 heures pour tout configurer correctement.
