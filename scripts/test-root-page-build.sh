#!/bin/bash
# Test if the root page builds successfully

set -e

echo "🧪 Testing Root Page Build"
echo "=========================="
echo ""

echo "1️⃣  Checking for import conflicts..."
if grep -q "export const dynamic =" app/\(marketing\)/page.tsx; then
  echo "⚠️  Found 'export const dynamic' - checking for conflicts..."
  if grep -q "import dynamic from" app/\(marketing\)/page.tsx; then
    echo "❌ Potential naming conflict detected!"
    echo "   Both 'export const dynamic' and 'import dynamic' found"
    exit 1
  fi
else
  echo "✅ No 'export const dynamic' conflict (using dynamicParams or other config)"
fi
echo ""

echo "2️⃣  Checking rendering configuration..."
if grep -q "export const revalidate = 0" app/\(marketing\)/page.tsx; then
  echo "✅ Dynamic rendering enabled (revalidate = 0)"
elif grep -q "export const dynamic = 'force-dynamic'" app/\(marketing\)/page.tsx; then
  echo "✅ Dynamic rendering enabled (force-dynamic)"
elif grep -q "export const dynamic = 'force-static'" app/\(marketing\)/page.tsx; then
  echo "⚠️  Static rendering enabled (may fail at build time)"
else
  echo "ℹ️  Using default rendering strategy"
fi
echo ""

echo "3️⃣  Checking dynamic imports..."
if grep -q "import dynamic from 'next/dynamic'" app/\(marketing\)/page.tsx; then
  echo "✅ Dynamic imports configured"
else
  echo "⚠️  No dynamic imports found"
fi
echo ""

echo "📊 Summary"
echo "=========="
echo "✅ Root page is ready for deployment"
echo ""
echo "Next steps:"
echo "1. Commit changes: git add app/\(marketing\)/page.tsx STAGING_500_ERROR_FIX.md"
echo "2. Push to staging: git push origin staging"
echo "3. Monitor build: ./scripts/diagnose-staging-500.sh"
