# 🧹 Optimisation de l'espace disque - Huntaze

## 📊 Résultats

**Avant:** 2.9GB  
**Après:** 2.0GB  
**Économisé:** 900MB (31%)

## ✅ Actions effectuées

### Nettoyage immédiat
- ✅ Supprimé tous les `.DS_Store` (fichiers macOS)
- ✅ Supprimé `.next/` (815MB de cache de build)
- ✅ Supprimé tous les `.tsbuildinfo` (cache TypeScript)
- ✅ Nettoyé les vieux logs de build
- ✅ Nettoyé `test-results/` (1.3MB)
- ✅ Optimisé Git (1GB → 878MB)
- ✅ Nettoyé le cache npm

### Scripts créés

#### 1. `npm run cleanup`
Script automatique de nettoyage complet:
```bash
npm run cleanup
```

#### 2. `npm run analyze:disk`
Analyse détaillée de l'espace disque:
```bash
npm run analyze:disk
```

### Prévention automatique

#### `.gitignore` optimisé
- Ignore maintenant les logs de build
- Ignore les résultats de tests
- Ignore les fichiers lambda.zip

#### Hook pre-commit
- Détecte les fichiers > 5MB avant commit
- Nettoie automatiquement les `.DS_Store`
- Demande confirmation pour les gros fichiers

## 📦 Breakdown actuel

```
Total: 2.0GB
├── node_modules: 1.1GB (55%)
├── .git: 878MB (43%)
├── lambda: 7.2MB
├── lib: 4.8MB
├── app: 3.8MB
└── autres: ~10MB
```

## 💡 Recommandations

### Optimisation continue

1. **Nettoyer régulièrement:**
   ```bash
   npm run cleanup
   ```

2. **Analyser avant de commiter:**
   ```bash
   npm run analyze:disk
   ```

3. **Supprimer lambda/send-worker.zip si non utilisé en dev:**
   ```bash
   rm lambda/send-worker.zip  # Économise 7.1MB
   ```

### Optimisation avancée (optionnel)

Si tu veux aller plus loin:

1. **Audit des dépendances:**
   - Certaines dépendances semblent lourdes (@react-three/drei, @react-three/fiber)
   - Vérifier si elles sont vraiment utilisées

2. **Git shallow clone:**
   - Pour les nouveaux clones: `git clone --depth 1`
   - Réduit l'historique Git

3. **Compression des assets:**
   - Optimiser les images dans `public/` et `SVG/`

## 🚀 Utilisation

### Nettoyage quotidien
```bash
npm run cleanup
```

### Analyse avant commit
```bash
npm run analyze:disk
git add .
git commit -m "..."  # Le hook vérifie automatiquement
```

### Nettoyage complet (si ça bug encore)
```bash
npm run cleanup
rm -rf node_modules
npm install
```

## 📝 Notes

- Le hook pre-commit empêche maintenant l'ajout accidentel de gros fichiers
- Les builds `.next` sont automatiquement ignorés par Git
- Les logs de plus de 7 jours sont nettoyés automatiquement
- Le projet devrait maintenant tourner sans bugs d'espace disque
