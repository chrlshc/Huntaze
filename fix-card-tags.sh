#!/bin/bash

# Script pour corriger les balises Card non fermées

files=(
  "components/content/AIAssistant.tsx"
  "components/content/BatchOperationsToolbar.tsx"
  "components/content/ContentCalendar.tsx"
  "components/content/ContentList.tsx"
  "components/content/ContentValidator.tsx"
  "components/content/TagAnalytics.tsx"
  "components/content/TagInput.tsx"
  "components/content/TemplateSelector.tsx"
  "components/content/VariationManager.tsx"
  "components/dashboard/DashboardErrorBoundary.tsx"
  "components/dashboard/EffectiveTakeRateCard.tsx"
  "components/dashboard/LoadingStates.tsx"
  "components/home/DashboardMockSection.tsx"
  "components/hz/ConnectorCard.tsx"
  "components/hz/PWAInstall.tsx"
  "components/integrations/AccountSwitcher.tsx"
  "components/InteractiveDemo.tsx"
  "components/PricingSection.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Checking $file..."
    # Compter les balises Card ouvertes et fermées
    open_count=$(grep -o "<Card" "$file" | wc -l)
    close_count=$(grep -o "</Card>" "$file" | wc -l)
    
    if [ "$open_count" -ne "$close_count" ]; then
      echo "  ⚠️  Mismatch: $open_count open, $close_count close"
    else
      echo "  ✓ Balanced"
    fi
  fi
done
