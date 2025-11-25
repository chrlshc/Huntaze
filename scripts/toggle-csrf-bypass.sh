#!/bin/bash

# Script pour activer/désactiver le contournement CSRF
# Usage: ./scripts/toggle-csrf-bypass.sh [on|off|status]

ENV_FILE=".env.local"
BYPASS_VAR="CSRF_BYPASS=true"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_status() {
    echo -e "${BLUE}🔍 Status du contournement CSRF${NC}"
    echo "================================"
    
    if [ -f "$ENV_FILE" ] && grep -q "^CSRF_BYPASS=true" "$ENV_FILE"; then
        echo -e "${YELLOW}⚠️  CONTOURNEMENT ACTIF${NC}"
        echo "   Fichier: $ENV_FILE"
        echo "   Ligne: $(grep -n "^CSRF_BYPASS=true" "$ENV_FILE")"
        echo ""
        echo -e "${RED}🚨 ATTENTION: Protection CSRF désactivée${NC}"
    elif [ -f "$ENV_FILE" ] && grep -q "^#.*CSRF_BYPASS=true" "$ENV_FILE"; then
        echo -e "${GREEN}✅ CONTOURNEMENT INACTIF (commenté)${NC}"
        echo "   Fichier: $ENV_FILE"
        echo "   Ligne: $(grep -n "^#.*CSRF_BYPASS=true" "$ENV_FILE")"
    else
        echo -e "${GREEN}✅ CONTOURNEMENT INACTIF${NC}"
        echo "   Aucune configuration trouvée dans $ENV_FILE"
    fi
    
    echo ""
    echo "Variables d'environnement actuelles:"
    env | grep CSRF || echo "   Aucune variable CSRF trouvée"
}

activate_bypass() {
    echo -e "${YELLOW}🔧 Activation du contournement CSRF...${NC}"
    
    # Créer le fichier .env.local s'il n'existe pas
    if [ ! -f "$ENV_FILE" ]; then
        touch "$ENV_FILE"
        echo "Fichier $ENV_FILE créé"
    fi
    
    # Vérifier si déjà présent
    if grep -q "^CSRF_BYPASS=true" "$ENV_FILE"; then
        echo -e "${YELLOW}⚠️  Contournement déjà actif${NC}"
        return 0
    fi
    
    # Décommenter si commenté
    if grep -q "^#.*CSRF_BYPASS=true" "$ENV_FILE"; then
        sed -i '' 's/^#.*CSRF_BYPASS=true/CSRF_BYPASS=true/' "$ENV_FILE"
        echo -e "${GREEN}✅ Contournement décommenté${NC}"
    else
        # Ajouter la ligne
        echo "" >> "$ENV_FILE"
        echo "# Contournement temporaire CSRF - SUPPRIMER EN PRODUCTION" >> "$ENV_FILE"
        echo "$BYPASS_VAR" >> "$ENV_FILE"
        echo -e "${GREEN}✅ Contournement ajouté à $ENV_FILE${NC}"
    fi
    
    echo ""
    echo -e "${RED}🚨 ATTENTION: Redémarrer le serveur pour appliquer les changements${NC}"
    echo "   npm run dev"
    echo ""
    echo -e "${RED}⚠️  SÉCURITÉ RÉDUITE - Utiliser uniquement pour le diagnostic${NC}"
}

deactivate_bypass() {
    echo -e "${BLUE}🔒 Désactivation du contournement CSRF...${NC}"
    
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${GREEN}✅ Aucun fichier $ENV_FILE trouvé${NC}"
        return 0
    fi
    
    # Commenter la ligne au lieu de la supprimer
    if grep -q "^CSRF_BYPASS=true" "$ENV_FILE"; then
        sed -i '' 's/^CSRF_BYPASS=true/#CSRF_BYPASS=true/' "$ENV_FILE"
        echo -e "${GREEN}✅ Contournement désactivé (commenté)${NC}"
        echo ""
        echo -e "${GREEN}🔒 Protection CSRF réactivée${NC}"
        echo "   Redémarrer le serveur: npm run dev"
    else
        echo -e "${GREEN}✅ Contournement déjà inactif${NC}"
    fi
}

show_help() {
    echo "Usage: $0 [on|off|status|help]"
    echo ""
    echo "Commandes:"
    echo "  on      - Activer le contournement CSRF"
    echo "  off     - Désactiver le contournement CSRF"
    echo "  status  - Afficher le status actuel"
    echo "  help    - Afficher cette aide"
    echo ""
    echo "Exemples:"
    echo "  $0 on     # Activer pour déboguer"
    echo "  $0 off    # Désactiver après le fix"
    echo "  $0 status # Vérifier l'état actuel"
}

# Main
case "${1:-status}" in
    "on"|"activate"|"enable")
        activate_bypass
        echo ""
        show_status
        ;;
    "off"|"deactivate"|"disable")
        deactivate_bypass
        echo ""
        show_status
        ;;
    "status"|"check")
        show_status
        ;;
    "help"|"--help"|"h")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Commande inconnue: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
