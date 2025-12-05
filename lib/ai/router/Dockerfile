# =============================================================================
# AI Router Dockerfile - Production Optimized
# =============================================================================
# Huntaze AI Router - Azure AI Foundry East US 2
#
# Build: docker build -t huntaze-ai-router .
# Run: docker run -p 8000:8000 --env-file .env huntaze-ai-router
#
# Multi-stage build for smaller image size (<500MB target)
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Builder - Install dependencies
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS builder

WORKDIR /app

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Stage 2: Production - Minimal runtime image
# -----------------------------------------------------------------------------
FROM python:3.11-slim AS production

# Labels for container registry
LABEL maintainer="Huntaze <dev@huntaze.com>" \
      version="1.0.0" \
      description="Huntaze AI Router - Azure AI Foundry" \
      org.opencontainers.image.source="https://github.com/huntaze/huntaze"

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    PATH="/opt/venv/bin:$PATH" \
    # Default configuration
    ROUTER_PORT=8000 \
    ROUTER_HOST=0.0.0.0 \
    ROUTER_WORKERS=1

# Install only runtime dependencies (curl for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Copy application code (only what's needed)
COPY main.py .
COPY config.py .
COPY models.py .
COPY classifier.py .
COPY client.py .
COPY routing.py .
COPY __init__.py .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash --uid 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check for ECS/ALB
# - interval: Check every 30 seconds
# - timeout: Fail if no response in 10 seconds
# - start-period: Wait 10 seconds before first check
# - retries: Mark unhealthy after 3 failures
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with uvicorn
# - workers: Use ROUTER_WORKERS env var (default 1)
# - timeout-keep-alive: Keep connections alive for 65s (ALB default is 60s)
CMD ["sh", "-c", "uvicorn main:app --host ${ROUTER_HOST} --port ${ROUTER_PORT} --workers ${ROUTER_WORKERS} --timeout-keep-alive 65"]
