# Tests de Documentation Azure Deployment Name

## 📖 Vue d'ensemble

Cette suite de tests valide la documentation `docs/FIND_AZURE_DEPLOYMENT_NAME.md`, qui guide les utilisateurs dans la résolution de l'erreur `DeploymentNotFound` lors de la configuration d'Azure OpenAI.

## 🎯 Objectifs

- ✅ Valider la structure et le contenu de la documentation
- ✅ Garantir la cohérence avec les scripts et configurations
- ✅ Prévenir les régressions lors des modifications
- ✅ Assurer la qualité et l'utilité de la documentation

## 📁 Fichiers de Test

### Tests Unitaires
**Fichier** : `tests/unit/azure-deployment-name-documentation.test.ts`

**Contenu** : 63 tests de validation
- Structure et format markdown
- Contenu technique (commandes, variables, exemples)
- Intégration avec scripts existants
- Qualité et lisibilité

### Tests de Régression
**Fichier** : `tests/regression/azure-deployment-name-regression.test.ts`

**Contenu** : 35 tests de régression
- Préservation des informations critiques
- Cohérence avec le codebase
- Compatibilité avec l'infrastructure
- Standards de qualité maintenus

## 🚀 Exécution des Tests

### Tous les tests
```bash
npm run test tests/unit/azure-deployment-name-documentation.test.ts tests/regression/azure-deployment-name-regression.test.ts
```

### Tests unitaires uniquement
```bash
npm run test tests/unit/azure-deployment-name-documentation.test.ts
```

### Tests de régression uniquement
```bash
npm run test tests/regression/azure-deployment-name-regression.test.ts
```

### Avec couverture
```bash
npm run test:coverage -- tests/unit/azure-deployment-name-documentation.test.ts
```

### Mode watch (développement)
```bash
npm run test -- tests/unit/azure-deployment-name-documentation.test.ts --watch
```

## 📊 Résultats Attendus

```
✓ tests/unit/azure-deployment-name-documentation.test.ts (63 tests)
✓ tests/regression/azure-deployment-name-regression.test.ts (35 tests)

Test Files  2 passed (2)
     Tests  98 passed (98)
  Duration  ~1s
```

## 🔍 Que Valident les Tests ?

### 1. Structure de la Documentation
- ✅ Existence du fichier
- ✅ Format markdown correct
- ✅ Hiérarchie des en-têtes
- ✅ Langue française

### 2. Contenu Technique
- ✅ Description de l'erreur `DeploymentNotFound`
- ✅ Étapes de solution (4 étapes)
- ✅ Commandes Azure CLI
- ✅ Variables d'environnement
- ✅ Exemples de noms de déploiement

### 3. Informations de Ressource
- ✅ Endpoint Azure OpenAI
- ✅ Resource group
- ✅ Nom de ressource
- ✅ Version API

### 4. Intégration
- ✅ Cohérence avec `test-azure-connection.mjs`
- ✅ Alignement avec `.env.example`
- ✅ Complémentarité avec autres docs Azure

### 5. Qualité
- ✅ Instructions actionnables
- ✅ Exemples concrets
- ✅ Indicateurs visuels (✅/❌)
- ✅ Blocs de code formatés

## 🛠️ Maintenance

### Quand Exécuter les Tests ?

1. **Avant de modifier la documentation**
   ```bash
   npm run test tests/unit/azure-deployment-name-documentation.test.ts
   ```

2. **Après modification de la documentation**
   ```bash
   npm run test tests/regression/azure-deployment-name-regression.test.ts
   ```

3. **Avant un commit**
   ```bash
   npm run test tests/unit/azure-deployment-name-documentation.test.ts tests/regression/azure-deployment-name-regression.test.ts
   ```

4. **Dans le CI/CD**
   - Les tests s'exécutent automatiquement
   - Bloquent le merge si échec

### Que Faire si un Test Échoue ?

#### Test de Structure Échoue
```
❌ should have proper markdown structure
```
**Solution** : Vérifier la structure markdown du fichier
- En-têtes correctement formatés (`#`, `##`, `###`)
- Pas de syntaxe markdown cassée

#### Test de Contenu Échoue
```
❌ should document the Azure OpenAI endpoint
```
**Solution** : Vérifier que l'information est présente
- Rechercher le contenu manquant dans la doc
- Ajouter l'information si nécessaire
- Mettre à jour le test si l'information a changé de format

#### Test d'Intégration Échoue
```
❌ should align with test-azure-connection.mjs
```
**Solution** : Vérifier la cohérence
- Comparer les variables d'environnement
- Vérifier les noms de ressources
- Synchroniser la documentation avec le code

#### Test de Régression Échoue
```
❌ should preserve Azure resource information
```
**Solution** : Information critique supprimée
- Restaurer l'information manquante
- Ou mettre à jour le test si le changement est intentionnel

## 📝 Ajouter de Nouveaux Tests

### Exemple : Tester une Nouvelle Section

```typescript
describe('New Section Validation', () => {
  it('should document the new feature', () => {
    expect(docContent).toContain('Nouvelle Fonctionnalité');
    expect(docContent).toContain('Instructions détaillées');
  });

  it('should provide code examples', () => {
    expect(docContent).toMatch(/```bash[\s\S]*?nouvelle-commande[\s\S]*?```/);
  });
});
```

### Exemple : Tester une Nouvelle Commande

```typescript
it('should include the new Azure CLI command', () => {
  expect(docContent).toContain('az nouvelle-commande');
  expect(docContent).toContain('--parameter value');
});
```

## 🔧 Configuration

### Variables d'Environnement Testées
- `AZURE_OPENAI_DEPLOYMENT`
- `AZURE_OPENAI_ENDPOINT` (référencé)
- `AZURE_OPENAI_API_KEY` (référencé)

### Fichiers Liés Vérifiés
- `docs/FIND_AZURE_DEPLOYMENT_NAME.md` (fichier principal)
- `scripts/test-azure-connection.mjs` (script de test)
- `.env.example` (configuration)
- `docs/AZURE_OPENAI_SETUP.md` (doc complémentaire)

## 📚 Ressources

### Documentation Liée
- [FIND_AZURE_DEPLOYMENT_NAME.md](../../docs/FIND_AZURE_DEPLOYMENT_NAME.md) - Documentation testée
- [AZURE_OPENAI_SETUP.md](../../docs/AZURE_OPENAI_SETUP.md) - Configuration Azure OpenAI
- [test-azure-connection.mjs](../../scripts/test-azure-connection.mjs) - Script de test

### Guides de Test
- [Tests README](../README.md) - Guide général des tests
- [TEST_GENERATION_SUMMARY_AZURE_DEPLOYMENT_NAME.md](../../TEST_GENERATION_SUMMARY_AZURE_DEPLOYMENT_NAME.md) - Résumé détaillé

## 🤝 Contribution

### Modifier la Documentation

1. **Modifier** `docs/FIND_AZURE_DEPLOYMENT_NAME.md`
2. **Exécuter** les tests
   ```bash
   npm run test tests/unit/azure-deployment-name-documentation.test.ts
   ```
3. **Corriger** les erreurs si nécessaire
4. **Exécuter** les tests de régression
   ```bash
   npm run test tests/regression/azure-deployment-name-regression.test.ts
   ```
5. **Commit** si tous les tests passent

### Ajouter des Tests

1. **Identifier** ce qui doit être testé
2. **Ajouter** le test dans le fichier approprié
3. **Exécuter** pour vérifier
4. **Documenter** le nouveau test dans ce README

## ❓ FAQ

### Q : Pourquoi tester de la documentation ?
**R** : Pour garantir que la documentation reste précise, cohérente et utile au fil du temps.

### Q : Les tests ralentissent-ils le développement ?
**R** : Non, ils accélèrent en détectant les problèmes tôt (1s pour 98 tests).

### Q : Que faire si je veux changer le format de la doc ?
**R** : Modifier la doc, puis mettre à jour les tests de régression pour refléter le nouveau format.

### Q : Les tests vérifient-ils les liens externes ?
**R** : Oui, ils vérifient la présence et le format des liens (ex: Azure Portal).

### Q : Puis-je ignorer un test qui échoue ?
**R** : Non recommandé. Soit corriger la doc, soit mettre à jour le test si le changement est intentionnel.

## 🎯 Checklist de Qualité

Avant de merger une modification de documentation :

- [ ] Tous les tests unitaires passent
- [ ] Tous les tests de régression passent
- [ ] La documentation est lisible et claire
- [ ] Les exemples de code sont corrects
- [ ] Les commandes sont testables
- [ ] Les liens fonctionnent
- [ ] La langue est cohérente (français)
- [ ] Les informations sont à jour

---

**Maintenu par** : L'équipe Huntaze  
**Dernière mise à jour** : 26 octobre 2025  
**Version** : 1.0.0
