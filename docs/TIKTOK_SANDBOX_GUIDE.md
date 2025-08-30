# Guide TikTok Sandbox et Démo Vidéo

## 1. Configuration du Sandbox TikTok

### Accéder au Sandbox
1. Va sur [TikTok Developer Portal](https://developers.tiktok.com/)
2. Dans ton app Huntaze, clique sur l'onglet "Sandbox"
3. Tu verras un environnement de test séparé

### Créer des comptes de test
1. Dans la section Sandbox, clique sur "Test Users"
2. Clique sur "Create Test User"
3. Crée au moins 2 comptes de test :
   - Un compte créateur (pour poster)
   - Un compte viewer (optionnel, pour voir les posts)

### Obtenir les credentials Sandbox
Dans l'onglet Sandbox, tu auras :
- **Sandbox Client Key** (différent du production)
- **Sandbox Client Secret** (différent du production)
- Les URLs OAuth restent les mêmes mais pointent vers l'environnement sandbox

## 2. Configurer Huntaze pour le Sandbox

### Créer un fichier .env.sandbox
```bash
# TikTok Sandbox Credentials
TIKTOK_CLIENT_KEY=your-sandbox-client-key
TIKTOK_CLIENT_SECRET=your-sandbox-client-secret
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://huntaze.com/auth/tiktok/callback
TIKTOK_SANDBOX_MODE=true
```

### Modifier le code OAuth pour supporter le sandbox
Crée ou modifie `/app/auth/tiktok/route.ts` :

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const redirectUri = process.env.NEXT_PUBLIC_TIKTOK_REDIRECT_URI || 'https://huntaze.com/auth/tiktok/callback';
  const isSandbox = process.env.TIKTOK_SANDBOX_MODE === 'true';
  
  if (!clientKey) {
    return NextResponse.json({ error: 'TikTok app not configured' }, { status: 500 });
  }

  const state = Math.random().toString(36).substring(7);
  
  // URLs différentes pour sandbox vs production
  const baseUrl = isSandbox 
    ? 'https://open-sandbox.tiktok.com' 
    : 'https://www.tiktok.com';
  
  const scope = 'user.info.basic,user.info.stats,video.list';
  const authUrl = `${baseUrl}/v2/auth/authorize?client_key=${clientKey}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
  
  return NextResponse.redirect(authUrl);
}
```

## 3. Enregistrer la Démo Vidéo

### Outils recommandés
- **Mac**: QuickTime Player (Cmd+Shift+5) ou OBS Studio
- **Windows**: OBS Studio ou Windows Game Bar (Win+G)
- **Chrome**: Extension Loom ou Screencastify

### Script de la démo (étape par étape)

1. **Intro (0:00-0:10)**
   - Ouvre ton navigateur sur https://huntaze.com
   - Montre que tu es déconnecté

2. **Connexion à Huntaze (0:10-0:20)**
   - Clique sur "Sign In" 
   - Connecte-toi avec un compte test

3. **Navigation vers Social Media (0:20-0:30)**
   - Va dans le Dashboard
   - Clique sur "Social Media Management"
   - Montre la section TikTok

4. **Connexion TikTok OAuth (0:30-0:50)**
   - Clique sur "Connect TikTok Account"
   - Tu seras redirigé vers la page de connexion TikTok Sandbox
   - Connecte-toi avec ton **compte test sandbox**
   - Montre la page d'autorisation avec les permissions
   - Clique sur "Authorize"

5. **Retour sur Huntaze (0:50-1:00)**
   - Montre le redirect vers Huntaze
   - Montre que le compte TikTok est maintenant connecté
   - Affiche le nom d'utilisateur TikTok récupéré

6. **Upload de vidéo (1:00-1:20)**
   - Clique sur "Create Post" ou "Upload Video"
   - Sélectionne un fichier vidéo (prépare un .mp4 court)
   - Montre le preview de la vidéo

7. **Ajout de caption (1:20-1:40)**
   - Entre un titre/caption
   - Ajoute des hashtags (#test #huntaze #demo)
   - Montre les options disponibles

8. **Publication (1:40-2:00)**
   - Clique sur "Publish to TikTok"
   - Montre le loading/progress
   - Montre le message de succès
   - (Optionnel) Montre l'ID du post créé

### Vidéo de test
Prépare une vidéo courte (10-30 secondes) pour l'upload :
- Format: MP4
- Résolution: 720p ou 1080p
- Contenu: Peut être juste un écran coloré avec texte "Test Huntaze"

## 4. Points importants pour la démo

### ✅ À montrer absolument :
- L'URL huntaze.com visible dans la barre d'adresse
- La page d'autorisation TikTok avec les 3 scopes
- Le flow complet sans coupure
- Les messages de succès

### ❌ À éviter :
- Ne pas montrer de vrais credentials
- Ne pas utiliser de comptes réels
- Ne pas couper la vidéo pendant l'OAuth
- Ne pas accélérer la vidéo

## 5. Tester en local avec sandbox

Pour tester localement avant la démo :

```bash
# Utilise les credentials sandbox
cp .env.sandbox .env.local

# Lance en local
npm run dev

# Modifie temporairement le redirect URI dans TikTok sandbox pour :
# http://localhost:3002/auth/tiktok/callback
```

## 6. Après l'enregistrement

1. Exporte en MP4 (pas MOV si possible)
2. Vérifie que la vidéo fait moins de 50MB
3. Regarde la vidéo pour vérifier :
   - Pas de credentials visibles
   - Tous les scopes sont démontrés
   - Le flow est clair et complet

## 7. Alternative : Vidéo avec mockups

Si tu ne peux pas faire fonctionner le sandbox :

1. Enregistre le flow jusqu'à la redirection TikTok
2. Crée des mockups/screenshots de :
   - La page de login TikTok (floute les credentials)
   - La page d'autorisation
   - Le retour sur Huntaze
3. Monte les séquences ensemble
4. Ajoute des annotations expliquant chaque étape

## Notes supplémentaires

- Le sandbox ne poste pas vraiment sur TikTok
- Les vidéos uploadées en sandbox ne sont pas publiques
- Tu peux réutiliser les mêmes comptes test plusieurs fois
- L'API sandbox a les mêmes endpoints mais des limites différentes