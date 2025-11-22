# Guide: Désactiver l'Autofix Automatique de Kiro

## Problème

L'autofix de Kiro se déclenche automatiquement et peut causer des problèmes:
- ❌ Duplication de contenu
- ❌ Corruption de fichiers
- ❌ Modifications non désirées
- ❌ Perte de temps à corriger

## Solution: Désactiver l'Autofix Automatique

### Option 1: Via les Paramètres de Kiro (Recommandé)

1. **Ouvrir les Paramètres**
   - Cliquer sur l'icône d'engrenage ⚙️ en haut à droite
   - Ou utiliser le raccourci: `Cmd+,` (Mac) / `Ctrl+,` (Windows/Linux)

2. **Rechercher "Autofix"**
   - Dans la barre de recherche des paramètres
   - Taper: `autofix`

3. **Désactiver l'Autofix Automatique**
   - Décocher: `Enable Automatic Autofix`
   - Ou: `Autofix on Save` (si disponible)
   - Ou: `Format on Save` (si c'est lié)

4. **Sauvegarder les Paramètres**
   - Les paramètres sont généralement sauvegardés automatiquement

### Option 2: Via le Fichier de Configuration

Si Kiro utilise un fichier de configuration (comme `.kiro/settings.json` ou similaire):

```json
{
  "autofix": {
    "enabled": false,
    "onSave": false,
    "automatic": false
  },
  "format": {
    "onSave": false
  }
}
```

### Option 3: Désactiver pour des Fichiers Spécifiques

Si tu veux garder l'autofix pour certains fichiers mais pas pour les tests:

1. **Créer un fichier `.kiro/autofix-ignore`** (si supporté)
   ```
   tests/**/*.test.ts
   tests/**/*.integration.test.ts
   **/*.test.tsx
   ```

2. **Ou ajouter dans les paramètres**:
   ```json
   {
     "autofix": {
       "exclude": [
         "tests/**/*.test.ts",
         "tests/**/*.integration.test.ts"
       ]
     }
   }
   ```

## Utilisation Manuelle de l'Autofix

Une fois désactivé, tu peux toujours utiliser l'autofix manuellement quand tu en as besoin:

1. **Via le Menu Contextuel**
   - Clic droit sur le fichier
   - Sélectionner: `Format Document` ou `Autofix`

2. **Via le Raccourci Clavier**
   - `Shift+Alt+F` (Windows/Linux)
   - `Shift+Option+F` (Mac)

3. **Via la Palette de Commandes**
   - `Cmd+Shift+P` (Mac) / `Ctrl+Shift+P` (Windows/Linux)
   - Taper: `Format Document` ou `Autofix`

## Vérification

Pour vérifier que l'autofix est bien désactivé:

1. **Ouvrir un fichier de test**
2. **Faire une petite modification** (ajouter un espace)
3. **Sauvegarder** (`Cmd+S` / `Ctrl+S`)
4. **Vérifier** que le fichier n'est pas automatiquement formaté

## Recommandations

### ✅ À Faire
- Désactiver l'autofix automatique pour les fichiers de test
- Utiliser l'autofix manuellement quand nécessaire
- Vérifier les modifications avant de sauvegarder
- Utiliser git pour suivre les changements

### ❌ À Éviter
- Laisser l'autofix automatique activé pour les tests
- Sauvegarder sans vérifier les modifications
- Faire confiance aveuglément à l'autofix

## Historique des Problèmes

### Session 5 - Round 1
- **Problème**: Fichier corrompu (tronqué à 46 lignes)
- **Cause**: Autofix automatique
- **Solution**: Restauration manuelle

### Session 5 - Round 2
- **Problème**: Contenu dupliqué (1276 lignes au lieu de 701)
- **Cause**: Autofix automatique
- **Solution**: Suppression de la duplication avec `head -701`

### Session 5 - Round 3
- **Problème**: Autofix déclenché à nouveau
- **Cause**: Autofix toujours activé
- **Solution**: Ce guide pour le désactiver

## Support

Si tu ne trouves pas comment désactiver l'autofix:

1. **Consulter la documentation de Kiro**
   - Chercher: "disable autofix" ou "format on save"

2. **Demander à l'équipe Kiro**
   - Via le support ou la communauté

3. **Utiliser git pour protéger tes fichiers**
   - Commit régulièrement
   - Vérifier les diffs avant de commit

## Statut Actuel

✅ **Tests**: 21/21 passent (100%)  
⚠️ **Autofix**: Toujours activé (à désactiver)  
📝 **Action**: Suivre ce guide pour désactiver

---

*Guide créé le: 2024-11-20*  
*Dernière mise à jour: 2024-11-20*
