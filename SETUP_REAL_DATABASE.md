# 🚀 Configuration Base de Données Réelle

## Status Actuel
✅ Site fonctionne en mode DEMO  
✅ Interface auth testable  
⏳ Besoin d'une vraie DATABASE_URL  

## Options Rapides (5 minutes)

### Option 1: Supabase (Recommandé)
1. Aller sur https://supabase.com
2. Créer un compte gratuit
3. Créer un nouveau projet
4. Aller dans Settings → Database
5. Copier la "Connection string" (URI format)
6. Ajouter dans Amplify Console

### Option 2: Neon (Alternative)
1. Aller sur https://neon.tech
2. Créer un compte gratuit  
3. Créer une database
4. Copier la connection string
5. Ajouter dans Amplify Console

## Ajouter dans Amplify Console

1. **AWS Amplify Console** → Huntaze-app → staging
2. **Environment variables** (menu gauche)
3. **Manage variables**
4. **Add variable:**
   - Key: `DATABASE_URL`
   - Value: `postgresql://user:pass@host:port/dbname`
5. **Save**
6. **Redeploy** (ou attendre le prochain push)

## Variables Recommandées

```bash
# CRITIQUE
DATABASE_URL=postgresql://user:pass@host:port/dbname
JWT_SECRET=your-super-secret-jwt-key-32-chars-min

# OPTIONNEL (pour OAuth plus tard)
NEXTAUTH_URL=https://staging.huntaze.com
NEXTAUTH_SECRET=another-secret-key
```

## Test Après Configuration

Une fois DATABASE_URL ajoutée:
1. Le site basculera automatiquement en mode réel
2. Tester registration: https://staging.huntaze.com/auth/register
3. Plus de message "🚧 DEMO MODE"

## Migrations DB

Le code va automatiquement créer les tables nécessaires au premier lancement avec une vraie DB.

## Temps Estimé
- Supabase setup: 3-5 minutes
- Amplify config: 1-2 minutes  
- **Total: ~5-7 minutes**