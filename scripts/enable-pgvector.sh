#!/bin/bash

# Enable pgvector extension on RDS PostgreSQL database
# This must be run before prisma db push

set -e

echo "🔧 Enabling pgvector extension on RDS database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo "Please set it in your .env file or export it"
  exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL=$DATABASE_URL

echo "📡 Connecting to database..."

# Run the SQL script to enable pgvector
psql "$DB_URL" -f scripts/enable-pgvector.sql

if [ $? -eq 0 ]; then
  echo "✅ pgvector extension enabled successfully!"
  echo ""
  echo "You can now run: npx prisma db push"
else
  echo "❌ Failed to enable pgvector extension"
  echo ""
  echo "If you're using AWS RDS, make sure:"
  echo "1. Your RDS instance supports pgvector (PostgreSQL 11+)"
  echo "2. You have SUPERUSER or rds_superuser privileges"
  echo "3. The pgvector extension is available in your RDS instance"
  echo ""
  echo "To check available extensions, run:"
  echo "psql \"\$DATABASE_URL\" -c \"SELECT * FROM pg_available_extensions WHERE name = 'vector';\""
  exit 1
fi
