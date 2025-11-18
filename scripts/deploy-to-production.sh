#!/bin/bash
set -e

echo "🚀 Déploiement Production - Huntaze"
echo "===================================="
echo ""

# Vérifier que les credentials AWS sont configurés
if [ -z "$AWS_ACCESS_KEY_ID" ]; then
    echo "❌ AWS_ACCESS_KEY_ID non configuré"
    echo "Configurez vos credentials AWS avant d'exécuter ce script"
    exit 1
fi

echo "✅ Credentials AWS détectés"
echo ""

# Étape 1: Générer Prisma
echo "📦 1/4 - Génération Prisma..."
npx prisma generate
echo "✅ Prisma généré"
echo ""

# Étape 2: Migrations (baseline pour DB existante)
echo "🗄️  2/4 - Synchronisation migrations..."
npx prisma migrate resolve --applied "20241117_add_content_marketing_transactions_subscriptions" || true
npx prisma migrate resolve --applied "20241117_add_oauth_accounts" || true
npx prisma migrate deploy
echo "✅ Migrations synchronisées"
echo ""

# Étape 3: Commit
echo "📝 3/4 - Commit..."
git add .
git commit -m "feat: API corrections and deployment ready" || echo "Rien à committer"
echo ""

# Étape 4: Push
echo "🚀 4/4 - Push vers Git..."
git push huntaze staging-new
echo ""

echo "✅ DÉPLOIEMENT COMPLÉTÉ!"
