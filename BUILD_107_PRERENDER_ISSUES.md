# 🔧 Build #107 - Problèmes de Prerender

## 📋 Nouveaux Problèmes Identifiés

Le build #107 échoue maintenant avec des erreurs de **prerender** sur plusieurs pages :

### 1. TypeError: Cannot read properties of undefined (reading 'clientModules')
- **Cause** : Code client évalué côté serveur pendant le prerender
- **Pages affectées** : Multiples pages (/, /ai/assistant, /demo/*)

### 2. TypeError: Invalid URL
- **Cause** : `new URL()` appelé avec une chaîne vide
- **Variable manquante** : `NEXT_PUBLIC_APP_URL` ou `APP_URL`
- **Impact** : Toute page qui construit des URLs absolues

### 3. ReferenceError: document is not defined
- **Cause** : Code browser (`document`, `window`) exécuté pendant le SSR
- **Impact** : Composants qui accèdent au DOM pendant le render

---

## ✅ Corrections Appliquées (Build #108)

### 1. Ajout de APP_URL à amplify.yml
```yaml
APP_URL=${APP_URL}
```

Cette variable doit être configurée dans Amplify Console avec une valeur comme :
```
https://prod.d3xxxxxxxxx.amplifyapp.com
```

---

## 🔧 Corrections Recommandées (À Faire)

### A. Sécuriser la Construction d'URL

**Avant** (❌ jette si APP_URL est vide) :
```typescript
const url = new URL('/ai/assistant', process.env.NEXT_PUBLIC_APP_URL!);
```

**Après** (✅ gestion d'erreur) :
```typescript
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
if (!baseUrl) {
  throw new Error('APP_URL/NEXT_PUBLIC_APP_URL not configured');
}
const url = new URL('/ai/assistant', baseUrl);
```

### B. Forcer le Rendu Dynamique des Pages Problématiques

Ajouter en haut de chaque page affectée :
```typescript
export const dynamic = 'force-dynamic';
```

**Pages à corriger** :
- `app/page.tsx` (landing page)
- `app/ai/assistant/page.tsx`
- `app/demo/*/page.tsx` (toutes les pages demo)
- Toute page qui utilise `document` ou `window`

### C. Isoler le Code Browser-Only

**Option 1 : Client Component**
```typescript
'use client'
import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    // OK: exécuté uniquement côté client
    document.querySelector('#something')?.scrollIntoView();
  }, []);
  
  return <div id="something">…</div>;
}
```

**Option 2 : Dynamic Import avec ssr: false**
```typescript
import dynamic from 'next/dynamic';

const ClientOnlyWidget = dynamic(() => import('./Widget'), { 
  ssr: false 
});
```

---

## 📊 Historique des Builds

| Build | Problème | Solution | Statut |
|-------|----------|----------|--------|
| #99-100 | Import errors | Export fixes | ❌ |
| #101-102 | Instagram/Reddit OAuth | Dynamic + Lazy | ❌ |
| #103-104 | OpenAI build-time | Lazy instantiation | ❌ |
| #105-106 | Amplify.yml env order | Reorder + add vars | ❌ |
| #107 | TikTok OAuth | Lazy instantiation | ❌ |
| #108 | Prerender errors | Add APP_URL | 🟡 En cours |

---

## 🎯 Stratégie de Correction

### Phase 1 : Variables d'Environnement (Build #108)
- ✅ Ajouter `APP_URL` à amplify.yml
- ⏳ Configurer `APP_URL` dans Amplify Console

### Phase 2 : Corrections Ciblées (Build #109+)
Si le build #108 échoue encore, corriger les pages une par une :

1. **Landing page** (`app/page.tsx`)
   - Ajouter `export const dynamic = 'force-dynamic'`
   
2. **AI Assistant** (`app/ai/assistant/page.tsx`)
   - Vérifier les appels à `new URL()`
   - Ajouter `export const dynamic = 'force-dynamic'`

3. **Pages Demo** (`app/demo/*/page.tsx`)
   - Identifier le code qui utilise `document`/`window`
   - Déplacer dans `useEffect` ou marquer `'use client'`

---

## 📝 Variables d'Environnement Requises

### Dans Amplify Console

```bash
# Base URL (REQUIS pour éviter Invalid URL errors)
APP_URL=https://prod.d3xxxxxxxxx.amplifyapp.com
NEXT_PUBLIC_APP_URL=https://prod.d3xxxxxxxxx.amplifyapp.com

# Database
DATABASE_URL=postgresql://...

# Auth
JWT_SECRET=...
AUTH_SECRET=...
NEXTAUTH_URL=https://prod.d3xxxxxxxxx.amplifyapp.com

# OpenAI (optionnel)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4

# Azure OpenAI (optionnel)
AZURE_OPENAI_API_KEY=...
AZURE_OPENAI_ENDPOINT=...
AZURE_OPENAI_DEPLOYMENT=...
AZURE_OPENAI_API_VERSION=2024-06-01

# OAuth Providers (optionnel)
FACEBOOK_APP_ID=...
FACEBOOK_APP_SECRET=...
REDDIT_CLIENT_ID=...
REDDIT_CLIENT_SECRET=...
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...

# Public URLs
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/auth/instagram/callback
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://yourdomain.com/api/auth/reddit/callback
NEXT_PUBLIC_TIKTOK_REDIRECT_URI=https://yourdomain.com/api/auth/tiktok/callback
```

---

## 🚀 Prochaines Étapes

1. **Vérifier Build #108** - Voir si l'ajout de `APP_URL` suffit
2. **Si échec** - Identifier les pages spécifiques qui causent l'erreur
3. **Corrections ciblées** - Ajouter `force-dynamic` ou isoler le code client
4. **Build #109** - Déployer les corrections

---

**Date** : 2 novembre 2025  
**Build actuel** : #107 (échec prerender) → #108 (ajout APP_URL)  
**Statut** : 🟡 Correction en cours  
**Type d'erreur** : Prerender / SSR (nouveau type d'erreur)
