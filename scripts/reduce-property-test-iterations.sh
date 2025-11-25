#!/bin/bash

# Script to reduce property test iterations from 100 to 10 to prevent RAM crashes

echo "Reducing property test iterations to prevent RAM crashes..."

# List of files to update
files=(
  "tests/unit/components/navlink-active-state.property.test.tsx"
  "tests/unit/components/marketing-header-presence.property.test.tsx"
  "tests/unit/components/marketing-header-sticky.property.test.tsx"
  "tests/unit/components/mobile-nav-parity.property.test.tsx"
  "tests/unit/components/mobile-nav-accessibility.property.test.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing $file..."
    # Replace numRuns: 100 with numRuns: 10
    sed -i.bak 's/numRuns: 100/numRuns: 10/g' "$file"
    rm "${file}.bak" 2>/dev/null || true
    echo "✓ Updated $file"
  else
    echo "⚠ File not found: $file"
  fi
done

echo ""
echo "✅ All property test iterations reduced from 100 to 10"
echo "This prevents RAM crashes when running all tests together"
