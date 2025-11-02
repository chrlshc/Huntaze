# Monitoring System Tests

Tests unitaires pour le système de monitoring et d'alertes.

## Tests Inclus

### `monitoring-system.test.ts`

Tests de validation de la logique du système de monitoring :

#### Metrics Collection Logic
- Validation de la structure des métriques OAuth
- Validation de la structure des métriques d'upload
- Validation de la structure des métriques de webhook

#### Alert Configuration
- Validation de la structure des alertes
- Validation des niveaux de sévérité (warning, error, critical)

#### Error Rate Calculation
- Calcul correct du taux d'erreur
- Détection des taux d'erreur élevés (>5%)
- Seuil minimum de volume (>10 tentatives)

#### Latency Calculation
- Calcul de la latence moyenne
- Détection de latence élevée (>5 secondes)
- Seuil minimum d'échantillons (>5)

#### Dashboard Data Structure
- Validation de la structure du résumé des métriques
- Calcul des taux de succès

#### Alert Notification Structure
- Validation du payload Slack webhook
- Mapping sévérité → couleurs

#### API Response Structure
- Validation de la réponse API métriques
- Validation de la réponse API alertes

## Exécution des Tests

```bash
# Tous les tests de monitoring
npm test tests/unit/monitoring

# Test spécifique
npm test tests/unit/monitoring/monitoring-system.test.ts
```

## Couverture

Ces tests valident la logique métier du système de monitoring sans dépendances externes. Ils testent :
- ✅ Structures de données
- ✅ Calculs de métriques
- ✅ Logique d'alertes
- ✅ Formats d'API

## Notes

Les tests utilisent des mocks pour éviter les dépendances sur les services réels (`metrics`, `alertService`). Cela permet de tester la logique pure sans effets de bord.
