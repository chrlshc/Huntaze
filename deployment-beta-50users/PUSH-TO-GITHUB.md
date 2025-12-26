# 🚀 Guide Push vers GitHub

**Statut**: Code prêt localement (commit `6b824881a`)  
**Problème**: Authentification GitHub requise

---

## ✅ Ce qui est PRÊT

- ✅ Code commité localement
- ✅ 4 API routes créées
- ✅ `@azure/service-bus` installé
- ✅ Documentation complète

---

## 🔑 Solution: Créer un Personal Access Token (PAT)

### Étape 1: Créer le Token sur GitHub

1. Va sur https://github.com/settings/tokens
2. Clique **"Generate new token (classic)"**
3. Donne un nom: `Huntaze Deployment`
4. Sélectionne les permissions:
   - ✅ `repo` (Full control of private repositories)
5. Clique **"Generate token"**
6. **COPIE LE TOKEN** (tu ne pourras plus le voir après)

### Étape 2: Push avec le Token

```bash
# Remplace TON_TOKEN par le token que tu viens de copier
git push https://TON_TOKEN@github.com/huntazeplateforme-create/Huntaze.git main
```

**Exemple**:
```bash
git push https://ghp_abc123xyz789@github.com/huntazeplateforme-create/Huntaze.git main
```

---

## 🔄 Alternative: Créer le Repo d'abord

Si le repo `huntazeplateforme-create/Huntaze` n'existe pas encore:

### 1. Créer le Repo sur GitHub

1. Va sur https://github.com/new
2. Owner: **huntazeplateforme-create**
3. Repository name: **Huntaze**
4. Visibility: **Private** (recommandé)
5. **NE PAS** initialiser avec README/gitignore/license
6. Clique **"Create repository"**

### 2. Push le Code

```bash
# Avec le token
git push https://TON_TOKEN@github.com/huntazeplateforme-create/Huntaze.git main

# OU avec SSH (si configuré)
git remote set-url huntaze-plateforme git@github.com:huntazeplateforme-create/Huntaze.git
git push huntaze-plateforme main
```

---

## 📦 Contenu du Commit

**Commit**: `6b824881a`  
**Message**: "Add Azure Service Bus integration - 4 API routes + Workers deployment"

**Fichiers inclus**:
- ✅ `app/api/jobs/video-analysis/route.ts`
- ✅ `app/api/jobs/chat-suggestions/route.ts`
- ✅ `app/api/jobs/content-suggestions/route.ts`
- ✅ `app/api/jobs/content-analysis/route.ts`
- ✅ `deployment-beta-50users/` (tous les docs)
- ✅ `huntaze-workers/` (workers Azure)
- ✅ `huntaze-workers-v2/` (workers déployés)
- ✅ `package.json` + `package-lock.json`

**Total**: 63 fichiers, 20,642 insertions

---

## 🎯 Après le Push

Une fois le code pushé sur GitHub:

### 1. Connecter à Vercel

1. Va sur https://vercel.com/new
2. Importe `huntazeplateforme-create/Huntaze`
3. Framework: **Next.js**
4. Build Command: `npm run build`
5. Deploy

### 2. Ajouter Variables d'Environnement

Dans Vercel Dashboard → Settings → Environment Variables:

```bash
SERVICEBUS_CONNECTION_SEND="Endpoint=sb://huntaze-sb-1eaef9fe.servicebus.windows.net/;SharedAccessKeyName=vercel-send;SharedAccessKey=REDACTED"
```

### 3. Tester

```bash
curl -X POST https://ton-app.vercel.app/api/jobs/video-analysis \
  -H "Content-Type: application/json" \
  -d '{"videoUrl": "https://test.mp4", "creatorId": "test-123"}'
```

---

## 🔒 Sécurité du Token

**IMPORTANT**:
- ❌ Ne commit JAMAIS le token dans le code
- ❌ Ne partage JAMAIS le token publiquement
- ✅ Utilise-le uniquement en ligne de commande
- ✅ Révoque-le après usage si nécessaire

---

## 📝 Commandes Rapides

```bash
# Vérifier le statut
git status

# Voir le dernier commit
git log -1

# Push avec token (remplace TON_TOKEN)
git push https://TON_TOKEN@github.com/huntazeplateforme-create/Huntaze.git main

# Vérifier les remotes
git remote -v
```

---

## ❓ Problèmes Courants

### "Repository not found"
→ Le repo n'existe pas encore, crée-le d'abord sur GitHub

### "Authentication failed"
→ Le token est invalide ou n'a pas les bonnes permissions

### "Permission denied (publickey)"
→ Clé SSH non configurée, utilise le token HTTPS à la place

---

**Dernière mise à jour**: 2025-12-23 00:10 UTC  
**Statut**: ⏳ EN ATTENTE DE PUSH VERS GITHUB

