# 🚀 DÉPLOIEMENT FINAL - GUIDE COMPLET

## 📊 État Actuel

✅ **FAIT:**
- Base de données PostgreSQL initialisée (avec pgvector)
- Variables infrastructure dans Vercel (DB, Redis, S3, Azure AI)
- NEXTAUTH_SECRET et ENCRYPTION_KEY configurés

🔧 **À FAIRE:**
- Générer et ajouter les secrets manquants (5 min)
- Ajouter les variables publiques (2 min)
- (Optionnel) Configurer OAuth providers (5-10 min)
- Déployer sur Vercel (3-5 min)

---

## 🎯 Option 1: Déploiement Minimal (7 min)

**Pour déployer rapidement sans OAuth:**

### 1. Génère les secrets (2 min)
```bash
./deployment-beta-50users/scripts/generate-secrets.sh
```

### 2. Copie les secrets dans Vercel (3 min)
- Va sur vercel.com → Ton projet → Settings → Environment Variables
- Colle les 5 secrets générés
- Sélectionne: Production, Preview, Development
- Clique "Save"

### 3. Ajoute les variables publiques (2 min)
```
NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app
NEXT_PUBLIC_API_URL=https://ton-app.vercel.app
NODE_ENV=production
API_MODE=real
```

⚠️ Remplace `https://ton-app.vercel.app` par ton URL Vercel!

### 4. Déploie! (3-5 min)
```bash
vercel --prod
```

**Résultat:** App fonctionnelle sans login social (tu pourras l'ajouter plus tard)

---

## 🎯 Option 2: Déploiement Complet (15-20 min)

**Pour déployer avec Google OAuth:**

### 1. Génère les secrets (2 min)
```bash
./deployment-beta-50users/scripts/generate-secrets.sh
```

### 2. Configure Google OAuth (5 min)
1. Va sur: https://console.cloud.google.com/apis/credentials
2. Crée un projet "Huntaze"
3. Crée "OAuth 2.0 Client IDs"
4. Authorized redirect URIs: `https://ton-app.vercel.app/auth/google/callback`
5. Copie Client ID et Client Secret

### 3. Ajoute TOUTES les variables dans Vercel (5 min)
```
# Secrets
JWT_SECRET=<généré-par-script>
OAUTH_STATE_SECRET=<généré-par-script>
WORKER_SECRET=<généré-par-script>
DATA_DELETION_SECRET=<généré-par-script>
CRM_WEBHOOK_SECRET=<généré-par-script>

# Variables publiques
NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app
NEXT_PUBLIC_API_URL=https://ton-app.vercel.app
NODE_ENV=production
API_MODE=real

# Google OAuth
GOOGLE_CLIENT_ID=<ton-client-id>
GOOGLE_CLIENT_SECRET=<ton-client-secret>
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://ton-app.vercel.app/auth/google/callback
```

### 4. Déploie! (3-5 min)
```bash
vercel --prod
```

**Résultat:** App complète avec login Google

---

## 📋 Fichiers de Référence

| Fichier | Description |
|---------|-------------|
| `VERCEL-FINAL-READY.txt` | Variables de base (déjà fait) |
| `VERCEL-ENV-VARS-COMPLETE.txt` | Liste complète de toutes les variables |
| `GENERER-SECRETS.md` | Guide pour générer les secrets |
| `ETAPES-FINALES.md` | Guide étape par étape détaillé |
| `scripts/generate-secrets.sh` | Script automatique pour générer les secrets |

---

## 🔍 Variables par Catégorie

### ✅ Déjà Configurées
- DATABASE_URL, REDIS_URL
- AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
- NEXTAUTH_URL, NEXTAUTH_SECRET, ENCRYPTION_KEY
- SERVICEBUS_CONNECTION_SEND
- AZURE_DEEPSEEK_V3_ENDPOINT, AZURE_DEEPSEEK_R1_ENDPOINT
- AZURE_PHI4_MULTIMODAL_ENDPOINT, AZURE_PHI4_MINI_ENDPOINT
- AZURE_LLAMA_ENDPOINT, AZURE_MISTRAL_ENDPOINT
- AZURE_AI_API_KEY, AZURE_SPEECH_KEY, AZURE_SPEECH_REGION

### 🔧 À Ajouter Maintenant (Requis)
- JWT_SECRET
- OAUTH_STATE_SECRET
- WORKER_SECRET
- DATA_DELETION_SECRET
- CRM_WEBHOOK_SECRET
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_API_URL
- NODE_ENV

### 🟡 À Ajouter Plus Tard (Optionnel)
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (login Google)
- INSTAGRAM_CLIENT_ID, INSTAGRAM_CLIENT_SECRET (Instagram)
- TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET (TikTok)
- GEMINI_API_KEY (AI supplémentaire)
- STRIPE_SECRET_KEY (paiements)
- APIFY_API_TOKEN (content trends)

---

## 🚨 Troubleshooting

### Erreur: "NEXTAUTH_URL must be provided"
**Solution:** Vérifie que NEXTAUTH_URL est configuré dans Vercel

### Erreur: "Database connection failed"
**Solution:** Vérifie que DATABASE_URL est correct

### Erreur: "Redis connection failed"
**Solution:** Vérifie que REDIS_URL est correct

### Erreur: "Google OAuth not configured"
**Solution:** Normal si tu n'as pas configuré Google OAuth. Tu peux:
- Option A: Configurer Google OAuth maintenant
- Option B: Ignorer et configurer plus tard

---

## ✅ Checklist Finale

- [ ] Générer les 5 secrets avec le script
- [ ] Ajouter les secrets dans Vercel
- [ ] Ajouter NEXT_PUBLIC_APP_URL (avec ton URL réelle)
- [ ] Ajouter NODE_ENV=production
- [ ] (Optionnel) Configurer Google OAuth
- [ ] Déployer avec `vercel --prod`
- [ ] Tester l'app sur ton URL Vercel
- [ ] Vérifier que la DB fonctionne
- [ ] Vérifier que Redis fonctionne
- [ ] Vérifier que Azure AI fonctionne

---

## 🎉 Après le Déploiement

Ton app sera disponible sur: `https://ton-app.vercel.app`

**Features disponibles:**
- ✅ Dashboard
- ✅ Analytics
- ✅ Content management
- ✅ AI features (Azure AI)
- ✅ Database (PostgreSQL)
- ✅ Cache (Redis)
- ✅ Storage (S3)
- 🔧 Login Google (si configuré)
- 🔧 Instagram (si configuré)
- 🔧 TikTok (si configuré)

**Tu pourras ajouter plus tard:**
- Stripe (paiements)
- Apify (content trends)
- Reddit, Threads, Twitter
- Bright Data (proxies)
- Sentry (error tracking)
- Google Analytics

---

## 📞 Commandes Rapides

```bash
# Génère les secrets
./deployment-beta-50users/scripts/generate-secrets.sh

# Déploie
vercel --prod

# Vérifie les logs
vercel logs

# Rollback si problème
vercel rollback
```

---

**Prêt? Choisis Option 1 (minimal) ou Option 2 (complet) et go! 🚀**
