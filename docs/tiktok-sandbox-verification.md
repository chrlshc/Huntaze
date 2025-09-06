# Vérification Sandbox TikTok

## Configuration Actuelle

### 1. Service TikTok (lib/services/tiktok.ts)
- ✓ Détecte le mode sandbox avec `TIKTOK_SANDBOX_MODE`
- ✓ Utilise les bonnes URLs:
  - Sandbox: `https://open-sandbox.tiktok.com`
  - Production: `https://open-api.tiktok.com`
- ✓ Gère upload vidéo et authentification

### 2. OAuth Flow (app/api/auth/tiktok/callback/route.ts)
- ✓ Échange code contre token
- ✓ Récupère infos utilisateur
- ✓ Compatible sandbox/production

### 3. Variables d'environnement
```bash
# .env.local (pour sandbox)
TIKTOK_CLIENT_KEY=your-sandbox-key
TIKTOK_CLIENT_SECRET=your-sandbox-secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/auth/tiktok/callback
TIKTOK_SANDBOX_MODE=true
```

## Test en Sandbox

### 1. Page de test créée
- URL: `/test-tiktok-sandbox`
- Vérifie configuration
- Teste OAuth flow
- Affiche endpoints utilisés

### 2. Étapes de vérification

1. **Configurer .env.local**
   ```bash
   cp .env.sandbox.example .env.local
   # Ajouter vos clés sandbox TikTok
   ```

2. **Lancer le test**
   ```bash
   npm run dev
   # Aller sur http://localhost:3000/test-tiktok-sandbox
   ```

3. **Vérifier:**
   - Mode = SANDBOX
   - Client Key présent
   - Redirect URI correct
   - Test OAuth ouvre popup TikTok sandbox

### 3. Passage en Production

1. **Changer .env.local**
   ```bash
   TIKTOK_SANDBOX_MODE=false  # ou supprimer la ligne
   TIKTOK_CLIENT_KEY=your-production-key
   TIKTOK_CLIENT_SECRET=your-production-secret
   ```

2. **Déployer sur Amplify**
   - Ajouter les variables dans AWS Amplify Console
   - SANS `TIKTOK_SANDBOX_MODE` pour production

## Points à Vérifier

- [ ] Clés sandbox reçues de TikTok
- [ ] Redirect URI ajouté dans TikTok Developer Portal
- [ ] Test OAuth fonctionne
- [ ] Upload vidéo test réussit
- [ ] Webhook configured (si nécessaire)

## Troubleshooting

### Erreur "Invalid client"
- Vérifier client_key et client_secret
- Vérifier redirect_uri exact

### Erreur "Scope invalid"
- Scopes sandbox: `user.info.basic,video.publish`
- Vérifier scopes approuvés dans app TikTok

### Upload échoue
- Vérifier taille vidéo (< 128MB)
- Format MP4 requis
- Durée 5 secondes minimum