# Huntaze Video Processor Worker
# Fargate-optimized container with ffmpeg + libass for caption burn-in

# Use pre-built ffmpeg image as base
FROM jrottenberg/ffmpeg:4.4-alpine

# Add Node.js
RUN apk add --no-cache nodejs npm

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY src/ ./src/
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Create temp directory for video processing
RUN mkdir -p /tmp/videos

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD echo "healthy" || exit 1

# Run worker
CMD ["node", "dist/index.js"]
