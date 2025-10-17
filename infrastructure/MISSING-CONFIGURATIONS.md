# 🔧 Configurations Manquantes pour la Production

## 1. 🔴 CRITIQUE - À faire MAINTENANT

### AWS Amplify Configuration
```typescript
// 📍 Fichier manquant: lib/amplify-config.ts
import { Amplify } from 'aws-amplify';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code',
      userAttributes: {
        email: {
          required: true,
        },
      },
      passwordFormat: {
        minLength: 14,
        requireNumbers: true,
        requireSpecialCharacters: true,
        requireUppercase: true,
        requireLowercase: true,
      },
    },
  },
});
```

### Provider Amplify dans app/layout.tsx
```typescript
// 📍 À ajouter dans app/layout.tsx
import { Amplify } from 'aws-amplify';
import config from '@/lib/amplify-config';

Amplify.configure(config);
```

### API Routes manquantes
- ❌ `/api/auth/login/route.ts` - Pour se connecter
- ❌ `/api/auth/signup/route.ts` - Pour créer un compte
- ❌ `/api/auth/logout/route.ts` - Pour se déconnecter
- ❌ `/api/auth/refresh/route.ts` - Pour refresh tokens
- ✅ `/api/auth/forgot-password/route.ts` - Existe
- ❌ `/api/auth/confirm-signup/route.ts` - Pour confirmer email

## 2. 🟡 IMPORTANT - Cette semaine

### Cognito Domain Custom
```bash
# Actuellement pas de domaine configuré pour le Hosted UI
aws cognito-idp create-user-pool-domain \
  --profile huntaze \
  --domain "huntaze-auth-dev" \
  --user-pool-id us-east-1_XXTo7YU8O
```

### Callback URLs
```bash
# Ajouter les URLs de callback pour OAuth
aws cognito-idp update-user-pool-client \
  --profile huntaze \
  --user-pool-id us-east-1_XXTo7YU8O \
  --client-id 2du9llnniksecskav0lnfg99u0 \
  --callback-urls "http://localhost:3000/auth/callback" "https://app.huntaze.com/auth/callback" \
  --logout-urls "http://localhost:3000/auth/logout" "https://app.huntaze.com/auth/logout"
```

### Groups & Roles
```bash
# Créer des groupes pour RBAC
aws cognito-idp create-group \
  --profile huntaze \
  --user-pool-id us-east-1_XXTo7YU8O \
  --group-name "admins" \
  --description "Admin users"

aws cognito-idp create-group \
  --profile huntaze \
  --user-pool-id us-east-1_XXTo7YU8O \
  --group-name "creators" \
  --description "Content creators"
```

## 3. 🟠 AVANT LA PROD - Sécurité

### Advanced Security Features
```bash
# Activer la protection contre les compromissions
aws cognito-idp set-risk-configuration \
  --profile huntaze \
  --user-pool-id us-east-1_XXTo7YU8O \
  --compromised-credentials-risk-configuration \
    EventFilter=SIGN_IN,SIGN_UP \
    Actions={EventAction=BLOCK}
```

### MFA Configuration
```bash
# Activer MFA optionnel
aws cognito-idp set-user-pool-mfa-config \
  --profile huntaze \
  --user-pool-id us-east-1_XXTo7YU8O \
  --mfa-configuration OPTIONAL \
  --software-token-mfa-configuration Enabled=true
```

### Email avec SES (pas les emails Cognito par défaut)
1. Vérifier domaine dans SES
2. Sortir du sandbox SES  
3. Configurer Cognito pour utiliser SES
4. Templates d'emails personnalisés

## 4. 🔵 NICE TO HAVE - Plus tard

### Monitoring
- CloudWatch Dashboards
- Alertes sur échecs de connexion
- Métriques d'usage
- Logs d'audit

### Backup & Recovery
- Export régulier des users
- Plan de disaster recovery
- Multi-region setup

### Intégrations
- Social login (Google, Apple)
- SSO entreprise (SAML)
- Webhooks pour événements

## 📋 Checklist Immédiate

### 1. Créer les API routes manquantes
```bash
mkdir -p app/api/auth/login
mkdir -p app/api/auth/signup  
mkdir -p app/api/auth/logout
mkdir -p app/api/auth/refresh
mkdir -p app/api/auth/confirm-signup
```

### 2. Configurer Amplify
```bash
# Installer si nécessaire
npm install aws-amplify
```

### 3. Tester le flow complet
- [ ] Signup avec email
- [ ] Recevoir code de confirmation
- [ ] Login
- [ ] Refresh token
- [ ] Logout
- [ ] Forgot password

## 🚨 Le Plus Urgent

**Sans les API routes et la config Amplify, l'authentification ne fonctionnera pas !**

Veux-tu que je crée :
1. Les API routes manquantes ?
2. La configuration Amplify ?
3. Les deux ?

C'est ~30 minutes de travail pour tout finaliser.