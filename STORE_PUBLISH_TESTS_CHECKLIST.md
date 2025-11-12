# Checklist - Tests /api/store/publish

Checklist complète pour valider les tests de l'endpoint de publication de boutique.

## ✅ Phase 1: Création des tests (COMPLET)

### Tests principaux
- [x] Créer `tests/integration/api/store-publish.test.ts`
- [x] Implémenter 30+ scénarios de test
- [x] Couvrir 10 catégories de tests
- [x] Utiliser Vitest + Zod pour validation

### Catégories de tests
- [x] HTTP Methods (4 tests)
- [x] Authentication (2 tests)
- [x] Gating Middleware (3 tests)
- [x] Request Body Validation (5 tests)
- [x] Response Schema Validation (3 tests)
- [x] Error Handling (2 tests)
- [x] Performance (1 test)
- [x] Concurrent Access (2 tests)
- [x] Idempotency (1 test)
- [x] Security (4 tests)

### Schémas Zod
- [x] SuccessResponseSchema (200)
- [x] GatingResponseSchema (409)
- [x] ErrorResponseSchema (401/500)

### Fixtures
- [x] Créer `fixtures/store-publish-samples.ts`
- [x] Définir utilisateurs de test
- [x] Définir réponses attendues
- [x] Définir benchmarks de performance
- [x] Définir patterns de sécurité

### Documentation
- [x] Créer `store-publish-README.md`
- [x] Mettre à jour `docs/api-tests.md`
- [x] Créer `STORE_PUBLISH_TESTS_COMPLETE.md`
- [x] Créer `QUICK_START_STORE_PUBLISH_TESTS.md`
- [x] Créer `STORE_PUBLISH_TEST_SCENARIOS.md`
- [x] Créer `TESTS_INTEGRATION_SUMMARY.md`

---

## 🔄 Phase 2: Validation locale (À FAIRE)

### Prérequis
- [ ] Node.js installé (v18+)
- [ ] npm install exécuté
- [ ] Base de données configurée
- [ ] Variables d'environnement configurées

### Démarrage
- [ ] Démarrer le serveur de dev (`npm run dev`)
- [ ] Vérifier que le serveur répond (`http://localhost:3000`)
- [ ] Vérifier les logs du serveur

### Exécution des tests
- [ ] Exécuter tous les tests
  ```bash
  npm run test:integration tests/integration/api/store-publish.test.ts
  ```
- [ ] Vérifier que tous les tests passent (30/30)
- [ ] Vérifier le temps d'exécution (< 30s)
- [ ] Vérifier qu'il n'y a pas de tests flaky

### Tests par catégorie
- [ ] Tests HTTP Methods
  ```bash
  npm run test:integration -- --grep "HTTP Methods"
  ```
- [ ] Tests Authentication
  ```bash
  npm run test:integration -- --grep "Authentication"
  ```
- [ ] Tests Gating
  ```bash
  npm run test:integration -- --grep "Gating"
  ```
- [ ] Tests Performance
  ```bash
  npm run test:integration -- --grep "Performance"
  ```
- [ ] Tests Concurrent
  ```bash
  npm run test:integration -- --grep "Concurrent"
  ```

### Couverture de code
- [ ] Exécuter avec couverture
  ```bash
  npm run test:integration -- --coverage tests/integration/api/store-publish.test.ts
  ```
- [ ] Vérifier couverture > 80%
- [ ] Identifier les branches non couvertes
- [ ] Ajouter des tests si nécessaire

---

## 🧪 Phase 3: Tests avec données réelles (À FAIRE)

### Utilisateurs de test
- [ ] Créer utilisateur avec paiements configurés
- [ ] Créer utilisateur sans paiements configurés
- [ ] Générer tokens d'authentification valides
- [ ] Mettre à jour les fixtures avec vrais tokens

### Base de données
- [ ] Vérifier que la table `user_onboarding` existe
- [ ] Vérifier que la table `onboarding_step_definitions` existe
- [ ] Vérifier que l'étape 'payments' existe
- [ ] Créer des données de test dans la DB

### Tests avec vrais utilisateurs
- [ ] Tester avec utilisateur sans paiements → 409
- [ ] Tester avec utilisateur avec paiements → 200
- [ ] Tester avec token invalide → 401
- [ ] Tester sans token → 401

### Validation des réponses
- [ ] Vérifier que les correlation IDs sont uniques
- [ ] Vérifier que les messages sont en français
- [ ] Vérifier que les URLs de boutique sont valides
- [ ] Vérifier que les actions de gating sont correctes

---

## 🚀 Phase 4: Tests en staging (À FAIRE)

### Configuration
- [ ] Déployer le code en staging
- [ ] Vérifier que l'endpoint est accessible
- [ ] Configurer TEST_BASE_URL pour staging
  ```bash
  TEST_BASE_URL=https://staging.huntaze.com
  ```

### Exécution
- [ ] Exécuter tous les tests contre staging
- [ ] Vérifier que tous les tests passent
- [ ] Vérifier les logs du serveur staging
- [ ] Vérifier les métriques de performance

### Validation
- [ ] Temps de réponse acceptable (< 2s)
- [ ] Pas d'erreurs 500 inattendues
- [ ] Gating middleware fonctionne
- [ ] Correlation IDs présents dans les logs

### Monitoring
- [ ] Vérifier que les métriques sont collectées
- [ ] Vérifier que les logs sont structurés
- [ ] Vérifier que les alertes ne se déclenchent pas
- [ ] Vérifier les dashboards Grafana

---

## 🔧 Phase 5: Intégration CI/CD (À FAIRE)

### Configuration GitHub Actions
- [ ] Créer workflow pour tests d'intégration
- [ ] Configurer démarrage du serveur
- [ ] Configurer exécution des tests
- [ ] Configurer upload de la couverture

### Workflow
```yaml
name: Integration Tests - Store Publish

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - run: npx wait-on http://localhost:3000
      - run: npm run test:integration tests/integration/api/store-publish.test.ts
```

### Validation
- [ ] Workflow s'exécute sur push
- [ ] Workflow s'exécute sur PR
- [ ] Tests passent dans CI
- [ ] Couverture uploadée vers Codecov
- [ ] Notifications configurées

### Alertes
- [ ] Configurer alertes sur échecs de tests
- [ ] Configurer alertes sur baisse de couverture
- [ ] Configurer alertes sur dégradation de performance
- [ ] Tester les alertes

---

## 📊 Phase 6: Monitoring production (À FAIRE)

### Métriques
- [ ] Configurer métriques Prometheus
  - `api_store_publish_requests_total`
  - `api_store_publish_duration_seconds`
  - `api_store_publish_errors_total`
  - `api_store_publish_gating_blocks_total`

### Dashboards
- [ ] Créer dashboard Grafana pour l'endpoint
- [ ] Ajouter graphiques de taux de requêtes
- [ ] Ajouter graphiques de latence (p50, p95, p99)
- [ ] Ajouter graphiques de taux d'erreur
- [ ] Ajouter graphiques de gating blocks

### Alertes
- [ ] Alerter si taux d'erreur > 5%
- [ ] Alerter si p95 latency > 2s
- [ ] Alerter si taux de gating > 50%
- [ ] Alerter si endpoint down

### Logs
- [ ] Vérifier que les logs sont structurés
- [ ] Vérifier que les correlation IDs sont présents
- [ ] Vérifier que les erreurs sont loggées
- [ ] Configurer rétention des logs

---

## 🎯 Phase 7: Documentation équipe (À FAIRE)

### Formation
- [ ] Présenter les tests à l'équipe
- [ ] Expliquer les patterns de test
- [ ] Montrer comment exécuter les tests
- [ ] Montrer comment déboguer les tests

### Documentation
- [ ] Partager `QUICK_START_STORE_PUBLISH_TESTS.md`
- [ ] Partager `STORE_PUBLISH_TEST_SCENARIOS.md`
- [ ] Partager `tests/integration/api/store-publish-README.md`
- [ ] Ajouter liens dans la doc d'équipe

### Processus
- [ ] Documenter quand exécuter les tests
- [ ] Documenter comment ajouter de nouveaux tests
- [ ] Documenter comment déboguer les échecs
- [ ] Documenter le processus de review

### Support
- [ ] Créer canal Slack #platform-tests
- [ ] Désigner responsable des tests
- [ ] Planifier revues régulières
- [ ] Documenter FAQ

---

## 🔄 Phase 8: Maintenance continue (À FAIRE)

### Revues régulières
- [ ] Revoir les tests mensuellement
- [ ] Identifier les tests flaky
- [ ] Optimiser les tests lents
- [ ] Mettre à jour les fixtures

### Métriques de santé
- [ ] Suivre le taux de succès des tests
- [ ] Suivre le temps d'exécution
- [ ] Suivre la couverture de code
- [ ] Suivre le nombre de tests

### Améliorations
- [ ] Ajouter des tests de charge (k6/Artillery)
- [ ] Ajouter des tests E2E (Playwright)
- [ ] Ajouter des tests de chaos engineering
- [ ] Améliorer la documentation

### Évolution
- [ ] Adapter les tests aux changements d'API
- [ ] Ajouter des tests pour nouvelles fonctionnalités
- [ ] Refactorer les tests obsolètes
- [ ] Partager les patterns avec autres endpoints

---

## ✅ Critères de succès

### Tests
- ✅ 30+ tests créés
- ⏳ Tous les tests passent localement
- ⏳ Tous les tests passent en staging
- ⏳ Tous les tests passent en CI/CD
- ⏳ Couverture de code > 80%
- ⏳ Temps d'exécution < 30s
- ⏳ Aucun test flaky

### Documentation
- ✅ README complet créé
- ✅ Scénarios documentés
- ✅ Patterns établis
- ⏳ Équipe formée
- ⏳ FAQ créée

### Intégration
- ⏳ CI/CD configuré
- ⏳ Monitoring configuré
- ⏳ Alertes configurées
- ⏳ Dashboards créés

### Processus
- ⏳ Processus de review établi
- ⏳ Responsable désigné
- ⏳ Maintenance planifiée
- ⏳ Support disponible

---

## 📈 Métriques cibles

| Métrique | Cible | Actuel | Status |
|----------|-------|--------|--------|
| Tests créés | 30+ | 30+ | ✅ |
| Tests passant | 100% | - | ⏳ |
| Couverture | > 80% | - | ⏳ |
| Temps d'exécution | < 30s | - | ⏳ |
| Tests flaky | 0% | - | ⏳ |
| Documentation | Complète | ✅ | ✅ |

---

## 🎯 Prochaines actions

### Immédiat (Aujourd'hui)
1. [ ] Exécuter les tests localement
2. [ ] Créer des utilisateurs de test
3. [ ] Valider que tous les tests passent

### Court terme (Cette semaine)
1. [ ] Tester en staging
2. [ ] Configurer CI/CD
3. [ ] Former l'équipe

### Moyen terme (Ce mois)
1. [ ] Déployer en production
2. [ ] Configurer monitoring
3. [ ] Établir processus de maintenance

### Long terme (Trimestre)
1. [ ] Ajouter tests de charge
2. [ ] Ajouter tests E2E
3. [ ] Étendre aux autres endpoints

---

**Status**: Phase 1 complète ✅, Phases 2-8 à faire ⏳  
**Dernière mise à jour**: 2024-11-11  
**Responsable**: Équipe Platform  
**Prochaine étape**: Exécution locale des tests 🚀
