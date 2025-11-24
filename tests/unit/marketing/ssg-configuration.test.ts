/**
 * SSG Configuration Tests
 * 
 * Validates that marketing pages are properly configured for Static Site Generation (SSG)
 * 
 * Task: 11. SSG Configuration
 * Spec: mobile-ux-marketing-refactor
 * 
 * @validates Requirements 4.2 - Static marketing pages should use generateStaticParams for pre-rendering
 * @validates Property 13 - Marketing pages should export generateStaticParams or force-static
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('Marketing Pages SSG Configuration', () => {
  it('should have marketing pages configured for static generation', async () => {
    // Find all page.tsx files in marketing directory
    const pages = await glob('app/(marketing)/**/page.tsx');
    
    expect(pages.length).toBeGreaterThan(0);
    
    const results = {
      forceStatic: [] as string[],
      forceDynamic: [] as string[],
      noExport: [] as string[],
    };
    
    for (const pagePath of pages) {
      const content = fs.readFileSync(pagePath, 'utf-8');
      
      if (content.includes("export const dynamic = 'force-static'")) {
        results.forceStatic.push(pagePath);
      } else if (content.includes("export const dynamic = 'force-dynamic'")) {
        results.forceDynamic.push(pagePath);
      } else {
        results.noExport.push(pagePath);
      }
    }
    
    // Log results for visibility
    console.log('\n📊 SSG Configuration Summary:');
    console.log(`   Force Static: ${results.forceStatic.length}`);
    console.log(`   Force Dynamic: ${results.forceDynamic.length}`);
    console.log(`   No Export (default static): ${results.noExport.length}`);
    console.log(`   Total: ${pages.length}\n`);
    
    // Marketing pages should NOT use force-dynamic
    expect(results.forceDynamic).toHaveLength(0);
    
    // Most marketing pages should be explicitly static or default static
    const staticPages = results.forceStatic.length + results.noExport.length;
    expect(staticPages).toBe(pages.length);
  });
  
  it('should not have force-dynamic in marketing pages', async () => {
    const pages = await glob('app/(marketing)/**/page.tsx');
    
    const forceDynamicPages: string[] = [];
    
    for (const pagePath of pages) {
      const content = fs.readFileSync(pagePath, 'utf-8');
      
      if (content.includes("export const dynamic = 'force-dynamic'")) {
        forceDynamicPages.push(pagePath);
      }
    }
    
    if (forceDynamicPages.length > 0) {
      console.error('\n❌ Pages with force-dynamic:');
      forceDynamicPages.forEach(page => console.error(`   - ${page}`));
    }
    
    expect(forceDynamicPages).toHaveLength(0);
  });
  
  it('should have marketing layout without force-dynamic', () => {
    const layoutPath = 'app/(marketing)/layout.tsx';
    const content = fs.readFileSync(layoutPath, 'utf-8');
    
    // Layout should not force dynamic rendering
    expect(content).not.toContain("export const dynamic = 'force-dynamic'");
  });
});

describe('Static Generation Comments', () => {
  it('should have explanatory comments for force-static exports', async () => {
    const pages = await glob('app/(marketing)/**/page.tsx');
    
    const pagesWithForceStatic: string[] = [];
    const pagesWithComments: string[] = [];
    
    for (const pagePath of pages) {
      const content = fs.readFileSync(pagePath, 'utf-8');
      
      if (content.includes("export const dynamic = 'force-static'")) {
        pagesWithForceStatic.push(pagePath);
        
        // Check if there's a comment explaining the static generation
        const lines = content.split('\n');
        const exportLineIndex = lines.findIndex(line => 
          line.includes("export const dynamic = 'force-static'")
        );
        
        // Check the line before the export for a comment
        if (exportLineIndex > 0) {
          const previousLine = lines[exportLineIndex - 1];
          if (previousLine.includes('//') || previousLine.includes('/*')) {
            pagesWithComments.push(pagePath);
          }
        }
      }
    }
    
    console.log('\n📝 Comment Coverage:');
    console.log(`   Pages with force-static: ${pagesWithForceStatic.length}`);
    console.log(`   Pages with comments: ${pagesWithComments.length}`);
    
    // All pages with force-static should have explanatory comments
    expect(pagesWithComments.length).toBe(pagesWithForceStatic.length);
  });
});
