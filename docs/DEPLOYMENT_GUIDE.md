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
AZURE_OPENAI_API_KEY=REDACTED-key
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

## 🎯 Checklist de Déploiement

Avant de déployer en production :

- [ ] RDS instance démarrée et accessible
- [ ] Tables créées (users, sessions, email_verification_tokens)
- [ ] Variables d'environnement configurées dans Amplify
- [ ] AWS SES domaine vérifié
- [ ] AWS SES sorti du sandbox mode
- [ ] Permissions IAM configurées
- [ ] Tests d'inscription effectués
- [ ] Tests de vérification effectués
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
