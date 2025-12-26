#!/bin/bash

# Fix all verifyAuth(request) calls to use getUserFromRequest

files=(
  "app/api/onboarding/event/route.ts"
  "app/api/onboarding/analytics/route.ts"
  "app/api/onboarding/creator-level/route.ts"
  "app/api/onboarding/start/route.ts"
  "app/api/onboarding/step/[stepId]/skip/route.ts"
  "app/api/onboarding/path/route.ts"
  "app/api/onboarding/status/route.ts"
  "app/api/onboarding/step/[stepId]/complete/route.ts"
  "app/api/onboarding/check-unlocks/route.ts"
  "app/api/content/import/url/route.ts"
  "app/api/content/variations/[id]/stats/route.ts"
  "app/api/content/variations/[id]/assign/route.ts"
  "app/api/content/variations/[id]/track/route.ts"
  "app/api/features/unlocked/route.ts"
  "app/api/features/[featureId]/requirements/route.ts"
  "app/api/features/locked/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Replace import
    sed -i '' 's/import { verifyAuth } from/import { getUserFromRequest } from/g' "$file"
    sed -i '' "s|'@/lib/auth/jwt'|'@/lib/auth/getUserFromRequest'|g" "$file"
    
    # Replace usage
    sed -i '' 's/const authResult = await verifyAuth(request);/const user = await getUserFromRequest(request);/g' "$file"
    sed -i '' 's/if (!authResult\.valid || !authResult\.payload)/if (!user)/g' "$file"
    sed -i '' 's/if (!authResult\.valid || !authResult\.userId)/if (!user)/g' "$file"
    sed -i '' 's/authResult\.payload\.userId/String(user.id)/g' "$file"
    sed -i '' 's/authResult\.userId/String(user.id)/g' "$file"
  fi
done

echo "Done!"
