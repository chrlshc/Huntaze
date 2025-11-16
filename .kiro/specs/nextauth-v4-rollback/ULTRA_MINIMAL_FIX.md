# Fix Final : Configuration NextAuth v5 Ultra-Minimale

## Problème identifié

Après la migration vers NextAuth v5, l'erreur 500 persistait même avec le build réussi.

**Cause probable** : La configuration NextAuth v5 utilisait la base de données (`query()` de `@/lib/db`) qui peut causer des problèmes d'initialisation en environnement serverless.

## Solution appliquée

Simplification de `lib/auth/config.ts` :
- ✅ Suppression de la dépendance à la base de données
- ✅ Suppression de bcrypt
- ✅ Configuration ultra-minimale pour tester
- ✅ Accepte n'importe quelles credentials (pour test uniquement)

## Code avant

```typescript
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// ... dans authorize()
const result = await query(
  'SELECT id, email, name, password, image FROM users WHERE email = $1',
  [credentials.email]
);
const isPasswordValid = await bcrypt.compare(...);
```

## Code après

```typescript
// MINIMAL: Accept any credentials for testing
if (!credentials?.email || !credentials?.password) {
  return null;
}

return {
  id: 'test-user-id',
  email: credentials.email as string,
  name: 'Test User',
};
```

## Commit déployé

```
d08e47aca - Fix: Simplify NextAuth v5 config - remove DB dependency for testing
```

## Tests à effectuer

Une fois le build terminé (3-5 min) :

```bash
# 1. Test endpoint NextAuth
curl -I https://staging.huntaze.com/api/auth/signin

# 2. Test route de diagnostic
curl https://staging.huntaze.com/api/test-env

# 3. Test connexion sur /auth
# Aller sur https://staging.huntaze.com/auth
# Essayer de se connecter avec n'importe quel email/password
```

## Si ça fonctionne

Une fois que NextAuth v5 fonctionne avec cette config minimale, on pourra :

1. Réintégrer la connexion DB progressivement
2. Réintégrer la vérification de mot de passe
3. Tester à chaque étape

## Si ça ne fonctionne toujours pas

Cela signifierait que le problème vient de NextAuth v5 lui-même ou de Next.js 16 sur Amplify.

Options :
1. Downgrade Next.js à v15
2. Utiliser une solution d'auth alternative (Clerk, Auth0, Supabase)
3. Implémenter une auth custom sans NextAuth

## Statut

- ✅ Config simplifiée
- ✅ Commit créé
- ✅ Push réussi
- ⏳ Build en cours
- ⏳ Tests à effectuer
