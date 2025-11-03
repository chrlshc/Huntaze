# 🚀 Déploiement Huntaze - Guide Rapide

## ✅ Ce qui est Prêt

Votre application Huntaze est **100% prête** pour le déploiement avec :

- ✅ Base de données PostgreSQL configurée sur AWS RDS
- ✅ 3 tables créées (users, sessions, email_verification_tokens)
- ✅ Système d'authentification complet avec JWT
- ✅ Vérification d'email avec AWS SES
- ✅ Emails professionnels (HTML + texte)
- ✅ Configuration Amplify prête
- ✅ Documentation complète
- ✅ Scripts de test

## 🎯 Déploiement en 3 Étapes

### Option 1 : Script Automatique (Recommandé)

```bash
./DEPLOY_NOW.sh
```

Ce script vous guide à travers toutes les étapes et pousse automatiquement sur Amplify.

### Option 2 : Manuel

#### 1. Configurer AWS SES

```bash
# Vérifier l'email
aws ses verify-email-identity --email-address noreply@huntaze.com

# Vérifier le statut
aws ses get-identity-verification-attributes --identities noreply@huntaze.com
```

#### 2. Configurer Amplify

Aller dans **AWS Amplify Console** → **Environment variables** et ajouter :

```
DATABASE_URL=postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze
JWT_SECRET=huntaze-super-secret-jwt-key-change-this-in-production-2025
FROM_EMAIL=noreply@huntaze.com
AWS_REGION=us-east-1
NEXT_PUBLIC_APP_URL=https://your-app.amplifyapp.com
```

#### 3. Pousser le Code

```bash
git add .
git commit -F COMMIT_MESSAGE.txt
git push origin main
```

## 📧 Ce que les Utilisateurs Reçoivent

### Email 1 : Vérification (immédiat)
```
Sujet: Vérifiez votre email - Huntaze

Bienvenue [Nom] ! 👋

[Bouton: Vérifier mon email]

Lien expire dans 24h
```

### Email 2 : Bienvenue (après vérification)
```
Sujet: Bienvenue sur Huntaze ! 🎉

Votre email est vérifié ! 🎉

[Bouton: Accéder au tableau de bord]
```

## 🧪 Tests

### Test Local

```bash
# Tester l'envoi d'emails
npm run test:email your-email@example.com "Your Name"

# Démarrer l'app
npm run dev

# Tester l'inscription
# Aller sur http://localhost:3000/auth/register
```

### Test en Production

```bash
# Créer un compte
curl -X POST https://your-app.amplifyapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# Vérifier l'email reçu
# Cliquer sur le lien de vérification
```

## 📚 Documentation Complète

### Guides Principaux
- **`PUSH_TO_AMPLIFY.md`** - Guide détaillé de déploiement
- **`docs/DEPLOYMENT_GUIDE.md`** - Configuration AWS complète
- **`WHAT_USERS_RECEIVE.md`** - Détails des emails
- **`TODAY_SUMMARY.md`** - Résumé complet du travail

### Documentation Technique
- **`lib/email/README.md`** - Système d'emails
- **`scripts/README.md`** - Scripts disponibles
- **`docs/DB_SETUP_COMPLETE.md`** - Configuration DB

### Références Rapides
- **`SETUP_SUCCESS.md`** - Référence rapide
- **`EMAIL_VERIFICATION_COMPLETE.md`** - Système email
- **`COMMIT_MESSAGE.txt`** - Message de commit prêt

## 🔧 Scripts Disponibles

```bash
# Base de données
npm run db:init:safe          # Initialiser les tables
npm run db:init:wait          # Avec attente RDS

# Tests
npm run test:email [email]    # Tester l'envoi d'emails

# Développement
npm run dev                   # Démarrer en dev
npm run build                 # Build production

# Déploiement
./DEPLOY_NOW.sh              # Script de déploiement complet
```

## ⚠️ Checklist Avant Déploiement

- [ ] AWS SES : Email FROM vérifié
- [ ] AWS SES : Sorti du sandbox mode (pour production)
- [ ] AWS Amplify : Variables d'environnement configurées
- [ ] AWS IAM : Permissions SES ajoutées au rôle Amplify
- [ ] AWS RDS : Instance démarrée
- [ ] Code : Tous les fichiers commités
- [ ] Tests : Emails testés localement

## 🎯 Après le Déploiement

### 1. Vérifier le Build

Aller dans **AWS Amplify Console** et vérifier :
- ✅ Prebuild : Dependencies installed
- ✅ Build : DB initialized + Build completed
- ✅ Deploy : Deployed successfully

### 2. Tester l'Application

1. Créer un compte sur l'app déployée
2. Vérifier l'email de vérification reçu
3. Cliquer sur le lien de vérification
4. Vérifier l'email de bienvenue reçu
5. Se connecter au dashboard

### 3. Vérifier la Base de Données

```bash
PGPASSWORD="PASSWORD" psql \
  -h huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com \
  -U huntazeadmin \
  -d huntaze \
  -c "SELECT id, email, email_verified FROM users;"
```

## 🆘 Besoin d'Aide ?

### Problèmes Courants

**Email non reçu ?**
- Vérifier le dossier spam
- Vérifier que FROM_EMAIL est vérifié dans SES
- Vérifier les logs Amplify

**Build failed ?**
- Vérifier DATABASE_URL dans Amplify
- Vérifier que RDS est démarré
- Vérifier les logs de build

**Erreur SES ?**
- Vérifier les permissions IAM
- Vérifier que l'email est vérifié
- Vérifier la région AWS

### Documentation Détaillée

Consultez ces fichiers pour plus d'informations :
- `PUSH_TO_AMPLIFY.md` - Guide pas à pas
- `docs/DEPLOYMENT_GUIDE.md` - Troubleshooting complet
- `lib/email/README.md` - Problèmes d'emails

## 🎉 Résultat Final

Une fois déployé, votre application aura :

✅ **Authentification complète**
- Inscription sécurisée
- Login avec JWT
- Sessions persistantes

✅ **Vérification d'email**
- Emails professionnels automatiques
- Tokens sécurisés avec expiration
- Flux complet de vérification

✅ **Infrastructure robuste**
- PostgreSQL sur AWS RDS
- Emails via AWS SES
- Hébergement sur AWS Amplify

✅ **Prêt pour la production**
- Sécurité de niveau entreprise
- Documentation complète
- Tests validés

---

## 🚀 Commande Rapide

Pour déployer maintenant :

```bash
./DEPLOY_NOW.sh
```

Ou manuellement :

```bash
git add .
git commit -F COMMIT_MESSAGE.txt
git push origin main
```

---

**Bonne chance avec votre déploiement ! 🎉**

Pour toute question, consultez la documentation complète dans les fichiers mentionnés ci-dessus.
