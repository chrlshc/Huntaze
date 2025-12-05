/**
 * **Feature: dashboard-ux-overhaul, Property 1: Sidebar Section Completeness**
 * **Validates: Requirements 1.1**
 * 
 * Property: For any rendered sidebar component, the sidebar SHALL contain all 
 * required sections: Home, OnlyFans, Analytics, Marketing, Content, Automations, 
 * Integrations, Settings.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SIDEBAR_SECTIONS } from '@/src/components/sidebar-config';

// Required sections per design spec
const REQUIRED_SECTIONS = [
  'home',
  'onlyfans', 
  'analytics',
  'marketing',
  'content',
  'automations',
  'integrations',
  'settings'
] as const;

// Required section labels for display
const REQUIRED_LABELS = [
  'Home',
  'OnlyFans',
  'Analytics', 
  'Marketing',
  'Content',
  'Automations',
  'Integrations',
  'Settings'
] as const;

describe('Sidebar Section Completeness Property', () => {
  /**
   * Property 1: All required sections must be present in SIDEBAR_SECTIONS
   */
  it('should contain all required section IDs', () => {
    fc.assert(
      fc.property(
        fc.constant(SIDEBAR_SECTIONS),
        (sections) => {
          const sectionIds = sections.map(s => s.id);
          
          // Every required section must be present
          for (const requiredId of REQUIRED_SECTIONS) {
            expect(sectionIds).toContain(requiredId);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1b: All required section labels must be present
   */
  it('should contain all required section labels', () => {
    fc.assert(
      fc.property(
        fc.constant(SIDEBAR_SECTIONS),
        (sections) => {
          const sectionLabels = sections.map(s => s.label);
          
          for (const requiredLabel of REQUIRED_LABELS) {
            expect(sectionLabels).toContain(requiredLabel);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1c: Each section must have an icon
   */
  it('should have an icon for every section', () => {
    fc.assert(
      fc.property(
        fc.constant(SIDEBAR_SECTIONS),
        (sections) => {
          for (const section of sections) {
            expect(section.icon).toBeDefined();
            // Lucide icons are React forward_ref components with $$typeof symbol
            expect(section.icon).toHaveProperty('$$typeof');
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1d: Each section must have either href or items (navigation target)
   */
  it('should have navigation target (href or items) for every section', () => {
    fc.assert(
      fc.property(
        fc.constant(SIDEBAR_SECTIONS),
        (sections) => {
          for (const section of sections) {
            const hasHref = typeof section.href === 'string' && section.href.length > 0;
            const hasItems = Array.isArray(section.items) && section.items.length > 0;
            
            // Each section must have at least one navigation method
            expect(hasHref || hasItems).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1e: Section count must be exactly 8 (no more, no less)
   */
  it('should have exactly 8 main sections', () => {
    fc.assert(
      fc.property(
        fc.constant(SIDEBAR_SECTIONS),
        (sections) => {
          expect(sections.length).toBe(8);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1f: OnlyFans section must have required sub-items
   */
  it('should have required OnlyFans sub-items', () => {
    const requiredOnlyFansItems = ['Overview', 'Messages', 'Fans', 'PPV', 'Settings'];
    
    fc.assert(
      fc.property(
        fc.constant(SIDEBAR_SECTIONS),
        (sections) => {
          const onlyfansSection = sections.find(s => s.id === 'onlyfans');
          expect(onlyfansSection).toBeDefined();
          expect(onlyfansSection?.items).toBeDefined();
          
          const itemLabels = onlyfansSection?.items?.map(i => i.label) || [];
          
          for (const required of requiredOnlyFansItems) {
            expect(itemLabels).toContain(required);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 1g: Analytics section must have required sub-items
   */
  it('should have required Analytics sub-items', () => {
    const requiredAnalyticsItems = ['Overview', 'Revenue', 'Fans', 'Churn', 'Pricing', 'Forecast'];
    
    fc.assert(
      fc.property(
        fc.constant(SIDEBAR_SECTIONS),
        (sections) => {
          const analyticsSection = sections.find(s => s.id === 'analytics');
          expect(analyticsSection).toBeDefined();
          expect(analyticsSection?.items).toBeDefined();
          
          const itemLabels = analyticsSection?.items?.map(i => i.label) || [];
          
          for (const required of requiredAnalyticsItems) {
            expect(itemLabels).toContain(required);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
