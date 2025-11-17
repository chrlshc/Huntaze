#!/bin/bash

# Pages that fail prerendering
PAGES=(
  "app/agency-comparison/page.tsx"
  "app/for-instagram-creators/page.tsx"
  "app/for-everyone/page.tsx"
  "app/for-agencies/page.tsx"
  "app/careers/page.tsx"
  "app/case-studies/page.tsx"
  "app/business/page.tsx"
  "app/blog/page.tsx"
  "app/automations/page.tsx"
  "app/ai-technology/page.tsx"
  "app/ai-images-comparison/page.tsx"
  "app/how-it-works/page.tsx"
  "app/integrations/page.tsx"
  "app/join/page.tsx"
  "app/learn/page.tsx"
  "app/manage-business/page.tsx"
  "app/performance/page.tsx"
  "app/platform/page.tsx"
  "app/pricing/page.tsx"
  "app/privacy/page.tsx"
  "app/privacy-policy/page.tsx"
  "app/profile/page.tsx"
  "app/repost/page.tsx"
  "app/roadmap/page.tsx"
  "app/social-marketing/page.tsx"
  "app/status/page.tsx"
  "app/terms/page.tsx"
  "app/terms-of-service/page.tsx"
  "app/use-cases/page.tsx"
  "app/why-huntaze/page.tsx"
  "app/contact/page.tsx"
)

for page in "${PAGES[@]}"; do
  if [ -f "$page" ]; then
    # Check if it already has dynamic export
    if ! grep -q "export const dynamic" "$page"; then
      # Check if it has 'use client'
      if grep -q "^['\"]use client['\"]" "$page"; then
        # Add after 'use client'
        sed -i '' "/^['\"]use client['\"]/a\\
\\
export const dynamic = 'force-dynamic';
" "$page"
      else
        # Add at the beginning
        sed -i '' "1i\\
export const dynamic = 'force-dynamic';\\
\\
" "$page"
      fi
      echo "✓ Fixed $page"
    fi
  fi
done

echo "Done!"
