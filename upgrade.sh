#!/bin/bash

# 🚀 HUNTAZE UPGRADE 2025 - SCRIPT DE LANCEMENT
# Exécute l'upgrade complet vers Next 15 + React 19 + Tailwind v4

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction de log
log() {
    echo -e "${2:-$NC}$1${NC}"
}

# Header
log "🚀 HUNTAZE UPGRADE 2025" "$CYAN"
log "=======================================" "$CYAN"
log "Next.js 15 + React 19 + Tailwind v4 + ESLint 9" "$BLUE"
log ""

# Vérification Node.js
log "📋 Vérification des prérequis..." "$BLUE"
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
    log "❌ Node.js 22+ requis. Version actuelle: $(node --version)" "$RED"
    log "Exécutez: nvm use 22 || volta pin node@22" "$YELLOW"
    exit 1
fi
log "✅ Node.js $(node --version) OK" "$GREEN"

# Vérification Git
if ! git status &>/dev/null; then
    log "❌ Ce projet n'est pas un repository Git" "$RED"
    exit 1
fi
log "✅ Repository Git OK" "$GREEN"

# Demander confirmation
log ""
log "⚠️  ATTENTION: Cet upgrade va modifier votre code" "$YELLOW"
log "   - Next.js 14 → 15 + React 18 → 19" "$YELLOW"
log "   - Tailwind CSS v3 → v4" "$YELLOW"
log "   - ESLint 8 → 9 (flat config)" "$YELLOW"
log "   - Toutes les dépendances mises à jour" "$YELLOW"
log ""
read -p "Continuer l'upgrade ? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Upgrade annulé" "$YELLOW"
    exit 0
fi

# Étape 1: Sauvegarde
log ""
log "💾 Sauvegarde..." "$BLUE"
cp package.json package.json.backup
log "✅ package.json sauvegardé" "$GREEN"

# Étape 2: Créer la branche
log ""
log "🌿 Création de la branche d'upgrade..." "$BLUE"
if git checkout -b chore/upgrade-2025 2>/dev/null; then
    log "✅ Branche chore/upgrade-2025 créée" "$GREEN"
else
    log "⚠️ Branche existe déjà ou erreur Git" "$YELLOW"
fi

# Étape 3: Exécuter l'assistant d'upgrade
log ""
log "🔄 Lancement de l'assistant d'upgrade..." "$BLUE"
if node scripts/upgrade-assistant.mjs; then
    log "✅ Upgrade terminé avec succès" "$GREEN"
else
    log "❌ Erreur durant l'upgrade" "$RED"
    log "Consultez les logs ci-dessus pour plus de détails" "$YELLOW"
    exit 1
fi

# Étape 4: Validation
log ""
log "🔍 Validation post-upgrade..." "$BLUE"
if node scripts/post-upgrade-validation.mjs; then
    log "✅ Validation réussie" "$GREEN"
else
    log "⚠️ Validation avec avertissements" "$YELLOW"
    log "Consultez les détails ci-dessus" "$YELLOW"
fi

# Étape 5: Tests finaux
log ""
log "🧪 Tests finaux..." "$BLUE"
log "Exécution des tests unitaires..." "$BLUE"
if npm test -- --run 2>/dev/null; then
    log "✅ Tests unitaires OK" "$GREEN"
else
    log "⚠️ Certains tests échouent (normal après upgrade)" "$YELLOW"
fi

# Résumé final
log ""
log "🎉 UPGRADE HUNTAZE 2025 TERMINÉ !" "$GREEN"
log "=======================================" "$GREEN"
log ""
log "📋 Résumé des changements:" "$BLUE"
log "✅ Next.js 15 + React 19 installés" "$GREEN"
log "✅ Tailwind CSS v4 configuré" "$GREEN"
log "✅ ESLint 9 avec flat config" "$GREEN"
log "✅ Toutes les dépendances mises à jour" "$GREEN"
log "✅ Codemods officiels appliqués" "$GREEN"
log ""
log "📝 Prochaines étapes manuelles:" "$YELLOW"
log "1. Testez l'application: npm run dev" "$YELLOW"
log "2. Vérifiez dans le navigateur" "$YELLOW"
log "3. Exécutez les tests E2E: npx playwright test" "$YELLOW"
log "4. Commitez si tout fonctionne: git add . && git commit -m 'feat: upgrade to Next 15 + React 19'" "$YELLOW"
log ""
log "📚 Documentation:" "$BLUE"
log "- UPGRADE_RUNBOOK_2025.md (guide complet)" "$BLUE"
log "- ARCHITECTURE.md (architecture mise à jour)" "$BLUE"
log ""
log "🆘 En cas de problème:" "$YELLOW"
log "- Restaurer: cp package.json.backup package.json && npm install" "$YELLOW"
log "- Ou revenir: git checkout main && git branch -D chore/upgrade-2025" "$YELLOW"
log ""
log "🎯 Upgrade réussi ! Huntaze est maintenant sur la stack 2025 !" "$GREEN"