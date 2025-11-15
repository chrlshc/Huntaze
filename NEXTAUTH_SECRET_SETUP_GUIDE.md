# Guide: Ajouter NEXTAUTH_SECRET dans AWS Amplify

## Problème
L'erreur "An unexpected error occurred" lors de l'authentification est causée par l'absence de la variable `NEXTAUTH_SECRET` dans AWS Amplify.

## Solution Rapide (Console AWS)

### Étape 1: Accéder à AWS Amplify Console

1. Allez sur [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Sélectionnez votre application **Huntaze**
3. Dans le menu de gauche, cliquez sur **Environment variables**

### Étape 2: Ajouter NEXTAUTH_SECRET

1. Cliquez sur **Manage variables**
2. Cliquez sur **Add variable**
3. Remplissez:
   - **Variable name**: `NEXTAUTH_SECRET`
   - **Value**: Copiez la valeur de `JWT_SECRET` (déjà dans vos variables)
   - **Branch**: Sélectionnez **All branches**
4. Cliquez sur **Save**

### Étape 3: Redéployer

Après avoir ajouté la variable, déclenchez un nouveau build:

**Option A: Via Git**
```bash
git commit --allow-empty -m "chore: trigger rebuild for NEXTAUTH_SECRET"
git push origin staging
```

**Option B: Via Console Amplify**
1. Allez dans **Build settings**
2. Cliquez sur **Redeploy this version** sur le dernier build

### Étape 4: Vérifier

Une fois le build terminé (~5 minutes):

1. Allez sur https://huntaze.com/auth
2. Cliquez sur **Sign up with Google**
3. Vous devriez être redirigé vers Google OAuth
4. Après autorisation, retour sur /onboarding

## Variables Requises

Vérifiez que ces variables sont présentes dans Amplify:

- ✅ `GOOGLE_CLIENT_ID` (déjà configuré)
- ✅ `GOOGLE_CLIENT_SECRET` (déjà configuré)
- ✅ `JWT_SECRET` (déjà configuré)
- ⚠️ `NEXTAUTH_SECRET` (À AJOUTER - utilisez la même valeur que JWT_SECRET)
- ✅ `NEXTAUTH_URL` (devrait être https://huntaze.com)

## Configuration Google Cloud

Assurez-vous que les URIs de redirection sont configurés dans Google Cloud Console:

1. Allez sur [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez votre projet
3. **APIs & Services** > **Credentials**
4. Cliquez sur votre OAuth 2.0 Client ID
5. Vérifiez **Authorized redirect URIs**:
   ```
   https://huntaze.com/api/auth/callback/google
   ```

## Diagnostic

Si l'erreur persiste après le redéploiement:

### 1. Vérifier les logs Amplify

Dans la console Amplify:
- **Build history** > Dernier build > **View logs**
- Recherchez: `NEXTAUTH_SECRET is required`

### 2. Vérifier les variables d'environnement

Dans la console Amplify:
- **Environment variables**
- Confirmez que `NEXTAUTH_SECRET` est présent
- Vérifiez qu'il est appliqué à la branche `staging`

### 3. Tester en local

```bash
# Copiez .env.example vers .env.local
cp .env.example .env.local

# Ajoutez vos vraies valeurs dans .env.local
# (demandez-les à l'équipe ou récupérez-les d'Amplify)

# Lancez le serveur de dev
npm run dev

# Testez sur http://localhost:3000/auth
```

## Erreurs Communes

### "Configuration errors: NEXTAUTH_SECRET is required"
- La variable n'est pas configurée dans Amplify
- Solution: Suivez les étapes ci-dessus

### "OAuth validation failed"
- Les URIs de redirection ne sont pas configurés dans Google Cloud
- Solution: Ajoutez `https://huntaze.com/api/auth/callback/google`

### "Email not verified"
- L'utilisateur Google n'a pas vérifié son email
- Solution: Utilisez un compte Google avec email vérifié

## Support

Si le problème persiste:
1. Vérifiez les logs Amplify
2. Vérifiez la configuration Google Cloud Console
3. Testez en local avec `.env.local`
4. Contactez l'équipe dev

## Checklist

- [ ] `NEXTAUTH_SECRET` ajouté dans Amplify
- [ ] Variable appliquée à la branche `staging`
- [ ] Build redéployé
- [ ] URIs de redirection configurés dans Google Cloud
- [ ] Test sur https://huntaze.com/auth
- [ ] Google OAuth fonctionne ✅
