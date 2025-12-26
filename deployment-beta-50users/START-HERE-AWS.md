# 🚀 START HERE - Déploiement AWS + Vercel

**Date**: 23 décembre 2025  
**Statut**: ✅ Infrastructure AWS déployée, prêt pour Vercel

---

## 📍 Situation Actuelle

✅ **AWS Infrastructure** (us-east-2) - DÉPLOYÉ
- PostgreSQL RDS: `huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com`
- Redis Serverless: `huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com`
- S3 Bucket: `huntaze-beta-storage-1766460248`
- Secrets: Stockés dans AWS Secrets Manager

✅ **Azure AI Models** (France Central) - DÉPLOYÉ
- 7 modèles: DeepSeek-V3, DeepSeek-R1, Phi-4 Multimodal, Phi-4 Mini, Llama 3.3-70B, Mistral Large, Azure Speech
- Budget: $62/mois (6% du budget $1,000/mois)

❓ **Question Azure**: France Central ou East US?
- **Réponse**: GARDE France Central pour l'instant
- **Raison**: 100-150ms est acceptable, déploie maintenant
- **Voir**: `DECISION-AZURE-REGION.md`

---

## 🎯 PROCHAINE ÉTAPE: Configurer Vercel

### Option 1: CLI Automatique (RECOMMANDÉ) 🚀

**Récupère TOUTES les clés automatiquement via CLI**

```bash
# Un seul script pour tout récupérer
./deployment-beta-50users/scripts/get-all-keys.sh
```

**Ce que fait le script**:
- ✅ Récupère les clés Azure AI automatiquement
- ✅ Récupère les clés Azure Speech automatiquement
- ✅ Récupère les clés AWS automatiquement
- ✅ Fusionne toutes les clés
- ✅ Crée un fichier prêt pour Vercel
- ✅ Teste les connexions

**Temps estimé**: 5-10 minutes

**Guide complet**: `CLI-GUIDE.md`

---

### Option 2: Guide Manuel

**Fichier**: `NEXT-STEP.md`

Étapes:
1. Récupère tes clés Azure AI et AWS manuellement
2. Copie les variables depuis `COPY-PASTE-VERCEL.txt`
3. Colle dans Vercel (Settings → Environment Variables)
4. Initialise la base de données: `npx prisma db push`
5. Déploie: `vercel --prod`

**Temps estimé**: 15-30 minutes

---

### Option 3: Script Interactif

**Fichier**: `QUICK-COMMANDS.sh`

```bash
# Exécute le script interactif
./deployment-beta-50users/QUICK-COMMANDS.sh
```

Le script te guide étape par étape:
1. Récupération des clés (manuelle)
2. Configuration Vercel
3. Initialisation base de données
4. Tests des services
5. Déploiement

---

## 📚 Documentation Disponible

### Guides Essentiels
- **NEXT-STEP.md** - Prochaine étape (Vercel)
- **COPY-PASTE-VERCEL.txt** - Variables à copier dans Vercel
- **DECISION-AZURE-REGION.md** - France Central vs East US
- **QUICK-COMMANDS.sh** - Script de déploiement automatique

### Documentation Complète
- **VERCEL-ENV-VARS-COMPLET.md** - Guide détaillé des variables
- **AZURE-AI-COMPLET.md** - Documentation Azure AI (7 modèles)
- **AZURE-AI-MIGRATION-EASTUS.md** - Guide de migration (optionnel)
- **AWS-INFRASTRUCTURE-DEPLOYED.md** - Infrastructure AWS déployée
- **aws-infrastructure-config.env** - Configuration AWS

### Guides de Déploiement
- **AWS-DEPLOYMENT-GUIDE.md** - Guide de déploiement AWS
- **DEPLOIEMENT-AWS-COMPLET.md** - Déploiement AWS complet
- **SESSION-RECAP-2025-12-23.md** - Récapitulatif de session

---

## 🎯 Checklist Rapide

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

### Actions
- [ ] Récupérer les clés Azure AI
- [ ] Récupérer les AWS Access Keys
- [ ] Configurer Vercel
- [ ] Initialiser la base de données
- [ ] Déployer sur Vercel
- [ ] Tester l'application

---

## 🚀 Démarrage Rapide (3 Commandes)

```bash
# 1. Récupère les clés (manuellement depuis Azure Portal et AWS Console)

# 2. Configure Vercel (copie-colle depuis COPY-PASTE-VERCEL.txt)

# 3. Déploie
export DATABASE_URL="postgresql://huntaze_admin:ernMIVqqb7F0DuHYSje8ZsCpD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"
npx prisma db push
vercel --prod
```

**C'est tout! Tu es en production! 🎉**

---

## 🆘 Besoin d'Aide?

### Problèmes Courants

**Erreur: "Cannot connect to database"**
- Vérifie que `DATABASE_URL` est correct
- Teste: `psql "$DATABASE_URL" -c "SELECT 1;"`
- Vérifie le Security Group RDS (port 5432 ouvert)

**Erreur: "Redis connection timeout"**
- Redis Serverless prend 1-2 min pour "wake up"
- Attendre et réessayer

**Erreur: "Azure AI 401 Unauthorized"**
- Vérifie que `AZURE_AI_API_KEY` est correct
- Teste l'endpoint avec curl

### Documentation Détaillée

Voir `NEXT-STEP.md` section "Problèmes Courants"

---

## 📊 Architecture Déployée

```
┌─────────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend + API)                   │
│                  https://ton-app.vercel.app                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  AWS (US-E2) │      │ AZURE AI (FR)│      │ AZURE WORKERS│
├──────────────┤      ├──────────────┤      ├──────────────┤
│ PostgreSQL   │      │ DeepSeek-V3  │      │ Service Bus  │
│ Redis        │      │ DeepSeek-R1  │      │ Functions    │
│ S3           │      │ Phi-4 Multi  │      │              │
│              │      │ Phi-4 Mini   │      │              │
│ $47-62/mois  │      │ Llama 3.3    │      │ $5-10/mois   │
│              │      │ Mistral      │      │              │
│              │      │ Speech       │      │              │
│              │      │ $62/mois     │      │              │
└──────────────┘      └──────────────┘      └──────────────┘

Total: ~$114-134/mois pour 50 utilisatrices
```

---

## 🎯 Résumé en 3 Étapes

1. **Récupère tes clés** (Azure AI, AWS)
2. **Configure Vercel** (copie-colle les variables)
3. **Déploie** (`vercel --prod`)

**Temps estimé**: 15-30 minutes

---

**Prêt? Ouvre `NEXT-STEP.md` et go! 🚀**
