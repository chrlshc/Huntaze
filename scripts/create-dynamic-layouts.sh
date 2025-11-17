#!/bin/bash

# Create dynamic layouts for pages that fail prerendering
PAGES=(
  "app/dashboard/huntaze-ai"
  "app/for-instagram-creators"
  "app/for-everyone"
  "app/for-agencies"
  "app/careers"
  "app/case-studies"
  "app/business"
  "app/blog"
  "app/automations"
  "app/how-it-works"
  "app/integrations"
  "app/join"
  "app/learn"
  "app/manage-business"
  "app/performance"
  "app/platform"
  "app/pricing"
  "app/privacy"
  "app/privacy-policy"
  "app/profile"
  "app/repost"
  "app/roadmap"
  "app/social-marketing"
  "app/status"
  "app/terms"
  "app/terms-of-service"
  "app/use-cases"
  "app/why-huntaze"
  "app/contact"
  "app/home"
  "app/flows"
  "app/features"
  "app/design-system"
  "app/data-deletion"
  "app/creator/messages"
  "app/content"
  "app/configure"
  "app/complete-onboarding"
  "app/chatting"
  "app/chatbot"
  "app/campaigns"
  "app/billing"
  "app/auth"
)

LAYOUT_CONTENT='export const dynamic = '\''force-dynamic'\'';
export const dynamicParams = true;
export const revalidate = 0;

export default function DynamicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
'

for page in "${PAGES[@]}"; do
  layout_file="$page/layout.tsx"
  
  # Only create if doesn't exist
  if [ ! -f "$layout_file" ]; then
    mkdir -p "$page"
    echo "$LAYOUT_CONTENT" > "$layout_file"
    echo "✓ Created $layout_file"
  fi
done

echo "Done!"
