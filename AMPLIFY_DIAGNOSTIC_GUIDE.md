# 🚀 Guide de Diagnostic AWS Amplify

## 📋 Scripts Disponibles

### 1. Vérification du Statut (`check-amplify-status.js`)
Diagnostic complet de votre configuration Amplify.

```bash
# Avec vos credentials temporaires
AWS_ACCESS_KEY_ID=AKIA... AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/check-amplify-status.js
```

**Ce script vérifie :**
- ✅ Applications Amplify disponibles
- 🌿 Branches configurées (staging, prod, main)
- 🔄 Statut auto-build pour chaque branche
- 📊 Historique des derniers builds
- ⚠️ Recommandations de configuration

### 2. Déclenchement Manuel (`trigger-amplify-build.js`)
Force un nouveau build sur une branche spécifique.

```bash
# Pour staging (par défaut)
AWS_ACCESS_KEY_ID=AKIA... AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/trigger-amplify-build.js

# Pour prod
AWS_ACCESS_KEY_ID=AKIA... AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/trigger-amplify-build.js prod

# Pour main
AWS_ACCESS_KEY_ID=AKIA... AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/trigger-amplify-build.js main
```

## 🔧 Résolution des Problèmes Courants

### ❌ Aucun Build ne se Déclenche

**Causes possibles :**
1. **Auto-build désactivé** → Le script vous le dira
2. **Webhooks GitHub cassés** → Vérifiez dans GitHub Settings > Webhooks
3. **Branche non connectée** → Configurez la branche dans Amplify Console

**Solutions :**
```bash
# 1. Vérifiez le statut
node scripts/check-amplify-status.js

# 2. Forcez un build manuel
node scripts/trigger-amplify-build.js staging
```

### ⚠️ Builds qui Échouent

**Vérifications :**
1. **Variables d'environnement** → Amplify Console > App Settings > Environment Variables
2. **Version Node.js** → Vérifiez `amplify.yml` (Node 20)
3. **Dépendances** → Logs de build dans Amplify Console

### 🔑 Problèmes d'Authentification

**Messages d'erreur typiques :**
- `UnauthorizedOperation` → Credentials invalides
- `AccessDenied` → Permissions insuffisantes

**Solution :**
Vérifiez que vos credentials AWS ont les permissions :
- `amplify:ListApps`
- `amplify:GetApp`
- `amplify:ListBranches`
- `amplify:ListJobs`
- `amplify:StartJob`

## 📊 Interprétation des Résultats

### Statuts de Build
- ✅ `SUCCEED` → Build réussi
- ❌ `FAILED` → Build échoué (voir logs)
- 🔄 `RUNNING` → Build en cours
- ⏳ `PENDING` → Build en attente

### Configuration Optimale
```
✅ Auto-build activé pour staging
✅ Auto-build activé pour prod  
✅ Webhooks GitHub configurés
✅ Variables d'environnement définies
```

## 🎯 Actions Recommandées

1. **Exécutez le diagnostic :**
   ```bash
   node scripts/check-amplify-status.js
   ```

2. **Si aucun build récent :**
   ```bash
   node scripts/trigger-amplify-build.js staging
   node scripts/trigger-amplify-build.js prod
   ```

3. **Surveillez les builds :**
   - Console AWS Amplify
   - URLs fournies par les scripts

## 🔗 Liens Utiles

- **Console Amplify :** https://console.aws.amazon.com/amplify/
- **GitHub Webhooks :** https://github.com/chrlshc/Huntaze/settings/hooks
- **Logs de Build :** Disponibles dans la console Amplify

---

💡 **Astuce :** Gardez ces credentials temporaires à portée de main pour diagnostiquer rapidement les problèmes de déploiement !