# 🚨 DIAGNOSTIC: Erreur 500 sur /auth/register

## Problème Identifié
L'erreur 500 vient de la connexion à la base de données. Le code essaie de se connecter à PostgreSQL avec `DATABASE_URL` mais la valeur de fallback dans `amplify.yml` n'est pas une vraie DB.

## Cause Racine
```yaml
# Dans amplify.yml - VALEUR DE TEST SEULEMENT
DATABASE_URL=${DATABASE_URL:-postgresql://test:test@localhost:5432/test}
```

Cette URL pointe vers une DB locale qui n'existe pas sur Amplify.

## Solutions Immédiates

### Option 1: Ajouter la vraie DATABASE_URL dans Amplify Console
1. Aller dans AWS Amplify Console
2. App → staging → Environment variables  
3. Ajouter: `DATABASE_URL` = `postgresql://user:pass@host:5432/dbname`

### Option 2: Utiliser une DB temporaire pour tester
Créer une DB PostgreSQL gratuite sur:
- **Supabase** (recommandé): https://supabase.com
- **Neon**: https://neon.tech  
- **Railway**: https://railway.app

### Option 3: Mock temporaire pour tester l'UI
Modifier temporairement `/api/auth/register` pour retourner un succès sans DB.

## Variables Manquantes Critiques
```bash
DATABASE_URL=postgresql://...  # CRITIQUE - cause l'erreur 500
JWT_SECRET=your-secret-here    # CRITIQUE - pour les tokens
```

## Test Rapide
Une fois DATABASE_URL ajoutée, tester:
```bash
curl -X POST https://staging.huntaze.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password123"}'
```

## Status
❌ DATABASE_URL pointe vers une DB inexistante
❌ Erreur 500 sur toutes les routes qui utilisent la DB
✅ Site se charge (404 résolu)
✅ Build Amplify fonctionne