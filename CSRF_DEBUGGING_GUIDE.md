# Guide de Débogage CSRF

## Problème Actuel
"CSRF token is required" malgré la configuration complète

## Checklist de Diagnostic

### 1. Vérifier que le token est généré ✅
```bash
curl http://localhost:3000/api/csrf/token
```

Devrait retourner:
```json
{
  "success": true,
  "data": {
    "token": "1234567890:abc...:def...",
    "expiresIn": 3600000
  }
}
```

### 2. Vérifier que le cookie est défini ✅
```bash
curl -v http://localhost:3000/api/csrf/token 2>&1 | grep -i "set-cookie"
```

Devrait afficher:
```
< Set-Cookie: csrf-token=...; Path=/; HttpOnly; SameSite=Lax
```

### 3. Vérifier que le token est envoyé dans la requête ❓
Ouvrir DevTools → Network → Sélectionner la requête POST → Headers

**Vérifier:**
- Header `x-csrf-token` est présent
- Cookie `csrf-token` est envoyé
- Les deux valeurs correspondent

### 4. Vérifier les logs serveur
```bash
# Chercher les logs CSRF
grep "CSRF" .next/server.log
```

## Solutions Possibles

### Solution 1: Le token n'est pas chargé à temps
**Symptôme**: Le bouton est cliquable avant que `useCsrfToken()` ait fini de charger

**Fix**: Ajouter une vérification dans le composant
```typescript
if (!csrfToken) {
  console.error('CSRF token not loaded yet');
  return;
}
```

### Solution 2: Le cookie n'est pas envoyé
**Symptôme**: Le cookie `csrf-token` n'apparaît pas dans les DevTools

**Causes possibles:**
- SameSite policy bloque le cookie
- Domain mismatch (localhost vs 127.0.0.1)
- HTTPS requis en production

**Fix**: Vérifier la configuration du cookie dans `lib/middleware/csrf.ts`

### Solution 3: Le header n'est pas envoyé
**Symptôme**: Le header `x-csrf-token` n'apparaît pas dans la requête

**Fix**: Vérifier que `credentials: 'include'` est présent dans le fetch

### Solution 4: Token expiré
**Symptôme**: Le token a été généré il y a plus d'1 heure

**Fix**: Rafraîchir la page ou appeler `refresh()` du hook

### Solution 5: Problème de domaine en production
**Symptôme**: Fonctionne en local mais pas en production

**Fix**: Vérifier la configuration du domaine dans `lib/middleware/csrf.ts`:
```typescript
if (process.env.NODE_ENV === 'production') {
  cookieOptions.domain = '.huntaze.com';
}
```

## Test Manuel Complet

### Étape 1: Ouvrir DevTools
1. Ouvrir Chrome DevTools (F12)
2. Aller dans l'onglet Network
3. Cocher "Preserve log"

### Étape 2: Charger la page signup
1. Aller sur `/signup`
2. Vérifier dans Network qu'une requête à `/api/csrf/token` est faite
3. Vérifier la réponse contient un token

### Étape 3: Inspecter le state React
1. Installer React DevTools
2. Sélectionner le composant `EmailSignupForm`
3. Vérifier que `csrfToken` a une valeur

### Étape 4: Soumettre le formulaire
1. Entrer un email valide
2. Cliquer sur "Continue with Email"
3. Dans Network, sélectionner la requête POST à `/api/auth/signup/email`
4. Vérifier les headers:
   - `x-csrf-token`: doit être présent
   - `Cookie`: doit contenir `csrf-token`

### Étape 5: Vérifier la réponse
- Si 403 avec "CSRF token is required" → Le token n'est pas envoyé
- Si 403 avec "CSRF token has expired" → Rafraîchir la page
- Si 200 → Succès! ✅

## Logs à Activer

Ajouter dans `.env.local`:
```bash
LOG_LEVEL=debug
DEBUG=csrf*
```

Puis redémarrer le serveur:
```bash
npm run dev
```

## Commandes de Test

### Test avec curl
```bash
# 1. Obtenir le token
TOKEN=$(curl -s -c /tmp/cookies.txt http://localhost:3000/api/csrf/token | jq -r '.data.token')

# 2. Utiliser le token
curl -b /tmp/cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $TOKEN" \
  -X POST \
  -d '{"email":"test@example.com"}' \
  http://localhost:3000/api/auth/signup/email
```

### Test avec le script
```bash
./scripts/test-csrf-flow.sh
```

## Prochaines Étapes

1. ✅ Ajouter des logs dans `extractToken()` pour voir ce qui est reçu
2. ⏳ Tester en local avec le serveur de dev
3. ⏳ Vérifier les logs serveur
4. ⏳ Tester en production/staging

## Contact

Si le problème persiste après avoir suivi ce guide, fournir:
1. Les logs du serveur
2. Une capture d'écran des DevTools Network
3. La version de Node.js et Next.js
4. L'environnement (local/staging/production)
