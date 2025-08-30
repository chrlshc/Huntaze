# Guide Vidéo Démo TikTok Sandbox - Huntaze

## ✅ Vérifications avant de commencer

1. **App TikTok configurée** ✓
   - Client key: sbawig5ujktghe109j
   - Compte test sandbox: @huntazeo
   - Redirect URI: https://huntaze.com/auth/tiktok/callback

2. **Variables d'environnement AWS Amplify**
   - Vérifier que ces variables sont définies :
   ```
   TIKTOK_CLIENT_KEY=sbawig5ujktghe109j
   TIKTOK_CLIENT_SECRET=uXf6cwokWvnHI2C26LAx15Nn4SwUmKMK
   TIKTOK_SANDBOX_MODE=true
   ```

## 📹 Script de la démo (2-3 minutes max)

### 1. **Intro (0:00-0:10)**
- Ouvrir Chrome en navigation privée
- Aller sur https://huntaze.com
- Montrer que vous êtes déconnecté

### 2. **Connexion à Huntaze (0:10-0:20)**
- Cliquer sur "Sign in" 
- Se connecter avec un compte (Google ou email)
- Arriver sur le dashboard

### 3. **Navigation vers TikTok (0:20-0:30)**
- Dans le dashboard, scroll jusqu'à "Social Media"
- Montrer la carte TikTok "Not connected"
- Cliquer sur "Connect"

### 4. **OAuth TikTok Sandbox (0:30-1:00)**
- **IMPORTANT**: Vous serez redirigé vers https://open-sandbox.tiktok.com
- Connectez-vous avec le compte sandbox **@huntazeo**
- La page d'autorisation affichera :
  - App name: Huntaze
  - Permissions demandées :
    - ✓ user.info.basic (profil)
    - ✓ video.upload (upload drafts)
    - ✓ video.publish (publier directement)
- Cliquer sur "Authorize"

### 5. **Retour sur Huntaze (1:00-1:10)**
- Montrer la redirection vers huntaze.com
- Le dashboard affiche maintenant "@huntazeo" connecté
- Montrer le bouton "Upload Video"

### 6. **Upload de vidéo (1:10-1:40)**
- Cliquer sur "Upload Video"
- Sélectionner un fichier vidéo test (préparez un MP4 de 5-10 sec)
- Entrer une description : "Test Huntaze TikTok Integration #demo"
- Cliquer sur "Upload"

### 7. **Confirmation (1:40-2:00)**
- Montrer le message de succès
- (Optionnel) Montrer que la vidéo est en draft sur TikTok sandbox

## 🎥 Préparer la vidéo test

Créez une vidéo simple (5-10 secondes) :
- Format : MP4
- Contenu : Écran avec texte "Huntaze Demo Test"
- Ou utilisez cette commande pour créer une vidéo test :

```bash
# Sur Mac avec ffmpeg
ffmpeg -f lavfi -i color=c=purple:s=720x1280:d=5 \
-vf "drawtext=text='Huntaze Demo':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2" \
-c:v libx264 -pix_fmt yuv420p huntaze-demo.mp4
```

## ⚠️ Points critiques à montrer

1. **URL sandbox visible** : https://open-sandbox.tiktok.com
2. **Les 3 permissions** clairement visibles
3. **Compte sandbox @huntazeo** utilisé pour la connexion
4. **Pas de coupure** pendant le flow OAuth
5. **Message de succès** après upload

## 🚫 À éviter

- Ne pas montrer de vrais mots de passe
- Ne pas utiliser de comptes TikTok réels (seulement @huntazeo)
- Ne pas accélérer la vidéo
- Ne pas couper pendant l'OAuth

## 🎬 Enregistrement

### Mac
- QuickTime : Cmd+Shift+5
- OBS Studio (gratuit)

### Windows  
- OBS Studio
- Windows Game Bar (Win+G)

### Chrome Extension
- Loom
- Screencastify

## 📤 Export final

- Format : MP4
- Taille : < 50MB
- Résolution : 1080p recommandé
- Nom : huntaze-tiktok-sandbox-demo.mp4

## 🔍 Vérification finale

Avant d'envoyer, vérifiez :
- [ ] OAuth flow complet sans interruption
- [ ] Les 3 scopes sont visibles
- [ ] Upload vidéo fonctionne
- [ ] Pas de credentials visibles
- [ ] Durée < 3 minutes

## 📨 Soumission à TikTok

1. Dans TikTok Developer Portal
2. Onglet "App Review"
3. Upload la vidéo démo
4. Soumettre pour review

Bonne chance ! 🚀