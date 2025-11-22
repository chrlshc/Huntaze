#!/bin/bash

# Script pour réactiver les tests beta

echo "✅ Réactivation des tests beta..."

# Renommer les fichiers pour les réactiver (retirer .disabled)
mv tests/unit/beta-landing-page.test.tsx.disabled tests/unit/beta-landing-page.test.tsx 2>/dev/null
mv tests/unit/responsive-layout.property.test.tsx.disabled tests/unit/responsive-layout.property.test.tsx 2>/dev/null
mv tests/unit/animation-performance.test.ts.disabled tests/unit/animation-performance.test.ts 2>/dev/null

echo "✅ Tests beta réactivés"
echo ""
echo "Pour les lancer de manière optimisée:"
echo "  npm run test:beta"
