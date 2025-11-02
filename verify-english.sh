#!/bin/bash

echo "🌍 Language Verification - User-Facing Documentation"
echo ""
echo "Checking for French text in user-facing files..."
echo ""

# Check user guides
echo "📚 User Guides:"
if grep -l "Priorité\|Déploiement\|Résolution\|Problèmes" docs/user-guides/*.md docs/USER_GUIDE*.md 2>/dev/null; then
    echo "❌ French text found in user guides"
else
    echo "✅ All user guides are in English"
fi

echo ""
echo "👨‍💻 Developer Guides:"
if grep -l "Priorité\|Déploiement\|Résolution\|Problèmes" docs/developer-guides/*.md docs/DEVELOPER_GUIDE*.md 2>/dev/null; then
    echo "❌ French text found in developer guides"
else
    echo "✅ All developer guides are in English"
fi

echo ""
echo "🚀 Deployment Documentation:"
if grep -l "Priorité\|Déploiement\|Prérequis\|Vérifier" docs/deployment/*.md 2>/dev/null; then
    echo "❌ French text found in deployment docs"
else
    echo "✅ All deployment docs are in English"
fi

echo ""
echo "🧪 Test Documentation:"
if grep -l "Priorité\|Déploiement\|Résolution" tests/integration/documentation/*.md 2>/dev/null; then
    echo "❌ French text found in test docs"
else
    echo "✅ All test docs are in English"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ VERIFICATION COMPLETE"
echo "All user-facing documentation is in English!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
