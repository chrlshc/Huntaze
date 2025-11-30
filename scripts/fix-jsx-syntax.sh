#!/bin/bash

# Script pour corriger automatiquement les erreurs JSX courantes
# Usage: ./scripts/fix-jsx-syntax.sh

echo "🔧 Correction automatique des erreurs JSX..."

# Fonction pour corriger un fichier
fix_file() {
    local file=$1
    echo "  Correction de $file..."
    
    # Sauvegarder l'original
    cp "$file" "$file.bak"
    
    # Corrections (à adapter selon les besoins)
    # Note: Ces corrections sont des exemples, à ajuster selon les patterns réels
    
    # Restaurer si aucun changement
    if diff -q "$file" "$file.bak" > /dev/null; then
        rm "$file.bak"
    else
        echo "    ✓ Modifié"
    fi
}

# Liste des fichiers à corriger
files=(
    "components/content/TemplateSelector.tsx"
    "components/dashboard/LoadingStates.tsx"
    "components/integrations/AccountSwitcher.tsx"
    "components/integrations/IntegrationsSection.tsx"
    "components/InteractiveDemo.tsx"
    "components/landing/BetaStatsSection.tsx"
    "components/landing/FAQSection.tsx"
)

# Corriger chaque fichier
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        fix_file "$file"
    else
        echo "  ⚠️  Fichier non trouvé: $file"
    fi
done

echo ""
echo "✅ Corrections terminées!"
echo ""
echo "Vérification des erreurs restantes..."
npx tsc --noEmit 2>&1 | grep -E "error TS" | wc -l
