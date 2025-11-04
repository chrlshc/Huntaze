#!/bin/bash

echo "🚀 Setting up local PostgreSQL database for development"
echo "=================================================="

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL not found. Installing..."
    
    # macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install postgresql
            brew services start postgresql
        else
            echo "Please install Homebrew first: https://brew.sh/"
            exit 1
        fi
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get update
        sudo apt-get install postgresql postgresql-contrib
        sudo systemctl start postgresql
        sudo systemctl enable postgresql
    else
        echo "Unsupported OS. Please install PostgreSQL manually."
        exit 1
    fi
fi

# Create database and user
echo "📊 Creating local database..."
createdb huntaze_dev 2>/dev/null || echo "Database huntaze_dev already exists"

# Update .env file
echo "📝 Updating .env file..."
cp .env .env.backup
sed -i.bak 's|DATABASE_URL="postgresql://.*"|DATABASE_URL="postgresql://localhost:5432/huntaze_dev?schema=public"|g' .env

echo "✅ Local database setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Run: npm run db:migrate"
echo "2. Run: npm run dev"
echo "3. Test: http://localhost:3000"
echo ""
echo "📋 To restore production DB:"
echo "cp .env.backup .env"