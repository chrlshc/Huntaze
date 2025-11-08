#!/bin/bash

# Build Warnings Fixes - Git Commit Script
# Date: 7 novembre 2024

echo "🚀 Préparation du commit pour build-warnings-fixes..."
echo ""

# Ajouter tous les fichiers modifiés
echo "📦 Ajout des fichiers modifiés..."

# Smart Onboarding Services
git add lib/smart-onboarding/services/contextualHelpService.ts
git add lib/smart-onboarding/services/dataValidationService.ts
git add lib/smart-onboarding/services/dataWarehouseService.ts
git add lib/smart-onboarding/services/dynamicPathOptimizer.ts
git add lib/smart-onboarding/services/interventionEffectivenessTracker.ts

# Analytics Pages
git add app/analytics/advanced/page.tsx
git add app/platforms/onlyfans/analytics/page.tsx
git add app/api/smart-onboarding/analytics/insights/route.ts

# Content Components
git add components/content/ContentCalendar.tsx
git add components/content/MediaPicker.tsx
git add components/content/ProductivityDashboard.tsx
git add components/content/TagAnalytics.tsx
git add components/content/VariationManager.tsx
git add components/content/VariationPerformance.tsx

# Marketing Components
git add app/fans/mobile-page.tsx
git add components/sections/marketing/ForEveryone.tsx
git add components/sections/marketing/GrowGlobally.tsx
git add components/sections/marketing/QuickStart.tsx

# Configuration Files
git add lib/analytics/enterprise-events.ts
git add lib/db/index.ts
git add lib/smart-onboarding/repositories/struggleIndicatorsRepository.ts
git add src/lib/of/psychological-sales-tactics.ts
git add src/lib/of/trend-detector.ts

# UI Components
git add components/ui/Skeleton.tsx
git add app/demo/skeleton/page.tsx

# Scripts de validation
git add scripts/validate-functionality-preservation.js
git add scripts/validate-performance-improvements.js

# Documentation
git add BUILD_WARNINGS_FIXES_COMPLETE.md
git add BUILD_WARNINGS_FIXES_FINAL_SUMMARY.md
git add BUILD_WARNINGS_FIXES_COMMIT.txt
git add SESSION_BUILD_WARNINGS_COMPLETE.md
git add GIT_COMMIT_BUILD_WARNINGS.sh

# Spec files
git add .kiro/specs/build-warnings-fixes/tasks.md

echo "✅ Fichiers ajoutés!"
echo ""

# Afficher le statut
echo "📊 Statut Git:"
git status --short

echo ""
echo "📝 Message de commit:"
echo "---"
cat BUILD_WARNINGS_FIXES_COMMIT.txt
echo "---"
echo ""

# Demander confirmation
read -p "🤔 Voulez-vous commiter ces changements? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "💾 Création du commit..."
    git commit -F BUILD_WARNINGS_FIXES_COMMIT.txt
    
    echo ""
    echo "✅ Commit créé avec succès!"
    echo ""
    echo "🎯 Prochaines étapes:"
    echo "  1. Vérifier le commit: git log -1"
    echo "  2. Pousser vers remote: git push origin <branch>"
    echo "  3. Créer une PR si nécessaire"
    echo ""
    echo "📊 Statistiques du commit:"
    git show --stat
else
    echo ""
    echo "❌ Commit annulé."
    echo "💡 Les fichiers restent staged. Utilisez 'git reset' pour unstage."
fi

echo ""
echo "🎉 Script terminé!"
