#!/bin/bash

# AI System End-to-End Test Runner
# 
# Runs comprehensive E2E tests for the AI system integration
# Task: 17.6 Tests end-to-end avec l'app complète

set -e

echo "🚀 Starting AI System E2E Tests..."
echo ""

# Check if required environment variables are set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set"
  echo "Please set DATABASE_URL in .env.test"
  exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "⚠️  WARNING: GEMINI_API_KEY is not set"
  echo "Some tests may fail without a valid Gemini API key"
fi

if [ -z "$ELASTICACHE_REDIS_HOST" ]; then
  echo "⚠️  WARNING: ELASTICACHE_REDIS_HOST is not set"
  echo "Falling back to localhost:6379"
  export ELASTICACHE_REDIS_HOST="localhost"
  export ELASTICACHE_REDIS_PORT="6379"
fi

echo "📋 Test Configuration:"
echo "  - Database: ${DATABASE_URL}"
echo "  - Redis: ${ELASTICACHE_REDIS_HOST}:${ELASTICACHE_REDIS_PORT}"
echo "  - Gemini API: ${GEMINI_API_KEY:0:10}..."
echo ""

# Run E2E tests
echo "🧪 Running E2E tests..."
npx vitest run --config vitest.config.e2e.ts

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ All E2E tests passed!"
  echo ""
  echo "📊 Test Results:"
  echo "  - Results: ./test-results/e2e-results.json"
  echo "  - HTML Report: ./test-results/e2e-results.html"
  echo ""
  echo "🎉 AI System E2E Testing Complete!"
else
  echo ""
  echo "❌ Some E2E tests failed"
  echo "Check the output above for details"
  exit 1
fi
