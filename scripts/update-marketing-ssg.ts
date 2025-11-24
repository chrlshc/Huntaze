#!/usr/bin/env ts-node
/**
 * Script to update marketing pages for Static Site Generation (SSG)
 * 
 * This script:
 * 1. Finds all page.tsx files in app/(marketing)
 * 2. Replaces `export const dynamic = 'force-dynamic'` with `export const dynamic = 'force-static'`
 * 3. Adds comments explaining the SSG configuration
 * 
 * Task: 11. SSG Configuration
 * Spec: mobile-ux-marketing-refactor
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

const MARKETING_DIR = 'app/(marketing)';

async function updateMarketingPages() {
  console.log('🔍 Finding marketing pages...\n');
  
  // Find all page.tsx files in marketing directory
  const pages = await glob(`${MARKETING_DIR}/**/page.tsx`);
  
  console.log(`Found ${pages.length} marketing pages\n`);
  
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  for (const pagePath of pages) {
    try {
      const content = fs.readFileSync(pagePath, 'utf-8');
      
      // Check if page has force-dynamic
      if (content.includes("export const dynamic = 'force-dynamic'")) {
        // Replace force-dynamic with force-static and add comment
        let newContent = content.replace(
          /export const dynamic = 'force-dynamic';/g,
          "// Enable static generation for optimal performance and SEO\nexport const dynamic = 'force-static';"
        );
        
        // Write updated content
        fs.writeFileSync(pagePath, newContent, 'utf-8');
        console.log(`✅ Updated: ${pagePath}`);
        updatedCount++;
      } else if (content.includes("export const dynamic = 'force-static'")) {
        console.log(`⏭️  Already static: ${pagePath}`);
        skippedCount++;
      } else {
        console.log(`⏭️  No dynamic export: ${pagePath}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${pagePath}:`, error);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`   Updated: ${updatedCount}`);
  console.log(`   Skipped: ${skippedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log(`   Total: ${pages.length}`);
}

updateMarketingPages().catch(console.error);
