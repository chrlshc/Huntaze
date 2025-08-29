#!/bin/bash

# Initial setup script for AWS EC2
# Run on your EC2 instance

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "🚀 Initial EC2 setup for Huntaze"

# System update
log "Updating system..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Install Node.js 18
log "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
log "Installing PM2..."
sudo npm install -g pm2

# Install nginx
log "Installing nginx..."
sudo apt-get install -y nginx

# Install certbot for SSL
log "Installing certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# Firewall configuration
log "Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Create app directory
log "Creating app directory..."
mkdir -p ~/huntaze
mkdir -p ~/logs

# Basic nginx configuration
log "Configuring nginx..."
sudo tee /etc/nginx/sites-available/huntaze << 'EOF'
server {
    listen 80;
    server_name huntaze.com www.huntaze.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/huntaze /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# PM2 configuration
log "Configuring PM2 for autostart..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Create startup script
cat > ~/huntaze/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'huntaze-site',
    script: 'npm',
    args: 'start',
    cwd: '/home/ubuntu/huntaze',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/ubuntu/logs/err.log',
    out_file: '/home/ubuntu/logs/out.log',
    log_file: '/home/ubuntu/logs/combined.log',
    time: true
  }]
};
EOF

log "✅ Initial setup complete!"
log ""
log "Next steps:"
log "1. Point your domain to this server IP"
log "2. Deploy your app with: ./deploy-simple.sh <this-ip>"
log "3. Get an SSL certificate: sudo certbot --nginx -d huntaze.com -d www.huntaze.com"
log ""
warn "Don’t forget to create a .env file with your environment variables!"
