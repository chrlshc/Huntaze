# Guide d'Exécution du Diagnostic Baseline

Ce guide explique comment exécuter le diagnostic de performance et établir la baseline pour le dashboard Huntaze.

## Objectif

Établir une baseline de performance mesurable avant d'appliquer les optimisations. Cette baseline servira de point de référence pour mesurer l'impact de chaque optimisation.

## Prérequis

1. L'application doit être en cours d'exécution (dev ou production)
2. La base de données doit être accessible
3. Node.js et npm doivent être installés

## Méthode 1: Script Automatisé (Recommandé)

### Exécution

```bash
npm run diagnostic:baseline
```

### Ce que fait le script

1. Démarre l'outil de diagnostic
2. Collecte des métriques pendant 5 secondes
3. Génère un rapport complet
4. Identifie les top 5 bottlenecks
5. Sauvegarde les résultats dans:
   - `.kiro/specs/dashboard-performance-real-fix/baseline-metrics.json` (données brutes)
   - `.kiro/specs/dashboard-performance-real-fix/baseline-report.md` (rapport lisible)

### Sortie Attendue

```
🔍 Starting baseline diagnostic...

📊 Starting diagnostic collection...
⏳ Collecting metrics (this may take a moment)...
📈 Generating diagnostic report...

✅ Baseline diagnostic complete!

📊 Summary:
   Total Issues: 12
   High Impact: 4
   Medium Impact: 5
   Low Impact: 3
   Estimated Improvement Potential: 50-70%

🎯 Top 5 Bottlenecks to Fix:

1. 🔴 [HIGH] force-dynamic on layout disables all caching
   Type: cache
   Current Time: 2500ms
   Location: app/(app)/layout.tsx

2. 🔴 [HIGH] usePerformanceMonitoring called on every page
   Type: monitoring
   Current Time: 800ms
   Location: hooks/usePerformanceMonitoring.ts

...
```

## Méthode 2: Via l'Interface Web

### Accès

1. Démarrer l'application: `npm run dev`
2. Naviguer vers: `http://localhost:3000/diagnostics`
3. Cliquer sur "Start Diagnostic"
4. Attendre la collecte des métriques
5. Cliquer sur "Generate Report"
6. Télécharger le rapport

### Avantages

- Interface visuelle
- Contrôle manuel du timing
- Visualisation en temps réel des métriques

## Méthode 3: Diagnostic en Production

### Configuration

Pour exécuter le diagnostic en production (avec précaution):

```bash
# Définir l'environnement
export NODE_ENV=production

# Exécuter le diagnostic
npm run diagnostic:baseline
```

⚠️ **Attention**: Le diagnostic en production peut impacter les performances. À utiliser pendant les heures creuses.

## Interprétation des Résultats

### Niveaux d'Impact

- **🔴 HIGH**: Bottleneck critique, impact > 500ms, priorité maximale
- **🟡 MEDIUM**: Impact modéré, 100-500ms, à traiter après les HIGH
- **🟢 LOW**: Impact mineur, < 100ms, optimisation optionnelle

### Types de Bottlenecks

- **db**: Requêtes database lentes ou N+1 queries
- **render**: Temps de rendu de composants élevé
- **network**: Requêtes API dupliquées ou lentes
- **monitoring**: Overhead du monitoring de performance
- **cache**: Problèmes de configuration du cache

### Métriques Clés

1. **DB Query Time**: Temps total des requêtes database
2. **Render Time**: Temps de rendu des composants
3. **Duplicate Requests**: Nombre de requêtes dupliquées
4. **Monitoring Overhead**: Impact du monitoring sur les performances
5. **Cache Hit Rate**: Pourcentage de requêtes servies depuis le cache

## Prochaines Étapes

Après avoir établi la baseline:

1. **Analyser le rapport**: Identifier les patterns dans les bottlenecks
2. **Prioriser**: Commencer par les issues HIGH impact
3. **Planifier**: Suivre l'ordre des tâches dans `tasks.md`
4. **Optimiser**: Implémenter les fixes (tâches 3+)
5. **Mesurer**: Re-exécuter le diagnostic après chaque optimisation majeure
6. **Comparer**: Valider l'amélioration vs baseline

## Troubleshooting

### Le diagnostic ne démarre pas

```bash
# Vérifier que l'outil de diagnostic existe
ls -la lib/diagnostics/

# Vérifier les dépendances
npm install
```

### Pas de métriques collectées

- Vérifier que l'application est en cours d'exécution
- Vérifier que la DB est accessible
- Augmenter le temps de collecte dans le script

### Erreur "Cannot find module"

```bash
# Rebuild le projet
npm run build

# Ou utiliser tsx directement
npx tsx scripts/run-baseline-diagnostic.ts
```

## Automatisation

Pour automatiser le diagnostic dans votre CI/CD:

```yaml
# .github/workflows/performance-baseline.yml
name: Performance Baseline

on:
  push:
    branches: [main]

jobs:
  baseline:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run diagnostic:baseline
      - uses: actions/upload-artifact@v3
        with:
          name: baseline-report
          path: .kiro/specs/dashboard-performance-real-fix/baseline-*.{json,md}
```

## Support

Si vous rencontrez des problèmes:

1. Vérifier les logs dans la console
2. Consulter `baseline-report.md` pour les détails
3. Examiner `baseline-metrics.json` pour les données brutes
4. Ouvrir une issue avec les logs d'erreur

---

**Note**: Cette baseline est le point de départ. Toutes les optimisations futures seront mesurées par rapport à ces métriques initiales.
