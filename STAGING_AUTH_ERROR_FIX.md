# 🔴 Fix Erreur "An unexpected error occurred" sur Staging

## Problème

L'authentification affiche "An unexpected error occurred. Please try again." sur staging.

## Causes Probables

### 1. NEXTAUTH_URL Incorrect (TRÈS PROBABLE)

```bash
# ❌ MAUVAIS (configuration actuelle probable)
NEXTAUTH_URL=http://localhost:3000

# ✅ CORRECT (ce qu'il faut)
NEXTAUTH_URL=https://staging.huntaze.com
```

### 2. NEXTAUTH_SECRET Manquant

```bash
# Doit être configuré
NEXTAUTH_SECRET=9tZUvb1Ky3Ciy+NKXIju8p5e3AdrC123OCsX0XOx9oQ=
```

### 3. Connexion Base de Données

La DB est dans un VPC privé et doit être accessible depuis Amplify.

## Solution Rapide

### Étape 1: Vérifier/Corriger NEXTAUTH_URL

1. Ouvre AWS Amplify Console:
   ```
   https://console.aws.amazon.com/amplify/
   ```

2. Sélectionne ton app Huntaze

3. Va dans **App settings** → **Environment variables**

4. Trouve `NEXTAUTH_URL` et vérifie la valeur:
   
   ```bash
   # Si c'est localhost, CHANGE-LE:
   NEXTAUTH_URL=https://staging.huntaze.com
   ```

5. Clique sur **Save**

6. **Redéploie l'application**:
   - Va dans **Deployments**
   - Clique sur **Redeploy this version**
   
   OU force un nouveau build:
   ```bash
   git commit --allow-empty -m "chore: trigger rebuild for NEXTAUTH_URL fix"
   git push huntaze staging:main
   ```

### Étape 2: Vérifier les Autres Variables

Dans Environment Variables, vérifie que tu as:

```bash
✅ NEXTAUTH_SECRET=9tZUvb1Ky3Ciy+NKXIju8p5e3AdrC123OCsX0XOx9oQ=
✅ NEXTAUTH_URL=https://staging.huntaze.com
✅ DATABASE_URL=postgresql://huntaze_admin:***@huntaze-production-cluster...
✅ GOOGLE_CLIENT_ID=617004665472-hoaj6lobp0e6rlt1o3sl6kipnna4av35...
✅ GOOGLE_CLIENT_SECRET=GOCSPX-***
```

### Étape 3: Vérifier les Logs CloudWatch

1. Ouvre CloudWatch:
   ```
   https://console.aws.amazon.com/cloudwatch/
   ```

2. Va dans **Log Groups**

3. Cherche `/aws/amplify/huntaze-staging`

4. Ouvre le dernier log stream

5. Cherche les erreurs:
   - `[Auth] Authentication attempt`
   - `[Auth] Authentication failed`
   - Erreurs de connexion DB
   - Erreurs NEXTAUTH_URL

## Vérification Après Fix

Une fois le build terminé, teste:

```bash
# 1. Test API
curl https://staging.huntaze.com/api/auth/providers

# 2. Test CSRF
curl https://staging.huntaze.com/api/auth/csrf

# 3. Test page
open https://staging.huntaze.com/auth
```

## Si l'Erreur Persiste

### Option 1: Rollback

Si ça ne fonctionne toujours pas, rollback vers la version précédente:

```bash
git revert 46c96591c
git push huntaze staging:main
```

### Option 2: Vérifier les Logs Détaillés

Dans CloudWatch, cherche:

```
[Auth] Authentication attempt
[Auth] Authentication failed
Error: 
```

Copie l'erreur exacte et on pourra la corriger.

### Option 3: Vérifier la Connexion DB

Le problème peut venir de la connexion à la base de données:

1. Vérifie que la DB est accessible depuis le VPC Amplify
2. Vérifie les security groups AWS
3. Vérifie que `DATABASE_URL` est correct

## Checklist de Débogage

- [ ] NEXTAUTH_URL = https://staging.huntaze.com (PAS localhost)
- [ ] NEXTAUTH_SECRET configuré
- [ ] DATABASE_URL configuré
- [ ] Build Amplify réussi
- [ ] Logs CloudWatch vérifiés
- [ ] Pas d'erreur 500 dans les logs
- [ ] API endpoints testés

## Commandes Utiles

```bash
# Forcer un nouveau build
git commit --allow-empty -m "chore: trigger rebuild"
git push huntaze staging:main

# Tester les endpoints
./check-staging.sh

# Rollback si nécessaire
git revert 46c96591c
git push huntaze staging:main
```

## Contact

Si le problème persiste après avoir vérifié NEXTAUTH_URL:

1. Copie les logs CloudWatch
2. Copie l'erreur exacte du navigateur (DevTools → Console)
3. Vérifie les variables d'environnement Amplify

---

**Action Immédiate**: Vérifie NEXTAUTH_URL dans Amplify Console!
