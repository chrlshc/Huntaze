# Script Démo Vidéo TikTok - Guide Étape par Étape

## Préparation avant l'enregistrement

1. **Ouvre 3 onglets dans ton navigateur** :
   - Onglet 1 : Huntaze Dashboard (https://huntaze.com ou http://localhost:3002)
   - Onglet 2 : TikTok (pour te connecter avec ton compte sandbox)
   - Onglet 3 : TikTok Developer Portal (pour montrer que c'est sandbox)

2. **Prépare une vidéo test** :
   - Fichier MP4 court (10-30 secondes)
   - Nom : "test-huntaze-demo.mp4"

3. **Assure-toi d'être déconnecté** de Huntaze et TikTok

## Script de la démo (2-3 minutes max)

### Intro (0:00 - 0:10)
```
"Bonjour, voici une démonstration de l'intégration TikTok dans Huntaze, 
notre plateforme de gestion de contenu pour créateurs."
```
- Montre la page d'accueil Huntaze

### Connexion à Huntaze (0:10 - 0:20)
- Clique sur "Sign In"
- Connecte-toi à Huntaze
- Arrive sur le Dashboard

### Navigation vers Social Media (0:20 - 0:30)
- Montre le Dashboard
- Clique sur "Social Media Management"
- Montre la section TikTok avec le bouton "Connect Account"

### Connexion OAuth TikTok (0:30 - 1:00)
```
"Je vais maintenant connecter mon compte TikTok"
```
- Clique sur "Connect TikTok Account"
- Tu es redirigé vers TikTok
- Connecte-toi avec ton compte sandbox
- Montre la page d'autorisation avec les 3 permissions :
  - user.info.basic
  - video.upload
  - video.publish
- Clique sur "Authorize"

### Retour sur Huntaze (1:00 - 1:20)
```
"TikTok est maintenant connecté à Huntaze"
```
- Montre le redirect vers Huntaze
- Montre que le compte est connecté (nom d'utilisateur affiché)
- Montre le bouton "Create Post" ou "Upload Video"

### Upload et publication (1:20 - 2:00)
```
"Je vais maintenant publier une vidéo sur TikTok"
```
- Clique sur "Create Post" / "Upload Video"
- Sélectionne ton fichier test
- Entre un caption : "Test démo Huntaze #huntaze #demo #test"
- Montre les options disponibles
- Clique sur "Publish to TikTok"
- Montre le message de succès

### Conclusion (2:00 - 2:10)
```
"La vidéo a été publiée avec succès sur TikTok via l'API Content Posting"
```
- Montre le message de confirmation
- (Optionnel) Montre l'ID de la vidéo créée

## Points importants à montrer

✅ **OBLIGATOIRE** :
- L'URL huntaze.com visible
- La page d'autorisation TikTok avec les 3 scopes
- Le flow complet sans coupure
- Le message de succès final

❌ **À ÉVITER** :
- Ne montre PAS les credentials
- Ne montre PAS de vrais comptes (utilise sandbox)
- Ne coupe PAS pendant l'OAuth
- N'accélère PAS la vidéo

## Si tu rencontres des problèmes

### Erreur de redirect :
1. Vérifie que le redirect URI dans TikTok correspond exactement
2. Pour local : `http://localhost:3002/auth/tiktok/callback`
3. Pour production : `https://huntaze.com/auth/tiktok/callback`

### Erreur de token :
1. Vérifie que tu utilises les bons credentials (sandbox vs production)
2. Vérifie que `TIKTOK_SANDBOX_MODE=true` dans .env.local

### La vidéo ne s'upload pas :
- C'est normal en sandbox, tu peux simuler un succès
- Ou créer un mock de l'API response

## Commandes pour l'enregistrement

### Sur Mac :
```bash
# Option 1 : QuickTime
Cmd + Shift + 5
# Sélectionne "Enregistrer l'écran entier" ou une zone

# Option 2 : Via terminal avec ffmpeg
ffmpeg -f avfoundation -i "1:0" -t 180 demo-tiktok.mp4
```

### Export final :
- Format : MP4 (pas MOV)
- Taille : < 50MB
- Résolution : 720p ou 1080p minimum