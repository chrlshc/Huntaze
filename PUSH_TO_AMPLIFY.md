# 🚀 Push to Amplify - Guide Rapide

## Étapes Avant de Pousser

### 1. Vérifier AWS SES

```bash
# Vérifier l'email d'envoi
aws ses verify-email-identity --email-address noreply@huntaze.com

# Vérifier le statut
aws ses get-identity-verification-attributes \
  --identities noreply@huntaze.com
```

**Résultat attendu :**
```json
{
  "VerificationAttributes": {
    "noreply@huntaze.com": {
      "VerificationStatus": "Success"
    }
  }
}
```

### 2. Configurer les Variables dans Amplify

Aller dans **AWS Amplify Console** → Votre App → **Environment variables**

Ajouter ces variables :

```
DATABASE_URL=postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?schema=public

JWT_SECRET=huntaze-super-secret-jwt-key-change-this-in-production-2025

FROM_EMAIL=noreply@huntaze.com

AWS_REGION=us-east-1

NEXT_PUBLIC_APP_URL=https://main.d3xxxxxxxxx.amplifyapp.com
```

**Note :** Remplacez `d3xxxxxxxxx` par votre vrai domaine Amplify

### 3. Vérifier les Permissions IAM

Le rôle IAM d'Amplify doit avoir ces permissions :

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
    }
  ]
}
```

**Comment ajouter :**
1. Aller dans **IAM Console**
2. Chercher le rôle Amplify (ex: `amplify-huntaze-main-xxxxx`)
3. Cliquer **Add permissions** → **Create inline policy**
4. Coller le JSON ci-dessus
5. Nommer la policy `SESEmailSending`
6. Sauvegarder

## 🚀 Pousser le Code

### Vérifier les Changements

```bash
# Voir les fichiers modifiés
git status

# Voir les différences
git diff
```

### Commiter et Pousser

```bash
# Ajouter tous les fichiers
git add .

# Commit avec message descriptif
git commit -m "feat: Add email verification system with AWS SES

- Integrated AWS SES for transactional emails
- Created email verification flow with 24h token expiry
- Added email_verification_tokens table
- Implemented verification and welcome emails
- Updated registration to send verification emails
- Created /api/auth/verify-email endpoint
- Created /auth/verify-email page
- Updated amplify.yml for deployment
- Added comprehensive documentation"

# Pousser sur la branche principale
git push origin main
```

## 📊 Suivre le Déploiement

### Dans Amplify Console

1. **Aller dans AWS Amplify Console**
2. **Sélectionner votre app**
3. **Voir le build en cours**

### Phases du Build

#### 1. Provision (30s)
```
Provisioning build environment...
✓ Environment provisioned
```

#### 2. Pre-Build (2-3 min)
```
Installing Node.js 20...
Installing dependencies...
✓ Dependencies installed
```

#### 3. Build (3-5 min)
```
Initializing database...
✓ DB already initialized
Writing .env.production...
✓ Environment configured
Building Next.js app...
✓ Build completed
```

#### 4. Deploy (1-2 min)
```
Deploying to CDN...
✓ Deployed successfully
```

### Vérifier les Logs

Chercher ces messages dans les logs :

```bash
# Database initialization
npm run db:init:safe || echo "DB already initialized"
✅ Connected successfully!
📊 Tables created:
  ✓ sessions (5 columns)
  ✓ users (7 columns)
  ✓ email_verification_tokens (6 columns)

# Build success
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages
```

## ✅ Tests Post-Déploiement

### 1. Test de Santé

```bash
# Vérifier que l'app est accessible
curl https://your-app.amplifyapp.com

# Devrait retourner 200 OK
```

### 2. Test d'Inscription

```bash
# Créer un compte
curl -X POST https://your-app.amplifyapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@example.com",
    "password": "SecurePass123!"
  }'
```

**Résultat attendu :**
```json
{
  "user": {
    "id": 1,
    "name": "Test User",
    "email": "your-email@example.com",
    "emailVerified": false
  },
  "message": "Account created! Please check your email to verify your account."
}
```

### 3. Vérifier l'Email Reçu

1. **Ouvrir votre boîte email**
2. **Chercher l'email de Huntaze**
3. **Vérifier le contenu :**
   - ✅ Sujet : "Vérifiez votre email - Huntaze"
   - ✅ Message de bienvenue avec votre nom
   - ✅ Bouton "Vérifier mon email"
   - ✅ Lien de vérification

### 4. Test de Vérification

1. **Cliquer sur le bouton dans l'email**
2. **Vérifier la redirection vers `/auth/verify-email?token=xxx`**
3. **Vérifier l'affichage :**
   - ✅ Spinner de chargement
   - ✅ Message de succès
   - ✅ Redirection vers le dashboard

### 5. Vérifier l'Email de Bienvenue

1. **Ouvrir votre boîte email**
2. **Chercher le deuxième email**
3. **Vérifier le contenu :**
   - ✅ Sujet : "Bienvenue sur Huntaze ! 🎉"
   - ✅ Message de félicitations
   - ✅ Bouton "Accéder au tableau de bord"

### 6. Vérifier dans la Base de Données

```bash
# Vérifier que l'utilisateur est créé et vérifié
PGPASSWORD="1o612aUCXFMESpcNQWXITJWG0" psql \
  -h huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com \
  -U huntazeadmin \
  -d huntaze \
  -c "SELECT id, email, name, email_verified, created_at FROM users ORDER BY id DESC LIMIT 1;"
```

**Résultat attendu :**
```
 id |        email         |    name    | email_verified |         created_at         
----+----------------------+------------+----------------+----------------------------
  1 | your-email@example.com | Test User  | t              | 2025-10-31 12:34:56.789
```

## 🔧 Troubleshooting

### Build Failed

**Erreur :** `npm run db:init:safe` failed

**Solution :**
1. Vérifier que DATABASE_URL est configuré dans Amplify
2. Vérifier que RDS est démarré
3. Vérifier le security group RDS

### Email Non Reçu

**Erreur :** L'utilisateur ne reçoit pas l'email

**Solutions :**
1. Vérifier que FROM_EMAIL est vérifié dans SES
2. Vérifier les logs Amplify pour les erreurs SES
3. Vérifier le dossier spam
4. Si en sandbox SES, vérifier que TO_EMAIL est aussi vérifié

### Erreur SES

**Erreur :** `MessageRejected: Email address is not verified`

**Solution :**
```bash
# Vérifier l'email
aws ses verify-email-identity --email-address noreply@huntaze.com

# Attendre l'email de vérification d'AWS
# Cliquer sur le lien dans l'email
```

### Permissions IAM

**Erreur :** `AccessDenied: User is not authorized to perform: ses:SendEmail`

**Solution :**
1. Aller dans IAM Console
2. Trouver le rôle Amplify
3. Ajouter la policy SES (voir section 3 ci-dessus)

## 📊 Monitoring

### CloudWatch Logs

```bash
# Voir les logs en temps réel
aws logs tail /aws/amplify/your-app-id --follow

# Filtrer les logs d'email
aws logs tail /aws/amplify/your-app-id --follow --filter "email"

# Voir les erreurs
aws logs tail /aws/amplify/your-app-id --follow --filter "ERROR"
```

### Métriques SES

Dans **AWS Console** → **SES** → **Reputation dashboard** :

- **Emails sent** : Nombre total d'emails envoyés
- **Bounce rate** : Doit être < 5%
- **Complaint rate** : Doit être < 0.1%
- **Delivery rate** : Doit être > 95%

## 🎉 Succès !

Si tous les tests passent, votre application est **déployée avec succès** ! 🚀

Les utilisateurs peuvent maintenant :
1. ✅ S'inscrire sur votre app
2. ✅ Recevoir un email de vérification professionnel
3. ✅ Vérifier leur email en un clic
4. ✅ Recevoir un email de bienvenue
5. ✅ Accéder à leur compte vérifié

## 📚 Ressources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

**Prêt à déployer ?** Suivez les étapes ci-dessus et votre app sera en ligne en quelques minutes ! 🚀
