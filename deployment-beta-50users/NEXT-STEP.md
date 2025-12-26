# 🚀 PROCHAINE ÉTAPE - Déploiement Vercel

**Date**: 23 décembre 2025  
**Statut**: ✅ Infrastructure AWS déployée, prêt pour Vercel

---

## 📍 Où tu en es

✅ **AWS Infrastructure** (us-east-2)
- PostgreSQL RDS déployé
- Redis Serverless déployé
- S3 bucket créé
- Secrets stockés dans AWS Secrets Manager

✅ **Azure AI Models** (France Central)
- 7 modèles déployés et fonctionnels
- DeepSeek-V3, DeepSeek-R1, Phi-4, Llama, Mistral, Azure Speech

❓ **Question**: France Central ou East US?
- **Réponse**: GARDE France Central pour l'instant
- **Raison**: 100-150ms est acceptable, déploie maintenant
- **Migration**: Possible plus tard si nécessaire

---

## 🎯 PROCHAINE ÉTAPE: Configurer Vercel

### Étape 1: Récupérer tes Clés Azure AI

Tu as besoin de 2 clés:

```bash
# 1. Azure AI API Key
# Va sur: https://portal.azure.com
# Cherche: "Azure AI Services" → Resource Group "huntaze-ai"
# Clique: "Keys and Endpoint" → Copie "KEY 1"

# 2. Azure Speech Key
# Va sur: https://portal.azure.com
# Cherche: "Speech Services"
# Clique: "Keys and Endpoint" → Copie "KEY 1"
```

### Étape 2: Récupérer tes AWS Access Keys

```bash
# Si tu n'as pas encore créé d'access keys:
aws iam create-access-key --user-name ton-user

# Ou récupère-les depuis AWS Console:
# https://console.aws.amazon.com/iam/home#/security_credentials
```

### Étape 3: Copier les Variables dans Vercel

**Fichier à utiliser**: `deployment-beta-50users/COPY-PASTE-VERCEL.txt`

1. Ouvre le fichier `COPY-PASTE-VERCEL.txt`
2. Remplace les placeholders:
   - `<TON_ACCESS_KEY_ID>` → Ta AWS Access Key
   - `<TON_SECRET_ACCESS_KEY>` → Ta AWS Secret Key
   - `<TA_CLE_AZURE_AI>` → Ta clé Azure AI
   - `<TA_CLE_AZURE_SPEECH>` → Ta clé Azure Speech
   - `https://ton-app.vercel.app` → Ton URL Vercel réelle

3. Va sur [vercel.com](https://vercel.com)
4. Ouvre ton projet
5. Va dans **Settings → Environment Variables**
6. Copie-colle TOUTES les variables (une par une)
7. Sélectionne **Production**, **Preview**, **Development**
8. Clique "Save"

### Étape 4: Initialiser la Base de Données

```bash
# 1. Exporte DATABASE_URL localement
export DATABASE_URL="postgresql://huntaze_admin:ernMIVqqb7F0DuHYSje8ZsCpD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"

# 2. Initialise le schéma Prisma
npx prisma db push

# 3. (Optionnel) Seed la base avec des données de test
npx prisma db seed
```

### Étape 5: Déployer sur Vercel

```bash
# Méthode 1: Via CLI
vercel --prod

# Méthode 2: Via Git
git add .
git commit -m "feat: configure production environment"
git push origin main
# Vercel déploie automatiquement
```

### Étape 6: Tester

```bash
# 1. Ouvre ton app Vercel
open https://ton-app.vercel.app

# 2. Teste les fonctionnalités critiques:
# - Connexion utilisateur
# - Génération de contenu AI
# - Messages OnlyFans
# - Upload d'images (S3)
# - Analytics

# 3. Vérifie les logs Vercel
vercel logs --prod
```

---

## 📋 Checklist Complète

### Variables Critiques (OBLIGATOIRES)
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

### Variables Recommandées
- [ ] `AZURE_DEEPSEEK_R1_ENDPOINT` - Endpoint DeepSeek-R1
- [ ] `AZURE_PHI4_MULTIMODAL_ENDPOINT` - Endpoint Phi-4
- [ ] `AZURE_SPEECH_ENDPOINT` - Endpoint Azure Speech
- [ ] `AZURE_SPEECH_KEY` - Clé Azure Speech
- [ ] `GEMINI_API_KEY` - Clé Google Gemini (optionnel)

### Actions
- [ ] Récupérer les clés Azure AI
- [ ] Récupérer les AWS Access Keys
- [ ] Remplacer les placeholders dans COPY-PASTE-VERCEL.txt
- [ ] Copier les variables dans Vercel
- [ ] Initialiser la base de données (Prisma)
- [ ] Déployer sur Vercel
- [ ] Tester l'application

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
# Redis Serverless peut prendre 1-2 min pour "wake up"
# Attendre et réessayer

# Tester la connexion
redis-cli -h huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com -p 6379 ping
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

## 📚 Documentation Utile

- **COPY-PASTE-VERCEL.txt** - Variables à copier dans Vercel
- **VERCEL-ENV-VARS-COMPLET.md** - Guide détaillé des variables
- **AZURE-AI-COMPLET.md** - Documentation complète Azure AI
- **DECISION-AZURE-REGION.md** - France Central vs East US
- **AZURE-AI-MIGRATION-EASTUS.md** - Guide de migration (optionnel)
- **aws-infrastructure-config.env** - Configuration AWS

---

## 🎯 Résumé en 3 Étapes

1. **Récupère tes clés** (Azure AI, AWS)
2. **Configure Vercel** (copie-colle les variables)
3. **Déploie** (`vercel --prod`)

**Temps estimé**: 15-30 minutes

---

**Prêt? Go! 🚀**

Si tu as des questions, demande-moi!
