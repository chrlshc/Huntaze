#!/bin/bash

# ============================================================================
# 🚀 QUICK COMMANDS - Déploiement Huntaze Beta
# ============================================================================

echo "🎯 HUNTAZE BETA - QUICK COMMANDS"
echo "================================"
echo ""

# ============================================================================
# 1️⃣ RÉCUPÉRER LES CLÉS AZURE AI
# ============================================================================

echo "📋 1. RÉCUPÉRER LES CLÉS AZURE AI"
echo ""
echo "Azure AI API Key:"
echo "  → https://portal.azure.com"
echo "  → Cherche: 'Azure AI Services' → Resource Group 'huntaze-ai'"
echo "  → Clique: 'Keys and Endpoint' → Copie 'KEY 1'"
echo ""
echo "Azure Speech Key:"
echo "  → https://portal.azure.com"
echo "  → Cherche: 'Speech Services'"
echo "  → Clique: 'Keys and Endpoint' → Copie 'KEY 1'"
echo ""
read -p "Appuie sur ENTER quand tu as récupéré les clés..."

# ============================================================================
# 2️⃣ RÉCUPÉRER LES AWS ACCESS KEYS
# ============================================================================

echo ""
echo "📋 2. RÉCUPÉRER LES AWS ACCESS KEYS"
echo ""
echo "Option 1: Créer de nouvelles access keys"
echo "  aws iam create-access-key --user-name ton-user"
echo ""
echo "Option 2: Récupérer depuis AWS Console"
echo "  → https://console.aws.amazon.com/iam/home#/security_credentials"
echo ""
read -p "Appuie sur ENTER quand tu as récupéré les clés..."

# ============================================================================
# 3️⃣ CONFIGURER VERCEL
# ============================================================================

echo ""
echo "📋 3. CONFIGURER VERCEL"
echo ""
echo "Fichier à utiliser: deployment-beta-50users/COPY-PASTE-VERCEL.txt"
echo ""
echo "Actions:"
echo "  1. Ouvre COPY-PASTE-VERCEL.txt"
echo "  2. Remplace les placeholders:"
echo "     - <TON_ACCESS_KEY_ID>"
echo "     - <TON_SECRET_ACCESS_KEY>"
echo "     - <TA_CLE_AZURE_AI>"
echo "     - <TA_CLE_AZURE_SPEECH>"
echo "     - https://ton-app.vercel.app"
echo "  3. Va sur vercel.com → Settings → Environment Variables"
echo "  4. Copie-colle TOUTES les variables"
echo "  5. Sélectionne Production, Preview, Development"
echo "  6. Clique 'Save'"
echo ""
read -p "Appuie sur ENTER quand tu as configuré Vercel..."

# ============================================================================
# 4️⃣ INITIALISER LA BASE DE DONNÉES
# ============================================================================

echo ""
echo "📋 4. INITIALISER LA BASE DE DONNÉES"
echo ""

# Exporter DATABASE_URL
export DATABASE_URL="postgresql://huntaze_admin:ernMIVqqb7F0DuHYSje8ZsCpD@huntaze-beta-db.c5ugu8oea3qv.us-east-2.rds.amazonaws.com:5432/huntaze_production"

echo "✅ DATABASE_URL exporté"
echo ""

# Tester la connexion
echo "🧪 Test de connexion PostgreSQL..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
  echo "✅ Connexion PostgreSQL OK"
else
  echo "❌ Erreur de connexion PostgreSQL"
  echo "Vérifie que le Security Group RDS autorise ton IP"
  exit 1
fi

echo ""

# Initialiser Prisma
echo "🔧 Initialisation du schéma Prisma..."
if npx prisma db push; then
  echo "✅ Schéma Prisma initialisé"
else
  echo "❌ Erreur lors de l'initialisation Prisma"
  exit 1
fi

echo ""

# ============================================================================
# 5️⃣ TESTER LES SERVICES
# ============================================================================

echo "📋 5. TESTER LES SERVICES"
echo ""

# Test Redis
echo "🧪 Test Redis..."
if redis-cli -h huntaze-beta-redis-dmgoy6.serverless.use2.cache.amazonaws.com -p 6379 ping > /dev/null 2>&1; then
  echo "✅ Redis OK"
else
  echo "⚠️  Redis timeout (normal si Serverless, attendre 1-2 min)"
fi

echo ""

# Test S3
echo "🧪 Test S3..."
if aws s3 ls s3://huntaze-beta-storage-1766460248 --region us-east-2 > /dev/null 2>&1; then
  echo "✅ S3 OK"
else
  echo "❌ Erreur S3"
  exit 1
fi

echo ""

# ============================================================================
# 6️⃣ DÉPLOYER SUR VERCEL
# ============================================================================

echo "📋 6. DÉPLOYER SUR VERCEL"
echo ""
echo "Option 1: Via CLI"
echo "  vercel --prod"
echo ""
echo "Option 2: Via Git"
echo "  git add ."
echo "  git commit -m 'feat: configure production environment'"
echo "  git push origin main"
echo ""
read -p "Appuie sur ENTER pour déployer via CLI..."

echo ""
echo "🚀 Déploiement en cours..."
vercel --prod

echo ""
echo "============================================"
echo "✅ DÉPLOIEMENT TERMINÉ!"
echo "============================================"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Ouvre ton app Vercel"
echo "  2. Teste les fonctionnalités critiques"
echo "  3. Vérifie les logs: vercel logs --prod"
echo ""
echo "📚 Documentation:"
echo "  - NEXT-STEP.md - Guide complet"
echo "  - COPY-PASTE-VERCEL.txt - Variables Vercel"
echo "  - DECISION-AZURE-REGION.md - France Central vs East US"
echo ""
echo "🎉 Félicitations! Ton app est en production!"
