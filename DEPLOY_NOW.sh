#!/bin/bash

# 🚀 Script de Déploiement Huntaze
# Ce script vous guide à travers le déploiement complet

set -e

echo "🚀 Déploiement Huntaze - Email Verification System"
echo "=================================================="
echo ""

# Couleurs pour le terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Fonction pour afficher les étapes
step() {
    echo -e "${BLUE}▶ $1${NC}"
}

success() {
    echo -e "${GREEN}✓ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

error() {
    echo -e "${RED}✗ $1${NC}"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Erreur: package.json non trouvé. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

success "Répertoire correct détecté"
echo ""

# Étape 1: Vérifier AWS SES
step "Étape 1/5: Vérification AWS SES"
echo ""
echo "Vérifiez que votre email est vérifié dans AWS SES:"
echo ""
echo "  aws ses get-identity-verification-attributes \\"
echo "    --identities noreply@huntaze.com"
echo ""
read -p "Votre email est-il vérifié dans SES ? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "Veuillez d'abord vérifier votre email dans AWS SES:"
    echo ""
    echo "  1. Allez sur https://console.aws.amazon.com/ses"
    echo "  2. Cliquez sur 'Verified identities'"
    echo "  3. Cliquez sur 'Create identity'"
    echo "  4. Sélectionnez 'Email address'"
    echo "  5. Entrez: noreply@huntaze.com"
    echo "  6. Vérifiez l'email reçu"
    echo ""
    exit 1
fi
success "Email SES vérifié"
echo ""

# Étape 2: Vérifier les variables Amplify
step "Étape 2/5: Configuration Amplify"
echo ""
echo "Assurez-vous que ces variables sont configurées dans Amplify:"
echo ""
echo "  DATABASE_URL=postgresql://huntazeadmin:PASSWORD@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze"
echo "  JWT_SECRET=huntaze-super-secret-jwt-key-change-this-in-production-2025"
echo "  FROM_EMAIL=noreply@huntaze.com"
echo "  AWS_REGION=us-east-1"
echo "  NEXT_PUBLIC_APP_URL=https://your-app.amplifyapp.com"
echo ""
read -p "Les variables sont-elles configurées dans Amplify ? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "Veuillez configurer les variables dans Amplify:"
    echo ""
    echo "  1. Allez sur https://console.aws.amazon.com/amplify"
    echo "  2. Sélectionnez votre app"
    echo "  3. Allez dans 'Environment variables'"
    echo "  4. Ajoutez toutes les variables ci-dessus"
    echo ""
    exit 1
fi
success "Variables Amplify configurées"
echo ""

# Étape 3: Vérifier les permissions IAM
step "Étape 3/5: Permissions IAM"
echo ""
echo "Le rôle IAM d'Amplify doit avoir ces permissions:"
echo ""
echo "  {" 
echo "    \"Effect\": \"Allow\","
echo "    \"Action\": ["
echo "      \"ses:SendEmail\","
echo "      \"ses:SendRawEmail\""
echo "    ],"
echo "    \"Resource\": \"*\""
echo "  }"
echo ""
read -p "Les permissions IAM sont-elles configurées ? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "Veuillez ajouter les permissions IAM:"
    echo ""
    echo "  1. Allez sur https://console.aws.amazon.com/iam"
    echo "  2. Cherchez le rôle Amplify (ex: amplify-huntaze-main-xxxxx)"
    echo "  3. Cliquez 'Add permissions' → 'Create inline policy'"
    echo "  4. Collez le JSON ci-dessus"
    echo "  5. Nommez la policy 'SESEmailSending'"
    echo ""
    exit 1
fi
success "Permissions IAM configurées"
echo ""

# Étape 4: Vérifier les changements Git
step "Étape 4/5: Vérification des changements"
echo ""
git status
echo ""
read -p "Voulez-vous voir les différences ? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git diff --stat
fi
echo ""

# Étape 5: Commit et Push
step "Étape 5/5: Commit et Push"
echo ""
echo "Prêt à commiter et pousser les changements ?"
echo ""
read -p "Continuer ? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    warning "Déploiement annulé"
    exit 0
fi

# Ajouter tous les fichiers
step "Ajout des fichiers..."
git add .
success "Fichiers ajoutés"

# Commit avec le message préparé
step "Création du commit..."
if [ -f "COMMIT_MESSAGE.txt" ]; then
    git commit -F COMMIT_MESSAGE.txt
else
    git commit -m "feat: Add complete email verification system with AWS SES

- Database setup with users, sessions, email_verification_tokens tables
- AWS SES integration for transactional emails
- Email verification flow with 24h token expiry
- Professional HTML email templates
- Complete deployment configuration
- Comprehensive documentation

Ready for production deployment on AWS Amplify"
fi
success "Commit créé"

# Push vers origin main
step "Push vers GitHub..."
git push origin main
success "Code poussé sur GitHub"

echo ""
echo "=================================================="
echo -e "${GREEN}🎉 Déploiement lancé avec succès !${NC}"
echo "=================================================="
echo ""
echo "Prochaines étapes:"
echo ""
echo "  1. Allez sur AWS Amplify Console"
echo "  2. Vérifiez que le build démarre automatiquement"
echo "  3. Suivez les logs du build"
echo "  4. Attendez que le déploiement soit terminé (~5-10 min)"
echo "  5. Testez l'inscription sur votre app"
echo ""
echo "Liens utiles:"
echo "  - Amplify: https://console.aws.amazon.com/amplify"
echo "  - SES: https://console.aws.amazon.com/ses"
echo "  - RDS: https://console.aws.amazon.com/rds"
echo ""
echo "Documentation:"
echo "  - Guide de déploiement: docs/DEPLOYMENT_GUIDE.md"
echo "  - Guide de push: PUSH_TO_AMPLIFY.md"
echo "  - Résumé: TODAY_SUMMARY.md"
echo ""
echo -e "${GREEN}Bonne chance ! 🚀${NC}"
echo ""
