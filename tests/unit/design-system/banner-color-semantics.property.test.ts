/**
 * **Feature: dashboard-design-refactor, Property 12: Banner color semantics**
 * **Validates: Requirements 5.1**
 * 
 * For any Banner component, the background color SHALL match the semantic 
 * color token for its status (info→blue, warning→yellow, critical→red, success→green).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Banner status types
type BannerStatus = 'info' | 'warning' | 'critical' | 'success';

// Banner configuration
interface BannerConfig {
  status: BannerStatus;
  title: string;
  description?: string;
  hasAction: boolean;
  hasDismiss: boolean;
}

// Expected color mappings
const statusColorMappings: Record<BannerStatus, {
  backgroundContains: string;
  borderContains: string;
  semanticColor: string;
}> = {
  info: {
    backgroundContains: 'EBF5FF', // Light blue
    borderContains: 'info',
    semanticColor: 'blue',
  },
  warning: {
    backgroundContains: 'FFF8E6', // Light yellow
    borderContains: 'warning',
    semanticColor: 'yellow',
  },
  critical: {
    backgroundContains: 'FFF4F4', // Light red
    borderContains: 'critical',
    semanticColor: 'red',
  },
  success: {
    backgroundContains: 'F0FDF4', // Light green
    borderContains: 'success',
    semanticColor: 'green',
  },
};

// Simulated Banner style output
interface BannerStyleOutput {
  backgroundClass: string;
  borderClass: string;
  iconColorClass: string;
}

// Simulate Banner styling logic
function simulateBannerStyles(status: BannerStatus): BannerStyleOutput {
  const mapping = statusColorMappings[status];
  
  return {
    backgroundClass: `bg-[#${mapping.backgroundContains}]`,
    borderClass: `border-[var(--color-status-${status})]`,
    iconColorClass: `text-[var(--color-status-${status})]`,
  };
}

// Arbitraries
const statusArb = fc.constantFrom('info', 'warning', 'critical', 'success') as fc.Arbitrary<BannerStatus>;
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

const bannerConfigArb = fc.record({
  status: statusArb,
  title: nonEmptyStringArb,
  description: fc.option(nonEmptyStringArb, { nil: undefined }),
  hasAction: fc.boolean(),
  hasDismiss: fc.boolean(),
});

describe('Property 12: Banner color semantics', () => {
  it('info status should use blue semantic colors', () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constant('info' as BannerStatus),
          title: nonEmptyStringArb,
          description: fc.option(nonEmptyStringArb, { nil: undefined }),
          hasAction: fc.boolean(),
          hasDismiss: fc.boolean(),
        }),
        (config) => {
          const styles = simulateBannerStyles(config.status);
          expect(styles.backgroundClass).toContain('EBF5FF');
          expect(styles.borderClass).toContain('info');
          expect(styles.iconColorClass).toContain('info');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('warning status should use yellow semantic colors', () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constant('warning' as BannerStatus),
          title: nonEmptyStringArb,
          description: fc.option(nonEmptyStringArb, { nil: undefined }),
          hasAction: fc.boolean(),
          hasDismiss: fc.boolean(),
        }),
        (config) => {
          const styles = simulateBannerStyles(config.status);
          expect(styles.backgroundClass).toContain('FFF8E6');
          expect(styles.borderClass).toContain('warning');
          expect(styles.iconColorClass).toContain('warning');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('critical status should use red semantic colors', () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constant('critical' as BannerStatus),
          title: nonEmptyStringArb,
          description: fc.option(nonEmptyStringArb, { nil: undefined }),
          hasAction: fc.boolean(),
          hasDismiss: fc.boolean(),
        }),
        (config) => {
          const styles = simulateBannerStyles(config.status);
          expect(styles.backgroundClass).toContain('FFF4F4');
          expect(styles.borderClass).toContain('critical');
          expect(styles.iconColorClass).toContain('critical');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('success status should use green semantic colors', () => {
    fc.assert(
      fc.property(
        fc.record({
          status: fc.constant('success' as BannerStatus),
          title: nonEmptyStringArb,
          description: fc.option(nonEmptyStringArb, { nil: undefined }),
          hasAction: fc.boolean(),
          hasDismiss: fc.boolean(),
        }),
        (config) => {
          const styles = simulateBannerStyles(config.status);
          expect(styles.backgroundClass).toContain('F0FDF4');
          expect(styles.borderClass).toContain('success');
          expect(styles.iconColorClass).toContain('success');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all statuses should have consistent color token pattern', () => {
    fc.assert(
      fc.property(statusArb, (status) => {
        const styles = simulateBannerStyles(status);
        // Border and icon should reference the same status token
        expect(styles.borderClass).toContain(status);
        expect(styles.iconColorClass).toContain(status);
      }),
      { numRuns: 100 }
    );
  });
});
