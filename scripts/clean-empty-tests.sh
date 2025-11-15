#!/bin/bash

# Script to remove empty test files

echo "🧹 Cleaning empty test files..."

EMPTY_COUNT=0

# Find and remove empty test files
while IFS= read -r file; do
  if [ ! -s "$file" ]; then
    echo "Removing empty file: $file"
    rm "$file"
    ((EMPTY_COUNT++))
  fi
done < <(find tests -name "*.test.ts" -o -name "*.test.tsx")

echo "✅ Removed $EMPTY_COUNT empty test files"
