# TikTok App Details - À Compléter

## 1. App Icon
Tu dois créer et uploader un logo 1024x1024px. Options :

### Option A : Créer rapidement avec Canva
1. Va sur [Canva](https://www.canva.com)
2. Recherche "Logo 1024x1024"
3. Utilise ces éléments :
   - Fond : Violet/Purple (#9333EA ou #7C3AED)
   - Texte : "H" ou "Huntaze" en blanc
   - Style : Moderne et minimaliste

### Option B : Utiliser un générateur
- [Logo.com](https://logo.com)
- [Hatchful](https://hatchful.shopify.com)
- Ou demande à ChatGPT/Claude de générer avec DALL-E

## 2. Description (à copier-coller)
```
AI-powered social media management platform for content creators. Schedule posts, analyze performance, and manage multiple accounts across TikTok, Instagram, and more.
```

Ou en version plus courte :
```
All-in-one platform for creators to manage, schedule, and analyze their social media content with AI assistance.
```

## 3. URLs (déjà correctes)
- Terms of Service : `https://huntaze.com/terms`
- Privacy Policy : `https://huntaze.com/privacy`

## 4. Products à ajouter
Clique sur "Add products" et sélectionne :
1. **Login Kit** - Pour l'authentification OAuth
2. **Content Posting API** - Pour publier des vidéos

## 5. Scopes à ajouter
Clique sur "Add scopes" et sélectionne :
1. `user.info.basic` - Pour récupérer les infos du profil
2. `video.upload` - Pour uploader des vidéos
3. `video.publish` - Pour publier directement

## 6. Sandbox - Target Users
Dans l'onglet Sandbox :
1. Clique sur "Add account"
2. Entre le username d'un compte TikTok test
3. Ou crée un nouveau compte test

## Configuration complète :

### Dans le code, mets à jour `.env.local` :
```bash
# TikTok Production
TIKTOK_CLIENT_KEY=sbawig5ujktghe109j
TIKTOK_CLIENT_SECRET=uXf6cwokWvnHI2C26LAx15Nn4SwUmKMK
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/auth/tiktok/callback
```

### Pour AWS Amplify, ajoute ces variables d'environnement :
```bash
TIKTOK_CLIENT_KEY=sbawig5ujktghe109j
TIKTOK_CLIENT_SECRET=uXf6cwokWvnHI2C26LAx15Nn4SwUmKMK
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/auth/tiktok/callback
```

## Logo temporaire rapide

Si tu veux un logo super rapide en attendant :

1. Crée un fichier HTML local :
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 1024px;
            height: 1024px;
            background: linear-gradient(135deg, #9333EA 0%, #7C3AED 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .logo {
            color: white;
            font-size: 400px;
            font-weight: 700;
            letter-spacing: -20px;
        }
    </style>
</head>
<body>
    <div class="logo">H</div>
</body>
</html>
```

2. Ouvre le fichier dans Chrome
3. Fais un screenshot (Cmd+Shift+4 sur Mac)
4. Redimensionne à 1024x1024 si nécessaire

## Ordre des actions :

1. ✅ Upload l'app icon
2. ✅ Entre la description
3. ✅ Vérifie les URLs (déjà OK)
4. ✅ Ajoute Login Kit + Content Posting API
5. ✅ Ajoute les 3 scopes
6. ✅ Configure au moins un compte test dans Sandbox
7. ✅ Enregistre la vidéo démo
8. ✅ Submit for review

Les credentials que tu as donnés sont pour la production. Pour le sandbox, tu auras des credentials différents dans l'onglet Sandbox.