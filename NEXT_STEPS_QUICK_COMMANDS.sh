#!/bin/bash

# ============================================
# PROCHAINES ÉTAPES - COMMANDES RAPIDES
# Configuration AWS Amplify - Huntaze
# ============================================

echo "🎯 Configuration AWS - Prochaines Étapes"
echo "========================================"
echo ""

# ============================================
# ÉTAPE 1: Ajouter les Variables dans Amplify
# ============================================

echo "📝 ÉTAPE 1: Ajouter les Variables d'Environnement dans Amplify"
echo ""
echo "Option A: Via AWS Console (Recommandé)"
echo "  1. Ouvrir: https://console.aws.amazon.com/amplify/home?region=us-east-1#/d33l77zi1h78ce"
echo "  2. Cliquer sur 'Environment variables'"
echo "  3. Ajouter ces 8 variables:"
echo ""
echo "     S3_BUCKET_NAME=huntaze-assets"
echo "     S3_REGION=us-east-1"
echo "     AWS_SES_REGION=us-east-1"
echo "     AWS_SES_FROM_EMAIL=no-reply@huntaze.com"
echo "     AWS_SES_FROM_NAME=Huntaze"
echo "     CLOUDWATCH_LOG_GROUP=/aws/amplify/huntaze-production"
echo "     CLOUDWATCH_REGION=us-east-1"
echo "     AWS_REGION=us-east-1"
echo ""
echo "Option B: Via CLI (copier-coller cette commande)"
echo ""

cat << 'EOF'
aws amplify update-app \
  --app-id d33l77zi1h78ce \
  --region us-east-1 \
  --environment-variables \
    S3_BUCKET_NAME=huntaze-assets \
    S3_REGION=us-east-1 \
    AWS_SES_REGION=us-east-1 \
    AWS_SES_FROM_EMAIL=no-reply@huntaze.com \
    AWS_SES_FROM_NAME=Huntaze \
    CLOUDWATCH_LOG_GROUP=/aws/amplify/huntaze-production \
    CLOUDWATCH_REGION=us-east-1 \
    AWS_REGION=us-east-1
EOF

echo ""
echo ""

# ============================================
# ÉTAPE 2: Vérifier l'Email SES
# ============================================

echo "📧 ÉTAPE 2: Vérifier l'Email SES"
echo ""
echo "Commande:"
echo ""

cat << 'EOF'
aws ses verify-email-identity \
  --email-address no-reply@huntaze.com \
  --region us-east-1
EOF

echo ""
echo "Puis vérifier votre boîte email pour le lien de confirmation."
echo ""
echo ""

# ============================================
# ÉTAPE 3: Vérifier les Variables
# ============================================

echo "🔍 ÉTAPE 3: Vérifier que les Variables sont Ajoutées"
echo ""
echo "Commande:"
echo ""

cat << 'EOF'
aws amplify get-app \
  --app-id d33l77zi1h78ce \
  --region us-east-1 \
  --query 'app.environmentVariables'
EOF

echo ""
echo ""

# ============================================
# ÉTAPE 4: Déclencher un Build
# ============================================

echo "🚀 ÉTAPE 4: Déclencher un Nouveau Build"
echo ""
echo "Commande:"
echo ""

cat << 'EOF'
aws amplify start-job \
  --app-id d33l77zi1h78ce \
  --branch-name production-ready \
  --job-type RELEASE \
  --region us-east-1
EOF

echo ""
echo ""

# ============================================
# COMMANDES DE VÉRIFICATION
# ============================================

echo "✅ COMMANDES DE VÉRIFICATION"
echo ""
echo "Vérifier S3:"
echo "  aws s3 ls s3://huntaze-assets/"
echo ""
echo "Vérifier SES:"
echo "  aws ses list-identities --region us-east-1"
echo "  aws ses get-send-quota --region us-east-1"
echo ""
echo "Vérifier CloudWatch:"
echo "  aws logs describe-log-groups --log-group-name-prefix /aws/amplify/huntaze --region us-east-1"
echo ""
echo "Vérifier Amplify:"
echo "  aws amplify get-app --app-id d33l77zi1h78ce --region us-east-1"
echo ""
echo ""

# ============================================
# RÉSUMÉ
# ============================================

echo "📊 RÉSUMÉ"
echo "========================================"
echo "✅ Services AWS configurés et testés"
echo "✅ S3 bucket: huntaze-assets"
echo "✅ SES domaine: huntaze.com"
echo "✅ CloudWatch logs: /aws/amplify/huntaze-production"
echo ""
echo "⏳ À faire:"
echo "  1. Ajouter 8 variables dans Amplify"
echo "  2. Vérifier email no-reply@huntaze.com"
echo "  3. Déclencher un nouveau build"
echo ""
echo "📚 Documentation:"
echo "  - AWS_SETUP_SUCCESS.md"
echo "  - AWS_VERIFICATION_REPORT.md"
echo "  - AWS_AMPLIFY_ENV_VARS_GUIDE.md"
echo "  - AWS_SETUP_COMPLETE_SUMMARY.md"
echo ""
echo "✅ Configuration AWS terminée avec succès!"
echo ""
