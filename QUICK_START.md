# ⚡ Quick Start - Déploiement en 5 Minutes

## 🎯 Objectif

Déployer votre application Huntaze avec système d'authentification et vérification d'email sur AWS Amplify.

---

## ✅ Prérequis (2 minutes)

### 1. Vérifier l'Email dans AWS SES

```bash
aws ses verify-email-identity --email-address noreply@huntaze.com
```

Vous recevrez un email. **Cliquez sur le lien de vérification.**

### 2. Vérifier le Statut

```bash
aws ses get-identity-verification-attributes --identities noreply@huntaze.com
```

Attendez que le statut soit `"Success"`.

---

## 🔧 Configuration Amplify (1 minute)

Allez sur : https://console.aws.amazon.com/amplify

1. Sélectionnez votre app
2. Cliquez sur **"Environment variables"**
3. Ajoutez ces variables :

```
DATABASE_URL=postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze
JWT_SECRET=huntaze-super-secret-jwt-key-change-this-in-production-2025
FROM_EMAIL=noreply@huntaze.com
AWS_REGION=us-east-1
NEXT_PUBLIC_APP_URL=https://main.d3xxxxxxxxx.amplifyapp.com
```

**Note :** Remplacez `d3xxxxxxxxx` par votre vrai domaine Amplify

4. Cliquez **"Save"**

---

## 🔐 Permissions IAM (1 minute)

Allez sur : https://console.aws.amazon.com/iam

1. Cherchez le rôle : `amplify-huntaze-main-xxxxx`
2. Cliquez **"Add permissions"** → **"Create inline policy"**
3. Cliquez **"JSON"** et collez :

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

4. Nommez la policy : `SESEmailSending`
5. Cliquez **"Create policy"**

---

## 🚀 Déploiement (1 minute)

### Option 1 : Script Automatique

```bash
./DEPLOY_NOW.sh
```

### Option 2 : Manuel

```bash
# Ajouter tous les fichiers
git add .

# Commit
git commit -F COMMIT_MESSAGE.txt

# Push
git push origin main
```

---

## ✅ Vérification (30 secondes)

### 1. Vérifier le Build

Allez sur : https://console.aws.amazon.com/amplify

Vous devriez voir :
- ✅ Provision : Complete
- ✅ Pre-Build : Complete
- ✅ Build : Complete
- ✅ Deploy : Complete

### 2. Tester l'Application

Ouvrez votre app : `https://your-app.amplifyapp.com`

1. Cliquez sur **"Sign Up"**
2. Créez un compte
3. Vérifiez votre email
4. Cliquez sur le lien de vérification
5. Vous devriez recevoir l'email de bienvenue

---

## 🎉 C'est Fait !

Votre application est maintenant **en ligne** avec :

✅ Authentification complète  
✅ Vérification d'email automatique  
✅ Emails professionnels  
✅ Base de données PostgreSQL  
✅ Hébergement sur AWS Amplify  

---

## 🆘 Problèmes ?

### Email non reçu ?

```bash
# Vérifier les logs Amplify
aws logs tail /aws/amplify/your-app-id --follow --filter "email"
```

### Build failed ?

```bash
# Vérifier que RDS est démarré
aws rds describe-db-instances \
  --db-instance-identifier huntaze-postgres-production \
  --query 'DBInstances[0].DBInstanceStatus'
```

### Erreur SES ?

```bash
# Vérifier que l'email est vérifié
aws ses get-identity-verification-attributes \
  --identities noreply@huntaze.com
```

---

## 📚 Documentation Complète

Pour plus de détails :

- **`PUSH_TO_AMPLIFY.md`** - Guide détaillé
- **`docs/DEPLOYMENT_GUIDE.md`** - Troubleshooting complet
- **`WHAT_USERS_RECEIVE.md`** - Détails des emails
- **`TODAY_SUMMARY.md`** - Résumé complet

---

## 🎯 Commandes Utiles

```bash
# Tester l'envoi d'emails localement
npm run test:email your-email@example.com

# Initialiser la base de données
npm run db:init:safe

# Démarrer en développement
npm run dev

# Build pour production
npm run build
```

---

**Temps total : ~5 minutes**

**Prêt ? Lancez `./DEPLOY_NOW.sh` maintenant ! 🚀**
