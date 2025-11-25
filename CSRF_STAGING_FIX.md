# Fix CSRF sur Staging - staging.huntaze.com

## Problème
L'erreur "CSRF token is required" apparaît sur https://staging.huntaze.com/auth/register lors de la soumission du formulaire d'inscription.

## Cause Probable
Le cookie CSRF n'était pas correctement configuré pour le domaine staging. Le code utilisait un wildcard domain (`.huntaze.com`) qui peut causer des problèmes avec certains navigateurs ou configurations.

## Changements Appliqués

### 1. Utilisation du domaine exact au lieu du wildcard
**Fichier**: `lib/middleware/csrf.ts`

**Avant**:
```typescript
// Utilisait .huntaze.com (wildcard)
cookieOptions.domain = `.${parts.slice(-2).join('.')}`;
```

**Après**:
```typescript
// Utilise staging.huntaze.com (domaine exact)
cookieOptions.domain = hostname;
```

**Raison**: Les cookies avec wildcard domain peuvent ne pas être envoyés correctement dans certaines situations. Utiliser le domaine exact est plus fiable.

### 2. Amélioration du logging pour le diagnostic
Ajout de logs détaillés dans:
- `extractToken()`: Pour voir si le token est présent dans les headers/cookies
- `setTokenCookie()`: Pour confirmer que le cookie est bien défini

Ces logs apparaîtront dans:
- Les logs Amplify (CloudWatch)
- La console du navigateur (en mode production)

## Comment Vérifier le Fix

### Étape 1: Déployer sur Staging
```bash
git add lib/middleware/csrf.ts CSRF_STAGING_FIX.md CSRF_STAGING_DIAGNOSTIC.md
git commit -m "fix: CSRF cookie domain for staging environment"
git push origin main
```

### Étape 2: Attendre le déploiement Amplify
- Aller sur AWS Amplify Console
- Attendre que le build se termine (~5-10 minutes)

### Étape 3: Tester sur Staging
1. Ouvrir https://staging.huntaze.com/auth/register
2. Ouvrir DevTools > Console
3. Chercher les logs `[CSRF COOKIE SET]` et `[CSRF DEBUG]`
4. Remplir le formulaire et soumettre
5. Vérifier que l'inscription fonctionne

### Étape 4: Vérifier les Cookies
1. DevTools > Application > Cookies
2. Vérifier que le cookie `csrf-token` existe avec:
   - Domain: `staging.huntaze.com`
   - Secure: ✅
   - HttpOnly: ✅
   - SameSite: Lax

### Étape 5: Vérifier la Requête
1. DevTools > Network
2. Soumettre le formulaire
3. Cliquer sur `POST /api/auth/signup/email`
4. Vérifier dans Headers:
   - Request Headers > `x-csrf-token`: présent ✅
   - Request Headers > `Cookie`: contient `csrf-token=...` ✅

## Logs à Surveiller

### Dans CloudWatch (Amplify Logs)
```
[csrf-middleware] Setting CSRF token cookie
[csrf-middleware] CSRF token cookie set successfully
[csrf-middleware] Extracting CSRF token
```

### Dans la Console du Navigateur
```
[CSRF COOKIE SET] {
  cookieName: 'csrf-token',
  domain: 'staging.huntaze.com',
  secure: true,
  sameSite: 'lax',
  httpOnly: true,
  maxAge: 3600
}

[CSRF DEBUG] {
  url: 'https://staging.huntaze.com/api/auth/signup/email',
  method: 'POST',
  hasHeaderToken: true,
  hasCookieToken: true,
  ...
}
```

## Si le Problème Persiste

### Option 1: Forcer le domaine via variable d'environnement
Ajouter dans Amplify Environment Variables:
```
CSRF_COOKIE_DOMAIN=staging.huntaze.com
```

### Option 2: Désactiver temporairement le domaine
Modifier le code pour ne pas définir de domaine du tout:
```typescript
// Ne pas définir cookieOptions.domain
// Le navigateur utilisera automatiquement le domaine actuel
```

### Option 3: Vérifier les headers de sécurité
S'assurer que les headers CORS sont correctement configurés dans `next.config.ts`

## Rollback
Si le fix ne fonctionne pas, revenir à la version précédente:
```bash
git revert HEAD
git push origin main
```

## Notes Techniques

### Pourquoi le domaine exact est préférable
1. **Plus simple**: Pas de confusion avec les sous-domaines
2. **Plus sûr**: Le cookie n'est envoyé qu'au domaine exact
3. **Plus compatible**: Fonctionne avec tous les navigateurs

### Différence entre `.huntaze.com` et `staging.huntaze.com`
- `.huntaze.com`: Cookie envoyé à tous les sous-domaines (staging, www, api, etc.)
- `staging.huntaze.com`: Cookie envoyé uniquement à staging

### SameSite=Lax
- Permet l'envoi du cookie lors de navigations top-level (GET)
- Permet l'envoi du cookie lors de POST depuis le même site
- Bloque l'envoi lors de requêtes cross-site (protection CSRF)

## Prochaines Étapes

1. ✅ Déployer le fix
2. ✅ Tester sur staging
3. ✅ Vérifier les logs
4. ✅ Confirmer que l'inscription fonctionne
5. ⚠️ Si OK, déployer en production
6. ⚠️ Nettoyer les logs de debug après confirmation

## Checklist de Validation

- [ ] Le cookie `csrf-token` est présent dans DevTools
- [ ] Le cookie a le bon domaine (`staging.huntaze.com`)
- [ ] Le formulaire d'inscription fonctionne
- [ ] Pas d'erreur "CSRF token is required"
- [ ] Les logs montrent que le token est extrait correctement
- [ ] Le magic link est envoyé par email
