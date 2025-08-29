#!/bin/bash

# Simplified deployment script for Huntaze on AWS EC2
# Usage: ./deploy-simple.sh [your-ec2-ip]

set -e

# Configuration
EC2_HOST=${1:-"your-ec2-ip"}  # Replace with your EC2 IP
EC2_USER="ubuntu"  # or ec2-user depending on your AMI
PROJECT_NAME="huntaze-site"
PROJECT_PATH="/home/${EC2_USER}/huntaze"

# Colors
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

# Validate args
if [ "$EC2_HOST" == "your-ec2-ip" ]; then
    error "Please specify your EC2 instance IP: ./deploy-simple.sh <EC2-IP>"
fi

log "🚀 Starting deployment on ${EC2_HOST}"

# Create project archive
log "Creating project archive..."
tar -czf huntaze-site.tar.gz \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='*.tar.gz' \
    .

# Copy to EC2
log "Copying files to EC2..."
scp huntaze-site.tar.gz ${EC2_USER}@${EC2_HOST}:~/

# Remote deployment script to run on EC2
ssh ${EC2_USER}@${EC2_HOST} << 'ENDSSH'
set -e

# Variables
PROJECT_NAME="huntaze-site"
PROJECT_PATH="/home/ubuntu/huntaze"

echo "📦 Preparing deployment..."

# Ensure directory exists
mkdir -p ${PROJECT_PATH}
cd ${PROJECT_PATH}

# Extract archive
echo "Extracting files..."
tar -xzf ~/huntaze-site.tar.gz
rm ~/huntaze-site.tar.gz

# Install dependencies
echo "Installing dependencies..."
npm ci --production

# Build app
echo "Building app..."
npm run build

# Stop old process
echo "Stopping previous process..."
pm2 stop ${PROJECT_NAME} 2>/dev/null || true
pm2 delete ${PROJECT_NAME} 2>/dev/null || true

# Start with PM2
echo "Starting app with PM2..."
pm2 start npm --name ${PROJECT_NAME} -- start
pm2 save
pm2 startup

echo "✅ Application started!"

# Afficher le statut
pm2 status
ENDSSH

# Clean local archive
rm -f huntaze-site.tar.gz

log "✅ Deployment complete!"
log "Check your site at http://${EC2_HOST}:3000"
