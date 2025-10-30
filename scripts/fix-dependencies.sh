#!/bin/bash
# Fix dependency conflicts for Next.js 15.5 deployment

set -e

echo "🔧 Fixing dependencies for production..."

# 1. Clean everything
echo "🧹 Cleaning node_modules and caches..."
rm -rf node_modules
rm -rf .next
rm -rf .turbo
rm -rf package-lock.json
npm cache clean --force

# 2. Install with legacy peer deps (fixes ESLint conflict)
echo "📦 Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps

# 3. Verify critical packages
echo "🔍 Verifying package versions..."
echo "Next.js version:"
npm list next
echo ""
echo "ESLint version:"
npm list eslint || echo "ESLint not found (OK if using Next.js built-in)"
echo ""
echo "React version:"
npm list react

# 4. Test build
echo "🏗️  Testing production build..."
npm run build

echo ""
echo "✅ Dependencies fixed and build successful!"
echo ""
echo "Next: Deploy to AWS Amplify"
