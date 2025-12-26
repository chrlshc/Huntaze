# 🔴 VARIABLES CRITIQUES - À CONFIGURER MAINTENANT

## ⚠️ Ces Variables Sont ESSENTIELLES pour Ton App

Ton app ne peut PAS fonctionner sans ces variables car:
- **OAuth** = Cœur de l'app (login utilisateurs)
- **Apify** = Scraping content (pas d'API OnlyFans)
- **OnlyFans** = Scraping OF (pas d'API officielle)

---

## 🔴 PRIORITÉ 1: OAuth Providers (REQUIS)

### Google OAuth (Login principal)
```bash
# 1. Va sur: https://console.cloud.google.com/apis/credentials
# 2. Crée un projet "Huntaze"
# 3. Crée "OAuth 2.0 Client IDs"
# 4. Type: Web application
# 5. Authorized redirect URIs: https://ton-app.vercel.app/auth/google/callback
# 6. Copie Client ID et Client Secret

GOOGLE_CLIENT_ID=<ton-google-client-id>
GOOGLE_CLIENT_SECRET=<ton-google-client-secret>
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://ton-app.vercel.app/auth/google/callback
```

### Instagram OAuth (Intégration Instagram)
```bash
# 1. Va sur: https://developers.facebook.com/apps/
# 2. Crée une app "Huntaze"
# 3. Ajoute "Instagram Basic Display"
# 4. Configure OAuth redirect: https://ton-app.vercel.app/auth/instagram/callback
# 5. Copie App ID, App Secret, Client Token

FACEBOOK_APP_ID=<ton-facebook-app-id>
FACEBOOK_APP_SECRET=<ton-facebook-app-secret>
FACEBOOK_CLIENT_TOKEN=<ton-facebook-client-token>

INSTAGRAM_CLIENT_ID=<ton-instagram-client-id>
INSTAGRAM_CLIENT_SECRET=<ton-instagram-client-secret>
INSTAGRAM_REDIRECT_URI=https://ton-app.vercel.app/auth/instagram/callback
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://ton-app.vercel.app/auth/instagram/callback
INSTAGRAM_DEAUTH_CALLBACK_URL=https://ton-app.vercel.app/auth/deauthorize
INSTAGRAM_DATA_DELETION_URL=https://ton-app.vercel.app/data-deletion

# Webhooks Instagram
INSTAGRAM_WEBHOOK_SECRET=<genere-avec-openssl-rand-hex-32>
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<genere-avec-openssl-rand-hex-32>
```

### TikTok OAuth (Intégration TikTok)
```bash
# 1. Va sur: https://developers.tiktok.com/
# 2. Crée une app "Huntaze"
# 3. Configure redirect URI: https://ton-app.vercel.app/auth/tiktok/callback
# 4. Copie Client Key et Client Secret

TIKTOK_CLIENT_KEY=<ton-tiktok-client-key>
TIKTOK_CLIENT_SECRET=<ton-tiktok-client-secret>
TIKTOK_REDIRECT_URI=https://ton-app.vercel.app/auth/tiktok/callback
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://ton-app.vercel.app/auth/tiktok/callback
TIKTOK_SANDBOX_MODE=false
TIKTOK_WEBHOOK_SECRET=<genere-avec-openssl-rand-hex-32>
```

---

## 🔴 PRIORITÉ 2: Apify (Scraping Content Social - REQUIS)

```bash
# Apify = Scraping Instagram, TikTok, etc.
# Pour récupérer les trends et content des autres plateformes

# 1. Va sur: https://console.apify.com/account/integrations
# 2. Crée un API token
# 3. Copie le token

APIFY_API_TOKEN=<ton-apify-api-token>
APIFY_WEBHOOK_SECRET=<genere-avec-openssl-rand-hex-32>
```

**Coût Apify:**
- Free tier: $5/mois de crédit gratuit
- Pay-as-you-go: ~$0.25 par 1000 pages scrapées
- Pour 50 users: ~$10-20/mois

---

## 🔴 PRIORITÉ 3: Bright Data (Scraping OnlyFans - REQUIS)

```bash
# OnlyFans n'a PAS d'API officielle!
# Bright Data = Proxies résidentiels pour scraper OnlyFans sans ban

# 1. Va sur: https://brightdata.com/
# 2. Crée un compte
# 3. Configure une zone "residential"
# 4. Copie Customer ID et Password

BRIGHT_DATA_CUSTOMER=<ton-bright-data-customer>
BRIGHT_DATA_PASSWORD=<ton-bright-data-password>
BRIGHT_DATA_ZONE=residential

# Webhooks OnlyFans (pour notifications)
ONLYFANS_WEBHOOK_SECRET=<genere-avec-openssl-rand-hex-32>
```

**Coût Bright Data:**
- Residential proxies: ~$50-150/mois (selon usage)
- Pay-as-you-go: ~$12.50/GB
- Pour 50 users: ~$50-100/mois estimé

---

## 🟡 PRIORITÉ 4: Secrets Internes (REQUIS)

```bash
# Génère avec: openssl rand -hex 32

JWT_SECRET=<genere-avec-openssl-rand-hex-32>
OAUTH_STATE_SECRET=<genere-avec-openssl-rand-hex-32>
WORKER_SECRET=<genere-avec-openssl-rand-hex-32>
DATA_DELETION_SECRET=<genere-avec-openssl-rand-hex-32>
CRM_WEBHOOK_SECRET=<genere-avec-openssl-rand-hex-32>
```

---

## 🟢 PRIORITÉ 5: Variables Publiques (REQUIS)

```bash
NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app
NEXT_PUBLIC_API_URL=https://ton-app.vercel.app
NODE_ENV=production
API_MODE=real
ENABLE_RATE_LIMITING=true
ENABLE_CACHING=true
LOG_LEVEL=info
```

---

## 📋 Checklist de Configuration

### Étape 1: Génère les Secrets (2 min)
```bash
cd deployment-beta-50users
./scripts/generate-secrets.sh
```

### Étape 2: Configure Google OAuth (5 min)
- [ ] Créer projet Google Cloud
- [ ] Créer OAuth 2.0 Client IDs
- [ ] Configurer redirect URI
- [ ] Copier Client ID et Secret

### Étape 3: Configure Instagram OAuth (5 min)
- [ ] Créer app Facebook
- [ ] Ajouter Instagram Basic Display
- [ ] Configurer redirect URI
- [ ] Copier App ID, Secret, Client Token

### Étape 4: Configure TikTok OAuth (5 min)
- [ ] Créer app TikTok
- [ ] Configurer redirect URI
- [ ] Copier Client Key et Secret

### Étape 5: Configure Apify (2 min)
- [ ] Créer compte Apify
- [ ] Générer API token
- [ ] Copier le token

### Étape 6: Ajoute TOUT dans Vercel (5 min)
- [ ] Coller tous les secrets
- [ ] Coller toutes les variables OAuth
- [ ] Coller Apify token
- [ ] Coller variables publiques
- [ ] Sélectionner: Production, Preview, Development
- [ ] Cliquer "Save"

### Étape 7: Déploie! (3-5 min)
```bash
vercel --prod
```

---

## 💰 Budget Total

| Service | Coût/mois |
|---------|-----------|
| AWS RDS | $15-20 |
| AWS Redis | $25-35 |
| AWS S3 | $5-7 |
| Azure AI | $62 |
| Azure Workers | $5-10 |
| **Apify** | **$10-20** |
| **Bright Data** | **$50-100** |
| **TOTAL** | **$172-254/mois** |

---

## 🚨 Sans Ces Variables, Ton App Ne Peut PAS:

❌ **Sans OAuth (Google):**
- Pas de login utilisateurs
- Pas d'authentification
- App inutilisable

❌ **Sans Apify:**
- Pas de scraping content social (Instagram, TikTok)
- Pas de content trends
- Pas d'analytics multi-plateformes

❌ **Sans Bright Data:**
- Pas de scraping OnlyFans
- Pas de données OF (messages, stats, fans)
- Pas d'analytics OnlyFans

❌ **Sans Instagram/TikTok OAuth:**
- Pas d'intégration social media
- Pas de cross-posting
- Pas de connexion directe aux comptes

---

## ⚡ Script Rapide pour Générer TOUS les Secrets

```bash
# Génère tous les secrets d'un coup
cat << 'EOF'
# Secrets générés automatiquement
JWT_SECRET=$(openssl rand -hex 32)
OAUTH_STATE_SECRET=$(openssl rand -hex 32)
WORKER_SECRET=$(openssl rand -hex 32)
DATA_DELETION_SECRET=$(openssl rand -hex 32)
CRM_WEBHOOK_SECRET=$(openssl rand -hex 32)
INSTAGRAM_WEBHOOK_SECRET=$(openssl rand -hex 32)
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=$(openssl rand -hex 32)
TIKTOK_WEBHOOK_SECRET=$(openssl rand -hex 32)
ONLYFANS_WEBHOOK_SECRET=$(openssl rand -hex 32)
APIFY_WEBHOOK_SECRET=$(openssl rand -hex 32)
EOF
```

---

## 📞 Ordre de Configuration Recommandé

1. **Génère les secrets** (2 min) - `./scripts/generate-secrets.sh`
2. **Configure Google OAuth** (5 min) - Login principal
3. **Configure Apify** (2 min) - Scraping content
4. **Configure Instagram** (5 min) - Intégration social
5. **Configure TikTok** (5 min) - Intégration social
6. **Ajoute tout dans Vercel** (5 min)
7. **Déploie** (3-5 min) - `vercel --prod`

**Temps total:** 27-32 minutes

---

**Prêt? Commence par Google OAuth et Apify, ce sont les plus critiques! 🚀**
