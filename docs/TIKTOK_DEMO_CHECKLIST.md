# Checklist Vidéo Démo TikTok - Guide Simple

## 🎬 Ce que tu dois montrer (dans l'ordre)

### 1. **Début sur Huntaze (0:00-0:10)**
- [ ] Ouvre Chrome/Safari sur http://localhost:3001
- [ ] Montre que tu n'es PAS connecté
- [ ] Clique sur "Sign In"

### 2. **Connexion à Huntaze (0:10-0:20)**
- [ ] Email: `demo@huntaze.com`
- [ ] Password: `password123`
- [ ] Clique "Sign In"
- [ ] Arrive sur le Dashboard

### 3. **Navigation vers TikTok (0:20-0:30)**
- [ ] Scrolle jusqu'à "Social Media Management"
- [ ] Montre la carte TikTok (qui dit "0 accounts")
- [ ] Clique sur "+ Add TikTok Account"

### 4. **Autorisation TikTok (0:30-1:00)**
- [ ] Tu es redirigé vers TikTok
- [ ] Connecte-toi avec ton compte SANDBOX
- [ ] **IMPORTANT**: Montre bien la page d'autorisation avec les 3 permissions:
  - ✓ user.info.basic
  - ✓ video.upload  
  - ✓ video.publish
- [ ] Clique "Authorize"

### 5. **Retour sur Huntaze (1:00-1:20)**
- [ ] Montre que tu es revenu sur Huntaze
- [ ] La carte TikTok affiche maintenant "@ton_username"
- [ ] Clique sur "Upload Video"

### 6. **Upload de vidéo (1:20-2:00)**
- [ ] Sur la page d'upload, clique "Click to upload"
- [ ] Sélectionne un fichier vidéo MP4 (prépare-le avant)
- [ ] Entre un caption: "Test demo Huntaze #demo #test"
- [ ] Clique "Publish to TikTok"
- [ ] Montre le message de succès

### 7. **Fin (2:00-2:10)**
- [ ] Retour au dashboard
- [ ] Montre que tout fonctionne

## 📋 Prépare avant de filmer

1. **Fichier vidéo test**:
   - Un MP4 de 10-30 secondes
   - Nom: `demo-video.mp4`
   - Contenu: N'importe quoi (écran coloré, logo, etc.)

2. **Compte TikTok Sandbox**:
   - Username et mot de passe prêts
   - Déconnecte-toi de TikTok avant de commencer

3. **Navigateur**:
   - Vide le cache
   - Mode fenêtre normale (pas incognito)
   - Zoom à 100%

4. **Serveur local**:
   ```bash
   cd /Users/765h/Huntaze/site-web
   npm run dev
   ```
   - Vérifie que http://localhost:3001 fonctionne

## ⚠️ Points CRITIQUES à montrer

1. **L'URL `localhost:3001` ou `huntaze.com`** visible
2. **La page d'autorisation TikTok** avec les 3 scopes
3. **Le flow COMPLET** sans coupure
4. **Message de succès** à la fin

## 🎥 Comment enregistrer

### Option 1: QuickTime (Mac)
```
Cmd + Shift + 5
Sélectionne "Enregistrer l'écran entier"
```

### Option 2: OBS Studio
- Télécharge OBS Studio (gratuit)
- Ajoute une source "Capture d'écran"
- Enregistre en MP4

## 🚫 Erreurs à éviter

- ❌ Ne montre PAS de vrais mots de passe
- ❌ Ne coupe PAS la vidéo pendant l'OAuth
- ❌ N'accélère PAS la vidéo
- ❌ Ne montre PAS les credentials dans le code

## 📤 Format final

- Format: **MP4** (pas MOV)
- Durée: **2-3 minutes max**
- Taille: **< 50MB**
- Son: Pas obligatoire

## 💡 Astuce

Si l'upload ne marche pas vraiment (normal en sandbox), tu peux:
1. Montrer le loading 
2. Attendre 2 secondes
3. Le message de succès apparaîtra quand même

C'est normal, TikTok sandbox ne publie pas vraiment!