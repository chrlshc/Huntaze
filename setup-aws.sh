#!/bin/bash

# Script de configuration initiale pour AWS EC2
# À exécuter sur votre instance EC2

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[SETUP]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log "🚀 Configuration initiale de l'instance EC2 pour Huntaze"

# Mise à jour du système
log "Mise à jour du système..."
sudo apt-get update -y
sudo apt-get upgrade -y

# Installation de Node.js 18
log "Installation de Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Installation de PM2
log "Installation de PM2..."
sudo npm install -g pm2

# Installation de nginx
log "Installation de nginx..."
sudo apt-get install -y nginx

# Installation de certbot pour SSL
log "Installation de certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# Configuration du firewall
log "Configuration du firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw --force enable

# Création du répertoire de l'application
log "Création du répertoire de l'application..."
mkdir -p ~/huntaze
mkdir -p ~/logs

# Configuration nginx de base
log "Configuration nginx..."
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

# Activer le site
sudo ln -sf /etc/nginx/sites-available/huntaze /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Configuration PM2
log "Configuration PM2 pour démarrage automatique..."
pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Création du script de démarrage
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

log "✅ Configuration initiale terminée!"
log ""
log "Prochaines étapes:"
log "1. Configurez votre domaine pour pointer vers cette IP"
log "2. Déployez votre application avec: ./deploy-simple.sh <cette-ip>"
log "3. Obtenez un certificat SSL avec: sudo certbot --nginx -d huntaze.com -d www.huntaze.com"
log ""
warn "N'oubliez pas de créer un fichier .env avec vos variables d'environnement!"