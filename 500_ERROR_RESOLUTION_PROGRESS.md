# Résolution de l'Erreur 500 - Progression

## 🔴 Problème Initial
**URL :** https://staging.huntaze.com/  
**Erreur :** HTTP 500 Internal Server Error  
**Date :** 2025-11-24

## 🔍 Investigations Effectuées

### Test 1 : API Endpoints ✅
```bash
curl https://staging.huntaze.com/api/health
# Résultat : 200 OK

curl https://staging.huntaze.com/api/auth/providers  
# Résultat : 200 OK
```
**Conclusion :** Le serveur fonctionne, le problème est spécifique aux pages React

### Test 2 : Conflit de Nommage ❌
**Hypothèse :** Conflit entre `export const dynamic` et `import dynamic`  
**Action :** Changé vers `dynamicParams` et `revalidate`  
**Commit :** 1c5e2cb23  
**Résultat :** Erreur persiste

### Test 3 : Page Simplifiée ⏳
**Action :** Créé une page ultra-simple sans composants  
**Commit :** 4dae1f333  
**Contenu :** HTML basique avec liens  
**Résultat :** En attente...

### Test 4 : Layout Simplifié ⏳
**Action :** Supprimé JSON-LD du layout marketing  
**Commit :** 9bbb0d2eb  
**Raison :** Le layout pourrait causer l'erreur au runtime  
**Résultat :** En attente...

## 📝 Changements Appliqués

### Commit 1c5e2cb23 - Fix conflit de nommage
```typescript
// Avant
export const dynamic = 'force-static';
import dynamic from 'next/dynamic';

// Après  
import dynamic from 'next/dynamic';
export const dynamicParams = true;
export const revalidate = 0;
```

### Commit 4dae1f333 - Simplification page d'accueil
- ❌ Supprimé : Tous les composants complexes
- ❌ Supprimé : Dynamic imports
- ❌ Supprimé : LandingHeader, HeroSection, etc.
- ✅ Gardé : Structure HTML basique

### Commit 9bbb0d2eb - Simplification layout
- ❌ Supprimé : JsonLd components
- ❌ Supprimé : generateOrganizationSchema()
- ❌ Supprimé : generateWebSiteSchema()
- ✅ Gardé : Wrapper basique

## 🎯 Hypothèses Restantes

### Hypothèse A : Erreur au Runtime dans le Layout
- **Probabilité :** Haute
- **Test :** Layout simplifié (en cours)
- **Si confirmé :** Le problème vient de JSON-LD ou des fonctions SEO

### Hypothèse B : Variables d'Environnement Manquantes
- **Probabilité :** Moyenne
- **Observation :** Redis "not-configured" dans /api/health
- **Action requise :** Vérifier toutes les variables critiques

### Hypothèse C : Erreur de Build Amplify
- **Probabilité :** Moyenne
- **Test :** Vérifier les logs de build
- **Action requise :** Consulter CloudWatch

### Hypothèse D : Problème de Middleware
- **Probabilité :** Faible
- **Observation :** Middleware est minimal (NextResponse.next())
- **Status :** Peu probable

## 📊 Prochaines Étapes

### Si le layout simplifié fonctionne ✅
1. Le problème vient du JSON-LD ou des fonctions SEO
2. Réintroduire progressivement :
   - generateOrganizationSchema()
   - generateWebSiteSchema()
   - JsonLd component
3. Identifier la fonction qui cause l'erreur

### Si le layout simplifié échoue ❌
1. Le problème est plus profond (root layout ou configuration)
2. Vérifier `app/layout.tsx`
3. Vérifier les variables d'environnement critiques
4. Consulter les logs CloudWatch pour l'erreur exacte

## 🔧 Actions Immédiates

```bash
# 1. Attendre le build (5-10 min)
sleep 300

# 2. Tester la page
curl -I https://staging.huntaze.com/

# 3. Si toujours 500, vérifier les logs
aws logs tail /aws/amplify/d33l77zi1h78ce --follow --region us-east-1

# 4. Tester la page de test
curl -I https://staging.huntaze.com/test-simple
```

## 📚 Fichiers de Backup

- `app/(marketing)/page-backup-full.tsx` - Version complète originale
- Tous les composants originaux sont intacts dans `components/landing/`

## ⏱️ Timeline

| Heure | Action | Résultat |
|-------|--------|----------|
| 14:18 | Erreur identifiée | 500 Error |
| 14:30 | Fix conflit nommage | Échec |
| 14:45 | Page de test | En attente |
| 14:50 | Page simplifiée | En attente |
| 14:55 | Layout simplifié | En attente |
| 15:00 | Test après build | À venir |

## 🎯 Objectif

Identifier la cause exacte de l'erreur 500 en simplifiant progressivement jusqu'à trouver le composant ou la fonction qui cause le problème.

---

**Status Actuel :** En attente du build (commit 9bbb0d2eb)  
**ETA :** ~5 minutes  
**Prochain test :** 15:00
