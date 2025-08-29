#!/bin/bash

# Huntaze deployment script for AWS
# Usage: ./deploy-aws.sh [production|staging]

set -e  # Exit on error

# Configuration
ENVIRONMENT=${1:-production}
PROJECT_NAME="huntaze-site"
REGISTRY_URL="your-ecr-registry.amazonaws.com"  # Replace with your ECR
AWS_REGION="us-east-1"  # Adjust to your region
EC2_HOST="your-ec2-instance"  # Replace with your IP or hostname

# Log colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log helpers
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

# Check requirements
check_requirements() {
    log "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        error "AWS CLI is not installed"
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        error "AWS CLI is not configured. Run 'aws configure'"
    fi
}

# Build Docker image
build_image() {
    log "Building Docker image..."
    
    # Get version tag
    VERSION=$(git rev-parse --short HEAD)
    IMAGE_TAG="${PROJECT_NAME}:${VERSION}"
    IMAGE_TAG_LATEST="${PROJECT_NAME}:latest"
    
    # Build with cache
    docker build \
        --cache-from ${REGISTRY_URL}/${IMAGE_TAG_LATEST} \
        -t ${IMAGE_TAG} \
        -t ${IMAGE_TAG_LATEST} \
        .
    
    log "Image built: ${IMAGE_TAG}"
}

# Push to ECR
push_to_ecr() {
    log "Logging in to ECR..."
    
    # Login ECR
    aws ecr get-login-password --region ${AWS_REGION} | \
        docker login --username AWS --password-stdin ${REGISTRY_URL}
    
    # Tag for ECR
    docker tag ${IMAGE_TAG} ${REGISTRY_URL}/${IMAGE_TAG}
    docker tag ${IMAGE_TAG_LATEST} ${REGISTRY_URL}/${IMAGE_TAG_LATEST}
    
    # Push
    log "Pushing image to ECR..."
    docker push ${REGISTRY_URL}/${IMAGE_TAG}
    docker push ${REGISTRY_URL}/${IMAGE_TAG_LATEST}
    
    log "Images pushed successfully"
}

# Deploy to EC2
deploy_to_ec2() {
    log "Deploying to EC2..."
    
    # Create remote deployment script
    cat > deploy-remote.sh << 'EOF'
#!/bin/bash
set -e

# Variables passed via SSH
PROJECT_NAME=$1
REGISTRY_URL=$2
VERSION=$3
ENVIRONMENT=$4

# Stop old container
echo "Stopping old container..."
docker stop ${PROJECT_NAME} 2>/dev/null || true
docker rm ${PROJECT_NAME} 2>/dev/null || true

# Pull new image
echo "Pulling new image..."
docker pull ${REGISTRY_URL}/${PROJECT_NAME}:${VERSION}

# Create log directory if missing
mkdir -p /var/log/${PROJECT_NAME}

# Start new container
echo "Starting new container..."
docker run -d \
    --name ${PROJECT_NAME} \
    --restart unless-stopped \
    --network huntaze-network \
    -p 3003:3000 \
    -e NODE_ENV=${ENVIRONMENT} \
    -e PORT=3000 \
    -v /var/log/${PROJECT_NAME}:/app/logs \
    ${REGISTRY_URL}/${PROJECT_NAME}:${VERSION}

# Wait for service
echo "Waiting for service to be ready..."
for i in {1..30}; do
    if docker exec ${PROJECT_NAME} curl -f http://localhost:3000/api/health &>/dev/null; then
        echo "Service started successfully!"
        break
    fi
    echo "Waiting... ($i/30)"
    sleep 2
done

# Check status
if ! docker ps | grep -q ${PROJECT_NAME}; then
    echo "ERROR: Container is not running"
    docker logs ${PROJECT_NAME}
    exit 1
fi

# Cleanup old images
echo "Cleaning up old images..."
docker image prune -f

echo "Deployment complete!"
EOF
    
    # Copy & execute the script on EC2
    log "Copying remote script to EC2..."
    scp deploy-remote.sh ec2-user@${EC2_HOST}:/tmp/
    
    log "Executing remote deployment..."
    ssh ec2-user@${EC2_HOST} "chmod +x /tmp/deploy-remote.sh && /tmp/deploy-remote.sh ${PROJECT_NAME} ${REGISTRY_URL} ${VERSION} ${ENVIRONMENT}"
    
    # Nettoyer
    rm deploy-remote.sh
}

# Update nginx configuration
update_nginx() {
    log "Updating nginx configuration..."
    
    # Create nginx configuration
    cat > nginx-huntaze.conf << 'EOF'
# Nginx configuration for Huntaze.com
upstream huntaze_app {
    server huntaze-site:3000;
}

server {
    listen 80;
    listen [::]:80;
    server_name huntaze.com www.huntaze.com;
    
    # Redirect to HTTPS
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

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/huntaze.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/huntaze.com/privkey.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "origin-when-cross-origin" always;

    # Logs
    access_log /var/log/nginx/huntaze.access.log;
    error_log /var/log/nginx/huntaze.error.log;

    # Timeouts
    client_max_body_size 10M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    # Next.js application
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

    # Next.js static assets
    location /_next/static/ {
        proxy_pass http://huntaze_app;
        proxy_cache_valid 200 365d;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Images and public files
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

    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/(\.env|\.git|README|package\.json|yarn\.lock) {
        deny all;
    }
}
EOF
    
    # Copy to EC2
    scp nginx-huntaze.conf ec2-user@${EC2_HOST}:/tmp/
    
    # Apply configuration
    ssh ec2-user@${EC2_HOST} << 'ENDSSH'
        sudo cp /tmp/nginx-huntaze.conf /etc/nginx/sites-available/huntaze.conf
        sudo ln -sf /etc/nginx/sites-available/huntaze.conf /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        echo "nginx configuration updated"
ENDSSH
}

# Health check after deployment
health_check() {
    log "Running health check..."
    
    # Wait a bit
    sleep 5
    
    # Test health endpoint
    HEALTH_URL="https://huntaze.com/api/health"
    
    if curl -f -s ${HEALTH_URL} > /dev/null; then
        log "✅ Health check passed!"
    else
        error "❌ Health check failed!"
    fi
    
    # Test homepage
    if curl -f -s https://huntaze.com > /dev/null; then
        log "✅ Homepage accessible!"
    else
        warn "⚠️  Homepage not accessible"
    fi
}

# Main function
main() {
    log "🚀 Deploying Huntaze (${ENVIRONMENT})"
    
    check_requirements
    build_image
    push_to_ecr
    deploy_to_ec2
    update_nginx
    health_check
    
    log "✅ Deployment finished successfully!"
}

# Run deployment
main
