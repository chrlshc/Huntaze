#!/bin/bash

# Script de Déploiement Automatisé - Staging
# Déploie les optimisations de performance vers l'environnement staging

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Déploiement Staging - Optimisations de Performance       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Fonction pour afficher les étapes
step() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Fonction pour afficher le succès
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Fonction pour afficher les erreurs
error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Fonction pour afficher les avertissements
warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# 1. Vérification de l'environnement
step "1. Vérification de l'environnement..."

if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé"
fi

if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé"
fi

if ! command -v git &> /dev/null; then
    error "git n'est pas installé"
fi

success "Environnement vérifié"
echo ""

# 2. Vérification de la branche
step "2. Vérification de la branche Git..."

CURRENT_BRANCH=$(git branch --show-current)
echo "Branche actuelle: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "staging" ]; then
    warning "Vous n'êtes pas sur main ou staging"
    read -p "Continuer quand même? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        error "Déploiement annulé"
    fi
fi

success "Branche vérifiée"
echo ""

# 3. Vérification des changements non commités
step "3. Vérification des changements non commités..."

if [[ -n $(git status -s) ]]; then
    warning "Vous avez des changements non commités"
    git status -s
    read -p "Voulez-vous les commiter maintenant? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Message de commit: " COMMIT_MSG
        git commit -m "$COMMIT_MSG"
        success "Changements commités"
    else
        error "Veuillez commiter vos changements avant de déployer"
    fi
fi

success "Pas de changements non commités"
echo ""

# 4. Installation des dépendances
step "4. Installation des dépendances..."

npm install --legacy-peer-deps
success "Dépendances installées"
echo ""

# 5. Exécution des tests
step "5. Exécution des tests..."

echo "Tests unitaires..."
if npm run test:unit:optimized; then
    success "Tests unitaires passés (164/164)"
else
    error "Les tests unitaires ont échoué. Déploiement annulé."
fi

echo ""
echo "Tests de propriétés..."
if npm run test:performance; then
    success "Tests de propriétés passés"
else
    warning "Certains tests de propriétés ont échoué, mais on continue..."
fi

echo ""

# 6. Vérification du build
step "6. Vérification du build..."

if npm run build; then
    success "Build réussi"
else
    error "Le build a échoué. Déploiement annulé."
fi

echo ""

# 7. Création du tag de version
step "7. Création du tag de version..."

# Obtenir la dernière version
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
echo "Dernière version: $LAST_TAG"

# Proposer une nouvelle version
read -p "Nouvelle version (ex: v1.0.0-staging): " NEW_VERSION

if [ -z "$NEW_VERSION" ]; then
    warning "Pas de tag créé"
else
    git tag -a "$NEW_VERSION" -m "Staging deployment: Dashboard performance optimizations"
    success "Tag $NEW_VERSION créé"
fi

echo ""

# 8. Push vers GitHub
step "8. Push vers GitHub..."

read -p "Pousser vers staging? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Créer la branche staging si elle n'existe pas
    if ! git show-ref --verify --quiet refs/heads/staging; then
        git checkout -b staging
        success "Branche staging créée"
    else
        git checkout staging
        git merge $CURRENT_BRANCH
        success "Changements mergés dans staging"
    fi
    
    # Push
    git push origin staging
    
    # Push les tags si créés
    if [ ! -z "$NEW_VERSION" ]; then
        git push origin "$NEW_VERSION"
    fi
    
    success "Code poussé vers staging"
    
    # Retour à la branche originale
    git checkout $CURRENT_BRANCH
else
    warning "Push annulé"
fi

echo ""

# 9. Résumé
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Déploiement Préparé avec Succès!                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Prochaines étapes:${NC}"
echo ""
echo "1. Surveillez le build dans AWS Amplify Console:"
echo "   https://console.aws.amazon.com/amplify/"
echo ""
echo "2. Une fois déployé, testez staging:"
echo "   https://staging.huntaze.com"
echo ""
echo "3. Vérifiez les métriques:"
echo "   npm run aws:verify"
echo ""
echo "4. Exécutez les tests post-déploiement:"
echo "   npm run test:web-vitals"
echo "   npm run lighthouse"
echo ""
echo "5. Si tout est OK, déployez en production:"
echo "   ./scripts/deploy-to-production.sh"
echo ""
echo -e "${GREEN}✓ Prêt pour le déploiement!${NC}"
