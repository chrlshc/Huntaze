#!/bin/bash
# Script de déploiement frontend local/manuel

set -e

echo "🎨 Déploiement Frontend Huntaze"
echo "==============================="

# Vérifier les variables
if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "⚠️  NEXT_PUBLIC_API_URL non défini, utilisation de la valeur par défaut"
    export NEXT_PUBLIC_API_URL="https://api.huntaze.com"
fi

echo "1️⃣ Installation des dépendances..."
npm ci

echo "2️⃣ Build Next.js..."
npm run build

echo "3️⃣ Options de déploiement:"
echo "   a) Export statique (S3/CDN)"
echo "   b) Serveur Node.js (PM2)"
echo "   c) Docker"

# Option A: Export statique
if [ "$DEPLOY_MODE" = "static" ]; then
    echo "📦 Export statique..."
    npm run export
    echo "✅ Fichiers prêts dans ./out/"
    echo "   Uploadez vers S3/CDN"
fi

# Option B: PM2
if [ "$DEPLOY_MODE" = "pm2" ]; then
    echo "🔄 Démarrage PM2..."
    pm2 restart huntaze-frontend || pm2 start npm --name huntaze-frontend -- start
fi

# Option C: Docker
if [ "$DEPLOY_MODE" = "docker" ]; then
    echo "🐳 Build Docker..."
    docker build -t huntaze-frontend:latest .
    docker stop huntaze-frontend || true
    docker run -d --name huntaze-frontend -p 3001:3000 huntaze-frontend:latest
fi

echo "✅ Déploiement frontend terminé!"