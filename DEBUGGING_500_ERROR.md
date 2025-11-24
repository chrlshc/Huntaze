# Debugging 500 Error - Approche Progressive

## Situation

L'erreur 500 persiste malgré le fix du conflit de nommage. Nous adoptons une approche de simplification progressive pour isoler le problème.

## Étapes de Debug

### ✅ Étape 1 : Fix du conflit de nommage
- **Problème identifié :** Conflit entre `export const dynamic` et `import dynamic`
- **Fix appliqué :** Changé vers `dynamicParams` et `revalidate`
- **Résultat :** Erreur persiste

### ✅ Étape 2 : Page de test simple
- **Créé :** `app/(marketing)/test-simple/page.tsx`
- **Contenu :** Page HTML basique sans dépendances
- **But :** Vérifier si le serveur peut rendre une page simple
- **Commit :** c930062ee

### ✅ Étape 3 : Simplification de la page d'accueil
- **Action :** Supprimé tous les composants complexes
- **Gardé :** Structure HTML basique avec liens
- **Supprimé :**
  - Tous les dynamic imports
  - LandingHeader, HeroSection, FeaturesGrid, etc.
  - Tous les composants client-side
- **Commit :** 4dae1f333

## Version Simplifiée Actuelle

```typescript
export const dynamic = 'force-dynamic';

export default function HomePage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Huntaze</h1>
      <p>The all-in-one platform for content creators</p>
      <Link href="/auth/register">Get Started</Link>
      <Link href="/auth/login">Login</Link>
      <p>Timestamp: {new Date().toISOString()}</p>
    </div>
  );
}
```

## Tests à Effectuer

Une fois le build terminé (~5-10 min):

```bash
# 1. Test de la page simplifiée
curl -I https://staging.huntaze.com/
# Attendu : HTTP/2 200

# 2. Test de la page de test
curl -I https://staging.huntaze.com/test-simple
# Attendu : HTTP/2 200

# 3. Si ça fonctionne, réintroduire progressivement les composants
```

## Hypothèses sur la Cause

### Hypothèse 1 : Composants Client-Side
- Les composants avec `'use client'` causent des erreurs au runtime
- **Test :** Page simplifiée sans composants client

### Hypothèse 2 : Dynamic Imports
- Les imports dynamiques échouent à se résoudre
- **Test :** Page sans dynamic imports

### Hypothèse 3 : Images Next.js
- Les composants Image causent des erreurs
- **Test :** Page sans composants Image

### Hypothèse 4 : Layout Marketing
- Le layout marketing avec JSON-LD cause des erreurs
- **Test :** À vérifier si la page simplifiée fonctionne

### Hypothèse 5 : Variables d'Environnement Manquantes
- Des variables critiques manquent au runtime
- **Test :** Vérifier les logs CloudWatch

## Prochaines Étapes

### Si la page simplifiée fonctionne ✅
1. Réintroduire le LandingHeader
2. Réintroduire le HeroSection
3. Réintroduire les FeaturesGrid
4. Identifier quel composant cause l'erreur

### Si la page simplifiée échoue ❌
1. Vérifier le layout marketing
2. Vérifier les variables d'environnement
3. Consulter les logs CloudWatch
4. Vérifier la configuration Amplify

## Backups Créés

- `app/(marketing)/page-backup-full.tsx` - Version complète originale
- `app/(marketing)/page-backup.tsx` - Marqueur de backup

## Commandes de Monitoring

```bash
# Suivre le déploiement
./scripts/monitor-deployment.sh

# Vérifier les logs
aws logs tail /aws/amplify/d33l77zi1h78ce --follow --region us-east-1

# Tester manuellement
watch -n 5 'curl -I https://staging.huntaze.com/ 2>&1 | grep HTTP'
```

## Timeline

- **14:18** - Erreur 500 identifiée
- **14:30** - Fix du conflit de nommage (échec)
- **14:45** - Page de test créée
- **14:50** - Page d'accueil simplifiée
- **14:55** - En attente du build...

---

**Status :** En cours de debug  
**Approche :** Simplification progressive  
**Prochain test :** Dans ~5 minutes
