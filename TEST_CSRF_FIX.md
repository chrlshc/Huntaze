# Test du Fix CSRF sur Staging

## 🎯 Objectif
Vérifier que le fix CSRF résout l'erreur "CSRF token is required" sur staging.huntaze.com

## ⏱️ Attendre le Déploiement
1. Aller sur [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Sélectionner l'app Huntaze
3. Attendre que le build soit terminé (statut: ✅ Deployed)
4. Temps estimé: 5-10 minutes

## 🧪 Tests à Effectuer

### Test 1: Vérifier les Logs de Debug

1. Ouvrir https://staging.huntaze.com/auth/register
2. Ouvrir DevTools (F12) > Console
3. Chercher les logs:
   ```
   [CSRF COOKIE SET] { ... }
   ```
4. ✅ Vérifier que le domaine est `staging.huntaze.com`

### Test 2: Vérifier le Cookie

1. DevTools > Application > Cookies > https://staging.huntaze.com
2. Chercher le cookie `csrf-token`
3. ✅ Vérifier:
   - Name: `csrf-token`
   - Domain: `staging.huntaze.com` (PAS `.huntaze.com`)
   - Secure: ✅
   - HttpOnly: ✅
   - SameSite: `Lax`
   - Path: `/`

### Test 3: Tester l'Inscription

1. Sur https://staging.huntaze.com/auth/register
2. Entrer un email: `test+csrf@example.com`
3. Cliquer sur "Continue with Email"
4. ✅ Vérifier:
   - Pas d'erreur "CSRF token is required"
   - Message de confirmation: "Check your email"
   - Email reçu avec le magic link

### Test 4: Vérifier la Requête Network

1. DevTools > Network
2. Soumettre le formulaire
3. Cliquer sur `POST /api/auth/signup/email`
4. Onglet "Headers" > "Request Headers"
5. ✅ Vérifier:
   ```
   x-csrf-token: 1234567890:abc...
   Cookie: csrf-token=1234567890:abc...
   ```

### Test 5: Vérifier les Logs CloudWatch

1. Aller sur [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/)
2. Chercher le log group de l'app Amplify
3. Chercher les logs récents
4. ✅ Vérifier:
   ```
   [csrf-middleware] Setting CSRF token cookie
   [csrf-middleware] CSRF token cookie set successfully
   [csrf-middleware] Extracting CSRF token
   [csrf-middleware] Using CSRF token from header
   ```

## ✅ Critères de Succès

- [ ] Le cookie `csrf-token` est présent avec le bon domaine
- [ ] Les logs de debug apparaissent dans la console
- [ ] Le formulaire d'inscription fonctionne sans erreur
- [ ] L'email de vérification est envoyé
- [ ] Les logs CloudWatch montrent l'extraction du token

## ❌ Si le Test Échoue

### Scénario 1: Le cookie n'est pas présent
**Action**: Vérifier que l'endpoint `/api/csrf/token` est appelé
```javascript
// Dans la console
fetch('/api/csrf/token', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
```

### Scénario 2: Le cookie a le mauvais domaine
**Action**: Ajouter la variable d'environnement dans Amplify
```
CSRF_COOKIE_DOMAIN=staging.huntaze.com
```

### Scénario 3: L'erreur persiste
**Action**: Vérifier les logs CloudWatch pour voir ce qui est reçu
```
[CSRF DEBUG] {
  hasHeaderToken: false,  // ❌ Problème ici
  hasCookieToken: false,  // ❌ Ou ici
  ...
}
```

### Scénario 4: Le token est présent mais invalide
**Action**: Vérifier que le secret CSRF est le même partout
```bash
# Vérifier dans Amplify Environment Variables
CSRF_SECRET=...
NEXTAUTH_SECRET=...
```

## 🔧 Commandes Utiles

### Tester l'endpoint CSRF directement
```bash
curl -v https://staging.huntaze.com/api/csrf/token \
  -H "Accept: application/json" \
  -c cookies.txt
```

### Voir les cookies reçus
```bash
cat cookies.txt
```

### Tester la soumission avec le token
```bash
TOKEN=$(curl -s https://staging.huntaze.com/api/csrf/token -c cookies.txt | jq -r '.data.token')
curl -v https://staging.huntaze.com/api/auth/signup/email \
  -X POST \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $TOKEN" \
  -b cookies.txt \
  -d '{"email":"test@example.com"}'
```

## 📊 Résultats Attendus

### Console du Navigateur
```javascript
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
  headerTokenPreview: '1701234567890:abc123...',
  cookieTokenPreview: '1701234567890:abc123...'
}
```

### Réponse de l'API
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

## 📝 Rapport de Test

Après avoir effectué les tests, remplir ce rapport:

```
Date: _______________
Testeur: _______________

✅ / ❌ Test 1: Logs de debug visibles
✅ / ❌ Test 2: Cookie présent avec bon domaine
✅ / ❌ Test 3: Inscription fonctionne
✅ / ❌ Test 4: Requête contient le token
✅ / ❌ Test 5: Logs CloudWatch corrects

Notes:
_________________________________
_________________________________
_________________________________

Conclusion: ✅ FIX VALIDÉ / ❌ FIX À REVOIR
```

## 🚀 Prochaines Étapes

Si tous les tests passent:
1. ✅ Marquer le ticket comme résolu
2. ✅ Déployer en production (si applicable)
3. ✅ Nettoyer les logs de debug (optionnel)
4. ✅ Documenter la solution

Si des tests échouent:
1. ❌ Analyser les logs
2. ❌ Appliquer une des solutions de secours
3. ❌ Re-tester
4. ❌ Demander de l'aide si nécessaire
