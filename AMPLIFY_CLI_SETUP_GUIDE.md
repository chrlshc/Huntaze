# 🚀 Guide Complet - Configuration AWS Amplify CLI

## ✅ Progrès Accompli

Grâce au script CLI, nous avons réussi à :
- ✅ **Créer la branche `staging`** dans Amplify
- ✅ **Créer la branche `prod`** dans Amplify
- ✅ **Configurer les build specs** pour NextJS 15

## 🔧 Étapes Finales (Console AWS)

### 1. Connecter le Repository GitHub

**Problème identifié :** L'app Amplify a une branche "manually deployed" qui empêche la connexion GitHub.

**Solution :**
1. Allez sur https://console.aws.amazon.com/amplify/
2. Sélectionnez l'app **"huntaze"** (d2gmcfr71gawhz)
3. **Supprimez la branche `main` existante** :
   - Hosting → Manage branches
   - Cliquez sur `main` → Delete branch
4. **Connectez GitHub** :
   - App settings → General → Edit
   - Repository provider → Connect GitHub
   - Sélectionnez `chrlshc/Huntaze`
5. **Recréez les branches** :
   - Add branch → `main` (Production)
   - Add branch → `staging` (Development) 
   - Add branch → `prod` (Production)

### 2. Configuration des Branches

Pour chaque branche (`main`, `staging`, `prod`) :

1. **Activez Auto-build** ✅
2. **Configurez les variables d'environnement** :
   ```
   OPENAI_API_KEY=your_key
   DATABASE_URL=your_db_url
   JWT_SECRET=your_secret
   NEXT_PUBLIC_APP_URL=https://[branch].[app-id].amplifyapp.com
   ```
3. **Vérifiez le Build Spec** (déjà configuré par le script)

## 🎯 Scripts CLI Disponibles

### Diagnostic Complet
```bash
AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/check-amplify-status.js
```

### Configuration Automatique
```bash
AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/fix-amplify-cli.js
```

### Déploiement Manuel
```bash
# Staging
AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/deploy-amplify-cli.js staging

# Production
AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=xxx AWS_SESSION_TOKEN=xxx node scripts/deploy-amplify-cli.js prod
```

## 🔗 URLs des Environnements

Une fois configuré, vos environnements seront disponibles à :

- **Main (Production)** : https://main.d2gmcfr71gawhz.amplifyapp.com
- **Staging** : https://staging.d2gmcfr71gawhz.amplifyapp.com  
- **Prod** : https://prod.d2gmcfr71gawhz.amplifyapp.com

## 🎉 Test Final

Une fois la configuration terminée :

1. **Faites un commit** sur une branche
2. **Poussez vers GitHub** 
3. **Vérifiez** que le build se déclenche automatiquement dans Amplify
4. **Surveillez** les logs de build dans la console

## 🚨 Résolution des Problèmes

### Build qui Échoue
- Vérifiez les variables d'environnement
- Consultez les logs détaillés dans Amplify Console
- Assurez-vous que `amplify.yml` est correct

### Pas de Déclenchement Auto
- Vérifiez les webhooks GitHub (Settings → Webhooks)
- Confirmez que Auto-build est activé
- Testez avec un déploiement manuel

### Erreurs de Permissions
- Vérifiez que le service role Amplify a les bonnes permissions
- Confirmez l'accès au repository GitHub

---

💡 **Astuce :** Gardez vos credentials AWS temporaires à portée de main pour diagnostiquer rapidement les problèmes avec les scripts CLI !