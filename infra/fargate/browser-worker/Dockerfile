# Base Playwright officielle (Ubuntu Jammy) – alignée sur @playwright/test 1.56.0
FROM --platform=linux/amd64 mcr.microsoft.com/playwright:v1.56.0-jammy

WORKDIR /app
COPY package.json package-lock.json* ./
# Prefer npm ci; fallback to npm install if lockfile is out of sync (CI-safe fallback)
RUN if [ -f package-lock.json ]; then npm ci || npm install --no-audit --no-fund; else npm install --no-audit --no-fund; fi
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Allow Node heap to grow up to 4GB to reduce OOM during bursts
CMD ["node", "--max-old-space-size=4096", "dist/index.js"]
