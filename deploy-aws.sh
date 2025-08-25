#!/bin/bash

# Script de déploiement pour Huntaze sur AWS
# Usage: ./deploy-aws.sh [production|staging]

set -e  # Arrêter en cas d'erreur

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="huntaze-site"
REGISTRY_URL="your-ecr-registry.amazonaws.com"  # À remplacer par votre ECR
AWS_REGION="us-east-1"  # À adapter selon votre région
EC2_HOST="your-ec2-instance"  # À remplacer par votre IP ou hostname

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de log
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
    
    # Vérifier les credentials AWS
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI n'est pas configuré. Exécutez 'aws configure'"
    fi
}

# Build de l'image Docker
build_image() {
    log "Construction de l'image Docker..."
    
    # Obtenir le tag de version
    VERSION=$(git rev-parse --short HEAD)
    IMAGE_TAG="${PROJECT_NAME}:${VERSION}"
    IMAGE_TAG_LATEST="${PROJECT_NAME}:latest"
    
    # Build avec cache
    docker build \
        --cache-from ${REGISTRY_URL}/${IMAGE_TAG_LATEST} \
        -t ${IMAGE_TAG} \
        -t ${IMAGE_TAG_LATEST} \
        .
    
    log "Image construite: ${IMAGE_TAG}"
}

# Push vers ECR
push_to_ecr() {
    log "Connexion à ECR..."
    
    # Login ECR
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin ${REGISTRY_URL}
    
    # Tag pour ECR
    docker tag ${IMAGE_TAG} ${REGISTRY_URL}/${IMAGE_TAG}
    docker tag ${IMAGE_TAG_LATEST} ${REGISTRY_URL}/${IMAGE_TAG_LATEST}
    
    # Push
    log "Push de l'image vers ECR..."
    docker push ${REGISTRY_URL}/${IMAGE_TAG}
    docker push ${REGISTRY_URL}/${IMAGE_TAG_LATEST}
    
    log "Images poussées avec succès"
}

# Déploiement sur EC2
deploy_to_ec2() {
    log "Déploiement sur EC2..."
    
    # Créer le script de déploiement distant
    cat > deploy-remote.sh << 'EOF'
#!/bin/bash
set -e

# Variables passées par SSH
PROJECT_NAME=$1
REGISTRY_URL=$2
VERSION=$3
ENVIRONMENT=$4

# Arrêter l'ancien container
echo "Arrêt de l'ancien container..."
docker stop ${PROJECT_NAME} 2>/dev/null || true
docker rm ${PROJECT_NAME} 2>/dev/null || true

# Pull la nouvelle image
echo "Pull de la nouvelle image..."
docker pull ${REGISTRY_URL}/${PROJECT_NAME}:${VERSION}

# Créer le dossier de logs s'il n'existe pas
mkdir -p /var/log/${PROJECT_NAME}

# Démarrer le nouveau container
echo "Démarrage du nouveau container..."
docker run -d \
    --name ${PROJECT_NAME} \
    --restart unless-stopped \
    --network huntaze-network \
    -p 3003:3000 \
    -e NODE_ENV=${ENVIRONMENT} \
    -e PORT=3000 \
    -v /var/log/${PROJECT_NAME}:/app/logs \
    ${REGISTRY_URL}/${PROJECT_NAME}:${VERSION}

# Attendre que le service soit prêt
echo "Attente du démarrage du service..."
for i in {1..30}; do
    if docker exec ${PROJECT_NAME} curl -f http://localhost:3000/api/health &>/dev/null; then
        echo "Service démarré avec succès!"
        break
    fi
    echo "Attente... ($i/30)"
    sleep 2
done

# Vérifier le statut
if ! docker ps | grep -q ${PROJECT_NAME}; then
    echo "ERREUR: Le container n'est pas en cours d'exécution"
    docker logs ${PROJECT_NAME}
    exit 1
fi

# Nettoyer les anciennes images
echo "Nettoyage des anciennes images..."
docker image prune -f

echo "Déploiement terminé!"
EOF
    
    # Copier et exécuter le script sur EC2
    log "Copie du script sur EC2..."
    scp deploy-remote.sh ec2-user@${EC2_HOST}:/tmp/
    
    log "Exécution du déploiement distant..."
    ssh ec2-user@${EC2_HOST} "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh ${PROJECT_NAME} ${REGISTRY_URL} ${VERSION} ${ENVIRONMENT}"
    
    # Nettoyer
    rm deploy-remote.sh
}

# Mise à jour de la configuration nginx
update_nginx() {
    log "Mise à jour de la configuration nginx..."
    
    # Créer la configuration nginx
    cat > nginx-huntaze.conf << 'EOF'
# Configuration Nginx pour Huntaze.com
upstream huntaze_app {
    server huntaze-site:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name huntaze.com www.huntaze.com;
    
    # Redirection vers HTTPS
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name huntaze.com www.huntaze.com;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/huntaze.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/huntaze.com/privkey.pem;
    
    # Configuration SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Headers de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "origin-when-cross-origin" always;

    # Logs
    access_log /var/log/nginx/huntaze.access.log;
    error_log /var/log/nginx/huntaze.error.log;

    # Configuration des timeouts
    client_max_body_size 10M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Application Next.js
    location / {
        proxy_pass http://huntaze_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://huntaze_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Assets statiques Next.js
    location /_next/static/ {
        proxy_pass http://huntaze_app;
        proxy_cache_valid 200 365d;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Images et fichiers publics
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://huntaze_app;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://huntaze_app/api/health;
        access_log off;
    }

    # Bloquer l'accès aux fichiers sensibles
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/(\.env|\.git|README|package\.json|yarn\.lock) {
        deny all;
    }
}
EOF
    
    # Copier sur EC2
    scp nginx-huntaze.conf ec2-user@${EC2_HOST}:/tmp/
    
    # Appliquer la configuration
    ssh ec2-user@${EC2_HOST} << 'ENDSSH'
        sudo cp /tmp/nginx-huntaze.conf /etc/nginx/sites-available/huntaze.conf
        sudo ln -sf /etc/nginx/sites-available/huntaze.conf /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        echo "Configuration nginx mise à jour"
ENDSSH
}

# Health check après déploiement
health_check() {
    log "Vérification de santé..."
    
    # Attendre un peu
    sleep 5
    
    # Tester l'endpoint de santé
    HEALTH_URL="https://huntaze.com/api/health"
    
    if curl -f -s ${HEALTH_URL} > /dev/null; then
        log "✅ Health check réussi!"
    else
        error "❌ Health check échoué!"
    fi
    
    # Tester la page d'accueil
    if curl -f -s https://huntaze.com > /dev/null; then
        log "✅ Page d'accueil accessible!"
    else
        warn "⚠️  Page d'accueil non accessible"
    fi
}

# Fonction principale
main() {
    log "🚀 Déploiement de Huntaze (${ENVIRONMENT})"
    
    check_requirements
    build_image
    push_to_ecr
    deploy_to_ec2
    update_nginx
    health_check
    
    log "✅ Déploiement terminé avec succès!"
}

# Exécuter le déploiement
main