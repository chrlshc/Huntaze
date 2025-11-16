# Migration NextAuth v4 → v5 Complete

## Changements effectués

### 1. Installation de NextAuth v5

```bash
npm install next-auth@beta
```

Version installée : **next-auth@5.0.0-beta.30**

### 2. Nouvelle configuration centralisée

Créé `lib/auth/config.ts` avec la nouvelle API NextAuth v5 :

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Configuration complète avec Prisma, JWT, callbacks
});
```

### 3. Route API mise à jour

`app/api/auth/[...nextauth]/route.ts` simplifié :

```typescript
import { handlers } from '@/lib/auth/config';
export const { GET, POST } = handlers;
```

### 4. Session helpers mis à jour

`lib/auth/session.ts` utilise maintenant `auth()` au lieu de `getServerSession()` :

```typescript
import { auth } from '@/lib/auth/config';

export async function getSession() {
  return await auth();
}
```

## Avantages de NextAuth v5

✅ **Compatible Next.js 16** - Officiellement supporté
✅ **Meilleure performance** - Optimisé pour serverless
✅ **API plus simple** - Moins de boilerplate
✅ **Edge Runtime** - Support natif
✅ **TypeScript** - Meilleur typage

## Compatibilité

### Ce qui fonctionne sans changement :

- ✅ `signIn()` côté client (next-auth/react)
- ✅ `signOut()` côté client
- ✅ `useSession()` hook
- ✅ Pages d'authentification
- ✅ Callbacks JWT et session

### Ce qui a changé :

- ❌ `getServerSession()` → ✅ `auth()`
- ❌ `authOptions` export → ✅ Configuration centralisée
- ❌ `NextAuth()` retourne handler → ✅ Retourne `{ handlers, auth, signIn, signOut }`

## Tests à effectuer

### 1. Build local

```bash
npm run build
```

### 2. Test local

```bash
npm run dev
# Tester /auth et /api/auth/signin
```

### 3. Déploiement staging

```bash
git add .
git commit -m "Migrate to NextAuth v5 for Next.js 16 compatibility"
git push origin staging
```

### 4. Vérification staging

```bash
# Attendre le build (3-5 min)
curl -I https://staging.huntaze.com/api/auth/signin
# Devrait retourner 200 ou redirection, pas 500
```

## Rollback si nécessaire

Si NextAuth v5 cause des problèmes :

```bash
npm install next-auth@^4.24.11
git checkout HEAD~1 -- lib/auth/config.ts app/api/auth/[...nextauth]/route.ts lib/auth/session.ts
```

## Prochaines étapes

1. ✅ Migration du code effectuée
2. ⏳ Build et test local
3. ⏳ Déploiement sur staging
4. ⏳ Vérification que /api/auth/signin fonctionne
5. ⏳ Test de connexion sur /auth

## Références

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Migration Guide](https://authjs.dev/getting-started/migrating-to-v5)
- [Next.js 16 Compatibility](https://nextjs.org/docs/app/building-your-application/upgrading/version-16)
