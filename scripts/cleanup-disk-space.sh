#!/bin/bash

# Script de nettoyage automatique de l'espace disque
# Usage: bash scripts/cleanup-disk-space.sh

set -e

echo "🧹 Nettoyage de l'espace disque..."
echo ""

# Fonction pour afficher la taille avant/après
show_size() {
  du -sh . 2>/dev/null | awk '{print $1}'
}

BEFORE=$(show_size)
echo "📊 Taille actuelle: $BEFORE"
echo ""

# 1. Supprimer les fichiers temporaires macOS
echo "🗑️  Suppression des .DS_Store..."
find . -name ".DS_Store" -type f -delete 2>/dev/null || true

# 2. Supprimer les fichiers de cache TypeScript
echo "🗑️  Suppression des .tsbuildinfo..."
find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true

# 3. Nettoyer le cache de build Next.js
echo "🗑️  Suppression du cache .next..."
rm -rf .next 2>/dev/null || true

# 4. Nettoyer les vieux logs (> 7 jours)
echo "🗑️  Suppression des vieux logs..."
find .kiro/build-logs -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
find .kiro/build-logs-test -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

# 5. Nettoyer les résultats de tests
echo "🗑️  Suppression des résultats de tests..."
rm -rf test-results/* 2>/dev/null || true
rm -rf playwright-report 2>/dev/null || true
rm -rf coverage 2>/dev/null || true

# 6. Nettoyer le cache npm
echo "🗑️  Nettoyage du cache npm..."
npm cache clean --force 2>/dev/null || true

# 7. Optimiser Git
echo "🗑️  Optimisation du dépôt Git..."
git gc --aggressive --prune=now 2>/dev/null || true

# 8. Supprimer les gros fichiers de lambda si non nécessaires
if [ -f "lambda/send-worker.zip" ]; then
  echo "⚠️  Fichier lambda/send-worker.zip détecté (7.1MB)"
  echo "   Vous pouvez le supprimer si non utilisé en dev"
fi

echo ""
AFTER=$(show_size)
echo "✅ Nettoyage terminé!"
echo "📊 Taille avant: $BEFORE"
echo "📊 Taille après: $AFTER"
echo ""
echo "💡 Conseil: Ajoutez ce script à vos hooks Git pour un nettoyage automatique"
