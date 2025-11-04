# 🔧 Guide de Correction - Erreur Login Staging

## Problème Identifié
**Variables d'environnement manquantes dans AWS Amplify Staging**

## ⚡ Correction Immédiate (5-10 minutes)

### Étape 1: Accéder à AWS Amplify Console
1. Aller sur [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
2. Sélectionner l'application **Huntaze**
3. Aller dans l'onglet **Hosting environments**
4. Cliquer sur la branche **staging**
5. Aller dans **Environment variables**

### Étape 2: Vérifier les Variables Manquantes
Vérifier que ces variables critiques existent :

```bash
# Variables CRITIQUES pour l'authentification
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production

# Variables IMPORTANTES pour le fonctionnement
NEXT_PUBLIC_APP_URL=https://staging.huntaze.com
FROM_EMAIL=noreply@huntaze.com
AWS_REGION=us-east-1
```

### Étape 3: Ajouter/Corriger les Variables Manquantes

#### Option A: Via AWS Amplify Console (Recommandé)
1. Cliquer sur **Manage variables**
2. Ajouter chaque variable manquante :
   - **Key**: `DATABASE_URL`
   - **Value**: `[Copier depuis production ou backup]`
3. Répéter pour `JWT_SECRET`, `NODE_ENV`, etc.
4. Cliquer **Save**

#### Option B: Via AWS CLI
```bash
# Exemple de commandes (ajuster les valeurs)
aws amplify put-backend-environment \
  --app-id [APP_ID] \
  --environment-name staging \
  --environment-variables DATABASE_URL="postgresql://..." \
                          JWT_SECRET="..." \
                          NODE_ENV="production"
```

### Étape 4: Redéployer
1. Dans AWS Amplify Console, aller dans **Deployments**
2. Cliquer **Redeploy this version** sur le dernier build
3. Ou déclencher un nouveau build en pushant un commit vide :
   ```bash
   git commit --allow-empty -m "trigger staging redeploy after env vars fix"
   git push huntaze staging
   ```

## 🧪 Validation de la Correction

### Test 1: Health Check Global
```bash
curl https://staging.huntaze.com/api/health/overall
```

**Résultat attendu**:
```json
{
  "service": "overall-system",
  "status": "healthy",
  "details": {
    "loginFunctionality": "operational"
  }
}
```

### Test 2: Health Check Base de Données
```bash
curl https://staging.huntaze.com/api/health/database
```

**Résultat attendu**:
```json
{
  "service": "database",
  "status": "healthy",
  "details": {
    "connection": true,
    "queryExecution": true
  }
}
```

### Test 3: Test de Login
```bash
curl -X POST https://staging.huntaze.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}'
```

**Résultat attendu** (pour utilisateur inexistant):
```json
{
  "error": "Invalid email or password"
}
```

**❌ Résultat problématique** (si pas corrigé):
```json
{
  "error": "Internal server error"
}
```

## 🔄 Plan de Rollback (si nécessaire)

### Si la correction ne fonctionne pas:

#### Option 1: Rollback de Configuration
1. Restaurer les variables d'environnement depuis un backup
2. Ou copier exactement depuis l'environnement de production

#### Option 2: Rollback de Code
```bash
# Revenir au commit précédent le Smart Onboarding
git checkout [commit-avant-smart-onboarding]
git push huntaze staging --force

# Puis restaurer les variables d'environnement
```

#### Option 3: Rollback Complet
```bash
# Revenir complètement à l'état précédent
git revert d9d4ca36a  # Commit Smart Onboarding
git push huntaze staging
```

## 📋 Checklist de Validation

### ✅ Avant la Correction
- [ ] Backup des variables d'environnement actuelles
- [ ] Documentation de l'état actuel
- [ ] Plan de rollback préparé

### ✅ Après la Correction
- [ ] Variables d'environnement configurées
- [ ] Build staging réussi
- [ ] Health check `/api/health/overall` retourne `healthy`
- [ ] Health check `/api/health/database` retourne `healthy`
- [ ] Health check `/api/health/auth` retourne `healthy`
- [ ] Login endpoint ne retourne plus d'erreur 500
- [ ] Smart Onboarding accessible après login

## 🚨 Variables d'Environnement Critiques

### Authentification (CRITIQUE)
```bash
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=production
```

### Application (IMPORTANT)
```bash
NEXT_PUBLIC_APP_URL=https://staging.huntaze.com
FROM_EMAIL=noreply@huntaze.com
AWS_REGION=us-east-1
```

### Smart Onboarding (OPTIONNEL)
```bash
REDIS_URL=redis://localhost:6379
WEBSOCKET_PORT=3001
ML_MODEL_ENDPOINT=https://api.example.com/ml
```

## 📞 Escalation

### Si la correction ne fonctionne pas après 30 minutes:
1. **Vérifier les logs AWS Amplify** pour erreurs de build
2. **Contacter l'équipe DevOps** pour vérification infrastructure
3. **Considérer un rollback complet** pour débloquer les tests

### Contacts:
- **DevOps**: [Contact DevOps]
- **Database Admin**: [Contact DBA]
- **AWS Support**: [Ticket AWS si nécessaire]

---

**Temps estimé de résolution**: 5-15 minutes  
**Probabilité de succès**: 95%  
**Impact**: Résolution complète du problème de login staging