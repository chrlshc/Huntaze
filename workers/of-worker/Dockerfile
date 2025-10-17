# ---------- Builder (installe deps + compile TS) ----------
FROM node:20-bullseye AS builder
WORKDIR /app

# Install deps (avec devDeps pour tsc)
COPY package.json package-lock.json ./
RUN npm ci

# Sources
COPY tsconfig.json ./
COPY src ./src

# Build
RUN npx tsc -p .

# ---------- Runtime (Playwright + browsers) ----------
FROM mcr.microsoft.com/playwright:v1.47.2-jammy

# Travailler en root pour installer paquets, puis repasser en non-root
USER root
WORKDIR /app

# Paquets utiles (emoji, vidéo) et nettoyage
RUN apt-get update && apt-get install -y --no-install-recommends \
      fonts-noto-color-emoji ffmpeg tzdata \
  && rm -rf /var/lib/apt/lists/*

# Copie des artefacts build + deps prod uniquement
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist

# Confort Chromium en conteneur (Fargate)
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV NODE_ENV=production

# Repasser en utilisateur non-root (pwuser fourni par l'image Playwright)
USER pwuser

# Lancement
CMD ["node", "dist/index.js"]

