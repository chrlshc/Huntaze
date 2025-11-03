#!/bin/bash

# Script to migrate Next.js 15 params to async pattern
# Usage: ./scripts/migrate-params-to-async.sh

echo "🔄 Migrating params to async pattern for Next.js 15..."

# List of files to migrate (remaining files)
files=(
  "app/api/content/media/[id]/edit/route.ts"
  "app/api/content/media/[id]/edit-video/route.ts"
  "app/api/content/templates/[id]/use/route.ts"
  "app/api/content/variations/[id]/route.ts"
  "app/api/content/variations/[id]/stats/route.ts"
  "app/api/content/variations/[id]/track/route.ts"
  "app/api/content/variations/[id]/assign/route.ts"
  "app/api/content/schedule/[id]/route.ts"
  "app/api/crm/conversations/[id]/route.ts"
  "app/api/crm/conversations/[id]/messages/route.ts"
  "app/api/crm/conversations/[id]/typing/route.ts"
  "app/api/crm/fans/[id]/route.ts"
  "app/api/of/campaigns/[id]/route.ts"
  "app/api/of/campaigns/[id]/[action]/route.ts"
  "app/api/of/threads/[id]/route.ts"
  "app/api/onlyfans/messaging/[id]/retry/route.ts"
  "app/api/messages/[id]/read/route.ts"
  "app/api/schedule/[id]/route.ts"
  "app/api/roadmap/proposals/[id]/vote/route.ts"
  "app/api/repost/items/[id]/schedule/route.ts"
  "app/api/crm/connect/[provider]/route.ts"
  "app/api/crm/webhooks/[provider]/route.ts"
)

count=0
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "  📝 Processing: $file"
    
    # Create backup
    cp "$file" "$file.backup"
    
    # Pattern 1: Single param (id, provider, action, etc.)
    # { params }: { params: { id: string } } → { params }: { params: Promise<{ id: string }> }
    sed -i.tmp 's/{ params }: { params: { \([^}]*\) }/{ params }: { params: Promise<{ \1 }/g' "$file"
    
    # Pattern 2: Multiple params
    # { params }: { params: { id: string; action: string } } → { params }: { params: Promise<{ id: string; action: string }> }
    sed -i.tmp 's/{ params }: { params: { \([^}]*; [^}]*\) }/{ params }: { params: Promise<{ \1 }/g' "$file"
    
    # Clean up temp files
    rm -f "$file.tmp"
    
    ((count++))
  else
    echo "  ⚠️  File not found: $file"
  fi
done

echo ""
echo "✅ Migration complete!"
echo "   Files processed: $count"
echo ""
echo "⚠️  IMPORTANT: You must manually add 'const { id } = await params;' at the start of each handler"
echo "   This script only updates the type signatures."
echo ""
echo "📋 Next steps:"
echo "   1. Review changes with: git diff"
echo "   2. Manually add 'await params' destructuring in each handler"
echo "   3. Replace all 'params.id' with 'id' (or appropriate param name)"
echo "   4. Run: npm run build"
echo "   5. Test the application"
echo ""
