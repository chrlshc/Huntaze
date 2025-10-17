#!/usr/bin/env bash
# Huntaze Production Environment Template (copy to deployment/prod-env.sh and fill secrets)
# NOTE: Source this file before starting PM2 or the consumer.

export NODE_ENV=production

# --- AWS & Queues ---
export AWS_REGION=us-east-1
export SQS_AI_QUEUE=huntaze-ai-processing
export SQS_ANALYTICS_QUEUE=huntaze-analytics
export SQS_WEBHOOKS_QUEUE=huntaze-webhooks
export SQS_EMAIL_QUEUE=huntaze-email

# --- Database (RDS existing) ---
export POSTGRES_HOST=huntaze-postgres-production.c2ryoow8c5m4.us-east-1.rds.amazonaws.com
export POSTGRES_DB=huntaze
export POSTGRES_USER=huntazeadmin
export POSTGRES_PASSWORD=REPLACE_ME

# --- Azure OpenAI ---
export AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
export AZURE_OPENAI_API_KEY=REPLACE_ME
export AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
export AZURE_OPENAI_API_VERSION=2024-02-15-preview

# --- Platform APIs (optional but recommended) ---
# Instagram Graph
export IG_USE_GRAPH=1
export META_PAGE_ACCESS_TOKEN=REPLACE_ME
export IG_USER_ID=REPLACE_ME

# TikTok Content Posting API
export USE_TT_API=1
export TT_ACCESS_TOKEN=REPLACE_ME

# Reddit PRAW
export USE_REDDIT_OFFICIAL=1
export REDDIT_CLIENT_ID=REPLACE_ME
export REDDIT_CLIENT_SECRET=REPLACE_ME
export REDDIT_USER=REPLACE_ME
export REDDIT_PASS=REPLACE_ME

# --- Optional ML ---
export S3_BUCKET=REPLACE_ME  # bucket-us-east-1-pour-modeles-ML (optional)

# --- Internal API Guard ---
export HUNTAZE_INTERNAL_API_KEY=REPLACE_ME

# --- Redis (optional idempotence/cache) ---
export REDIS_URL=redis://your-redis-host:6379

# --- App base URL for validation ---
export HUNTAZE_API_BASE=https://your-app-domain

