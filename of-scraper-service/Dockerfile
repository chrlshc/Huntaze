# Image Playwright officielle - optimisée pour containers
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances (sans les devDependencies)
RUN npm install --production

# Copier le code
COPY server.js worker.js ./

# Variables d'environnement pour Chromium headless
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

# Port pour App Runner (HTTP API)
EXPOSE 8080

# Healthcheck intégré
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Par défaut: lance le serveur HTTP + Worker BullMQ
# Override avec CMD ["node", "worker.js"] pour worker-only
CMD ["sh", "-c", "node server.js & node worker.js"]
