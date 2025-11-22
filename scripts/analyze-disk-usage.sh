#!/bin/bash

# Script d'analyse de l'espace disque
# Usage: bash scripts/analyze-disk-usage.sh

echo "📊 Analyse de l'espace disque du projet Huntaze"
echo "================================================"
echo ""

# Taille totale
echo "📦 Taille totale du projet:"
du -sh . 2>/dev/null
echo ""

# Top directories
echo "📁 Top 15 des plus gros répertoires:"
du -sh */ 2>/dev/null | sort -hr | head -15
echo ""

# Gros fichiers (> 5MB)
echo "📄 Fichiers > 5MB (hors node_modules et .git):"
find . -type f -size +5M -not -path "./node_modules/*" -not -path "./.git/*" -exec ls -lh {} \; 2>/dev/null | awk '{print $5, $9}'
echo ""

# Fichiers temporaires
echo "🗑️  Fichiers temporaires à nettoyer:"
echo "  .DS_Store: $(find . -name ".DS_Store" -type f 2>/dev/null | wc -l | xargs)"
echo "  .tsbuildinfo: $(find . -name "*.tsbuildinfo" -type f 2>/dev/null | wc -l | xargs)"
echo "  Logs > 7 jours: $(find .kiro/build-logs* -name "*.log" -type f -mtime +7 2>/dev/null | wc -l | xargs)"
echo ""

# Breakdown par catégorie
echo "📊 Breakdown par catégorie:"
echo "  node_modules: $(du -sh node_modules 2>/dev/null | awk '{print $1}')"
echo "  .git: $(du -sh .git 2>/dev/null | awk '{print $1}')"
echo "  .next: $(du -sh .next 2>/dev/null | awk '{print $1}' || echo '0B (pas de build)')"
echo "  test-results: $(du -sh test-results 2>/dev/null | awk '{print $1}')"
echo "  lambda: $(du -sh lambda 2>/dev/null | awk '{print $1}')"
echo ""

echo "💡 Pour nettoyer: bash scripts/cleanup-disk-space.sh"
