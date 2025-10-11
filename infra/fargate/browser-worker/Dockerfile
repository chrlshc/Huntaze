# Base Playwright officielle (Ubuntu Jammy)
FROM mcr.microsoft.com/playwright:v1.46.0-jammy

WORKDIR /app
COPY package.json package-lock.json* ./
# Use npm ci when lockfile exists; fallback to npm install otherwise
RUN if [ -f package-lock.json ]; then npm ci; else npm install --no-audit --no-fund; fi
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

CMD ["node", "dist/index.js"]
