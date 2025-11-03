# Build #110-111 Fix: 'use client' Directive Position

## Problème identifié

**Erreur de compilation Next.js:**
```
The "use client" directive cannot be placed after imports or other expressions.
Move it to the top of the file.
```

**Cause:**
Dans `app/ai/assistant/page.tsx`, j'avais placé `export const dynamic = 'force-dynamic'` AVANT la directive `'use client'`, ce qui viole les règles Next.js :

```typescript
// ❌ INCORRECT
export const dynamic = 'force-dynamic';  // ligne 2
'use client';                             // ligne 4
```

**Règles Next.js:**
1. `'use client'` DOIT être la toute première ligne du fichier
2. `export const dynamic` (Route Segment Config) ne peut être utilisé QUE dans des Server Components ou Route Handlers
3. Ces deux directives sont **incompatibles** dans le même fichier

## Solution appliquée: Option A (Server + Client Components)

### Architecture choisie

**Séparation en deux fichiers:**

1. **`app/ai/assistant/page.tsx`** (Server Component)
   - Contient `export const dynamic = 'force-dynamic'`
   - Importe et rend le composant client
   - Minimal et propre

2. **`app/ai/assistant/AssistantClient.tsx`** (Client Component)
   - Commence par `'use client'` en première ligne
   - Contient tous les hooks React (useState, useEffect, useRef)
   - Contient toute la logique UI et interactions

### Code implémenté

#### page.tsx (Server Component)
```typescript
// Force dynamic rendering to avoid prerender issues with env vars
export const dynamic = 'force-dynamic';

import AssistantClient from './AssistantClient';

export default function AIAssistantPage() {
  return <AssistantClient />;
}
```

#### AssistantClient.tsx (Client Component)
```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
// ... reste des imports et du code UI
```

## Améliorations supplémentaires

### Fix du warning onKeyPress deprecated
- Remplacé `onKeyPress` par `onKeyDown` (recommandé par React)
- Plus moderne et compatible avec tous les navigateurs

```typescript
// ❌ Avant (deprecated)
onKeyPress={handleKeyPress}

// ✅ Après
onKeyDown={handleKeyDown}
```

## Avantages de cette approche

1. **Respect des règles Next.js** - Séparation claire Server/Client
2. **Performance** - Le Server Component peut faire du SSR si nécessaire
3. **Maintenabilité** - Architecture claire et standard
4. **Flexibilité** - Facile d'ajouter de la logique server-side plus tard

## Références officielles

- [Next.js: 'use client' directive](https://nextjs.org/docs/app/building-your-application/rendering/client-components#the-use-client-directive)
- [Next.js: Route Segment Config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- [Next.js: Server and Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns)

## Résultat attendu

✅ Pas d'erreur "'use client' directive cannot be placed after..."
✅ Compilation Next.js réussie
✅ `export const dynamic = 'force-dynamic'` fonctionne correctement
✅ Hooks React fonctionnent dans le Client Component
✅ Pas de warning onKeyPress deprecated

## Fichiers modifiés

1. **app/ai/assistant/page.tsx** - Transformé en Server Component minimal
2. **app/ai/assistant/AssistantClient.tsx** - Nouveau Client Component avec toute la logique UI
