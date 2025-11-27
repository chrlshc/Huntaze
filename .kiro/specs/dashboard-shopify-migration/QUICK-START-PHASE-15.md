# Quick Start - Phase 15 🚀

## Démarrage Rapide en 5 Minutes

Ce guide vous permet de commencer à utiliser les fonctionnalités de la Phase 15 immédiatement.

---

## 🎯 Ce Que Vous Pouvez Faire Maintenant

### 1. Utiliser les Nouveaux Composants

#### AsyncOperationWrapper - Pour Toute Opération Async

```tsx
import { AsyncOperationWrapper } from '@/components/dashboard/AsyncOperationWrapper';

// Exemple simple
<AsyncOperationWrapper
  operation={async () => {
    const res = await fetch('/api/data');
    return res.json();
  }}
  loadingMessage="Chargement..."
  errorMessage="Erreur de chargement"
>
  {(data) => <div>{data.message}</div>}
</AsyncOperationWrapper>
```

#### AsyncButton - Boutons avec Loading

```tsx
import { AsyncButton } from '@/components/dashboard/AsyncButton';

// Bouton primaire
<AsyncButton
  onClick={async () => {
    await saveData();
  }}
  variant="primary"
  loadingText="Sauvegarde..."
>
  Sauvegarder
</AsyncButton>

// Bouton danger
<AsyncButton
  onClick={async () => {
    await deleteItem();
  }}
  variant="danger"
  loadingText="Suppression..."
>
  Supprimer
</AsyncButton>
```

#### Error Boundary - Protection des Pages

```tsx
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';

export default function MaPage() {
  return (
    <ContentPageErrorBoundary pageName="Ma Page">
      <MonContenu />
    </ContentPageErrorBoundary>
  );
}
```

### 2. Activer le Performance Monitoring

Le monitoring est automatiquement actif en mode développement. Vous verrez un bouton flottant en bas à droite.

**Pour tracker manuellement:**

```tsx
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

function MonComposant() {
  const { trackApiCall, trackInteraction } = usePerformanceMonitoring();

  // Tracker un appel API
  const chargerDonnees = async () => {
    await trackApiCall('/api/data', async () => {
      return fetch('/api/data');
    });
  };

  // Tracker une interaction
  const handleClick = () => {
    trackInteraction('bouton_click', { 
      page: 'analytics',
      action: 'export' 
    });
  };

  return <button onClick={handleClick}>Exporter</button>;
}
```

---

## 📄 Pages Migrées Disponibles

### Analytics Page
- **URL**: `/analytics`
- **Fonctionnalités**: Métriques, graphiques, optimisation revenue
- **Design**: ✅ Shopify design system
- **Loading**: ✅ Skeleton loaders
- **Errors**: ✅ Error boundary

### Content Page
- **URL**: `/content`
- **Fonctionnalités**: Liste de contenu, recherche, CRUD
- **Design**: ✅ Shopify design system
- **Loading**: ✅ Skeleton loaders + virtual scrolling
- **Errors**: ✅ Error boundary

### Messages Page
- **URL**: `/messages`
- **Fonctionnalités**: Threads, conversations, pagination
- **Design**: ✅ Shopify design system
- **Loading**: ✅ Skeleton loaders + pagination
- **Errors**: ✅ Error boundary + retry

### Integrations Page
- **URL**: `/integrations`
- **Fonctionnalités**: Connexion plateformes, OAuth
- **Design**: ✅ Shopify design system
- **Loading**: ✅ Skeleton loaders
- **Errors**: ✅ Error boundary

---

## 🎨 Design Tokens Disponibles

Utilisez ces variables CSS dans vos composants:

```css
/* Couleurs */
--bg-app: #F8F9FB;           /* Canvas gris pâle */
--bg-surface: #FFFFFF;        /* Fond blanc */
--color-indigo: #6366f1;      /* Electric Indigo */
--color-text-main: #1F2937;   /* Texte principal */
--color-text-sub: #6B7280;    /* Texte secondaire */

/* Layout */
--huntaze-sidebar-width: 256px;
--huntaze-header-height: 64px;

/* Ombres */
--shadow-soft: 0 4px 20px rgba(0, 0, 0, 0.05);

/* Border Radius */
--radius-card: 16px;

/* Z-index */
--huntaze-z-index-header: 500;
--huntaze-z-index-nav: 400;
```

**Exemple d'utilisation:**

```tsx
<div className="bg-[var(--bg-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] p-6">
  <h2 className="text-[var(--color-text-main)]">Titre</h2>
  <p className="text-[var(--color-text-sub)]">Description</p>
  <button className="bg-[var(--color-indigo)] text-white">
    Action
  </button>
</div>
```

---

## 🔧 Patterns Communs

### Pattern 1: Page avec Chargement et Erreurs

```tsx
import { ContentPageErrorBoundary } from '@/components/dashboard/ContentPageErrorBoundary';
import { AsyncOperationWrapper } from '@/components/dashboard/AsyncOperationWrapper';

export default function MaPage() {
  return (
    <ContentPageErrorBoundary pageName="Ma Page">
      <AsyncOperationWrapper
        operation={async () => {
          const res = await fetch('/api/data');
          return res.json();
        }}
        loadingMessage="Chargement des données..."
        errorMessage="Impossible de charger les données"
      >
        {(data) => (
          <div className="p-8">
            <h1 className="text-2xl font-semibold text-[var(--color-text-main)]">
              {data.title}
            </h1>
            <div className="grid grid-cols-3 gap-6 mt-6">
              {data.items.map(item => (
                <Card key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}
      </AsyncOperationWrapper>
    </ContentPageErrorBoundary>
  );
}
```

### Pattern 2: Formulaire avec Bouton Async

```tsx
import { AsyncButton } from '@/components/dashboard/AsyncButton';
import { useState } from 'react';

function MonFormulaire() {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async () => {
    await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify({ nom, email })
    });
  };

  return (
    <form className="space-y-4">
      <input
        type="text"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Nom"
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Email"
      />
      <AsyncButton
        onClick={handleSubmit}
        variant="primary"
        loadingText="Envoi en cours..."
      >
        Envoyer
      </AsyncButton>
    </form>
  );
}
```

### Pattern 3: Liste avec Skeleton Loaders

```tsx
import { AsyncOperationWrapper } from '@/components/dashboard/AsyncOperationWrapper';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

function MaListe() {
  return (
    <AsyncOperationWrapper
      operation={async () => {
        const res = await fetch('/api/items');
        return res.json();
      }}
      loadingMessage="Chargement..."
      errorMessage="Erreur de chargement"
      renderLoading={() => (
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
    >
      {(items) => (
        <div className="grid grid-cols-3 gap-6">
          {items.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </AsyncOperationWrapper>
  );
}
```

---

## 🐛 Debugging

### Voir les Métriques de Performance

1. Lancez l'app en mode dev: `npm run dev`
2. Ouvrez n'importe quelle page du dashboard
3. Cliquez sur le bouton flottant en bas à droite
4. Consultez les métriques en temps réel

### Voir les Erreurs

Les erreurs sont automatiquement loggées dans la console avec contexte:

```
[Error Boundary] Error in Analytics Page
Error: Failed to fetch
Context: { userId: '123', page: 'analytics' }
Stack: ...
```

### Tester les États de Chargement

Pour tester les états de chargement, ajoutez un délai artificiel:

```tsx
const operation = async () => {
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
  const res = await fetch('/api/data');
  return res.json();
};
```

### Tester les Erreurs

Pour tester les error boundaries, lancez une erreur:

```tsx
function TestError() {
  throw new Error('Test error');
  return <div>Never rendered</div>;
}
```

---

## 📊 Vérifier que Tout Fonctionne

### Checklist Rapide (2 minutes)

1. **Ouvrir Analytics Page**
   - [ ] Page charge en < 3 secondes
   - [ ] Design Shopify visible (blanc sur gris pâle)
   - [ ] Aucune erreur dans la console

2. **Ouvrir Content Page**
   - [ ] Liste de contenu s'affiche
   - [ ] Recherche fonctionne
   - [ ] Boutons ont des états de loading

3. **Ouvrir Messages Page**
   - [ ] Threads s'affichent
   - [ ] Pagination fonctionne
   - [ ] Aucune erreur de chargement

4. **Ouvrir Integrations Page**
   - [ ] Cartes d'intégration visibles
   - [ ] Icônes chargent correctement
   - [ ] Boutons "Add app" fonctionnent

5. **Tester Performance Monitor**
   - [ ] Bouton flottant visible (dev mode)
   - [ ] Dashboard s'ouvre
   - [ ] Métriques s'affichent

### Si Quelque Chose Ne Fonctionne Pas

1. **Vérifier la console** pour les erreurs
2. **Vérifier le network tab** pour les requêtes échouées
3. **Consulter** `.kiro/specs/dashboard-shopify-migration/task-47-testing-guide.md`
4. **Vérifier** que tous les fichiers ont été créés correctement

---

## 📚 Documentation Complète

Pour plus de détails, consultez:

- **Vue d'ensemble**: `.kiro/specs/dashboard-shopify-migration/PHASE-15-READY-TO-USE.md`
- **Guide de test**: `.kiro/specs/dashboard-shopify-migration/task-47-testing-guide.md`
- **Résumé final**: `.kiro/specs/dashboard-shopify-migration/phase-15-final-summary.md`
- **Design doc**: `.kiro/specs/dashboard-shopify-migration/design.md`
- **Requirements**: `.kiro/specs/dashboard-shopify-migration/requirements.md`

---

## 🎉 Vous Êtes Prêt!

La Phase 15 est maintenant prête à être utilisée. Commencez par:

1. ✅ Utiliser les nouveaux composants dans vos pages
2. ✅ Consulter les pages migrées pour des exemples
3. ✅ Activer le performance monitoring
4. ✅ Tester sur votre environnement local

**Bon développement!** 🚀

---

**Dernière mise à jour**: 26 Novembre 2024  
**Version**: Phase 15 - Production Ready  
**Statut**: ✅ Prêt à utiliser
