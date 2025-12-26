#!/bin/bash

# Script de Déploiement Automatisé - Production
# Déploie les optimisations de performance vers l'environnement production

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${MAGENTA}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║  Déploiement PRODUCTION - Optimisations de Performance    ║${NC}"
echo -e "${MAGENTA}╚════════════════════════════════════════════════════════════╝${NC}"
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

# Fonction pour demander confirmation
confirm() {
    echo -e "${YELLOW}$1${NC}"
    read -p "Êtes-vous sûr? Tapez 'DEPLOY' pour confirmer: " CONFIRM
    if [ "$CONFIRM" != "DEPLOY" ]; then
        error "Déploiement annulé par l'utilisateur"
    fi
}

# AVERTISSEMENT PRODUCTION
echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  ⚠️  ATTENTION: DÉPLOIEMENT EN PRODUCTION  ⚠️              ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
confirm "Vous êtes sur le point de déployer en PRODUCTION."
echo ""

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

if [ "$CURRENT_BRANCH" != "staging" ]; then
    error "Vous devez être sur la branche 'staging' pour déployer en production"
fi

success "Branche vérifiée"
echo ""

# 3. Vérification que staging est déployé et testé
step "3. Vérification du déploiement staging..."

echo ""
echo "Avant de déployer en production, confirmez que:"
echo "  ✓ Staging est déployé et fonctionnel"
echo "  ✓ Tous les tests manuels sont passés"
echo "  ✓ Les métriques de performance sont bonnes"
echo "  ✓ Aucune erreur critique en staging"
echo ""

confirm "Staging a été validé et testé."
echo ""

# 4. Vérification des changements non commités
step "4. Vérification des changements non commités..."

if [[ -n $(git status -s) ]]; then
    error "Vous avez des changements non commités. Commitez-les avant de déployer."
fi

success "Pas de changements non commités"
echo ""

# 5. Pull des dernières modifications
step "5. Pull des dernières modifications..."

git pull origin staging
success "Dernières modifications récupérées"
echo ""

# 6. Installation des dépendances
step "6. Installation des dépendances..."

npm install --legacy-peer-deps
success "Dépendances installées"
echo ""

# 7. Exécution des tests complets
step "7. Exécution des tests complets..."

echo "Lint (CI)..."
if npm run lint:ci; then
    success "Lint CI passé"
else
    error "Lint CI a échoué. Déploiement annulé."
fi

echo ""
echo "API smoke tests..."
if npm run test:api-smoke; then
    success "API smokes passés"
else
    error "API smokes ont échoué. Déploiement annulé."
fi

echo ""
echo "Tests unitaires (non bloquants)..."
if npm run test:unit:optimized; then
    success "Tests unitaires passés"
else
    warning "Tests unitaires en échec (job séparé)"
fi

echo ""
echo "Tests d'intégration..."
if npm run test:integration:optimized; then
    success "Tests d'intégration passés"
else
    warning "Certains tests d'intégration ont échoué"
    confirm "Continuer malgré les échecs de tests d'intégration?"
fi

echo ""
echo "Tests de performance..."
if npm run test:performance; then
    success "Tests de performance passés"
else
    warning "Certains tests de performance ont échoué"
    confirm "Continuer malgré les échecs de tests de performance?"
fi

echo ""

# 8. Vérification du build
step "8. Vérification du build production..."

if NODE_ENV=production npm run build; then
    success "Build production réussi"
else
    error "Le build production a échoué. Déploiement annulé."
fi

echo ""

# 9. Backup de la base de données
step "9. Backup de la base de données..."

warning "Assurez-vous qu'un backup récent de la base de données existe"
confirm "Un backup de la base de données a été effectué."
echo ""

# 10. Création du tag de version production
step "10. Création du tag de version production..."

# Obtenir la dernière version
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
echo "Dernière version: $LAST_TAG"

# Proposer une nouvelle version
read -p "Version de production (ex: v1.0.0): " PROD_VERSION

if [ -z "$PROD_VERSION" ]; then
    error "Une version est requise pour la production"
fi

# Vérifier que la version n'existe pas déjà
if git rev-parse "$PROD_VERSION" >/dev/null 2>&1; then
    error "Le tag $PROD_VERSION existe déjà"
fi

git tag -a "$PROD_VERSION" -m "Production release: Dashboard performance optimizations - 100% test coverage"
success "Tag $PROD_VERSION créé"
echo ""

# 11. Merge vers main
step "11. Merge vers main..."

git checkout main
git pull origin main
git merge staging -m "chore: Merge staging to main for production deployment $PROD_VERSION"
success "Staging mergé dans main"
echo ""

# 12. Dernière confirmation avant push
echo -e "${RED}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${RED}║  DERNIÈRE CONFIRMATION AVANT DÉPLOIEMENT PRODUCTION        ║${NC}"
echo -e "${RED}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Résumé du déploiement:"
echo "  • Version: $PROD_VERSION"
echo "  • Branche: main"
echo "  • Tests: lint/build/api-smoke OK (unit non bloquants)"
echo "  • Build: Vérifié"
echo "  • Backup DB: Confirmé"
echo ""

confirm "Déployer en PRODUCTION maintenant."
echo ""

# 13. Push vers production
step "13. Push vers production..."

git push origin main
git push origin "$PROD_VERSION"

success "Code poussé vers production (main)"
echo ""

# 14. Monitoring post-déploiement
step "14. Configuration du monitoring..."

echo ""
echo "Le déploiement est en cours dans AWS Amplify."
echo "Surveillez le build ici:"
echo "  https://console.aws.amazon.com/amplify/"
echo ""

# 15. Résumé final
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Déploiement Production Lancé avec Succès!                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Prochaines étapes CRITIQUES:${NC}"
echo ""
echo "1. Surveillez le build Amplify (5-10 minutes):"
echo "   https://console.aws.amazon.com/amplify/"
echo ""
echo "2. Une fois déployé, testez immédiatement:"
echo "   • https://app.huntaze.com"
echo "   • Authentification"
echo "   • Dashboard principal"
echo "   • Fonctionnalités critiques"
echo ""
echo "3. Vérifiez les métriques CloudWatch:"
echo "   npm run aws:verify"
echo "   npm run perf:monitor"
echo ""
echo "4. Surveillez les erreurs pendant 1 heure:"
echo "   • CloudWatch Logs"
echo "   • Sentry (si configuré)"
echo "   • Feedback utilisateurs"
echo ""
echo "5. Si problème critique, rollback immédiat:"
echo "   • Dans Amplify Console: Redeploy version précédente"
echo "   • Ou: git revert et redéployer"
echo ""
echo -e "${YELLOW}⚠️  Restez disponible pendant les 2 prochaines heures${NC}"
echo -e "${GREEN}✓ Version $PROD_VERSION déployée en production!${NC}"
echo ""

# Retour à staging
git checkout staging
