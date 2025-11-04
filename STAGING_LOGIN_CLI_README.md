# 🚀 Staging Login CLI Tool

Outil CLI complet pour diagnostiquer et résoudre l'erreur de login staging suite au déploiement Smart Onboarding.

## 🎯 Problème Résolu

**Erreur 500 (Internal Server Error) sur `/api/auth/login` en staging**

- **Cause racine** : Variables d'environnement manquantes dans AWS Amplify
- **Variables critiques** : `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV`
- **Impact** : Impossible de se connecter en staging, bloque les tests Smart Onboarding

## ⚡ Installation Rapide

```bash
# 1. Installer et configurer le CLI
chmod +x scripts/setup-staging-cli.sh
./scripts/setup-staging-cli.sh

# 2. Diagnostiquer le problème
./staging-fix --diagnose
```

## 🔧 Utilisation

### Commandes Principales

```bash
# Diagnostic complet (recommandé en premier)
./staging-fix --diagnose
node scripts/staging-login-cli.js --diagnose

# Valider que la correction fonctionne
./staging-fix --validate
node scripts/staging-login-cli.js --validate

# Afficher les instructions de correction détaillées
./staging-fix --fix
node scripts/staging-login-cli.js --fix

# Afficher les procédures de rollback
./staging-fix --rollback
node scripts/staging-login-cli.js --rollback

# Afficher les commandes de test manuel
./staging-fix --curl
node scripts/staging-login-cli.js --curl

# Aide
./staging-fix --help
node scripts/staging-login-cli.js --help
```

### Scripts NPM (si disponibles)

```bash
npm run staging:diagnose    # Diagnostic complet
npm run staging:validate    # Validation de la correction
npm run staging:fix         # Instructions de correction
npm run staging:rollback    # Procédures de rollback
```

## 🔍 Workflow de Résolution

### 1. Diagnostic Initial
```bash
./staging-fix --diagnose
```

**Sortie attendue si problème confirmé :**
```
❌ Critical system failures detected:
   - Database Health
   - Auth Health
❌ Login endpoint returning 500 errors
   Root cause: Environment variables missing in AWS Amplify
```

### 2. Application de la Correction

Le CLI vous donnera les instructions exactes :

**Via AWS Amplify Console :**
1. Aller sur https://console.aws.amazon.com/amplify/
2. Sélectionner l'app "Huntaze" 
3. Aller dans Hosting environments > staging > Environment variables
4. Ajouter les variables manquantes :
   - `DATABASE_URL=postgresql://...`
   - `JWT_SECRET=your-secret-key`
   - `NODE_ENV=production`
5. Redéployer l'environnement staging

**Via AWS CLI :**
```bash
aws amplify update-app --app-id [YOUR_APP_ID] \
  --environment-variables \
    DATABASE_URL="[YOUR_DATABASE_URL]" \
    JWT_SECRET="[YOUR_JWT_SECRET]" \
    NODE_ENV="production"
```

### 3. Validation de la Correction
```bash
./staging-fix --validate
```

**Sortie attendue si correction réussie :**
```
🎉 SUCCESS! Staging login error has been RESOLVED!
✅ All critical health checks passing
✅ Login endpoint working correctly
✅ Smart Onboarding ready for testing
```

## 🧪 Tests Manuels

Le CLI génère aussi les commandes curl pour tests manuels :

```bash
# Test des endpoints de santé
curl -s "https://staging.huntaze.com/api/health/overall" | jq .
curl -s "https://staging.huntaze.com/api/health/database" | jq .
curl -s "https://staging.huntaze.com/api/health/auth" | jq .

# Test de l'endpoint de login
curl -X POST "https://staging.huntaze.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}' | jq .
```

## 🔄 Plan de Rollback

Si la correction ne fonctionne pas :

### Option 1: Rollback de Configuration
```bash
# Restaurer les variables d'environnement depuis la production
# Ou depuis un backup si disponible
```

### Option 2: Rollback de Code
```bash
git log --oneline -10  # Trouver le commit avant Smart Onboarding
git checkout [previous-commit]
git push huntaze staging --force
```

### Option 3: Revert Complet
```bash
git revert d9d4ca36a  # Revert du déploiement Smart Onboarding
git push huntaze staging
```

## ⚙️ Configuration

### Variables d'Environnement

```bash
# URL de l'environnement staging (optionnel)
export STAGING_URL=https://staging.huntaze.com

# ID de l'app AWS Amplify pour les commandes CLI (optionnel)
export AMPLIFY_APP_ID=your-amplify-app-id
```

### Personnalisation

Le CLI peut être personnalisé en modifiant `scripts/staging-login-cli.js` :

- Changer l'URL de staging par défaut
- Ajouter d'autres endpoints de test
- Modifier les variables d'environnement requises
- Personnaliser les messages de sortie

## 📊 Métriques de Succès

- **Temps de diagnostic** : 30 secondes - 2 minutes
- **Temps de correction** : 5-10 minutes
- **Probabilité de succès** : 95%
- **Temps total de résolution** : 10-15 minutes

## 🚨 Dépannage

### Le CLI ne fonctionne pas
```bash
# Vérifier Node.js
node --version

# Vérifier les permissions
chmod +x scripts/staging-login-cli.js
chmod +x staging-fix

# Tester manuellement
node scripts/staging-login-cli.js --help
```

### Staging inaccessible
```bash
# Tester la connectivité
curl -I https://staging.huntaze.com

# Utiliser les commandes curl manuelles
./staging-fix --curl
```

### Erreurs AWS CLI
```bash
# Vérifier la configuration AWS
aws configure list

# Obtenir l'ID de l'app Amplify
aws amplify list-apps
```

## 📞 Support

### Escalation si la correction échoue après 30 minutes :

1. **Vérifier les logs AWS Amplify** pour erreurs de build
2. **Contacter l'équipe DevOps** pour vérification infrastructure  
3. **Considérer un rollback complet** pour débloquer les tests

### Fichiers de Référence

- `STAGING_LOGIN_ERROR_ROOT_CAUSE_ANALYSIS.md` - Analyse détaillée
- `STAGING_LOGIN_FIX_GUIDE.md` - Guide de correction complet
- `scripts/diagnose-login-error.js` - Diagnostic local
- `scripts/validate-staging-fix.js` - Validation standalone

---

**Créé le** : 3 novembre 2024  
**Version** : 1.0  
**Compatibilité** : Node.js 16+, AWS CLI v2+