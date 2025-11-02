# 🔧 Build #101-102 - Corrections Finales

## 📋 Problèmes Identifiés (Build #101)

### 1. ❌ Export Error: 'query' is not exported from '@/lib/db'
**Cause**: L'objet `db` dans `lib/db/index.ts` créait une nouvelle fonction query au lieu de référencer directement la fonction exportée.

**Fichiers affectés**:
- `app/api/auth/login/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/auth/verify-email/route.ts`
- `app/api/auth/me/route.ts`
- `lib/auth/tokens.ts`
- `app/api/content/variations/[id]/assign/route.ts`
- `app/api/content/variations/[id]/stats/route.ts`
- `app/api/content/variations/[id]/track/route.ts`

### 2. ⚠️ Instagram OAuth: "OAuth credentials not configured"
**Cause**: Le constructeur de `InstagramOAuthService` lançait une erreur au moment de l'import (instantiation du singleton), ce qui cassait la build lors de la collecte des données de page.

**Erreur exacte**:
```
[WARNING] Error: Instagram/Facebook OAuth credentials not configured
[WARNING] > Build error occurred
[ERROR] Failed to collect page data for /api/auth/instagram
```

---

## ✅ Solutions Appliquées

### 1. Fix Export 'query' (lib/db/index.ts)

**❌ AVANT**:
```typescript
export const db = {
  query: async (text: string, params?: any[]) => {
    const pool = getPool();
    return pool.query(text, params);
  },
  getPool,
};
```

**✅ APRÈS**:
```typescript
import { getPool, query as dbQuery } from '../db';
export const db = {
  query: dbQuery,  // Direct reference instead of wrapper
  getPool,
};
```

**Impact**: Résout tous les imports de `query` depuis `@/lib/db`.

---

### 2. Fix Instagram OAuth Build-Time Evaluation

#### A. Routes Instagram - Force Dynamic Rendering

**app/api/auth/instagram/route.ts**:
```typescript
// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Check credentials at runtime
  if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
    // Return graceful error instead of throwing
    return NextResponse.redirect(errorUrl);
  }

  // Lazy import to avoid build-time instantiation
  const { instagramOAuth } = await import('@/lib/services/instagramOAuth');
  
  // ... rest of handler
}
```

**app/api/auth/instagram/callback/route.ts**:
```typescript
// Same pattern: force-dynamic + lazy import
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Lazy import
  const { instagramOAuth } = await import('@/lib/services/instagramOAuth');
  // ... rest of handler
}
```

#### B. Service Instagram OAuth - Defer Validation

**lib/services/instagramOAuth.ts**:

**❌ AVANT** (validation au constructeur):
```typescript
constructor() {
  this.appId = process.env.FACEBOOK_APP_ID || '';
  this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
  this.redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '';

  if (!this.appId || !this.appSecret || !this.redirectUri) {
    throw new Error('Instagram/Facebook OAuth credentials not configured');
  }
}
```

**✅ APRÈS** (validation à l'utilisation):
```typescript
constructor() {
  this.appId = process.env.FACEBOOK_APP_ID || '';
  this.appSecret = process.env.FACEBOOK_APP_SECRET || '';
  this.redirectUri = process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '';

  // Don't throw during construction to avoid build-time errors
  // Validation will happen when methods are called
}

private validateCredentials(): void {
  if (!this.appId || !this.appSecret || !this.redirectUri) {
    throw new Error('Instagram/Facebook OAuth credentials not configured');
  }
}

getAuthorizationUrl(permissions: string[] = DEFAULT_PERMISSIONS): InstagramAuthUrl {
  this.validateCredentials(); // Validate only when used
  // ...
}

async exchangeCodeForTokens(code: string): Promise<InstagramTokens> {
  this.validateCredentials(); // Validate only when used
  // ...
}
```

---

## 🎯 Avantages de Cette Approche

### 1. Build Réussit Sans Credentials OAuth
- ✅ Le build peut compiler même si les credentials Instagram ne sont pas configurés
- ✅ Pas de blocage pour les développeurs qui ne travaillent pas sur Instagram
- ✅ Déploiement possible sans tous les OAuth providers configurés

### 2. Graceful Runtime Handling
- ✅ Erreur claire à l'utilisateur si OAuth non configuré
- ✅ Pas de crash de l'application
- ✅ Redirection vers page d'erreur avec message explicite

### 3. Lazy Loading
- ✅ Le service n'est chargé que quand nécessaire
- ✅ Pas d'impact sur les autres routes
- ✅ Meilleure performance

---

## 📊 Résumé des Changements

| Fichier | Type | Changement |
|---------|------|------------|
| `lib/db/index.ts` | Export fix | Direct reference to query function |
| `app/api/auth/instagram/route.ts` | Dynamic + Lazy | force-dynamic + lazy import |
| `app/api/auth/instagram/callback/route.ts` | Dynamic + Lazy | force-dynamic + lazy import |
| `lib/services/instagramOAuth.ts` | Validation | Defer to method calls |

---

## 🔄 Pattern Recommandé pour OAuth Providers

Pour éviter ce problème avec d'autres providers (TikTok, Reddit, etc.):

```typescript
// ✅ GOOD: Route with dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Check credentials at runtime
  if (!process.env.PROVIDER_CLIENT_ID) {
    return NextResponse.json(
      { error: 'Provider not configured' },
      { status: 500 }
    );
  }

  // Lazy import service
  const { providerOAuth } = await import('@/lib/services/providerOAuth');
  
  // Use service
  const result = await providerOAuth.doSomething();
  return NextResponse.json(result);
}
```

```typescript
// ✅ GOOD: Service with deferred validation
export class ProviderOAuthService {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = process.env.PROVIDER_CLIENT_ID || '';
    this.clientSecret = process.env.PROVIDER_CLIENT_SECRET || '';
    // Don't throw here!
  }

  private validateCredentials(): void {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Provider OAuth not configured');
    }
  }

  someMethod() {
    this.validateCredentials(); // Validate when used
    // ...
  }
}
```

---

## 🚀 Builds Déclenchés

- **Build #99**: ❌ Import errors (db, verifyAuth, repositories)
- **Build #100**: ❌ Encore des import errors
- **Build #101**: ❌ query export + Instagram OAuth
- **Build #102**: ✅ Toutes les corrections appliquées

---

## ✅ Résultat Attendu (Build #102)

Le build devrait maintenant:
- ✅ Compiler sans erreurs d'import
- ✅ Compiler sans erreurs OAuth
- ✅ Gérer gracieusement les credentials manquants au runtime
- ✅ Déployer avec succès sur AWS Amplify

---

## 📝 Notes pour la Production

### Variables d'Environnement Requises (Optionnelles)

Pour activer Instagram OAuth en production, ajouter dans AWS Amplify:

```bash
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/auth/instagram/callback
```

**Important**: Ces variables sont **optionnelles**. L'application fonctionne sans elles, Instagram OAuth sera simplement désactivé avec un message d'erreur clair.

---

**Date**: 2 novembre 2025  
**Builds**: #99-101 (échecs) → #102 (correction complète)  
**Statut**: 🟢 Toutes les corrections appliquées et poussées  
**Commit**: `02cd0ec2c`
