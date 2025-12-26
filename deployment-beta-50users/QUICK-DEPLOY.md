# ⚡ DÉPLOIEMENT RAPIDE (7 min)

## 1️⃣ Génère les Secrets (2 min)

```bash
./deployment-beta-50users/scripts/generate-secrets.sh
```

Copie les 5 secrets affichés.

---

## 2️⃣ Ajoute dans Vercel (3 min)

Va sur [vercel.com](https://vercel.com) → Ton projet → Settings → Environment Variables

Colle les 5 secrets + ces 4 variables:

```
NEXT_PUBLIC_APP_URL=https://ton-app.vercel.app
NEXT_PUBLIC_API_URL=https://ton-app.vercel.app
NODE_ENV=production
API_MODE=real
```

⚠️ Remplace `https://ton-app.vercel.app` par ton URL Vercel!

Sélectionne: **Production**, **Preview**, **Development**

Clique **"Save"**

---

## 3️⃣ Déploie! (3-5 min)

```bash
vercel --prod
```

---

## ✅ C'est Tout!

Ton app est maintenant en production! 🎉

**URL:** `https://ton-app.vercel.app`

---

## 📚 Pour Plus de Détails

- **Guide complet:** `DEPLOY-FINAL.md`
- **Toutes les variables:** `VERCEL-ENV-VARS-COMPLETE.txt`
- **OAuth providers:** `ETAPES-FINALES.md`

---

## 🔧 Ajouter OAuth Plus Tard

### Google OAuth (5 min)
1. https://console.cloud.google.com/apis/credentials
2. Crée "OAuth 2.0 Client IDs"
3. Redirect URI: `https://ton-app.vercel.app/auth/google/callback`
4. Ajoute dans Vercel:
   ```
   GOOGLE_CLIENT_ID=ton-id
   GOOGLE_CLIENT_SECRET=ton-secret
   NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://ton-app.vercel.app/auth/google/callback
   ```

### Instagram (5 min)
1. https://developers.facebook.com/apps/
2. Crée une app
3. Ajoute "Instagram Basic Display"
4. Redirect URI: `https://ton-app.vercel.app/auth/instagram/callback`
5. Ajoute dans Vercel:
   ```
   INSTAGRAM_CLIENT_ID=ton-id
   INSTAGRAM_CLIENT_SECRET=ton-secret
   NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://ton-app.vercel.app/auth/instagram/callback
   ```

---

**Prêt? Lance les 3 commandes ci-dessus! 🚀**
