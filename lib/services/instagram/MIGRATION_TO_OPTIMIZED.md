# Migration vers Instagram OAuth Optimized

Guide de migration de l'ancien service vers le service optimisé.

---

## 🎯 Pourquoi Migrer ?

### Ancien Service (`instagramOAuth.ts`)
- ❌ Gestion d'erreurs basique
- ❌ Pas de retry automatique
- ❌ Pas de circuit breaker
- ❌ Tokens non gérés
- ❌ Logging minimal
- ❌ Pas de correlation IDs

### Nouveau Service (`instagramOAuth-optimized.ts`)
- ✅ Gestion d'erreurs structurée
- ✅ Retry avec exponential backoff
- ✅ Circuit breaker intégré
- ✅ Token management avec auto-refresh
- ✅ Logging complet
- ✅ Correlation IDs pour traçage

---

## 📋 Checklist de Migration

### Phase 1 : Préparation
- [ ] Lire cette documentation complète
- [ ] Vérifier les variables d'environnement
- [ ] Installer les dépendances si nécessaire
- [ ] Créer une branche de migration

### Phase 2 : Migration du Code
- [ ] Remplacer les imports
- [ ] Adapter les appels de méthodes
- [ ] Ajouter la gestion d'erreurs
- [ ] Implémenter le token management

### Phase 3 : Tests
- [ ] Tester le flow OAuth complet
- [ ] Tester la gestion d'erreurs
- [ ] Tester le token refresh
- [ ] Tester en environnement de staging

### Phase 4 : Déploiement
- [ ] Déployer en staging
- [ ] Monitorer les logs
- [ ] Déployer en production
- [ ] Monitorer les métriques

---

## 🔄 Guide de Migration Étape par Étape

### Étape 1 : Remplacer les Imports

**Avant** :
```typescript
import { instagramOAuth } from '@/lib/services/instagramOAuth';
```

**Après** :
```typescript
import { instagramOAuthOptimized } from '@/lib/services/instagramOAuth-optimized';
```

### Étape 2 : Adapter les Appels de Méthodes

#### 2.1 Authorization URL

**Avant** :
```typescript
const { url, state } = await instagramOAuth.getAuthorizationUrl();
```

**Après** :
```typescript
// Identique, mais avec meilleure gestion d'erreurs
try {
  const { url, state } = await instagramOAuthOptimized.getAuthorizationUrl();
  // Stocker state en session pour validation
  req.session.instagramState = state;
} catch (error) {
  console.error('Failed to generate auth URL:', error.userMessage);
  // Gérer l'erreur
}
```

#### 2.2 Exchange Code for Tokens

**Avant** :
```typescript
const tokens = await instagramOAuth.exchangeCodeForTokens(code);
```

**Après** :
```typescript
try {
  const tokens = await instagramOAuthOptimized.exchangeCodeForTokens(code);
  // tokens.access_token, tokens.expires_in
} catch (error) {
  if (error.type === InstagramErrorType.VALIDATION_ERROR) {
    // Code invalide ou expiré
  } else if (error.retryable) {
    // Erreur réseau, peut réessayer
  }
  console.error('Token exchange failed:', error.userMessage);
}
```

#### 2.3 Get Long-Lived Token

**Avant** :
```typescript
const longLived = await instagramOAuth.getLongLivedToken(shortToken);
```

**Après** :
```typescript
try {
  // IMPORTANT: Passer userId pour activer le token management
  const longLived = await instagramOAuthOptimized.getLongLivedToken(
    shortToken,
    userId // Nouveau paramètre optionnel
  );
  
  // Le token est automatiquement stocké et géré
  // Plus besoin de le sauvegarder manuellement
} catch (error) {
  console.error('Failed to get long-lived token:', error.userMessage);
}
```

#### 2.4 Get Account Info

**Avant** :
```typescript
const accountInfo = await instagramOAuth.getAccountInfo(accessToken);
```

**Après** :
```typescript
try {
  const accountInfo = await instagramOAuthOptimized.getAccountInfo(accessToken);
  
  // Vérifier si l'utilisateur a un compte Instagram Business
  if (instagramOAuthOptimized.hasInstagramBusinessAccount(accountInfo.pages)) {
    const igAccount = accountInfo.pages[0].instagram_business_account;
    // Utiliser igAccount
  }
} catch (error) {
  if (error.type === InstagramErrorType.TOKEN_EXPIRED) {
    // Token expiré, demander re-authorization
  }
  console.error('Failed to get account info:', error.userMessage);
}
```

### Étape 3 : Utiliser le Token Management

**Nouveau Feature** : Auto-refresh des tokens

```typescript
// Au lieu de gérer manuellement les tokens
// Utiliser getValidToken() qui auto-refresh si nécessaire

async function makeInstagramAPICall(userId: string) {
  try {
    // Obtenir un token valide (auto-refresh si nécessaire)
    const validToken = await instagramOAuthOptimized.getValidToken(userId);
    
    // Utiliser le token pour l'API call
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${validToken}`
    );
    
    return await response.json();
  } catch (error) {
    if (error.type === InstagramErrorType.TOKEN_EXPIRED) {
      // Token ne peut pas être refresh, demander re-authorization
      return redirectToAuth();
    }
    throw error;
  }
}
```

### Étape 4 : Implémenter la Gestion d'Erreurs

**Pattern Recommandé** :

```typescript
import { InstagramErrorType } from '@/lib/services/instagram/types';

async function handleInstagramOperation() {
  try {
    const result = await instagramOAuthOptimized.someMethod();
    return result;
  } catch (error) {
    // Erreur structurée avec type
    switch (error.type) {
      case InstagramErrorType.TOKEN_EXPIRED:
        // Rediriger vers re-authorization
        return redirectToAuth();
        
      case InstagramErrorType.RATE_LIMIT_ERROR:
        // Afficher message à l'utilisateur
        return showError('Too many requests. Please wait a moment.');
        
      case InstagramErrorType.PERMISSION_ERROR:
        // Demander les permissions manquantes
        return requestPermissions();
        
      case InstagramErrorType.NETWORK_ERROR:
      case InstagramErrorType.API_ERROR:
        // Erreurs retryables
        if (error.retryable) {
          return showError('Connection issue. Please try again.');
        }
        break;
        
      case InstagramErrorType.VALIDATION_ERROR:
        // Erreur de validation
        return showError(error.userMessage);
    }
    
    // Erreur générique
    console.error('Instagram error:', {
      type: error.type,
      message: error.message,
      correlationId: error.correlationId,
    });
    
    return showError(error.userMessage);
  }
}
```

### Étape 5 : Ajouter le Monitoring

```typescript
// Dans votre dashboard de monitoring
async function getInstagramServiceHealth() {
  const cbStats = instagramOAuthOptimized.getCircuitBreakerStats();
  
  return {
    circuitBreaker: {
      state: cbStats.state, // CLOSED, OPEN, HALF_OPEN
      failures: cbStats.failures,
      successes: cbStats.successes,
    },
    // Ajouter d'autres métriques
  };
}

// Endpoint de health check
app.get('/api/health/instagram', async (req, res) => {
  const health = await getInstagramServiceHealth();
  
  if (health.circuitBreaker.state === 'OPEN') {
    return res.status(503).json({
      status: 'degraded',
      message: 'Instagram service temporarily unavailable',
      ...health,
    });
  }
  
  return res.json({
    status: 'healthy',
    ...health,
  });
});
```

---

## 🔍 Différences Clés

### 1. Gestion d'Erreurs

**Avant** :
```typescript
try {
  const result = await instagramOAuth.someMethod();
} catch (error) {
  console.error(error.message); // Message brut
}
```

**Après** :
```typescript
try {
  const result = await instagramOAuthOptimized.someMethod();
} catch (error) {
  console.error(error.userMessage); // Message convivial
  console.error('Correlation ID:', error.correlationId); // Pour debugging
  console.error('Retryable:', error.retryable); // Peut réessayer ?
}
```

### 2. Retry Automatique

**Avant** :
```typescript
// Pas de retry, échec immédiat
const result = await instagramOAuth.someMethod();
```

**Après** :
```typescript
// Retry automatique avec exponential backoff
// 3 tentatives : 1s → 2s → 4s
const result = await instagramOAuthOptimized.someMethod();
```

### 3. Token Management

**Avant** :
```typescript
// Gestion manuelle
const token = await db.getToken(userId);
if (isExpired(token)) {
  const newToken = await instagramOAuth.refreshToken(token);
  await db.saveToken(userId, newToken);
}
```

**Après** :
```typescript
// Auto-refresh transparent
const validToken = await instagramOAuthOptimized.getValidToken(userId);
// Token toujours valide, refresh automatique si nécessaire
```

### 4. Circuit Breaker

**Avant** :
```typescript
// Pas de protection, continue à appeler même si le service est down
```

**Après** :
```typescript
// Circuit breaker protège contre les appels inutiles
// S'ouvre après 5 échecs, se ferme après 2 succès
```

### 5. Logging

**Avant** :
```typescript
console.log('Getting token');
```

**Après** :
```typescript
// Logs structurés avec contexte
instagramLogger.info('Getting token', {
  correlationId: 'ig-123',
  userId: 'user456',
  attempt: 1,
  duration: 245,
});
```

---

## 🧪 Tests de Migration

### Test 1 : OAuth Flow Complet

```typescript
describe('Instagram OAuth Migration', () => {
  it('should complete full OAuth flow', async () => {
    // 1. Generate auth URL
    const { url, state } = await instagramOAuthOptimized.getAuthorizationUrl();
    expect(url).toContain('facebook.com');
    expect(state).toBeDefined();
    
    // 2. Exchange code (mock)
    const tokens = await instagramOAuthOptimized.exchangeCodeForTokens('test_code');
    expect(tokens.access_token).toBeDefined();
    
    // 3. Get long-lived token
    const longLived = await instagramOAuthOptimized.getLongLivedToken(
      tokens.access_token,
      'user123'
    );
    expect(longLived.expires_in).toBeGreaterThan(0);
    
    // 4. Get account info
    const accountInfo = await instagramOAuthOptimized.getAccountInfo(
      longLived.access_token
    );
    expect(accountInfo.user_id).toBeDefined();
  });
});
```

### Test 2 : Error Handling

```typescript
it('should handle errors correctly', async () => {
  try {
    await instagramOAuthOptimized.exchangeCodeForTokens('invalid_code');
    fail('Should have thrown error');
  } catch (error) {
    expect(error.type).toBe(InstagramErrorType.VALIDATION_ERROR);
    expect(error.userMessage).toBeDefined();
    expect(error.correlationId).toBeDefined();
    expect(error.retryable).toBe(false);
  }
});
```

### Test 3 : Token Auto-Refresh

```typescript
it('should auto-refresh expired token', async () => {
  // Store token with short expiration
  await instagramOAuthOptimized.getLongLivedToken('short_token', 'user123');
  
  // Wait for token to need refresh
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Get valid token (should auto-refresh)
  const validToken = await instagramOAuthOptimized.getValidToken('user123');
  expect(validToken).toBeDefined();
});
```

---

## 📊 Métriques à Surveiller

### Avant Migration
- Taux d'échec des appels API
- Temps de réponse moyen
- Nombre de tokens expirés

### Après Migration
- ✅ Taux d'échec devrait diminuer (retry automatique)
- ✅ Temps de réponse peut augmenter légèrement (retry)
- ✅ Tokens expirés devrait être 0 (auto-refresh)
- ✅ Circuit breaker state (devrait rester CLOSED)
- ✅ Correlation IDs dans les logs

---

## 🚨 Points d'Attention

### 1. Variables d'Environnement

Vérifier que ces variables sont définies :
```bash
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI=https://your-domain.com/callback
```

### 2. Token Storage

**Important** : Le service optimisé stocke les tokens en mémoire par défaut.

Pour la production, implémenter la persistance Redis :
```typescript
// Voir OPTIMIZATION_RECOMMENDATIONS.md
// Section "Persistance des Tokens"
```

### 3. Circuit Breaker

Le circuit breaker s'ouvre après 5 échecs. Si cela arrive :
```typescript
// Vérifier l'état
const stats = instagramOAuthOptimized.getCircuitBreakerStats();
console.log('Circuit breaker state:', stats.state);

// Reset manuel si nécessaire
if (stats.state === 'OPEN') {
  instagramOAuthOptimized.resetCircuitBreaker();
}
```

### 4. Correlation IDs

Les correlation IDs sont automatiquement générés. Pour les utiliser :
```typescript
try {
  await instagramOAuthOptimized.someMethod();
} catch (error) {
  // Envoyer à votre système de monitoring
  sendToMonitoring({
    correlationId: error.correlationId,
    error: error.message,
    timestamp: error.timestamp,
  });
}
```

---

## 🎯 Rollback Plan

Si vous devez revenir à l'ancien service :

1. **Revert les imports**
   ```typescript
   import { instagramOAuth } from '@/lib/services/instagramOAuth';
   ```

2. **Supprimer le token management**
   ```typescript
   // Retirer les appels à getValidToken()
   // Revenir à la gestion manuelle
   ```

3. **Simplifier la gestion d'erreurs**
   ```typescript
   // Retirer les checks de error.type
   // Revenir aux try-catch simples
   ```

4. **Déployer**
   ```bash
   git revert <commit-hash>
   git push
   ```

---

## 📚 Ressources

- **Documentation Complète** : `API_INTEGRATION_ANALYSIS.md`
- **Recommandations** : `OPTIMIZATION_RECOMMENDATIONS.md`
- **Résumé** : `INTEGRATION_SUMMARY.md`
- **Tests** : `tests/unit/services/instagramOAuth-optimized.test.ts`

---

## ✅ Checklist Finale

Avant de déployer en production :

- [ ] Tous les imports sont mis à jour
- [ ] La gestion d'erreurs est implémentée
- [ ] Le token management est configuré
- [ ] Les tests passent
- [ ] Le monitoring est en place
- [ ] Les variables d'environnement sont définies
- [ ] Le rollback plan est documenté
- [ ] L'équipe est formée

---

## 🆘 Support

En cas de problème :

1. **Vérifier les logs** avec correlation ID
2. **Consulter** `API_INTEGRATION_ANALYSIS.md`
3. **Vérifier** l'état du circuit breaker
4. **Tester** en staging d'abord

---

**Créé par** : Kiro AI Assistant  
**Date** : 2025-01-14  
**Version** : 1.0
