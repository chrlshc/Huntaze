# 🔐 Générer les Secrets Requis

## Secrets à Générer Immédiatement

Tu as besoin de générer ces secrets pour que l'app fonctionne:

### 1. JWT_SECRET
```bash
openssl rand -hex 32
```

### 2. OAUTH_STATE_SECRET
```bash
openssl rand -hex 32
```

### 3. WORKER_SECRET
```bash
openssl rand -hex 32
```

### 4. DATA_DELETION_SECRET
```bash
openssl rand -hex 32
```

### 5. CRM_WEBHOOK_SECRET
```bash
openssl rand -hex 32
```

---

## Script Rapide (Génère Tous les Secrets)

```bash
echo "JWT_SECRET=$(openssl rand -hex 32)"
echo "OAUTH_STATE_SECRET=$(openssl rand -hex 32)"
echo "WORKER_SECRET=$(openssl rand -hex 32)"
echo "DATA_DELETION_SECRET=$(openssl rand -hex 32)"
echo "CRM_WEBHOOK_SECRET=$(openssl rand -hex 32)"
```

Copie le résultat et ajoute-le dans Vercel!

---

## OAuth Providers (À Configurer Plus Tard)

### Google OAuth
1. Va sur: https://console.cloud.google.com/apis/credentials
2. Crée un projet "Huntaze"
3. Crée des "OAuth 2.0 Client IDs"
4. Authorized redirect URIs: `https://ton-app.vercel.app/auth/google/callback`
5. Copie Client ID et Client Secret

### Instagram/Facebook
1. Va sur: https://developers.facebook.com/apps/
2. Crée une app "Huntaze"
3. Ajoute "Instagram Basic Display"
4. Configure OAuth redirect: `https://ton-app.vercel.app/auth/instagram/callback`
5. Copie App ID, App Secret, Client Token

### TikTok
1. Va sur: https://developers.tiktok.com/
2. Crée une app "Huntaze"
3. Configure redirect URI: `https://ton-app.vercel.app/auth/tiktok/callback`
4. Copie Client Key et Client Secret

---

## Priorités

### 🔴 URGENT (Requis pour déployer)
- ✅ NEXTAUTH_SECRET (déjà fait)
- ✅ ENCRYPTION_KEY (déjà fait)
- 🔧 JWT_SECRET (à générer maintenant)
- 🔧 OAUTH_STATE_SECRET (à générer maintenant)
- 🔧 WORKER_SECRET (à générer maintenant)

### 🟡 IMPORTANT (Requis pour features sociales)
- GOOGLE_CLIENT_ID + SECRET
- INSTAGRAM_CLIENT_ID + SECRET
- TIKTOK_CLIENT_KEY + SECRET

### 🟢 OPTIONNEL (Peut attendre)
- GEMINI_API_KEY
- STRIPE keys
- APIFY_API_TOKEN
- REDDIT, THREADS, TWITTER
- BRIGHT_DATA (proxies)
- SENTRY, GOOGLE_ANALYTICS

---

## Commande Rapide

```bash
# Génère tous les secrets d'un coup
cat << 'EOF'
# Secrets générés automatiquement
JWT_SECRET=$(openssl rand -hex 32)
OAUTH_STATE_SECRET=$(openssl rand -hex 32)
WORKER_SECRET=$(openssl rand -hex 32)
DATA_DELETION_SECRET=$(openssl rand -hex 32)
CRM_WEBHOOK_SECRET=$(openssl rand -hex 32)
EOF
```

Copie le résultat et ajoute-le dans Vercel → Environment Variables!
