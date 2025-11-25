# Diagnostic CSRF sur Staging

## Problème
L'erreur "CSRF token is required" apparaît sur https://staging.huntaze.com/auth/register

## Analyse du Code

### 1. Flux CSRF Actuel
1. **Récupération du token** (`useCsrfToken` hook):
   - Appelle `GET /api/csrf/token`
   - Reçoit le token dans la réponse JSON
   - Le serveur définit aussi un cookie `csrf-token`

2. **Soumission du formulaire** (`EmailSignupForm`):
   - Envoie le token dans le header `x-csrf-token`
   - Le cookie `csrf-token` devrait aussi être envoyé automatiquement

3. **Validation** (`validateCsrfToken`):
   - Cherche le token dans le header `x-csrf-token` OU dans le cookie `csrf-token`
   - Compare avec la signature HMAC

### 2. Configuration du Cookie Domain

Dans `lib/middleware/csrf.ts`, ligne ~250:
```typescript
if (process.env.NODE_ENV === 'production') {
  const configuredDomain = process.env.CSRF_COOKIE_DOMAIN;
  
  if (configuredDomain) {
    cookieOptions.domain = configuredDomain;
  } else if (process.env.NEXTAUTH_URL) {
    try {
      const url = new URL(process.env.NEXTAUTH_URL);
      const hostname = url.hostname; // staging.huntaze.com
      const parts = hostname.split('.'); // ['staging', 'huntaze', 'com']
      
      if (parts.length >= 2) {
        cookieOptions.domain = `.${parts.slice(-2).join('.')}`; // .huntaze.com
      }
    } catch (error) {
      // ...
    }
  }
}
```

Pour `NEXTAUTH_URL=https://staging.huntaze.com`:
- Domain du cookie: `.huntaze.com`
- Cela devrait fonctionner ✅

### 3. Problèmes Potentiels

#### A. Le cookie n'est pas défini
**Symptôme**: Le cookie `csrf-token` n'apparaît pas dans les DevTools
**Causes possibles**:
- Le endpoint `/api/csrf/token` ne retourne pas le cookie
- Les options du cookie sont incorrectes (Secure, SameSite, etc.)

#### B. Le cookie n'est pas envoyé avec la requête POST
**Symptôme**: Le cookie existe mais n'est pas inclus dans la requête
**Causes possibles**:
- `credentials: 'include'` manquant dans le fetch
- Problème de SameSite (devrait être 'lax')
- Problème de domaine du cookie

#### C. Le header n'est pas envoyé
**Symptôme**: Ni le cookie ni le header ne sont présents
**Causes possibles**:
- Le token n'est pas récupéré correctement par `useCsrfToken`
- Le token n'est pas passé à `handleEmailSubmit`

## Tests à Effectuer sur Staging

### Test 1: Vérifier que le cookie est défini
1. Ouvrir https://staging.huntaze.com/auth/register
2. Ouvrir DevTools > Application > Cookies
3. Chercher le cookie `csrf-token`
4. Vérifier:
   - ✅ Le cookie existe
   - ✅ Domain = `.huntaze.com` ou `staging.huntaze.com`
   - ✅ Secure = true
   - ✅ SameSite = Lax
   - ✅ HttpOnly = true

### Test 2: Vérifier que le token est récupéré
1. Ouvrir DevTools > Console
2. Taper: `document.cookie`
3. Vérifier que `csrf-token` apparaît

### Test 3: Vérifier la requête POST
1. Ouvrir DevTools > Network
2. Soumettre le formulaire
3. Cliquer sur la requête `POST /api/auth/signup/email`
4. Vérifier dans l'onglet "Headers":
   - ✅ Request Headers contient `x-csrf-token: ...`
   - ✅ Request Headers contient `Cookie: csrf-token=...`

### Test 4: Vérifier les logs serveur
Chercher dans les logs Amplify:
```
[csrf-middleware] Extracting CSRF token
```

Vérifier:
- `hasHeaderToken: true/false`
- `hasCookieToken: true/false`

## Solutions Possibles

### Solution 1: Forcer le domaine du cookie
Ajouter dans les variables d'environnement Amplify:
```
CSRF_COOKIE_DOMAIN=.huntaze.com
```

### Solution 2: Utiliser le domaine exact (sans point)
Modifier le code pour utiliser `staging.huntaze.com` au lieu de `.huntaze.com`

### Solution 3: Désactiver temporairement la validation CSRF
**⚠️ UNIQUEMENT POUR LE DIAGNOSTIC**
```typescript
// Dans lib/middleware/csrf.ts
export async function validateCsrfToken(request: NextRequest): Promise<CsrfValidationResult> {
  // TEMPORARY BYPASS FOR STAGING DIAGNOSIS
  if (process.env.BYPASS_CSRF === 'true') {
    return { valid: true };
  }
  // ... reste du code
}
```

Puis ajouter `BYPASS_CSRF=true` dans Amplify (temporairement)

### Solution 4: Améliorer le logging
Ajouter plus de logs dans `extractToken` pour voir exactement ce qui est reçu:

```typescript
extractToken(request: NextRequest): string | null {
  const headerToken = request.headers.get(this.config.headerName);
  const cookieToken = request.cookies.get(this.config.cookieName)?.value;
  
  // Log détaillé
  console.log('[CSRF DEBUG]', {
    url: request.url,
    method: request.method,
    hasHeaderToken: !!headerToken,
    hasCookieToken: !!cookieToken,
    headerToken: headerToken ? `${headerToken.substring(0, 20)}...` : null,
    cookieToken: cookieToken ? `${cookieToken.substring(0, 20)}...` : null,
    allCookies: request.cookies.getAll().map(c => c.name),
    allHeaders: Array.from(request.headers.keys()),
  });
  
  return headerToken || cookieToken || null;
}
```

## Prochaines Étapes

1. ✅ Vérifier les cookies dans le navigateur sur staging
2. ✅ Vérifier la requête Network dans DevTools
3. ✅ Vérifier les logs Amplify
4. ⚠️ Appliquer une des solutions ci-dessus
5. ✅ Tester à nouveau

## Notes

- Le code local fonctionne probablement parce que `NODE_ENV !== 'production'` donc le domaine du cookie n'est pas défini
- Sur staging, `NODE_ENV === 'production'` donc le domaine est défini à `.huntaze.com`
- Il est possible que le navigateur refuse le cookie avec un domaine qui ne correspond pas exactement
