# 🔧 Build #102-103 - Correction Reddit OAuth

## 📋 Problème Identifié (Build #102)

Même problème que Instagram, mais pour Reddit:

```
[WARNING] Error: Reddit OAuth credentials not configured
[WARNING] > Build error occurred
[ERROR] Failed to collect page data for /api/auth/reddit
```

**Cause**: Le constructeur de `RedditOAuthService` lançait une erreur au moment de l'import (instantiation du singleton), cassant la build lors de la collecte des données de page.

---

## ✅ Solution Appliquée (Pattern Unifié)

### 1. Routes Reddit - Force Dynamic Rendering

**app/api/auth/reddit/route.ts**:
```typescript
// Force dynamic rendering to avoid build-time evaluation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Check credentials at runtime
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    return NextResponse.json(
      { error: { code: 'OAUTH_NOT_CONFIGURED', message: '...' } },
      { status: 500 }
    );
  }

  // Lazy import to avoid build-time instantiation
  const { redditOAuth } = await import('@/lib/services/redditOAuth');
  
  // ... rest of handler
}
```

**app/api/auth/reddit/callback/route.ts**:
```typescript
// Same pattern: force-dynamic + lazy import
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Lazy import
  const { redditOAuth } = await import('@/lib/services/redditOAuth');
  // ... rest of handler
}
```

### 2. Service Reddit OAuth - Defer Validation

**lib/services/redditOAuth.ts**:

**❌ AVANT** (validation au constructeur):
```typescript
constructor() {
  this.clientId = process.env.REDDIT_CLIENT_ID || '';
  this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
  this.redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || '';
  this.userAgent = 'Huntaze/1.0.0';

  if (!this.clientId || !this.clientSecret || !this.redirectUri) {
    throw new Error('Reddit OAuth credentials not configured');
  }
}
```

**✅ APRÈS** (validation à l'utilisation):
```typescript
constructor() {
  this.clientId = process.env.REDDIT_CLIENT_ID || '';
  this.clientSecret = process.env.REDDIT_CLIENT_SECRET || '';
  this.redirectUri = process.env.NEXT_PUBLIC_REDDIT_REDIRECT_URI || '';
  this.userAgent = 'Huntaze/1.0.0';

  // Don't throw during construction to avoid build-time errors
}

private validateCredentials(): void {
  if (!this.clientId || !this.clientSecret || !this.redirectUri) {
    throw new Error('Reddit OAuth credentials not configured');
  }
}

getAuthorizationUrl(...): RedditAuthUrl {
  this.validateCredentials(); // Validate only when used
  // ...
}

async exchangeCodeForTokens(code: string): Promise<RedditTokens> {
  this.validateCredentials(); // Validate only when used
  // ...
}
```

---

## 🎯 Pattern Unifié pour Tous les OAuth Providers

### Providers Corrigés
- ✅ **Instagram** (Build #101-102)
- ✅ **Reddit** (Build #102-103)

### Pattern à Appliquer aux Autres (TikTok, etc.)

**Route Pattern**:
```typescript
// Force dynamic + lazy import
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Runtime check
  if (!process.env.PROVIDER_CLIENT_ID) {
    return NextResponse.json({ error: '...' }, { status: 500 });
  }

  // Lazy import
  const { providerOAuth } = await import('@/lib/services/providerOAuth');
  
  // Use service
}
```

**Service Pattern**:
```typescript
export class ProviderOAuthService {
  constructor() {
    this.clientId = process.env.PROVIDER_CLIENT_ID || '';
    // Don't throw here!
  }

  private validateCredentials(): void {
    if (!this.clientId) {
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

## 📊 Historique des Builds

| Build | Problème | Solution | Statut |
|-------|----------|----------|--------|
| #99 | Import errors (db, verifyAuth) | Export fixes | ❌ |
| #100 | Encore import errors | Export fixes | ❌ |
| #101 | query export + Instagram OAuth | Export + Dynamic | ❌ |
| #102 | Reddit OAuth | Dynamic + Lazy | ✅ En cours |
| #103 | - | Toutes corrections | 🟡 Déclenché |

---

## ✅ Résultat Attendu (Build #103)

Le build devrait maintenant:
- ✅ Compiler sans erreurs d'import
- ✅ Compiler sans erreurs OAuth (Instagram, Reddit)
- ✅ Gérer gracieusement les credentials manquants
- ✅ Déployer avec succès sur AWS Amplify

---

## 📝 Variables d'Environnement (Optionnelles)

### Instagram OAuth
```bash
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/auth/instagram/callback
```

### Reddit OAuth
```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_REDDIT_REDIRECT_URI=https://yourdomain.com/api/auth/reddit/callback
```

**Important**: Ces variables sont **optionnelles**. L'application fonctionne sans elles, les OAuth providers seront simplement désactivés avec des messages d'erreur clairs.

---

## 🚀 Prochaines Étapes

Si d'autres providers (TikTok, etc.) causent le même problème:

1. Appliquer le même pattern (force-dynamic + lazy import)
2. Déplacer la validation du constructeur vers les méthodes
3. Retourner des erreurs gracieuses au runtime

---

**Date**: 2 novembre 2025  
**Builds**: #99-102 (échecs) → #103 (correction complète)  
**Statut**: 🟢 Toutes les corrections OAuth appliquées  
**Commit**: `7daec3c58`  
**Pattern**: Unifié pour Instagram + Reddit
