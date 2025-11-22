#!/bin/bash

# Script pour lancer les tests de manière optimisée (faible consommation RAM)

echo "🧪 Lancement des tests optimisés..."

# Limiter la mémoire Node.js
export NODE_OPTIONS="--max-old-space-size=2048"

# Choisir le type de test
case "$1" in
  "unit")
    echo "📦 Tests unitaires uniquement..."
    npm run test:unit -- --run --reporter=basic
    ;;
  "integration")
    echo "🔗 Tests d'intégration (séquentiels)..."
    npm run test:integration -- --run --reporter=basic
    ;;
  "single")
    echo "🎯 Test unique: $2"
    npx vitest run "$2" --reporter=basic
    ;;
  *)
    echo "Usage: ./scripts/test-optimized.sh [unit|integration|single <file>]"
    echo ""
    echo "Exemples:"
    echo "  ./scripts/test-optimized.sh unit"
    echo "  ./scripts/test-optimized.sh integration"
    echo "  ./scripts/test-optimized.sh single tests/unit/beta-landing-page.test.tsx"
    exit 1
    ;;
esac

echo "✅ Tests terminés"
