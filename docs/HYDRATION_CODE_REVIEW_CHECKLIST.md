# Checklist de Code Review - Hydratation React

Cette checklist vous aide à identifier et prévenir les erreurs d'hydratation lors des revues de code.

## 🎯 Utilisation

- [ ] Utilisez cette checklist pour **chaque PR** contenant du code React/Next.js
- [ ] Cochez chaque élément vérifié
- [ ] Ajoutez des commentaires spécifiques pour les problèmes détectés
- [ ] Référencez les solutions recommandées

## 📋 Checklist Principale

### ✅ 1. Détection de Contenu Temporel

- [ ] **Aucun usage direct de `new Date()`** sans wrapper de sécurité
  ```jsx
  // ❌ À éviter
  <div>{new Date().toString()}</div>
  
  // ✅ Utiliser
  <SafeDateRenderer date={new Date()} format="full" />
  ```

- [ ] **Aucun usage de `Date.now()`** dans le rendu
  ```jsx
  // ❌ À éviter
  <div key={Date.now()}>Item</div>
  
  // ✅ Utiliser
  <div key={item.id}>Item</div>
  ```

- [ ] **Timestamps cohérents** entre serveur et client
  ```jsx
  // ✅ Bon pattern
  const timestamp = useSSRValue('pageTimestamp', Date.now());
  ```

### ✅ 2. Contenu Aléatoire et Dynamique

- [ ] **Aucun usage direct de `Math.random()`** sans seed
  ```jsx
  // ❌ À éviter
  const randomId = Math.random().toString(36);
  
  // ✅ Utiliser
  <SafeRandomContent seed="unique-seed">
    {(value) => <div id={value.toString(36)}>Content</div>}
  </SafeRandomContent>
  ```

- [ ] **Clés React stables** (pas de valeurs aléatoires)
  ```jsx
  // ❌ À éviter
  {items.map(() => <Item key={Math.random()} />)}
  
  // ✅ Utiliser
  {items.map((item) => <Item key={item.id} />)}
  ```

- [ ] **Contenu généré cohérent** entre rendus
  ```jsx
  // ✅ Bon pattern avec seed fixe
  <SafeRandomContent seed={`item-${item.id}`}>
    {(value) => <div>Random: {value}</div>}
  </SafeRandomContent>
  ```

### ✅ 3. APIs du Navigateur

- [ ] **Aucun accès direct à `window`** sans protection
  ```jsx
  // ❌ À éviter
  const width = window.innerWidth;
  
  // ✅ Utiliser
  <SafeBrowserAPI>
    {(api) => <div>Width: {api.window?.innerWidth}</div>}
  </SafeBrowserAPI>
  ```

- [ ] **Aucun accès direct à `document`** sans protection
  ```jsx
  // ❌ À éviter
  const title = document.title;
  
  // ✅ Utiliser
  <SafeDocumentAccess>
    {(doc) => <div>Title: {doc?.title}</div>}
  </SafeDocumentAccess>
  ```

- [ ] **Gestion sécurisée de `navigator`**
  ```jsx
  // ✅ Bon pattern
  <SafeBrowserAPI>
    {(api) => (
      <div>UA: {api.navigator?.userAgent || 'Unknown'}</div>
    )}
  </SafeBrowserAPI>
  ```

### ✅ 4. Storage et Persistance

- [ ] **Aucun accès direct à `localStorage`** sans protection
  ```jsx
  // ❌ À éviter
  const theme = localStorage.getItem('theme');
  
  // ✅ Utiliser
  <SafeBrowserAPI>
    {(api) => {
      const theme = api.localStorage?.getItem('theme');
      return <div className={theme}>Content</div>;
    }}
  </SafeBrowserAPI>
  ```

- [ ] **Gestion appropriée de `sessionStorage`**
- [ ] **Cookies accessibles** côté serveur si nécessaires

### ✅ 5. Rendu Conditionnel

- [ ] **Conditions indépendantes des APIs navigateur**
  ```jsx
  // ❌ À éviter
  const isMobile = window.innerWidth < 768;
  
  // ✅ Utiliser ClientOnly ou HydrationSafeWrapper
  <ClientOnly fallback={<DesktopView />}>
    <ResponsiveComponent />
  </ClientOnly>
  ```

- [ ] **Fallbacks appropriés** pour le contenu conditionnel
- [ ] **Pas de rendu conditionnel** basé sur `Math.random()`

### ✅ 6. Hooks et Effects

- [ ] **useEffect approprié** pour les initialisations client
  ```jsx
  // ✅ Bon pattern
  useEffect(() => {
    // Code client uniquement
  }, []);
  ```

- [ ] **Pas de side effects** dans le rendu initial
- [ ] **Gestion des cleanup** dans useEffect

### ✅ 7. Composants Hydration-Safe

- [ ] **Utilisation des composants Safe*** quand approprié
  - [ ] `SafeDateRenderer` pour les dates
  - [ ] `SafeRandomContent` pour le contenu aléatoire
  - [ ] `SafeBrowserAPI` pour les APIs navigateur
  - [ ] `ClientOnly` pour le contenu client uniquement
  - [ ] `HydrationSafeWrapper` pour les composants problématiques

- [ ] **Props appropriées** pour les composants Safe
  ```jsx
  // ✅ Vérifier les props requises
  <SafeDateRenderer 
    date={validDate} 
    format="full"
    fallback="Loading..."
  />
  ```

### ✅ 8. Gestion d'Erreurs

- [ ] **HydrationErrorBoundary** autour des composants à risque
- [ ] **Fallbacks définis** pour les erreurs d'hydratation
- [ ] **Messages d'erreur appropriés** pour les utilisateurs

## 🔍 Points d'Attention Spéciaux

### ⚠️ Patterns Suspects à Surveiller

- [ ] **Génération d'IDs dynamiques**
  ```jsx
  // ❌ Suspect
  const id = `item-${Math.random()}`;
  const id = `item-${Date.now()}`;
  
  // ✅ Préférer
  const id = `item-${item.id}`;
  ```

- [ ] **Styles conditionnels basés sur le navigateur**
  ```jsx
  // ❌ Suspect
  const style = { width: window.innerWidth };
  
  // ✅ Préférer
  <SafeBrowserAPI>
    {(api) => (
      <div style={{ width: api.window?.innerWidth || 'auto' }} />
    )}
  </SafeBrowserAPI>
  ```

- [ ] **Détection de features navigateur**
  ```jsx
  // ❌ Suspect
  const hasTouch = 'ontouchstart' in window;
  
  // ✅ Préférer
  <SafeBrowserAPI>
    {(api) => {
      const hasTouch = api.window && 'ontouchstart' in api.window;
      return <div>{hasTouch ? 'Touch' : 'Mouse'}</div>;
    }}
  </SafeBrowserAPI>
  ```

### 🎯 Cas Spéciaux

- [ ] **Composants tiers** : Vérifier la compatibilité SSR
- [ ] **Animations** : S'assurer qu'elles ne causent pas de mismatches
- [ ] **Lazy loading** : Vérifier la cohérence des placeholders
- [ ] **Internationalisation** : Dates et nombres formatés de manière cohérente

## 🛠️ Outils de Validation

### ✅ Validation Automatique

- [ ] **Pre-commit hook** activé et fonctionnel
  ```bash
  # Vérifier que le hook fonctionne
  git commit -m "test" # Devrait déclencher la validation
  ```

- [ ] **Build-time validation** configurée
  ```bash
  # Vérifier la validation build
  npm run validate:hydration
  ```

- [ ] **CI/CD pipeline** inclut la validation d'hydratation

### ✅ Tests

- [ ] **Tests d'hydratation** pour les nouveaux composants
- [ ] **Tests E2E** pour les flux critiques
- [ ] **Tests de régression** pour les bugs corrigés

## 📝 Commentaires de Review

### Templates de Commentaires

**Pour un problème de date :**
```
❌ Erreur d'hydratation potentielle : usage direct de `new Date()`

Problème : `new Date()` génère des valeurs différentes entre serveur et client.

Solution recommandée :
```jsx
<SafeDateRenderer date={new Date()} format="full" />
```

Référence : [Guide des Meilleures Pratiques](./HYDRATION_BEST_PRACTICES_GUIDE.md#gestion-des-dates)
```

**Pour un problème d'API navigateur :**
```
❌ Erreur d'hydratation : accès direct à `window`

Problème : `window` n'est pas disponible côté serveur.

Solution recommandée :
```jsx
<SafeBrowserAPI>
  {(api) => <div>Width: {api.window?.innerWidth}</div>}
</SafeBrowserAPI>
```

Référence : [Guide de Dépannage](./HYDRATION_TROUBLESHOOTING_GUIDE.md#apis-navigateur)
```

**Pour un contenu aléatoire :**
```
❌ Contenu aléatoire non déterministe

Problème : `Math.random()` produit des valeurs différentes à chaque rendu.

Solution recommandée :
```jsx
<SafeRandomContent seed="unique-seed" min={0} max={100}>
  {(value) => <div>{value}</div>}
</SafeRandomContent>
```
```

## 🎓 Formation et Ressources

### ✅ Vérifications d'Équipe

- [ ] **Équipe formée** aux patterns d'hydratation
- [ ] **Documentation accessible** et à jour
- [ ] **Exemples interactifs** disponibles
- [ ] **Outils de débogage** installés et configurés

### 📚 Ressources Recommandées

- [ ] [Guide des Meilleures Pratiques](./HYDRATION_BEST_PRACTICES_GUIDE.md)
- [ ] [Guide de Dépannage](./HYDRATION_TROUBLESHOOTING_GUIDE.md)
- [ ] [Exemples Interactifs](../examples/hydration/interactive-examples.tsx)
- [ ] [Configuration des Hooks](./HYDRATION_HOOKS_GUIDE.md)

## ✅ Validation Finale

### Avant d'Approuver la PR

- [ ] **Tous les éléments** de cette checklist ont été vérifiés
- [ ] **Validation automatique** passe sans erreur
- [ ] **Tests d'hydratation** ajoutés si nécessaire
- [ ] **Documentation mise à jour** si nouveaux patterns
- [ ] **Pas de régression** sur les composants existants

### Signature du Reviewer

```
✅ Code Review Hydratation - [Date]
Reviewer: [Nom]
Statut: ✅ Approuvé / ❌ Modifications requises
Commentaires: [Résumé des points principaux]
```

---

## 🚀 Automatisation

### Script de Validation Rapide

```bash
#!/bin/bash
# scripts/quick-hydration-check.sh

echo "🔍 Vérification rapide d'hydratation..."

# Patterns suspects
echo "Recherche de patterns suspects..."
grep -r "new Date()" --include="*.tsx" --include="*.jsx" src/ && echo "❌ new Date() détecté"
grep -r "Math.random()" --include="*.tsx" --include="*.jsx" src/ && echo "❌ Math.random() détecté"
grep -r "window\." --include="*.tsx" --include="*.jsx" src/ && echo "❌ window. détecté"
grep -r "localStorage" --include="*.tsx" --include="*.jsx" src/ && echo "❌ localStorage détecté"

echo "✅ Vérification terminée"
```

### Intégration IDE

**VSCode Settings :**
```json
{
  "eslint.rules.customizations": [
    {
      "rule": "no-direct-date",
      "severity": "error"
    },
    {
      "rule": "no-direct-window",
      "severity": "error"
    }
  ]
}
```

---

**💡 Conseil :** Utilisez cette checklist de manière systématique pour développer des réflexes et améliorer la qualité du code de votre équipe.