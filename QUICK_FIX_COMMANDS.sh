#!/bin/bash

# ============================================
# QUICK FIX - Commandes Rapides
# ============================================

echo "🎯 HUNTAZE - Configuration Rapide Amplify"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Étape 1: Générer les secrets${NC}"
echo "-------------------------------------------"
echo ""

echo -e "${YELLOW}NEXTAUTH_SECRET:${NC}"
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "$NEXTAUTH_SECRET"
echo ""

echo -e "${YELLOW}CSRF_SECRET:${NC}"
CSRF_SECRET=$(openssl rand -base64 32)
echo "$CSRF_SECRET"
echo ""

echo -e "${GREEN}✅ Secrets générés!${NC}"
echo ""
echo "-------------------------------------------"
echo ""

echo -e "${BLUE}Étape 2: Copier ces variables dans Amplify Console${NC}"
echo "-------------------------------------------"
echo ""
echo "Allez sur:"
echo "https://console.aws.amazon.com/amplify/home?region=us-east-1#/d33l77zi1h78ce"
echo ""
echo "Puis ajoutez ces variables:"
echo ""

cat << EOF
NODE_ENV=production
AMPLIFY_ENV=production-ready
NEXT_PUBLIC_APP_URL=https://production-ready.d33l77zi1h78ce.amplifyapp.com
AUTH_TRUST_HOST=true

# ⚠️ REMPLACEZ username et password avec vos vraies credentials RDS!
DATABASE_URL=postgresql://username:password@huntaze-postgres-production-encrypted.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?sslmode=require

REDIS_HOST=huntaze-redis-production.asmyhp.0001.use1.cache.amazonaws.com
REDIS_PORT=6379

NEXTAUTH_URL=https://production-ready.d33l77zi1h78ce.amplifyapp.com
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
CSRF_SECRET=$CSRF_SECRET

# ⚠️ REMPLACEZ avec vos vraies credentials AWS!
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<VOTRE_AWS_ACCESS_KEY>
AWS_SECRET_ACCESS_KEY=<VOTRE_AWS_SECRET_KEY>
S3_BUCKET_NAME=huntaze-assets
S3_REGION=us-east-1

# ⚠️ REMPLACEZ avec votre vraie clé Gemini!
GEMINI_API_KEY=<VOTRE_GEMINI_API_KEY>

# ⚠️ REMPLACEZ avec vos vraies credentials SES!
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@huntaze.com
AWS_SES_FROM_NAME=Huntaze
EMAIL_FROM=noreply@huntaze.com
EMAIL_SERVER_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=<VOTRE_SES_USERNAME>
EMAIL_SERVER_PASSWORD=<VOTRE_SES_PASSWORD>
EOF

echo ""
echo "-------------------------------------------"
echo ""

echo -e "${BLUE}Étape 3: Redéployer${NC}"
echo "-------------------------------------------"
echo ""
echo "Option A - Via Console Amplify:"
echo "  1. Cliquez sur 'Redeploy this version'"
echo ""
echo "Option B - Via AWS CLI:"
echo "  aws amplify start-job \\"
echo "    --app-id d33l77zi1h78ce \\"
echo "    --branch-name production-ready \\"
echo "    --job-type RELEASE"
echo ""

echo "-------------------------------------------"
echo ""
echo -e "${GREEN}✅ Configuration terminée!${NC}"
echo ""
echo "📚 Documentation complète:"
echo "  - Guide rapide: AMPLIFY_ENV_CHECKLIST.md"
echo "  - Guide complet: AMPLIFY_ENV_VARS_SETUP.md"
echo "  - Script interactif: ./scripts/setup-amplify-env.sh"
echo ""
echo "🎯 Votre app sera disponible sur:"
echo "  https://production-ready.d33l77zi1h78ce.amplifyapp.com"
echo ""
