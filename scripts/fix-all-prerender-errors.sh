#!/bin/bash
# Fix all prerender errors by adding force-dynamic or layout

MAX_ITERATIONS=50
iteration=0

while [ $iteration -lt $MAX_ITERATIONS ]; do
  iteration=$((iteration + 1))
  
  # Run build and capture failing page
  FAILING_PAGE=$(npm run build 2>&1 | grep "Error occurred prerendering page" | head -1 | sed 's/.*page "\(.*\)".*/\1/')
  
  if [ -z "$FAILING_PAGE" ]; then
    echo "✅ No more prerender errors!"
    exit 0
  fi
  
  # Convert route to file path
  PAGE_FILE="app${FAILING_PAGE}/page.tsx"
  LAYOUT_FILE="app${FAILING_PAGE}/layout.tsx"
  
  if [ ! -f "$PAGE_FILE" ]; then
    echo "❌ Could not find $PAGE_FILE"
    exit 1
  fi
  
  # Check if already has layout
  if [ -f "$LAYOUT_FILE" ]; then
    echo "⚠️  $LAYOUT_FILE already exists, but page still failing"
    exit 1
  fi
  
  # Check if page already has dynamic export
  if grep -q "export const dynamic" "$PAGE_FILE"; then
    # Create a layout instead
    cat > "$LAYOUT_FILE" << 'LAYOUT_EOF'
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
LAYOUT_EOF
    echo "✓ Created layout for $FAILING_PAGE (iteration $iteration)"
  else
    # Add dynamic export to page
    if grep -q "^['\"]use client['\"]" "$PAGE_FILE"; then
      # Add after "use client"
      sed -i '' "/^['\"]use client['\"]/a\\
\\
export const dynamic = 'force-dynamic';
" "$PAGE_FILE"
    else
      # Add at the beginning
      echo "export const dynamic = 'force-dynamic';" | cat - "$PAGE_FILE" > temp && mv temp "$PAGE_FILE"
    fi
    echo "✓ Fixed $PAGE_FILE (iteration $iteration)"
  fi
done

echo "⚠️  Reached max iterations ($MAX_ITERATIONS)"
exit 1
