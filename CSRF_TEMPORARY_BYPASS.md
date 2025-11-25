# Contournement Temporaire CSRF

## ⚠️ ATTENTION - TEMPORAIRE UNIQUEMENT

Ce contournement désactive temporairement la validation CSRF pour débloquer le signup pendant le diagnostic.

**🚨 NE PAS UTILISER EN PRODUCTION SANS SUPERVISION**

## Activation du Contournement

### En Local

Ajouter dans `.env.local`:
```bash
CSRF_BYPASS=true
```

Puis redémarrer le serveur:
```bash
npm run dev
```

### En Staging/Production (AWS Amplify)

1. Aller dans la console AWS Amplify
2. Sélectionner l'app Huntaze
3. Aller dans "Environment variables"
4. Ajouter:
   - **Name**: `CSRF_BYPASS`
   - **Value**: `true`
5. Redéployer l'application

## Vérification

Le signup devrait maintenant fonctionner. Dans les logs, vous verrez:
```
[WARN] CSRF validation bypassed via environment variable
```

## Diagnostic Pendant le Contournement

Pendant que le contournement est actif, nous pouvons diagnostiquer:

### 1. Vérifier les logs détaillés

Les logs dans `extractToken()` montreront exactement ce qui est reçu:
- Headers présents
- Cookies présents
- Valeurs des tokens

### 2. Tester le flow complet

```bash
# Avec le serveur qui tourne
./scripts/test-csrf-flow.sh
```

### 3. Vérifier dans le navigateur

1. Ouvrir DevTools (F12)
2. Aller sur `/signup`
3. Network tab → Voir la requête à `/api/csrf/token`
4. Soumettre le formulaire
5. Network tab → Voir la requête POST avec headers

## Désactivation du Contournement

Une fois le problème identifié et corrigé:

### En Local
```bash
# Supprimer ou commenter dans .env.local
# CSRF_BYPASS=true
```

### En Staging/Production
1. Retourner dans AWS Amplify
2. Supprimer la variable `CSRF_BYPASS`
3. Redéployer

## Problèmes Possibles Identifiés

### Problème 1: Cookie Domain
**Symptôme**: Cookie pas envoyé en production
**Solution**: Configurer le domaine du cookie

### Problème 2: SameSite Policy
**Symptôme**: Cookie bloqué par le navigateur
**Solution**: Ajuster la politique SameSite

### Problème 3: HTTPS Requis
**Symptôme**: Cookie pas envoyé sur HTTPS
**Solution**: Configurer `secure: true` en production

### Problème 4: Timing Race Condition
**Symptôme**: Token pas encore chargé quand le formulaire est soumis
**Solution**: Améliorer la gestion du loading state

## Sécurité

**⚠️ IMPORTANT**: Ce contournement désactive une protection de sécurité importante.

**Risques**:
- Vulnérabilité aux attaques CSRF
- Pas de protection contre les requêtes cross-origin malveillantes

**Mitigation**:
- Utiliser uniquement en environnement de test
- Surveiller les logs pour détecter des tentatives d'exploitation
- Réactiver dès que possible

## Prochaines Étapes

1. ✅ Activer le contournement
2. ⏳ Tester que le signup fonctionne
3. ⏳ Analyser les logs détaillés
4. ⏳ Identifier la cause racine
5. ⏳ Implémenter le fix définitif
6. ⏳ Désactiver le contournement
7. ⏳ Tester que la protection CSRF fonctionne

## Contact

Si vous avez des questions sur ce contournement ou si vous identifiez la cause du problème, documenter dans:
- Les logs serveur
- Les captures d'écran DevTools
- Les variables d'environnement utilisées

---

**Status**: 🟡 CONTOURNEMENT ACTIF  
**Sécurité**: ⚠️ RÉDUITE  
**Action requise**: Diagnostic et fix permanent
