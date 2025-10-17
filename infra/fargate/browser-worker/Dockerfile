FROM mcr.microsoft.com/playwright:v1.56.0-jammy

WORKDIR /app

# Install deps (AWS SDK v3 is small; playwright is preinstalled in the base image)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

COPY src ./src

CMD ["node", "src/index.js"]

