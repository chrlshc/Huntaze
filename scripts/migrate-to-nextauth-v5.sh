#!/bin/bash

# Script to migrate all API routes from NextAuth v4 to v5

echo "🔄 Migrating API routes to NextAuth v5..."

# List of files to update
files=(
  "app/api/ai/agents/route.ts"
  "app/api/analytics/overview/route.ts"
  "app/api/analytics/audience/route.ts"
  "app/api/analytics/content/route.ts"
  "app/api/analytics/trends/route.ts"
  "app/api/analytics/platform/[platform]/route.ts"
  "app/api/revenue/churn/reengage/route.ts"
  "app/api/revenue/churn/route.ts"
  "app/api/revenue/churn/bulk-reengage/route.ts"
  "app/api/revenue/pricing/route.ts"
  "app/api/revenue/pricing/apply/route.ts"
  "app/api/revenue/upsells/send/route.ts"
  "app/api/revenue/forecast/route.ts"
  "app/api/revenue/upsells/automation/route.ts"
  "app/api/revenue/upsells/dismiss/route.ts"
  "app/api/revenue/forecast/goal/route.ts"
  "app/api/revenue/upsells/route.ts"
  "app/api/revenue/forecast/scenario/route.ts"
  "app/api/smart-onboarding/analytics/track/route.ts"
  "app/api/smart-onboarding/analytics/engagement/route.ts"
  "app/api/smart-onboarding/analytics/insights/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  📝 Updating $file..."
    
    # Replace getServerSession import
    sed -i '' 's/import { getServerSession } from .next-auth./import { auth } from '\''@\/lib\/auth\/config'\'';/g' "$file"
    
    # Replace authOptions import (if exists)
    sed -i '' '/import { authOptions } from/d' "$file"
    
    # Replace getServerSession() calls with auth()
    sed -i '' 's/await getServerSession(authOptions)/await auth()/g' "$file"
    sed -i '' 's/await getServerSession()/await auth()/g' "$file"
    sed -i '' 's/getServerSession(authOptions)/auth()/g' "$file"
    sed -i '' 's/getServerSession()/auth()/g' "$file"
    
    echo "  ✅ Updated $file"
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Migration complete!"
echo ""
echo "Next steps:"
echo "1. Review the changes: git diff"
echo "2. Test locally: npm run build"
echo "3. Commit and push: git add . && git commit -m 'Fix: Migrate all API routes to NextAuth v5' && git push"
