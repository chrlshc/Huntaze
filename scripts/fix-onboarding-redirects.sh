#!/bin/bash

echo "🔧 Fixing onboarding redirects in all pages"
echo "==========================================="
echo ""

# Find all files with requireOnboarding={true} and replace with requireOnboarding={false}
echo "Searching for files with requireOnboarding={true}..."

FILES=$(grep -r "requireOnboarding={true}" app/ --include="*.tsx" --include="*.ts" -l)

if [ -z "$FILES" ]; then
    echo "✅ No files found with requireOnboarding={true}"
    exit 0
fi

echo "Found files to fix:"
echo "$FILES"
echo ""

# Replace requireOnboarding={true} with requireOnboarding={false}
for file in $FILES; do
    echo "Fixing: $file"
    sed -i '' 's/requireOnboarding={true}/requireOnboarding={false}/g' "$file"
done

echo ""
echo "✅ All files fixed!"
echo ""
echo "Files modified:"
echo "$FILES" | wc -l
echo ""
