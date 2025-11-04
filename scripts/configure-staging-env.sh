#!/bin/bash

echo "🚀 CONFIGURATION STAGING - VARIABLES D'ENVIRONNEMENT"
echo "=================================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Variables d'environnement pour le staging AWS Amplify${NC}"
echo ""

echo -e "${YELLOW}🔑 VARIABLES CRITIQUES:${NC}"
echo "DATABASE_URL=postgresql://huntazeadmin:1o612aUCXFMESpcNQWXITJWG0@huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com:5432/huntaze?schema=public&sslmode=require"
echo "JWT_SECRET=huntaze-super-secret-jwt-key-change-this-in-production-2025"
echo "NODE_ENV=production"
echo ""

echo -e "${YELLOW}🤖 AZURE AI:${NC}"
echo "AZURE_OPENAI_API_KEY=REDACTED"
echo "AZURE_OPENAI_ENDPOINT=https://huntaze-ai-eus2-29796.openai.azure.com"
echo "AZURE_OPENAI_API_VERSION=2024-05-01-preview"
echo "AZURE_OPENAI_DEPLOYMENT=gpt-4o"
echo ""

echo -e "${YELLOW}🌐 URLs:${NC}"
echo "NEXT_PUBLIC_APP_URL=https://staging.d1234567890.amplifyapp.com"
echo "FROM_EMAIL=noreply@huntaze.com"
echo ""

echo -e "${GREEN}📝 ÉTAPES À SUIVRE:${NC}"
echo "1. Aller sur AWS Amplify Console"
echo "2. Sélectionner l'app Huntaze"
echo "3. Aller dans 'Hosting environments' > 'staging'"
echo "4. Cliquer 'Environment variables' > 'Manage variables'"
echo "5. Copier-coller les variables ci-dessus"
echo "6. Cliquer 'Save'"
echo "7. Redéployer staging"
echo ""

echo -e "${BLUE}🔗 Lien direct AWS Amplify:${NC}"
echo "https://console.aws.amazon.com/amplify/"
echo ""

echo -e "${GREEN}✅ Après configuration, tester:${NC}"
echo "curl -s \"https://staging.d1234567890.amplifyapp.com/api/health/overall\" | jq ."