#!/bin/bash

# Script de déploiement simplifié pour Huntaze sur AWS EC2
# Usage: ./deploy-simple.sh [votre-ip-ec2]

set -e

# Configuration
EC2_HOST=${1:-"your-ec2-ip"}  # Remplacer par votre IP EC2
EC2_USER="ubuntu"  # ou ec2-user selon votre AMI
PROJECT_NAME="huntaze-site"
PROJECT_PATH="/home/${EC2_USER}/huntaze"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Vérifier les arguments
if [ "$EC2_HOST" == "your-ec2-ip" ]; then
    error "Veuillez spécifier l'IP de votre instance EC2: ./deploy-simple.sh <IP-EC2>"
fi

log "🚀 Début du déploiement sur ${EC2_HOST}"

# Créer une archive du projet
log "Création de l'archive du projet..."
tar -czf huntaze-site.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='*.tar.gz' \
    .

# Copier sur EC2
log "Copie des fichiers sur EC2..."
scp huntaze-site.tar.gz ${EC2_USER}@${EC2_HOST}:~/

# Script de déploiement à exécuter sur EC2
ssh ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
set -e

# Variables
PROJECT_NAME="huntaze-site"
PROJECT_PATH="/home/ubuntu/huntaze"

echo "📦 Préparation du déploiement..."

# Créer le répertoire si nécessaire
mkdir -p ${PROJECT_PATH}
cd ${PROJECT_PATH}

# Extraire l'archive
echo "Extraction des fichiers..."
tar -xzf ~/huntaze-site.tar.gz
rm ~/huntaze-site.tar.gz

# Installer les dépendances
echo "Installation des dépendances..."
npm ci --production

# Build l'application
echo "Build de l'application..."
npm run build

# Arrêter l'ancien processus
echo "Arrêt de l'ancien processus..."
pm2 stop ${PROJECT_NAME} 2>/dev/null || true
pm2 delete ${PROJECT_NAME} 2>/dev/null || true

# Démarrer avec PM2
echo "Démarrage de l'application avec PM2..."
pm2 start npm --name ${PROJECT_NAME} -- start
pm2 save
pm2 startup

echo "✅ Application démarrée!"

# Afficher le statut
pm2 status
ENDSSH

# Nettoyer l'archive locale
rm -f huntaze-site.tar.gz

log "✅ Déploiement terminé!"
log "Vérifiez votre site sur http://${EC2_HOST}:3000"