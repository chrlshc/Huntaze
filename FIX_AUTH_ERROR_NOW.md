# 🔴 FIX URGENT: "An unexpected error occurred"

## Problème

L'authentification sur staging affiche: **"An unexpected error occurred. Please try again."**

## Cause Principale (99% sûr)

`NEXTAUTH_URL` est configuré avec `localhost` au lieu de l'URL staging.

## Solution (5 minutes)

### Étape 1: Ouvrir Amplify Console

```
https://console.aws.amazon.com/amplify/
```

### Étape 2: Sélectionner l'App

1. Clique sur ton app **Huntaze**
2. Va dans **App settings** (menu de gauche)
3. Clique sur **Environment variables**

### Étape 3: Corriger NEXTAUTH_URL

Trouve la variable `NEXTAUTH_URL` et change:

```bash
# ❌ ACTUEL (MAUVAIS)
NEXTAUTH_URL=http://localhost:3000

# ✅ CORRECT
NEXTAUTH_URL=https://staging.huntaze.com
```

**IMPORTANT**: Utilise l'URL EXACTE de ton staging (vérifie dans Amplify → Domain management)

### Étape 4: Sauvegarder

1. Clique sur **Save**
2. Amplify va automatiquement redéployer

### Étape 5: Attendre le Build (3-5 min)

1. Va dans **Deployments** (menu de gauche)
2. Attends que le status soit **✅ Deployed**

### Étape 6: Tester

Une fois déployé:

```bash
# Ouvre la page d'auth
open https://staging.huntaze.com/auth

# Essaie de te connecter avec un compte existant
```

## Si ça ne fonctionne toujours pas

### Vérifier les autres variables

Dans Environment Variables, assure-toi d'avoir:

```bash
✅ NEXTAUTH_SECRET=9tZUvb1Ky3Ciy+NKXIju8p5e3AdrC123OCsX0XOx9oQ=
✅ NEXTAUTH_URL=https://staging.huntaze.com (PAS localhost!)
✅ DATABASE_URL=postgresql://huntaze_admin:***@huntaze-production-cluster...
```

### Vérifier les Logs

1. Ouvre CloudWatch:
   ```
   https://console.aws.amazon.com/cloudwatch/
   ```

2. Va dans **Log Groups**

3. Cherche `/aws/amplify/huntaze-staging`

4. Ouvre le dernier log stream

5. Cherche les erreurs avec:
   - `[Auth]`
   - `Error:`
   - `Failed`

### Forcer un Nouveau Build

Si le problème persiste après avoir changé NEXTAUTH_URL:

```bash
git commit --allow-empty -m "chore: force rebuild after NEXTAUTH_URL fix"
git push huntaze staging:main
```

## Changements Récents

✅ **Commit 7f74bb84c**: Caché le bouton Google OAuth (temporaire)
✅ **Commit 46c96591c**: Migration Auth.js v5

## Checklist Rapide

- [ ] Ouvrir Amplify Console
- [ ] Aller dans Environment Variables
- [ ] Changer NEXTAUTH_URL vers https://staging.huntaze.com
- [ ] Sauvegarder
- [ ] Attendre le build (3-5 min)
- [ ] Tester l'authentification

## Contact

Si ça ne fonctionne toujours pas après avoir changé NEXTAUTH_URL:

1. Copie les logs CloudWatch
2. Copie l'erreur exacte du navigateur (F12 → Console)
3. Vérifie que DATABASE_URL est correct

---

**Action Immédiate**: Change NEXTAUTH_URL dans Amplify Console!

**Temps estimé**: 5 minutes
