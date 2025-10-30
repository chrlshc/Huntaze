# Intégration CI/CD - Tests Documentation Azure Deployment Name

## 🎯 Objectif

Intégrer les tests de validation de la documentation `FIND_AZURE_DEPLOYMENT_NAME.md` dans le pipeline CI/CD pour garantir la qualité continue.

## 🔄 Pipeline CI/CD

### Déclencheurs

Les tests s'exécutent automatiquement lors de :
- ✅ Push sur `main` ou `develop`
- ✅ Pull Request vers `main` ou `develop`
- ✅ Modification de `docs/FIND_AZURE_DEPLOYMENT_NAME.md`
- ✅ Modification des scripts de test Azure
- ✅ Modification de `.env.example`

### Étapes du Pipeline

```yaml
# .github/workflows/test-azure-docs.yml
name: Test Azure Documentation

on:
  push:
    branches: [main, develop]
    paths:
      - 'docs/FIND_AZURE_DEPLOYMENT_NAME.md'
      - 'docs/AZURE_OPENAI_SETUP.md'
      - 'scripts/test-azure-connection.mjs'
      - '.env.example'
      - 'tests/unit/azure-deployment-name-documentation.test.ts'
      - 'tests/regression/azure-deployment-name-regression.test.ts'
  pull_request:
    branches: [main, develop]

jobs:
  test-documentation:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run documentation validation tests
        run: |
          npm run test -- \
            tests/unit/azure-deployment-name-documentation.test.ts \
            tests/regression/azure-deployment-name-regression.test.ts \
            --reporter=verbose \
            --run
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: reports/
```

## 📋 Checklist Pre-Commit

Avant de commiter des modifications à la documentation :

```bash
# 1. Vérifier que la documentation existe
[ -f docs/FIND_AZURE_DEPLOYMENT_NAME.md ] && echo "✓ Documentation exists"

# 2. Exécuter les tests de validation
npm run test tests/unit/azure-deployment-name-documentation.test.ts --run

# 3. Exécuter les tests de régression
npm run test tests/regression/azure-deployment-name-regression.test.ts --run

# 4. Vérifier le format markdown
npx markdownlint docs/FIND_AZURE_DEPLOYMENT_NAME.md || true

# 5. Vérifier les liens
npx markdown-link-check docs/FIND_AZURE_DEPLOYMENT_NAME.md || true
```

## 🔧 Configuration Git Hooks

### Pre-commit Hook

Créer `.git/hooks/pre-commit` :

```bash
#!/bin/bash

# Vérifier si la documentation Azure a été modifiée
if git diff --cached --name-only | grep -q "docs/FIND_AZURE_DEPLOYMENT_NAME.md"; then
  echo "🔍 Documentation Azure modifiée, exécution des tests..."
  
  # Exécuter les tests
  npm run test -- \
    tests/unit/azure-deployment-name-documentation.test.ts \
    tests/regression/azure-deployment-name-regression.test.ts \
    --run \
    --reporter=verbose
  
  # Vérifier le code de sortie
  if [ $? -ne 0 ]; then
    echo "❌ Les tests de documentation ont échoué"
    echo "Veuillez corriger les erreurs avant de commiter"
    exit 1
  fi
  
  echo "✅ Tests de documentation réussis"
fi

exit 0
```

Rendre le hook exécutable :
```bash
chmod +x .git/hooks/pre-commit
```

### Pre-push Hook

Créer `.git/hooks/pre-push` :

```bash
#!/bin/bash

echo "🔍 Exécution des tests de régression avant push..."

npm run test -- \
  tests/regression/azure-deployment-name-regression.test.ts \
  --run \
  --reporter=verbose

if [ $? -ne 0 ]; then
  echo "❌ Les tests de régression ont échoué"
  echo "Veuillez corriger les erreurs avant de pusher"
  exit 1
fi

echo "✅ Tests de régression réussis"
exit 0
```

## 📊 Métriques et Reporting

### Métriques Collectées

- ✅ Nombre de tests exécutés
- ✅ Taux de réussite
- ✅ Durée d'exécution
- ✅ Couverture de validation
- ✅ Nombre de sections validées

### Rapport de Test

Le pipeline génère automatiquement :
- Rapport JUnit XML
- Rapport de couverture
- Logs détaillés
- Artefacts de test

### Dashboard

Métriques disponibles dans :
- GitHub Actions (onglet Actions)
- Pull Request checks
- Branch protection rules

## 🚨 Gestion des Échecs

### Si les Tests Échouent en CI

1. **Consulter les logs**
   ```bash
   # Dans GitHub Actions
   Actions → Workflow run → Job → Step logs
   ```

2. **Reproduire localement**
   ```bash
   npm run test tests/unit/azure-deployment-name-documentation.test.ts --run
   ```

3. **Identifier le problème**
   - Test de structure → Vérifier le format markdown
   - Test de contenu → Vérifier les informations manquantes
   - Test d'intégration → Vérifier la cohérence avec le code

4. **Corriger et re-tester**
   ```bash
   # Après correction
   npm run test tests/regression/azure-deployment-name-regression.test.ts --run
   ```

### Bypass (Urgence Uniquement)

En cas d'urgence absolue, possibilité de bypass :

```bash
# Ajouter [skip ci] au message de commit
git commit -m "docs: update Azure deployment guide [skip ci]"
```

⚠️ **À utiliser avec précaution** - Les tests existent pour une raison !

## 🔐 Protection des Branches

### Configuration Recommandée

```yaml
# .github/branch-protection.yml
branches:
  main:
    protection:
      required_status_checks:
        strict: true
        contexts:
          - "test-documentation"
      required_pull_request_reviews:
        required_approving_review_count: 1
      enforce_admins: false
```

### Règles de Protection

- ✅ Tests de documentation requis
- ✅ Au moins 1 review requise
- ✅ Branches à jour avec main
- ✅ Pas de force push

## 📈 Monitoring Continu

### Alertes

Configurer des alertes pour :
- ❌ Échec des tests > 2 fois consécutives
- ⚠️ Durée d'exécution > 5 secondes
- ⚠️ Taux de réussite < 100%

### Notifications

- 📧 Email aux mainteneurs
- 💬 Slack/Discord notification
- 🔔 GitHub notification

## 🔄 Maintenance

### Mise à Jour des Tests

Quand mettre à jour les tests :
1. Nouvelle section dans la documentation
2. Changement de format
3. Nouvelle ressource Azure
4. Nouveau script de test

### Revue Périodique

- 📅 Mensuelle : Vérifier la pertinence des tests
- 📅 Trimestrielle : Optimiser les performances
- 📅 Annuelle : Refactoring si nécessaire

## 📚 Ressources

### Documentation
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vitest CI](https://vitest.dev/guide/ci.html)
- [Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)

### Scripts Utiles
```bash
# Exécuter tous les tests Azure
npm run test -- tests/unit/azure-*.test.ts tests/regression/azure-*.test.ts

# Générer un rapport de couverture
npm run test:coverage -- tests/unit/azure-deployment-name-documentation.test.ts

# Mode watch pour développement
npm run test -- tests/unit/azure-deployment-name-documentation.test.ts --watch
```

## ✅ Checklist d'Intégration

- [ ] Pipeline CI/CD configuré
- [ ] Git hooks installés
- [ ] Protection de branche activée
- [ ] Notifications configurées
- [ ] Documentation à jour
- [ ] Tests passent localement
- [ ] Tests passent en CI
- [ ] Métriques collectées

---

**Maintenu par** : L'équipe Huntaze  
**Dernière mise à jour** : 26 octobre 2025  
**Version** : 1.0.0
