#!/bin/bash

# Script to remove onboarding requirement from APIs
# Replaces withOnboarding with withAuth

set -e

echo "🔧 Removing onboarding requirement from APIs"
echo "=============================================="
echo ""

# List of files to update
FILES=(
  "app/api/analytics/overview/route.ts"
  "app/api/analytics/trends/route.ts"
  "app/api/marketing/campaigns/route.ts"
  "app/api/marketing/campaigns/[id]/route.ts"
  "app/api/onlyfans/stats/route.ts"
  "app/api/onlyfans/fans/route.ts"
  "app/api/onlyfans/content/route.ts"
  "app/api/content/[id]/route.ts"
  "app/api/content/route.ts"
)

UPDATED=0
FAILED=0

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "📝 Updating $file..."
    
    # Replace withOnboarding import with withAuth
    sed -i.bak 's/import { withOnboarding/import { withAuth/g' "$file"
    
    # Replace withOnboarding usage with withAuth
    sed -i.bak 's/withOnboarding(/withAuth(/g' "$file"
    
    # Remove backup file
    rm -f "${file}.bak"
    
    echo "   ✅ Updated"
    UPDATED=$((UPDATED + 1))
  else
    echo "   ❌ File not found: $file"
    FAILED=$((FAILED + 1))
  fi
done

echo ""
echo "📊 Summary"
echo "=========="
echo "Updated: $UPDATED files"
echo "Failed:  $FAILED files"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ All files updated successfully!"
else
  echo "⚠️  Some files failed to update"
fi
