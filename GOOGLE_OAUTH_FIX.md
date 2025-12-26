# Google OAuth Configuration Fix

## Problème
L'erreur "An unexpected error occurred" lors de l'authentification Google OAuth.

## Solution

### 1. Variables d'environnement requises

Vérifiez que ces variables sont configurées dans AWS Amplify:

```bash
# NextAuth (CRITIQUE - Manquant!)
NEXTAUTH_SECRET=<your-nextauth-secret-from-amplify>
NEXTAUTH_URL=https://huntaze.com

# Google OAuth (✅ Déjà configuré dans Amplify)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
```

**Note:** Les vraies valeurs sont déjà configurées dans AWS Amplify. Utilisez le script `./scripts/add-nextauth-secret.sh` pour ajouter automatiquement NEXTAUTH_SECRET.

### 2. Ajouter NEXTAUTH_SECRET dans Amplify

**Via AWS Console:**
1. Allez sur AWS Amplify Console
2. Sélectionnez votre app "Huntaze"
3. Allez dans "Environment variables"
4. Cliquez "Add variable"
5. Ajoutez:
   - Variable: `NEXTAUTH_SECRET`
   - Value: `<use-the-value-from-JWT_SECRET-in-amplify>`
   - Branch: `All branches`

**Via Script (Recommandé):**
```bash
./scripts/add-nextauth-secret.sh
```

Ce script ajoutera automatiquement la variable avec la bonne valeur.

### 3. Configuration Google Cloud Console

Vérifiez que les URIs de redirection sont configurés:

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez votre projet
3. APIs & Services > Credentials
4. Cliquez sur votre OAuth 2.0 Client ID
5. Vérifiez les "Authorized redirect URIs":

```
https://huntaze.com/api/auth/callback/google
http://localhost:3000/api/auth/callback/google (pour dev)
```

### 4. Redéployer

Après avoir ajouté `NEXTAUTH_SECRET`:

```bash
# Trigger un nouveau build
git commit --allow-empty -m "chore: trigger rebuild for NEXTAUTH_SECRET"
git push origin staging
```

### 5. Tester

Une fois le build terminé:

1. Allez sur https://huntaze.com/auth
2. Cliquez sur "Sign up with Google"
3. Devrait rediriger vers Google OAuth
4. Après autorisation, devrait revenir sur /onboarding

## Vérification locale

Pour tester en local:

```bash
# Le fichier .env.local a été créé avec toutes les variables
npm run dev

# Testez sur http://localhost:3000/auth
```

## Diagnostic

Si l'erreur persiste, vérifiez les logs:

```bash
# Logs Amplify
aws amplify get-job --app-id <APP_ID> --branch-name staging --job-id <JOB_ID>

# Ou dans la console Amplify > Build history > View logs
```

Recherchez:
- `NEXTAUTH_SECRET is required`
- `Configuration errors`
- `OAuth validation failed`

## Status

- ✅ `.env.local` créé pour développement local
- ⏳ `NEXTAUTH_SECRET` à ajouter dans Amplify
- ✅ Google OAuth credentials déjà configurés
- ⏳ Redéploiement nécessaire après ajout de la variable
