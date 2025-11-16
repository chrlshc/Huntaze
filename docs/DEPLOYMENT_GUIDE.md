# Guide de Déploiement - Huntaze

## 📋 Prérequis

Avant de déployer sur AWS Amplify, assurez-vous d'avoir :

1. ✅ Base de données RDS PostgreSQL configurée
2. ✅ Tables créées (users, sessions, email_verification_tokens)
3. ✅ AWS SES configuré et vérifié
4. ✅ Variables d'environnement prêtes

## 🚀 Déploiement sur AWS Amplify

### 1. Configuration des Variables d'Environnement

Dans AWS Amplify Console, ajoutez ces variables d'environnement :

#### Base de Données
```
DATABASE_URL=postgresql://huntazeadmin:PASSWORD@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?schema=public
```

#### Authentification
```
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025
```

#### Email (AWS SES)
```
FROM_EMAIL=noreply@huntaze.com
AWS_REGION=us-east-1
```

#### Application
```
NEXT_PUBLIC_APP_URL=https://main.d3xxxxxxxxx.amplifyapp.com
NEXT_PUBLIC_API_URL=https://main.d3xxxxxxxxx.amplifyapp.com/api
```

#### Azure OpenAI (existant)
```
AZURE_OPENAI_ENDPOINT=https://huntaze-ai-eus2-29796.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4o
AZURE_OPENAI_API_KEY=your-key
AZURE_OPENAI_API_VERSION=2024-05-01-preview
USE_AZURE_RESPONSES=1
ENABLE_AZURE_AI=1
```

### 2. Configuration AWS SES

#### Vérifier votre domaine
```bash
# Dans AWS SES Console
1. Allez dans "Verified identities"
2. Cliquez "Create identity"
3. Sélectionnez "Domain"
4. Entrez "huntaze.com"
5. Ajoutez les enregistrements DNS fournis
```

#### Vérifier l'email d'envoi
```bash
# Si vous n'avez pas encore de domaine vérifié
1. Allez dans "Verified identities"
2. Cliquez "Create identity"
3. Sélectionnez "Email address"
4. Entrez "noreply@huntaze.com"
5. Vérifiez l'email reçu
```

#### Sortir du Sandbox (Production)
```bash
# Pour envoyer des emails à n'importe quelle adresse
1. Allez dans "Account dashboard"
2. Cliquez "Request production access"
3. Remplissez le formulaire :
   - Use case: Transactional emails
   - Website URL: https://huntaze.com
   - Description: User registration and verification emails
4. Attendez l'approbation (généralement 24h)
```

### 3. Permissions IAM pour Amplify

Assurez-vous que le rôle IAM d'Amplify a ces permissions :

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Pousser le Code

```bash
# Vérifier que tout est commité
git status

# Ajouter les nouveaux fichiers
git add .

# Commit
git commit -m "feat: Add email verification system with AWS SES"

# Pousser sur la branche principale
git push origin main
```

### 5. Vérifier le Déploiement

1. **Allez dans AWS Amplify Console**
2. **Vérifiez le build** :
   - Prebuild : Installation des dépendances
   - Build : Initialisation DB + Build Next.js
   - Deploy : Déploiement sur CDN

3. **Vérifiez les logs** :
   ```
   [BUILD] wrote .env.production
   npm run db:init:safe || echo "DB already initialized"
   ✅ Connected successfully!
   📊 Tables created:
     ✓ sessions (5 columns)
     ✓ users (7 columns)
     ✓ email_verification_tokens (6 columns)
   ```

## 🔐 Authentication and Onboarding Flow

### Overview

The application implements a seamless authentication and onboarding flow:

1. **New User Registration** → Onboarding → Dashboard
2. **Existing User Login** (incomplete onboarding) → Onboarding → Dashboard
3. **Existing User Login** (completed onboarding) → Dashboard

### Key Features

- **Session-Based Authentication**: Uses NextAuth.js for secure session management
- **Onboarding Tracking**: Database flag tracks completion status
- **Smart Routing**: Automatic redirect based on onboarding status
- **Backward Compatible**: Existing users bypass onboarding

### Environment Variables

Ensure these NextAuth variables are set in Amplify:

```bash
NEXTAUTH_URL=https://your-domain.amplifyapp.com
NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production
```

Generate a secure NEXTAUTH_SECRET:

```bash
openssl rand -base64 32
```

### Testing the Flow

After deployment, test the complete authentication flow:

#### Test 1: New User Registration
```bash
# 1. Visit /auth
# 2. Fill registration form
# 3. Submit
# Expected: Redirect to /onboarding
# 4. Complete onboarding
# Expected: Redirect to /dashboard
```

#### Test 2: Login with Incomplete Onboarding
```bash
# 1. Create user with onboarding_completed = false
# 2. Visit /auth and login
# Expected: Redirect to /onboarding
# 3. Complete onboarding
# Expected: Redirect to /dashboard
```

#### Test 3: Login with Completed Onboarding
```bash
# 1. Login with existing user
# Expected: Direct redirect to /dashboard
```

For detailed flow documentation, see [docs/AUTH_FLOW.md](./AUTH_FLOW.md).

## 🧪 Tests Post-Déploiement

### 1. Test d'Inscription

```bash
# Créer un compte
curl -X POST https://your-app.amplifyapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

**Résultat attendu :**
- ✅ Utilisateur créé dans la base de données
- ✅ Email de vérification envoyé
- ✅ Token de session créé

### 2. Vérifier l'Email Reçu

L'utilisateur devrait recevoir un email avec :
- ✅ Message de bienvenue personnalisé
- ✅ Bouton "Vérifier mon email"
- ✅ Lien de vérification valide 24h
- ✅ Design responsive et professionnel

### 3. Test de Vérification

```bash
# Cliquer sur le lien dans l'email ou :
curl https://your-app.amplifyapp.com/api/auth/verify-email?token=VERIFICATION_TOKEN
```

**Résultat attendu :**
- ✅ Email marqué comme vérifié dans la DB
- ✅ Email de bienvenue envoyé
- ✅ Redirection vers le dashboard

### 4. Vérifier dans la Base de Données

```bash
# Vérifier l'utilisateur
PGPASSWORD="PASSWORD" psql \
  -h huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com \
  -U huntazeadmin \
  -d huntaze \
  -c "SELECT id, email, name, email_verified FROM users WHERE email = 'test@example.com';"

# Vérifier que le token a été supprimé
PGPASSWORD="PASSWORD" psql \
  -h huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com \
  -U huntazeadmin \
  -d huntaze \
  -c "SELECT * FROM email_verification_tokens WHERE email = 'test@example.com';"
```

## 📧 Contenu des Emails

### Email de Vérification

**Sujet :** Vérifiez votre email - Huntaze

**Contenu :**
- Message de bienvenue personnalisé avec le nom
- Bouton CTA "Vérifier mon email"
- Lien de vérification (expire dans 24h)
- Design professionnel avec logo Huntaze
- Version texte pour les clients email sans HTML

### Email de Bienvenue

**Sujet :** Bienvenue sur Huntaze ! 🎉

**Contenu :**
- Confirmation de vérification
- Bouton "Accéder au tableau de bord"
- Message d'encouragement
- Design cohérent avec l'email de vérification

## 🔧 Troubleshooting

### Email Non Reçu

**Problème :** L'utilisateur ne reçoit pas l'email de vérification

**Solutions :**
1. Vérifier les logs Amplify pour les erreurs SES
2. Vérifier que l'email FROM est vérifié dans SES
3. Vérifier que SES n'est pas en sandbox mode
4. Vérifier les quotas SES (50 emails/jour en sandbox)
5. Vérifier le dossier spam de l'utilisateur

### Token Expiré

**Problème :** Le lien de vérification ne fonctionne plus

**Solution :**
```bash
# Créer un nouveau token pour l'utilisateur
# TODO: Ajouter une route /api/auth/resend-verification
```

### Erreur de Connexion DB

**Problème :** Cannot connect to database

**Solutions :**
1. Vérifier que RDS est démarré
2. Vérifier DATABASE_URL dans Amplify
3. Vérifier le security group RDS
4. Vérifier les credentials

### Erreur SES

**Problème :** SES returns error

**Solutions :**
1. Vérifier les permissions IAM
2. Vérifier que l'email FROM est vérifié
3. Vérifier la région AWS (doit correspondre)
4. Vérifier les quotas SES

## 📊 Monitoring

### CloudWatch Logs

```bash
# Voir les logs d'envoi d'emails
aws logs tail /aws/lambda/amplify-app --follow --filter "email"

# Voir les erreurs
aws logs tail /aws/lambda/amplify-app --follow --filter "ERROR"
```

### Métriques SES

Dans AWS Console → SES → Reputation dashboard :
- Bounce rate (doit être < 5%)
- Complaint rate (doit être < 0.1%)
- Emails sent
- Emails delivered

## 🗄️ Database Migrations

### Onboarding Completed Column Migration

Before deploying the authentication and onboarding flow updates, you must run the database migration to add the `onboarding_completed` column.

#### For Staging

```bash
# Connect to staging database
psql -h staging-db-host -U your-user -d huntaze

# Run the migration
\i migrations/001_add_onboarding_completed.sql

# Verify the migration
SELECT column_name, data_type, column_default 
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'onboarding_completed';
```

#### For Production

```bash
# Connect to production database
psql -h huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com \
     -U huntazeadmin -d huntaze

# Run the migration
\i migrations/001_add_onboarding_completed.sql

# Verify the migration
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN onboarding_completed = true THEN 1 END) as completed,
  COUNT(CASE WHEN onboarding_completed = false THEN 1 END) as incomplete
FROM users;
```

#### What This Migration Does

1. **Adds Column**: Creates `onboarding_completed BOOLEAN DEFAULT false`
2. **Backfills Data**: Sets existing users to `onboarding_completed = true` (backward compatibility)
3. **Creates Index**: Adds index on `onboarding_completed` for performance
4. **Adds Documentation**: Adds column comment

#### Rollback (if needed)

```sql
-- Drop the index
DROP INDEX IF EXISTS idx_users_onboarding_completed;

-- Drop the column
ALTER TABLE users DROP COLUMN IF EXISTS onboarding_completed;
```

**⚠️ WARNING**: Rollback will permanently delete all onboarding status data.

For detailed migration documentation, see [migrations/README.md](../migrations/README.md) and [migrations/DEPLOYMENT_GUIDE.md](../migrations/DEPLOYMENT_GUIDE.md).

## 🎯 Checklist de Déploiement

Avant de déployer en production :

- [ ] RDS instance démarrée et accessible
- [ ] Tables créées (users, sessions, email_verification_tokens)
- [ ] **Migration onboarding_completed exécutée**
- [ ] **Migration vérifiée (colonne existe et index créé)**
- [ ] Variables d'environnement configurées dans Amplify
- [ ] AWS SES domaine vérifié
- [ ] AWS SES sorti du sandbox mode
- [ ] Permissions IAM configurées
- [ ] Tests d'inscription effectués
- [ ] Tests de vérification effectués
- [ ] **Tests du flux d'onboarding effectués**
- [ ] **Tests de redirection après login effectués**
- [ ] Emails reçus et vérifiés
- [ ] Design des emails validé
- [ ] Monitoring CloudWatch activé

## 🚀 Commandes Utiles

```bash
# Vérifier le statut RDS
aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --query 'DBInstances[0].DBInstanceStatus'

# Vérifier les identités SES
aws ses list-identities

# Vérifier le statut de vérification
aws ses get-identity-verification-attributes \
  --identities noreply@huntaze.com

# Envoyer un email de test
aws ses send-email \
  --from noreply@huntaze.com \
  --destination ToAddresses=test@example.com \
  --message Subject={Data="Test"},Body={Text={Data="Test email"}}
```

---

**Date de création :** 31 octobre 2025  
**Dernière mise à jour :** 31 octobre 2025  
**Status :** ✅ Prêt pour production


## 🏗️ Standalone Build Process

### Overview

The application uses Next.js standalone output mode for optimized deployments. This creates a self-contained package with all dependencies.

### Build Configuration

The standalone output is configured in `next.config.ts`:

```typescript
export default {
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    outputFileTracingIncludes: {
      '/': ['./node_modules/**']
    }
  }
}
```

### Building for Deployment

#### Standard Build

```bash
npm run build
```

This command:
1. Validates configuration (`build:validate`)
2. Runs Next.js build with error handling
3. Creates `.next/standalone` directory
4. Includes all required dependencies

#### Build Validation

Before deploying, validate your build:

```bash
# Pre-build validation
npm run build:validate

# Post-build verification
npm run build:verify
```

### Standalone Output Structure

After building, the `.next/standalone` directory contains:

```
.next/standalone/
├── server.js              # Entry point
├── package.json           # Dependencies
├── .next/                 # Build output
│   ├── server/           # Server bundles
│   ├── static/           # Static assets
│   └── standalone/       # Standalone files
├── public/               # Public assets
└── node_modules/         # Required dependencies
```

### Deploying Standalone Build

#### Local Testing

Test the standalone build locally:

```bash
# Build the application
npm run build

# Navigate to standalone directory
cd .next/standalone

# Set environment variables
export DATABASE_URL="your-database-url"
export JWT_SECRET="your-jwt-secret"
# ... other env vars

# Start the server
node server.js
```

The application will be available at `http://localhost:3000`

#### AWS Amplify Deployment

Amplify automatically handles the standalone build:

1. **Build Settings** (amplify.yml):
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
           - npm run build:validate
       build:
         commands:
           - npm run build
       postBuild:
         commands:
           - npm run build:verify
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
         - .next/cache/**/*
   ```

2. **Environment Variables**: Set all required variables in Amplify Console

3. **Deploy**: Push to your connected Git branch

### Environment Variables for Standalone

Required environment variables for standalone deployment:

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Authentication
JWT_SECRET=your-secret-key

# Email
FROM_EMAIL=noreply@huntaze.com
AWS_REGION=us-east-1

# Application URLs
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
```

### Troubleshooting Standalone Builds

If you encounter build issues:

1. **Check Configuration**
   ```bash
   npm run build:validate
   ```

2. **Review Build Errors**
   The build script provides detailed error messages and suggestions

3. **Verify Output**
   ```bash
   npm run build:verify
   ```

4. **Consult Documentation**
   See [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md) for detailed troubleshooting steps

### Common Issues

#### Missing Client Manifest Files

**Error**: `ENOENT: no such file or directory, copyfile '.next/server/app/(landing)/page_client-reference-manifest.js'`

**Solution**: Route groups have been refactored. The landing page is now at `app/page.tsx` as a server component.

#### Incomplete Standalone Output

**Solution**: Run `npm run build:verify` to check for missing files. Ensure all required paths are in `outputFileTracingIncludes`.

#### Memory Issues During Build

**Solution**: Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### Performance Optimization

The standalone build is optimized for:
- Minimal bundle size (only required dependencies)
- Fast cold starts
- Efficient file tracing
- Production-ready output

### Monitoring Deployment

After deployment, verify:

1. **Health Check**: Visit `/api/health`
2. **Routes**: Test all major routes
3. **Database**: Verify database connectivity
4. **Email**: Test email functionality
5. **Authentication**: Test login/register flows

### Rollback Procedure

If deployment fails:

1. Revert to previous Git commit
2. Trigger new Amplify build
3. Verify environment variables
4. Check build logs for errors

For detailed troubleshooting, see [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md)
