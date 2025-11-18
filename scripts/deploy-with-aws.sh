#!/bin/bash

# Script de déploiement sécurisé avec AWS
# Les credentials AWS doivent être configurés via AWS CLI ou variables d'environnement

set -e

echo "🚀 Déploiement Huntaze avec AWS"
echo "================================"
echo ""

# Vérifier que les credentials AWS sont configurés
if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
    echo "❌ Erreur: Credentials AWS non configurés"
    echo ""
    echo "Configurez vos credentials AWS avec:"
    echo "  export AWS_ACCESS_KEY_ID='your_key'"
    echo "  export AWS_SECRET_ACCESS_KEY='your_secret'"
    echo "  export AWS_SESSION_TOKEN='your_token'  # Si nécessaire"
    echo ""
    echo "Ou utilisez: aws configure"
    exit 1
fi

echo "✅ Credentials AWS détectés"
echo ""

# 1. Générer le client Prisma
echo "📦 Génération du client Prisma..."
npx prisma generate
echo "✅ Client Prisma généré"
echo ""

# 2. Exécuter les migrations
echo "🗄️  Exécution des migrations..."
npx prisma migrate deploy
echo "✅ Migrations appliquées"
echo ""

# 3. Build Next.js
echo "🏗️  Build Next.js..."
npm run build
echo "✅ Build complété"
echo ""

# 4. Commit et push
echo "📝 Commit des changements..."
git add .
git commit -m "feat: API corrections + onboarding removal + Instagram fix

- Standardize 13 APIs with consistent response format
- Remove onboarding requirement from 15 endpoints
- Fix Instagram publish API (add oauth_accounts table)
- Add comprehensive documentation
- All APIs now accessible to authenticated users

Breaking Changes: None
Migration Required: Yes (Prisma migrate deploy)
" || echo "Rien à committer"

echo ""
echo "🚀 Push vers Git..."
git push origin main

echo ""
echo "✅ Déploiement complété!"
echo ""
echo "📋 Prochaines étapes:"
echo "  1. Vérifier le déploiement sur Amplify"
echo "  2. Tester les APIs en staging"
echo "  3. Monitorer les logs"
