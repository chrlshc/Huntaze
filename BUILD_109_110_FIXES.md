# Build #109-110 Fixes

## Problèmes identifiés

### 1. Import Error: 'query' not exported from '@/lib/db'
**Fichier:** `lib/auth/tokens.ts`
**Erreur:** `import { query } from '@/lib/db'` échouait car `query` n'était pas exporté explicitement

**Solution:**
- Modifié `lib/db/index.ts` pour exporter explicitement `query` comme named export
- Ajouté `export const query = dbQuery;` pour rendre l'import fonctionnel

### 2. TypeError: Invalid URL
**Fichier:** `app/ai/assistant/page.tsx`
**Erreur:** `new URL(...)` appelé avec une base vide (NEXT_PUBLIC_APP_URL manquante)

**Solution:**
- Ajouté `export const dynamic = 'force-dynamic';` pour forcer le rendu dynamique
- Protégé l'accès à `window.location` avec `typeof window !== 'undefined'`
- Ajouté des valeurs par défaut dans `amplify.yml` pour APP_URL et NEXT_PUBLIC_APP_URL

### 3. ReferenceError: document is not defined
**Fichier:** `app/ai/assistant/page.tsx`
**Erreur:** Code "browser only" exécuté côté serveur pendant le prerender

**Solution:**
- Ajouté vérification `typeof document !== 'undefined'` dans `scrollToBottom()`
- Ajouté `export const dynamic = 'force-dynamic';` pour éviter le prerender

### 4. Prerender errors sur landing page
**Fichier:** `app/page.tsx`
**Erreur:** Tentative de prerender avec variables d'environnement manquantes

**Solution:**
- Ajouté `export const dynamic = 'force-dynamic';` en haut du fichier

### 5. TypeScript error: Property 'role' does not exist
**Fichier:** `app/ai/assistant/page.tsx`
**Erreur:** `session?.user?.role` n'existe pas dans le type NextAuth par défaut

**Solution:**
- Utilisé type assertion `(session?.user as any)?.role` pour accéder à la propriété custom

## Fichiers modifiés

1. **lib/db/index.ts** - Export explicite de `query`
2. **app/ai/assistant/page.tsx** - Force dynamic + protections browser-only
3. **app/page.tsx** - Force dynamic rendering
4. **amplify.yml** - Valeurs par défaut pour APP_URL et NEXT_PUBLIC_APP_URL

## Correctifs appliqués

### Pattern 1: Force Dynamic Rendering
```typescript
// En haut du fichier page.tsx
export const dynamic = 'force-dynamic';
```

### Pattern 2: Protection Browser-Only Code
```typescript
if (typeof document !== 'undefined') {
  // Code qui utilise document
}

if (typeof window !== 'undefined') {
  // Code qui utilise window
}
```

### Pattern 3: Export Named Function
```typescript
// lib/db/index.ts
import { query as dbQuery } from '../db';
export const query = dbQuery;
```

### Pattern 4: Valeurs par défaut dans amplify.yml
```yaml
NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL:-https://main.d2yjqfqvvvvvvv.amplifyapp.com}
APP_URL=${APP_URL:-https://main.d2yjqfqvvvvvvv.amplifyapp.com}
```

## Résultat attendu

✅ Import de `query` depuis `@/lib/db` fonctionne
✅ Pas d'erreur "Invalid URL" pendant la build
✅ Pas d'erreur "document is not defined" pendant le prerender
✅ Pages rendues dynamiquement sans erreur de prerender
✅ Pas d'erreur TypeScript sur `session.user.role`

## Prochaines étapes

1. Commit et push des changements
2. Vérifier le build #110 sur Amplify
3. Confirmer que toutes les erreurs sont résolues
