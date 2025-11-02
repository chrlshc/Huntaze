#!/bin/bash

# Script to initialize database tables with automatic wait for RDS availability
# This script will wait for the RDS instance to be available before executing SQL

set -e

echo "🔍 Checking RDS instance status..."

# Set AWS credentials if provided as environment variables
if [ -n "$AWS_ACCESS_KEY_ID" ]; then
    export AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY
    export AWS_SESSION_TOKEN
fi

# Wait for RDS to be available
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    STATUS=$(aws rds describe-db-instances \
        --db-instance-identifier huntaze-postgres-production \
        --region us-east-1 \
        --query 'DBInstances[0].DBInstanceStatus' \
        --output text 2>/dev/null || echo "error")
    
    if [ "$STATUS" = "available" ]; then
        echo "✅ RDS instance is available!"
        break
    elif [ "$STATUS" = "error" ]; then
        echo "❌ Error checking RDS status"
        exit 1
    else
        ATTEMPT=$((ATTEMPT + 1))
        echo "⏳ RDS status: $STATUS (attempt $ATTEMPT/$MAX_ATTEMPTS)"
        sleep 10
    fi
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ Timeout waiting for RDS to become available"
    exit 1
fi

echo ""
echo "🚀 Executing database initialization..."
echo ""

# Run the Node.js initialization script
node scripts/init-db-safe.js

echo ""
echo "✅ Database initialization complete!"
