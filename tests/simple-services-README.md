# Tests des Services Simplifiés

Ce document décrit la suite de tests complète pour les services utilisateur et de facturation simplifiés de Huntaze.

## 📋 Vue d'ensemble

Les tests couvrent deux services principaux :
- **SimpleUserService** : Gestion des utilisateurs, abonnements et validation d'accès
- **SimpleBillingService** : Intégration Stripe, gestion des paiements et webhooks

## 🗂️ Structure des Tests

```
tests/
├── unit/
│   ├── simple-user-service.test.ts           # Tests unitaires du service utilisateur
│   ├── simple-billing-service.test.ts        # Tests unitaires de base du service de facturation
│   ├── simple-billing-service-complete.test.ts # Tests complets du service de facturation
│   ├── simple-services-validation.test.ts    # Tests de validation et standards de qualité
├── integration/
│   └── user-billing-integration.test.ts      # Tests d'intégration entre les services
├── setup/
│   └── simple-services-setup.ts              # Configuration et utilitaires de test
└── simple-services-README.md                 # Cette documentation
```

## 🧪 Types de Tests

### Tests Unitaires

#### SimpleUserService Tests
- ✅ **getUserById** : Récupération d'utilisateur avec données liées
- ✅ **updateUser** : Mise à jour des données utilisateur
- ✅ **deleteUser** : Suppression logique (soft delete)
- ✅ **createUser** : Création d'utilisateur avec valeurs par défaut
- ✅ **getUserByEmail** : Recherche par email
- ✅ **updateUserSubscription** : Gestion des abonnements avec upsert
- ✅ **getUserStats** : Statistiques utilisateur
- ✅ **validateUserAccess** : Validation d'accès avec hiérarchie d'abonnements

#### SimpleBillingService Tests
- ✅ **createCheckoutSession** : Création de sessions Stripe avec gestion des clients
- ✅ **createPortalSession** : Sessions de portail client
- ✅ **handleWebhook** : Traitement des webhooks Stripe
- ✅ **getUserSubscription** : Récupération des informations d'abonnement
- ✅ **hasFeatureAccess** : Vérification d'accès aux fonctionnalités
- ✅ **getUsageLimits** : Limites d'utilisation par plan
- ✅ **Plan Mapping** : Correspondance entre prix Stripe et plans internes
- ✅ **Status Mapping** : Correspondance entre statuts Stripe et internes

### Tests d'Intégration

#### User-Billing Integration
- ✅ **Flux d'upgrade complet** : De FREE à PRO avec validation d'accès
- ✅ **Flux de downgrade** : Retour à FREE avec perte d'accès
- ✅ **Validation d'accès aux fonctionnalités** : Basée sur l'abonnement
- ✅ **Hiérarchie des abonnements** : FREE < PRO < ENTERPRISE
- ✅ **Gestion d'erreurs** : Cohérence entre services
- ✅ **Consistance des données** : Synchronisation user/billing
- ✅ **Opérations concurrentes** : Sécurité thread-safe

### Tests de Validation

#### Standards de Qualité
- ✅ **Gestion d'erreurs** : Patterns cohérents
- ✅ **Conventions de nommage** : camelCase, PascalCase, etc.
- ✅ **Types TypeScript** : Typage complet
- ✅ **Couverture de code** : Minimum 80%
- ✅ **Tests de régression** : Prévention des bugs
- ✅ **Standards de performance** : Temps de réponse acceptables
- ✅ **Standards de sécurité** : Validation d'entrée, authentification
- ✅ **Observabilité** : Logging et monitoring

## 🚀 Exécution des Tests

### Commandes Rapides

```bash
# Tous les tests des services simplifiés
npm run test:simple-services

# Tests unitaires seulement
npm run test tests/unit/simple-*.test.ts

# Tests d'intégration seulement
npm run test tests/integration/user-billing-integration.test.ts

# Avec couverture de code
npm run test:coverage tests/unit/simple-*.test.ts

# Script complet avec validation
node scripts/run-simple-services-tests.mjs
```

### Configuration Vitest

Utilise la configuration spécialisée :
```bash
npx vitest --config vitest.simple-services.config.ts
```

## 📊 Couverture de Code

### Objectifs de Couverture
- **Statements** : ≥ 80%
- **Branches** : ≥ 80%
- **Functions** : ≥ 80%
- **Lines** : ≥ 80%

### Zones Critiques Couvertes
- ✅ Gestion des erreurs Stripe
- ✅ Validation des données d'entrée
- ✅ Logique métier des abonnements
- ✅ Soft delete et isolation des données
- ✅ Webhooks et événements asynchrones
- ✅ Hiérarchie des permissions

## 🛠️ Utilitaires de Test

### Mocks Disponibles
```typescript
// Utilisateur mock
const mockUser = testUtils.createMockUser({
  subscription: 'PRO',
  stripeCustomerId: 'cus_123'
});

// Abonnement mock
const mockSubscription = testUtils.createMockSubscription({
  plan: 'ENTERPRISE',
  status: 'ACTIVE'
});

// Client Stripe mock
const mockCustomer = testUtils.createMockStripeCustomer({
  email: 'test@example.com'
});

// Session Stripe mock
const mockSession = testUtils.createMockStripeSession({
  url: 'https://checkout.stripe.com/session123'
});
```

### Matchers Personnalisés
```typescript
// Validation d'utilisateur
expect(user).toBeValidUser();

// Validation d'abonnement
expect(subscription).toBeValidSubscription();

// Test de performance
await expect(promise).toResolveWithin(1000); // 1 seconde
```

## 🔧 Configuration

### Variables d'Environnement de Test
```env
NODE_ENV=test
NEXT_PUBLIC_URL=https://test.huntaze.com
STRIPE_SECRET_KEY=sk_test_mock_key
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_enterprise_monthly
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly
```

### Mocks Automatiques
- **Stripe** : Toutes les méthodes mockées
- **Prisma** : Base de données mockée
- **Console** : Logging mocké
- **Timers** : Contrôle du temps pour les tests

## 📈 Métriques de Performance

### Objectifs de Performance
- **Lookup utilisateur** : < 100ms
- **Mise à jour abonnement** : < 200ms
- **Session checkout** : < 500ms
- **Traitement webhook** : < 300ms

### Tests de Charge
- **Utilisateurs concurrent** : 100
- **Requêtes/seconde** : 1000
- **Taux d'erreur acceptable** : < 0.1%
- **Utilisation mémoire** : < 100MB

## 🐛 Débogage

### Logs de Debug
```typescript
// Activer les logs détaillés
process.env.DEBUG = 'simple-services:*';

// Logs spécifiques
console.log('[TEST]', 'User service test starting');
```

### Problèmes Courants

#### Tests qui échouent de manière intermittente
- Vérifier les mocks de timing
- S'assurer que les promesses sont awaited
- Vérifier l'isolation des tests

#### Erreurs de couverture
- Ajouter des tests pour les branches manquées
- Tester les cas d'erreur
- Couvrir les méthodes privées via les publiques

#### Problèmes d'intégration
- Vérifier la cohérence des mocks
- S'assurer que les services utilisent les mêmes données
- Tester les flux complets end-to-end

## 📝 Bonnes Pratiques

### Écriture de Tests
1. **AAA Pattern** : Arrange, Act, Assert
2. **Tests isolés** : Chaque test est indépendant
3. **Noms descriptifs** : `should create checkout session for user with existing Stripe customer`
4. **Mocks appropriés** : Mock les dépendances externes, pas la logique métier
5. **Assertions spécifiques** : Vérifier les valeurs exactes, pas juste l'existence

### Organisation
1. **Groupement logique** : `describe` par méthode ou fonctionnalité
2. **Setup/Teardown** : `beforeEach`/`afterEach` pour la préparation
3. **Données de test** : Utiliser les utilitaires `testUtils`
4. **Documentation** : Commenter les tests complexes

### Performance
1. **Tests parallèles** : Utiliser l'isolation Vitest
2. **Mocks légers** : Éviter les mocks trop complexes
3. **Cleanup** : Nettoyer après chaque test
4. **Timeouts appropriés** : Ni trop courts ni trop longs

## 🔄 CI/CD Integration

### Pipeline de Tests
1. **Lint** : Vérification du code
2. **Type Check** : Validation TypeScript
3. **Unit Tests** : Tests unitaires
4. **Integration Tests** : Tests d'intégration
5. **Coverage** : Vérification de la couverture
6. **Performance** : Tests de performance

### Critères de Passage
- ✅ Tous les tests passent
- ✅ Couverture ≥ 80%
- ✅ Pas d'erreurs de lint
- ✅ Pas d'erreurs TypeScript
- ✅ Performance dans les limites

## 📚 Ressources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

### Outils
- **Vitest** : Framework de test
- **@vitest/ui** : Interface graphique
- **c8** : Couverture de code
- **MSW** : Mock Service Worker (si nécessaire)

---

## 🎯 Prochaines Étapes

1. **Ajouter des tests E2E** avec Playwright
2. **Tests de sécurité** automatisés
3. **Tests de performance** en continu
4. **Monitoring des métriques** de test
5. **Documentation interactive** des API

Pour toute question ou amélioration, consultez l'équipe de développement ou créez une issue dans le repository.