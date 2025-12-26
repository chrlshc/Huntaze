#!/bin/bash

# Script de déploiement Huntaze sur AWS
# Usage: ./deploy-simple-aws.sh

set -e

# Configuration AWS - À MODIFIER selon votre configuration
AWS_REGION="us-east-1"
ECR_REPOSITORY="huntaze-site"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG="latest"

# Couleurs pour les logs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier les prérequis
check_requirements() {
    log "Vérification des prérequis..."
    
    # Vérifier Docker
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    
    # Vérifier AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI n'est pas installé"
    fi
    
    # Vérifier la connexion AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI n'est pas configuré. Exécutez 'aws configure'"
    fi
    
    log "✓ Tous les prérequis sont satisfaits"
}

# Créer le repository ECR s'il n'existe pas
create_ecr_repository() {
    log "Vérification du repository ECR..."
    
    if ! aws ecr describe-repositories --repository-names ${ECR_REPOSITORY} --region ${AWS_REGION} &> /dev/null; then
        log "Création du repository ECR..."
        aws ecr create-repository --repository-name ${ECR_REPOSITORY} --region ${AWS_REGION}
        log "✓ Repository ECR créé"
    else
        log "✓ Repository ECR existe déjà"
    fi
}

# Build de l'image Docker
build_docker_image() {
    log "Construction de l'image Docker..."
    
    # Obtenir le hash du commit actuel
    GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "no-git")
    
    # Build avec les optimisations
    docker build \
        --build-arg NODE_ENV=production \
        --tag ${ECR_REPOSITORY}:${IMAGE_TAG} \
        --tag ${ECR_REPOSITORY}:${GIT_COMMIT} \
        --file Dockerfile \
        .
    
    log "✓ Image Docker construite avec succès"
}

# Push vers ECR
push_to_ecr() {
    log "Connexion à ECR..."
    
    # Login à ECR
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin ${ECR_URL}
    
    # Tag l'image pour ECR
    docker tag ${ECR_REPOSITORY}:${IMAGE_TAG} ${ECR_URL}/${ECR_REPOSITORY}:${IMAGE_TAG}
    docker tag ${ECR_REPOSITORY}:${GIT_COMMIT} ${ECR_URL}/${ECR_REPOSITORY}:${GIT_COMMIT}
    
    # Push
    log "Push de l'image vers ECR..."
    docker push ${ECR_URL}/${ECR_REPOSITORY}:${IMAGE_TAG}
    docker push ${ECR_URL}/${ECR_REPOSITORY}:${GIT_COMMIT}
    
    log "✓ Image poussée vers ECR avec succès"
}

# Déployer sur ECS/Fargate (optionnel)
deploy_to_ecs() {
    log "Déploiement sur ECS..."
    
    # Vérifier si le service ECS existe
    SERVICE_NAME="huntaze-service"
    CLUSTER_NAME="huntaze-cluster"
    
    if aws ecs describe-services --cluster ${CLUSTER_NAME} --services ${SERVICE_NAME} --region ${AWS_REGION} &> /dev/null; then
        log "Mise à jour du service ECS..."
        aws ecs update-service \
            --cluster ${CLUSTER_NAME} \
            --service ${SERVICE_NAME} \
            --force-new-deployment \
            --region ${AWS_REGION}
        
        log "✓ Service ECS mis à jour"
    else
        warn "Service ECS non trouvé. Créez d'abord le service ECS."
        warn "Documentation: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/"
    fi
}

# Déployer sur EC2 (alternatif)
deploy_to_ec2() {
    log "Instructions pour déployer sur EC2:"
    echo ""
    echo "1. Connectez-vous à votre instance EC2:"
    echo "   ssh ec2-user@votre-instance-ec2"
    echo ""
    echo "2. Arrêtez l'ancien conteneur:"
    echo "   docker stop huntaze-site 2>/dev/null || true"
    echo "   docker rm huntaze-site 2>/dev/null || true"
    echo ""
    echo "3. Récupérez la nouvelle image:"
    echo "   aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URL}"
    echo "   docker pull ${ECR_URL}/${ECR_REPOSITORY}:${IMAGE_TAG}"
    echo ""
    echo "4. Démarrez le nouveau conteneur:"
    echo "   docker run -d \\"
    echo "     --name huntaze-site \\"
    echo "     --restart unless-stopped \\"
    echo "     -p 80:3000 \\"
    echo "     -e NODE_ENV=production \\"
    echo "     ${ECR_URL}/${ECR_REPOSITORY}:${IMAGE_TAG}"
    echo ""
}

# Afficher les informations de déploiement
show_deployment_info() {
    log "=== Informations de déploiement ==="
    echo ""
    echo "Repository ECR: ${ECR_URL}/${ECR_REPOSITORY}"
    echo "Image tag: ${IMAGE_TAG}"
    echo "Git commit: ${GIT_COMMIT}"
    echo "Région AWS: ${AWS_REGION}"
    echo ""
    log "=================================="
}

# Fonction principale
main() {
    log "🚀 Déploiement de Huntaze sur AWS"
    
    check_requirements
    create_ecr_repository
    build_docker_image
    push_to_ecr
    
    # Choisir la méthode de déploiement
    echo ""
    echo "Choisissez votre méthode de déploiement:"
    echo "1) ECS/Fargate (recommandé pour la production)"
    echo "2) EC2 (instructions manuelles)"
    echo "3) Terminer (image disponible sur ECR)"
    read -p "Votre choix (1-3): " choice
    
    case $choice in
        1)
            deploy_to_ecs
            ;;
        2)
            deploy_to_ec2
            ;;
        3)
            log "Image disponible sur ECR, prête pour le déploiement"
            ;;
        *)
            warn "Choix invalide"
            ;;
    esac
    
    show_deployment_info
    log "✅ Processus terminé avec succès!"
}

# Exécuter le déploiement
main