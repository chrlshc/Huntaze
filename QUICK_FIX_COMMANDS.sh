#!/bin/bash

# Quick fix for webpack module resolution error
# "Cannot read properties of undefined (reading 'call')"

echo "🔧 Fixing webpack module resolution error..."

# Step 1: Clear Next.js cache
echo "1️⃣ Clearing Next.js cache..."
rm -rf .next

# Step 2: Clear node_modules cache
echo "2️⃣ Clearing node_modules cache..."
rm -rf node_modules/.cache

# Step 3: Reinstall dependencies (optional, uncomment if needed)
# echo "3️⃣ Reinstalling dependencies..."
# rm -rf node_modules package-lock.json
# npm install

# Step 4: Rebuild
echo "4️⃣ Rebuilding..."
npm run build

echo "✅ Done! Try running 'npm run dev' now"
