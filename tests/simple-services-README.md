# Tests des Services Simplifiés Huntaze

## 📋 Vue d'ensemble

Cette suite de tests couvre les services utilisateur et de facturation simplifiés de Huntaze, garantissant la qualité, la sécurité et les performances de ces composants critiques.

## 🏗️ Architecture des Tests

### Structure des Fichiers

```
tests/
├── unit/
│   ├── simple-user-service-complete.test.ts      # Tests utilisateur complets (680 lignes)
│   ├── simple-billing-service.test.ts            # Tests facturation complets (1,100 lignes)
│   └── simple-services-validation.test.ts        # Tests de validation (600 lignes)
├── integration/
│   └── user-billing-integration-complete.test.ts # Tests d'intégration (800 lignes)
├── setup/
│   └── simple-services-setup.ts                  # Configuration et utilitaires (400 lignes)
└── simple-services-README.md                     # Cette documentation
```

### Configuration

```
vitest.simple-services.config.ts                  # Configuration Vitest spécialisée (150 lignes)
scripts/run-simple-services-tests.mjs             # Script d'exécution complet (500 lignes)
```

## 🧪 Types de Tests

### Tests Unitaires (65 tests)

#### SimpleUserService (34 tests)
- **Récupération d'utilisateurs** : `getUserById`, `getUserByEmail`
- **Gestion CRUD** : `createUser`, `updateUser`, `deleteUser`
- **Abonnements** : `updateUserSubscription` avec upsert
- **Statistiques** : `getUserStats` avec métriques
- **Validation d'accès** : `validateUserAccess` hiérarchique
- **Opérations en lot** : `bulkUpdateUsers`, `listUsers`
- **Recherche** : `searchUsers` avec filtres
- **Métriques** : `getMetrics`, `isHealthy`

#### SimpleBillingService (31 tests)
- **Sessions Stripe** : `createCheckoutSession`, `createPortalSession`
- **Webhooks** : `handleWebhook` pour tous les événements Stripe
- **Abonnements** : `getUserSubscription`, `hasFeatureAccess`
- **Limites d'usage** : `getUsageLimits` par plan
- **Mapping** : `mapPriceIdToPlan`, `mapStripeStatus`
- **Plans** : `getAvailablePlans`, `getPlanById`
- **Métriques** : `getMetrics` avec revenus

### Tests d'Intégration (12 scénarios)

#### Flux Complets Utilisateur-Facturation
- **Upgrade FREE → PRO** : Checkout + validation d'accès
- **Downgrade PRO → FREE** : Perte d'accès aux fonctionnalités
- **Upgrade ENTERPRISE** : Accès complet aux fonctionnalités
- **Gestion des paiements** : Succès/échec via webhooks
- **Portail client** : Accès au portail Stripe
- **Contrôle d'accès** : Validation hiérarchique
- **Métriques intégrées** : Cohérence entre services

### Tests de Validation (50+ tests)

#### Standards de Qualité
- **TypeScript** : Sécurité des types, gestion async
- **Conventions** : Nommage, patterns, cohérence
- **Gestion d'erreurs** : Robustesse, messages significatifs
- **Consistance des données** : Intégrité référentielle

#### Standards de Performance
- **Temps de réponse** : < 100ms pour les lectures
- **Opérations en lot** : Efficacité des batch operations
- **Utilisation mémoire** : Pas de fuites mémoire
- **Scalabilité** : Performance sous charge

#### Standards de Sécurité
- **Validation d'entrée** : Sanitisation, prévention XSS/SQL injection
- **Protection des données** : Pas d'exposition de secrets
- **Contrôle d'accès** : Autorisation appropriée
- **Attaques timing** : Protection contre les fuites d'information

## 🚀 Exécution des Tests

### Commande Rapide

```bash
# Exécuter tous les tests des services simplifiés
node scripts/run-simple-services-tests.mjs

# Ou avec npm
npm run test:simple-services
```

### Commandes Spécifiques

```bash
# Tests unitaires seulement
npx vitest run --config vitest.simple-services.config.ts tests/unit/simple-*.test.ts

# Tests d'intégration seulement
npx vitest run --config vitest.simple-services.config.ts tests/integration/user-billing-*.test.ts

# Avec couverture de code
npx vitest run --config vitest.simple-services.config.ts --coverage

# Mode watch pour développement
npx vitest --config vitest.simple-services.config.ts --watch
```

### Variables d'Environnement

```bash
NODE_ENV=test
VITEST_SIMPLE_SERVICES=true
STRIPE_SECRET_KEY=sk_test_mock_key_for_simple_services
STRIPE_PRO_MONTHLY_PRICE_ID=price_pro_monthly_mock
STRIPE_PRO_YEARLY_PRICE_ID=price_pro_yearly_mock
STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_enterprise_monthly_mock
STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_enterprise_yearly_mock
NEXT_PUBLIC_URL=https://test.huntaze.com
```

## 📊 Couverture de Code

### Objectifs de Couverture

- **Statements** : ≥ 85%
- **Branches** : ≥ 80%
- **Functions** : ≥ 85%
- **Lines** : ≥ 85%

### Seuils Spécifiques

- **SimpleUserService** : 90% sur tous les indicateurs
- **SimpleBillingService** : 90% sur tous les indicateurs
- **Utilitaires de validation** : 85% minimum

### Rapports Générés

```
coverage/simple-services/
├── index.html              # Rapport HTML interactif
├── lcov.info               # Format LCOV pour CI/CD
├── coverage-summary.json   # Résumé JSON
└── clover.xml             # Format Clover
```

## 🛠️ Utilitaires de Test

### Mocks et Helpers

```typescript
// Créer un utilisateur mock
const user = testUtils.createMockUser({
  subscription: 'pro',
  stripeCustomerId: 'cus_123'
});

// Créer un événement webhook mock
const webhook = testUtils.createMockWebhookEvent('customer.subscription.created', {
  customer: 'cus_123'
});

// Attendre de manière asynchrone
await testUtils.waitForAsync(100);

// Simuler une date fixe
testUtils.mockDate('2024-01-15T10:00:00Z');
```

### Matchers Personnalisés

```typescript
// Vérifier qu'un objet est un utilisateur valide
expect(user).toBeValidUser();

// Vérifier qu'un objet est un abonnement valide
expect(subscription).toBeValidSubscription();

// Vérifier qu'une promesse se résout dans un délai
await expect(promise).toResolveWithin(1000);
```

## 🔧 Configuration Avancée

### Parallélisation

- **Threads** : 4 threads maximum pour les tests
- **Isolation** : Chaque test est isolé avec des mocks propres
- **Timeout** : 30 secondes par test, 10 secondes pour les hooks

### Retry et Resilience

- **Retry** : 2 tentatives pour les tests flaky
- **Bail** : Arrêt au premier échec en CI/CD
- **Cleanup** : Nettoyage automatique après chaque test

### Reporting

- **JUnit XML** : Pour intégration CI/CD
- **JSON** : Pour analyse programmatique
- **Verbose** : Sortie détaillée pour debugging
- **Coverage** : Rapports HTML et LCOV

## 📈 Métriques de Performance

### Benchmarks Attendus

- **Tests unitaires** : < 5 secondes pour la suite complète
- **Tests d'intégration** : < 10 secondes pour tous les scénarios
- **Couverture de code** : < 3 secondes pour génération
- **Mémoire** : < 100MB pendant l'exécution

### Optimisations

- **Mocks intelligents** : Réutilisation des instances
- **Cleanup efficace** : Nettoyage minimal nécessaire
- **Parallélisation** : Tests indépendants en parallèle
- **Cache** : Réutilisation des résultats de compilation

## 🐛 Debugging et Dépannage

### Logs de Debug

```bash
# Activer les logs détaillés
DEBUG=simple-services:* npm run test:simple-services

# Logs Vitest verbeux
VITEST_LOG_LEVEL=verbose npm run test:simple-services
```

### Problèmes Courants

#### Tests qui échouent de manière intermittente
```bash
# Augmenter les timeouts
VITEST_TIMEOUT=60000 npm run test:simple-services

# Désactiver la parallélisation
npx vitest run --config vitest.simple-services.config.ts --pool=forks --poolOptions.forks.singleFork=true
```

#### Problèmes de mémoire
```bash
# Augmenter la limite de mémoire Node.js
node --max-old-space-size=4096 scripts/run-simple-services-tests.mjs
```

#### Problèmes de couverture
```bash
# Vérifier les fichiers inclus/exclus
npx vitest run --config vitest.simple-services.config.ts --coverage --reporter=verbose
```

### Debugging Interactif

```typescript
// Dans un test, ajouter un breakpoint
debugger;

// Ou utiliser console.log avec des détails
console.log('User state:', JSON.stringify(user, null, 2));
```

## 🔄 Intégration CI/CD

### GitHub Actions

```yaml
- name: Run Simple Services Tests
  run: |
    node scripts/run-simple-services-tests.mjs
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/simple-services/lcov.info
    flags: simple-services
```

### AWS CodeBuild

```yaml
phases:
  build:
    commands:
      - node scripts/run-simple-services-tests.mjs
      
reports:
  simple-services-tests:
    files:
      - reports/simple-services-junit.xml
    file-format: JUNITXML
```

### Métriques de Qualité

- **Seuil de réussite** : 100% des tests passent
- **Couverture minimale** : 85% sur tous les indicateurs
- **Performance** : < 30 secondes d'exécution totale
- **Stabilité** : < 1% de tests flaky

## 📚 Ressources et Documentation

### Guides de Référence

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

### Standards Internes

- **Conventions de nommage** : camelCase pour les méthodes, PascalCase pour les classes
- **Structure des tests** : Arrange-Act-Assert pattern
- **Mocking** : Préférer les mocks manuels aux auto-mocks
- **Assertions** : Une assertion principale par test

### Contribution

1. **Ajouter un nouveau test** : Suivre la structure existante
2. **Modifier un service** : Mettre à jour les tests correspondants
3. **Optimiser les performances** : Mesurer avant/après
4. **Documenter les changements** : Mettre à jour ce README

## 🎯 Roadmap

### Améliorations Prévues

- **Tests E2E** : Intégration avec Playwright
- **Tests de charge** : Validation de la scalabilité
- **Tests de sécurité** : Analyse automatisée des vulnérabilités
- **Tests de mutation** : Validation de la qualité des tests

### Métriques Avancées

- **Code complexity** : Analyse de la complexité cyclomatique
- **Test coverage trends** : Évolution de la couverture dans le temps
- **Performance regression** : Détection des régressions de performance
- **Flaky test detection** : Identification automatique des tests instables

---

**🎉 Cette suite de tests garantit la qualité industrielle des services critiques de Huntaze !**

*Dernière mise à jour : 26 octobre 2025*