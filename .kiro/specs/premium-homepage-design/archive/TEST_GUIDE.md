# Guide de Test - Fix de Centrage

## Comment Tester le Fix

### Option 1 : Test en Local

```bash
# Démarrer le serveur de développement
npm run dev

# Ouvrir dans le navigateur
# http://localhost:3000
```

### Option 2 : Test du Build de Production

```bash
# Build
npm run build

# Démarrer le serveur de production
npm start

# Ouvrir dans le navigateur
# http://localhost:3000
```

## Checklist de Test Visuel

### ✅ Mobile (375px - 414px)

1. Ouvrir DevTools (F12)
2. Activer le mode responsive (Ctrl+Shift+M)
3. Sélectionner "iPhone SE" ou "iPhone 12 Pro"
4. Vérifier :
   - [ ] Pas de scroll horizontal
   - [ ] Contenu centré
   - [ ] Texte lisible sans zoom
   - [ ] Boutons accessibles

### ✅ Tablet (768px - 1024px)

1. Sélectionner "iPad" ou "iPad Pro"
2. Vérifier :
   - [ ] Pas de scroll horizontal
   - [ ] Contenu centré
   - [ ] Grids en 2 colonnes
   - [ ] Espacement approprié

### ✅ Desktop (1280px+)

1. Sélectionner "Responsive" et mettre 1280px
2. Puis tester à 1920px
3. Vérifier :
   - [ ] Pas de scroll horizontal
   - [ ] Contenu centré avec marges égales
   - [ ] Grids en 3 colonnes
   - [ ] Background glows visibles mais contenus
   - [ ] Dashboard preview 3D visible

## Test avec DevTools

### Trouver les Éléments qui Dépassent

```javascript
// Coller dans la console DevTools
document.querySelectorAll('*').forEach(el => {
  if (el.scrollWidth > document.documentElement.clientWidth) {
    console.log('Element dépasse:', el);
  }
});
```

Si aucun élément n'est loggé, c'est bon ! ✅

### Vérifier la Largeur du Body

```javascript
// Coller dans la console DevTools
console.log('Body width:', document.body.scrollWidth);
console.log('Viewport width:', window.innerWidth);
// Les deux devraient être égaux
```

## Test Cross-Browser

### Chrome/Edge
- [ ] Ouvrir en mode normal
- [ ] Ouvrir en mode incognito
- [ ] Vérifier tous les viewports

### Firefox
- [ ] Ouvrir en mode normal
- [ ] Vérifier tous les viewports

### Safari (si disponible)
- [ ] Ouvrir sur Mac
- [ ] Vérifier tous les viewports

## Test sur Devices Réels

### iPhone
1. Ouvrir Safari
2. Aller sur le site
3. Vérifier qu'il n'y a pas de scroll horizontal
4. Pincer pour zoomer/dézoomer
5. Vérifier que le contenu reste centré

### Android
1. Ouvrir Chrome
2. Aller sur le site
3. Vérifier qu'il n'y a pas de scroll horizontal
4. Pincer pour zoomer/dézoomer
5. Vérifier que le contenu reste centré

## Problèmes Potentiels

### Si le problème persiste

1. **Vider le cache du navigateur**
   - Chrome : Ctrl+Shift+Delete
   - Sélectionner "Images et fichiers en cache"
   - Cliquer sur "Effacer les données"

2. **Forcer le rebuild**
   ```bash
   rm -rf .next
   npm run build
   ```

3. **Vérifier que le CSS est bien chargé**
   - Ouvrir DevTools → Network
   - Filtrer par "CSS"
   - Vérifier que globals.css est chargé
   - Cliquer dessus et vérifier que overflow-x: hidden est présent

## Validation Finale

Une fois tous les tests passés :

- [ ] Pas de scroll horizontal sur aucun device
- [ ] Contenu parfaitement centré
- [ ] Pas d'espace vide à droite
- [ ] Tous les effets visuels fonctionnent
- [ ] Performance maintenue (pas de lag)

## Rapport de Bug (si nécessaire)

Si le problème persiste, noter :
1. Device/Browser utilisé
2. Viewport size
3. Screenshot du problème
4. Console errors (s'il y en a)
5. Résultat du script DevTools ci-dessus

---

**Prochaine étape** : Une fois validé, marquer les tâches 17-20 comme complètes dans `tasks.md`
