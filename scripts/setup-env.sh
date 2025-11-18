#!/bin/bash

# Script de configuration de l'environnement
# Configure les variables d'environnement de manière sécurisée

set -e

echo "🔧 Configuration de l'environnement Huntaze"
echo "==========================================="
echo ""

# Vérifier si .env existe déjà
if [ -f ".env.local" ]; then
    echo "⚠️  .env.local existe déjà"
    read -p "Voulez-vous le remplacer? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuration annulée"
        exit 1
    fi
fi

# Copier le template
cp .env.example .env.local

echo "✅ Fichier .env.local créé"
echo ""
echo "📝 Vous devez maintenant éditer .env.local avec vos vraies valeurs:"
echo ""
echo "  1. DATABASE_URL - URL de votre base de données PostgreSQL"
echo "  2. NEXTAUTH_SECRET - Générez avec: openssl rand -base64 32"
echo "  3. AWS_* - Credentials AWS (utilisez aws configure de préférence)"
echo "  4. OAuth credentials pour Instagram, TikTok, Reddit"
echo ""
echo "⚠️  IMPORTANT:"
echo "  - Ne JAMAIS committer .env.local"
echo "  - Ne JAMAIS partager vos credentials"
echo "  - Utiliser AWS CLI pour les credentials AWS"
echo ""
echo "📖 Voir docs/SECURITY.md pour plus d'informations"
echo ""

# Vérifier que .env.local est dans .gitignore
if ! grep -q ".env.local" .gitignore 2>/dev/null; then
    echo ".env.local" >> .gitignore
    echo "✅ .env.local ajouté à .gitignore"
fi

echo ""
echo "🔐 Configuration AWS recommandée:"
echo "  aws configure"
echo "  # Ou pour SSO:"
echo "  aws sso login --profile huntaze"
echo ""
echo "✅ Configuration terminée!"
