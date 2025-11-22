#!/bin/bash

# Setup Test Database for Property-Based Tests
# This script creates the test database and user for running PBT tests

set -e

echo "🔧 Setting up test database for property-based tests..."

# Database configuration from .env.test
DB_USER="test"
DB_PASSWORD="test"
DB_NAME="huntaze_test"
DB_HOST="localhost"
DB_PORT="5432"

# Check if PostgreSQL is running
if ! pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running on $DB_HOST:$DB_PORT"
    echo "Please start PostgreSQL and try again."
    exit 1
fi

echo "✅ PostgreSQL is running"

# Get current user (superuser)
SUPERUSER=$(whoami)

# Create test user if it doesn't exist
echo "📝 Creating test user..."
psql -h $DB_HOST -p $DB_PORT -d postgres -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

echo "✅ Test user created/verified"

# Create test database if it doesn't exist
echo "📝 Creating test database..."
psql -h $DB_HOST -p $DB_PORT -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    psql -h $DB_HOST -p $DB_PORT -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

echo "✅ Test database created/verified"

# Grant privileges
echo "📝 Granting privileges..."
psql -h $DB_HOST -p $DB_PORT -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo "✅ Privileges granted"

# Sync schema to test database
echo "📝 Syncing Prisma schema to test database..."
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
npx prisma db push --skip-generate

echo "✅ Migrations completed"

# Verify connection
echo "📝 Verifying test database connection..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null

echo "✅ Test database connection verified"

echo ""
echo "🎉 Test database setup complete!"
echo ""
echo "You can now run property-based tests with:"
echo "  npm run test -- tests/unit/auth/user-registration-round-trip.property.test.ts --run"
echo "  npm run test -- tests/unit/auth/password-security.property.test.ts --run"
echo ""
echo "Database details:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo "  Connection string: postgresql://$DB_USER:****@$DB_HOST:$DB_PORT/$DB_NAME"
