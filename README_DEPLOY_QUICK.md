# 🚀 Huntaze - Déploiement Rapide

## ⚡ TL;DR - 3 Commandes

```bash
# 1. Vérifie que tout est prêt
./scripts/pre-deployment-check.sh

# 2. Configure AWS et déploie (interactive)
./QUICK_DEPLOY.sh

# 3. C'est tout! 🎉
```

---

## 📋 Ou Étape par Étape (20 min)

### 1. Vérifie (30s)
```bash
./scripts/pre-deployment-check.sh
```

### 2. Configure AWS (2 min)
```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
```

### 3. Déploie Infrastructure (5 min)
```bash
./scripts/deploy-huntaze-hybrid.sh
```

### 4. Configure Amplify (10 min)
1. Ouvre: https://console.aws.amazon.com/amplify
2. Va dans: App Settings > Environment variables
3. Copie depuis: `amplify-env-vars.txt`

### 5. Deploy (2 min)
```bash
git push origin main
```

---

## 📚 Documentation

| Fichier | Description |
|---------|-------------|
| **START_HERE.md** | 👈 **COMMENCE ICI** |
| DEPLOYMENT_NOW.md | Guide rapide 20 min |
| DEPLOYMENT_WORKFLOW.md | Workflow détaillé |
| WHAT_WE_BUILT.md | Ce qu'on a construit |
| TODO_DEPLOYMENT.md | Checklist complète |
| AMPLIFY_QUICK_START.md | Guide Amplify |

---

## 🎯 Ce Qui Est Prêt

✅ **Code:**
- Hybrid orchestrator (Azure + OpenAI)
- Rate limiter OnlyFans (10 msg/min)
- Cost monitoring en temps réel
- 16 API endpoints

✅ **Documentation:**
- 12 fichiers de guides
- Architecture complète
- Spec détaillée

✅ **Scripts:**
- Déploiement automatisé
- Vérification pré/post
- Configuration AWS

✅ **Tests:**
- 15+ fichiers de tests
- Unit + Integration + Performance

---

## ⚠️ Ce Qu'il Reste (20 min)

1. Configure AWS credentials (2 min)
2. Lance le script de déploiement (5 min)
3. Configure Amplify env vars (10 min)
4. Push to main (2 min)

---

## 💰 Coûts

~$70-75/month total:
- Amplify: $5-10
- AWS Services: $32
- AI (Azure + OpenAI): $32

---

## 🆘 Aide

**Problème avec AWS credentials?**
→ Lis `DEPLOYMENT_NOW.md` section "Troubleshooting"

**Besoin de comprendre l'architecture?**
→ Lis `HUNTAZE_COMPLETE_ARCHITECTURE.md`

**Veux voir le workflow complet?**
→ Lis `DEPLOYMENT_WORKFLOW.md`

**Veux savoir ce qu'on a construit?**
→ Lis `WHAT_WE_BUILT.md`

---

## 🚀 Quick Start

```bash
# Option A: Script interactif (recommandé)
./QUICK_DEPLOY.sh

# Option B: Manuel
./scripts/pre-deployment-check.sh
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
./scripts/deploy-huntaze-hybrid.sh
# Configure Amplify
git push origin main
```

---

## ✅ Vérification Post-Déploiement

```bash
# Health check
curl https://YOUR-URL/api/health/hybrid-orchestrator

# Cost stats
curl https://YOUR-URL/api/v2/costs/stats

# Feature flags
curl https://YOUR-URL/api/admin/feature-flags
```

---

## 🎉 Tu Es Prêt!

**Tout le code est prêt. Il te reste juste 20 minutes de config.**

**Lance:** `./QUICK_DEPLOY.sh` ou lis `START_HERE.md`

---

**Status:** ✅ Ready to deploy  
**Time to production:** 20 minutes  
**Next:** Lis `START_HERE.md` 👈
