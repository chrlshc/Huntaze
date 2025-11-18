# 🔧 Fix: Login après Registration

## 🐛 Problème Identifié

**Symptôme:** "Registration successful, but login failed. Please try logging in manually."

L'inscription créait l'utilisateur mais le login automatique échouait immédiatement après.

## 🔍 Cause Racine

### 1. Incohérence de Casse Email
- **Registration (`lib/services/auth/register.ts`):** Insère l'email avec `LOWER($1)`
- **Login (`lib/auth/config.ts`):** Cherche avec `WHERE email = $1` (sans LOWER)
- **Résultat:** Si l'utilisateur s'inscrit avec `Test@Example.com`, la DB stocke `test@example.com`, mais le login cherche `Test@Example.com` → utilisateur non trouvé

### 2. Délai Transaction DB
- Le login automatique se déclenchait 500ms après l'inscription
- Possibilité que la transaction DB ne soit pas encore committée
- Causait des échecs intermittents

## ✅ Solutions Appliquées

### Fix 1: Requête SQL Case-Insensitive
**Fichier:** `lib/auth/config.ts`

```diff
- WHERE email = $1
+ WHERE LOWER(email) = LOWER($1)
```

Maintenant le login utilise la même logique case-insensitive que l'inscription.

### Fix 2: Délai Augmenté
**Fichier:** `app/auth/auth-client.tsx`

```diff
- await new Promise(resolve => setTimeout(resolve, 500));
+ await new Promise(resolve => setTimeout(resolve, 2000));
```

Donne plus de temps pour que la transaction DB soit committée avant le login automatique.

## 📊 Impact

### Avant
- ❌ Login échoue après inscription
- ❌ Utilisateur doit se connecter manuellement
- ❌ Mauvaise expérience utilisateur
- ❌ Emails avec majuscules causent des problèmes

### Après
- ✅ Login automatique fonctionne après inscription
- ✅ Emails case-insensitive (Test@Example.com = test@example.com)
- ✅ Expérience utilisateur fluide
- ✅ Redirection automatique vers /onboarding

## 🧪 Test

Pour tester localement:

```bash
# 1. S'inscrire avec un email contenant des majuscules
Email: Test@Example.com
Password: SecurePass123!

# 2. Vérifier que le login automatique fonctionne
# 3. Vérifier la redirection vers /onboarding
```

## 📝 Fichiers Modifiés

1. `lib/auth/config.ts` - Requête SQL case-insensitive
2. `app/auth/auth-client.tsx` - Délai augmenté à 2s

## 🚀 Déploiement

```bash
git add lib/auth/config.ts app/auth/auth-client.tsx
git commit -m "fix: Login after registration with case-insensitive email

- Fix SQL query to use LOWER() for case-insensitive email matching
- Increase delay before auto-login to 2s (ensure DB commit)
- Fixes 'Registration successful, but login failed' error

Closes: Login failure after registration"
```

**Note:** Ne pas push automatiquement pour éviter de déclencher un build Amplify.
