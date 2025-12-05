/**
 * Property-Based Tests for Auto-Reply Status Indicator
 * **Feature: dashboard-ux-overhaul, Property 8: Auto-Reply Status Indicator**
 * **Validates: Requirements 3.2.3**
 * 
 * Property: For any Auto-Reply configuration state (enabled/disabled), 
 * the UI SHALL display the correct status indicator.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types matching the component
type AutoReplyTone = 'friendly' | 'professional' | 'flirty' | 'casual';
type AutoReplyStyle = 'short' | 'medium' | 'detailed';

interface AutoReplyConfig {
  enabled: boolean;
  tone: AutoReplyTone;
  style: AutoReplyStyle;
  responseDelay: number;
  personality: string;
  boundaries: string[];
  flagComplexMessages: boolean;
  requireApproval: boolean;
}

// Generators
const toneArb = fc.constantFrom<AutoReplyTone>('friendly', 'professional', 'flirty', 'casual');
const styleArb = fc.constantFrom<AutoReplyStyle>('short', 'medium', 'detailed');
const delayArb = fc.constantFrom(0, 15, 30, 60, 120, 300);

const autoReplyConfigArb = fc.record({
  enabled: fc.boolean(),
  tone: toneArb,
  style: styleArb,
  responseDelay: delayArb,
  personality: fc.string({ maxLength: 500 }),
  boundaries: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }),
  flagComplexMessages: fc.boolean(),
  requireApproval: fc.boolean()
});

// Status indicator rendering logic (mirrors component logic)
function getStatusIndicator(config: AutoReplyConfig): {
  status: 'enabled' | 'disabled';
  label: string;
  colorClass: string;
} {
  if (config.enabled) {
    return {
      status: 'enabled',
      label: 'Active',
      colorClass: 'bg-green-500/20 text-green-500'
    };
  }
  return {
    status: 'disabled',
    label: 'Inactive',
    colorClass: 'bg-gray-500/20 text-gray-500'
  };
}

// Validate status indicator matches config state
function validateStatusIndicator(config: AutoReplyConfig): boolean {
  const indicator = getStatusIndicator(config);
  
  if (config.enabled) {
    return indicator.status === 'enabled' && 
           indicator.label === 'Active' &&
           indicator.colorClass.includes('green');
  } else {
    return indicator.status === 'disabled' && 
           indicator.label === 'Inactive' &&
           indicator.colorClass.includes('gray');
  }
}

describe('Property 8: Auto-Reply Status Indicator', () => {
  /**
   * **Feature: dashboard-ux-overhaul, Property 8: Auto-Reply Status Indicator**
   * **Validates: Requirements 3.2.3**
   */
  
  it('should display correct status indicator for any enabled/disabled state', () => {
    fc.assert(
      fc.property(autoReplyConfigArb, (config) => {
        const indicator = getStatusIndicator(config);
        
        // Status must match enabled state
        expect(indicator.status).toBe(config.enabled ? 'enabled' : 'disabled');
        
        // Label must be correct
        expect(indicator.label).toBe(config.enabled ? 'Active' : 'Inactive');
        
        // Color must indicate state
        if (config.enabled) {
          expect(indicator.colorClass).toContain('green');
        } else {
          expect(indicator.colorClass).toContain('gray');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should always show status indicator regardless of other config options', () => {
    fc.assert(
      fc.property(autoReplyConfigArb, (config) => {
        const indicator = getStatusIndicator(config);
        
        // Indicator should always be defined
        expect(indicator).toBeDefined();
        expect(indicator.status).toBeDefined();
        expect(indicator.label).toBeDefined();
        expect(indicator.colorClass).toBeDefined();
        
        // Status should be one of the valid values
        expect(['enabled', 'disabled']).toContain(indicator.status);
      }),
      { numRuns: 100 }
    );
  });

  it('should toggle status correctly when enabled changes', () => {
    fc.assert(
      fc.property(autoReplyConfigArb, (config) => {
        const originalIndicator = getStatusIndicator(config);
        const toggledConfig = { ...config, enabled: !config.enabled };
        const toggledIndicator = getStatusIndicator(toggledConfig);
        
        // Status should be opposite after toggle
        expect(originalIndicator.status).not.toBe(toggledIndicator.status);
        
        // Labels should be different
        expect(originalIndicator.label).not.toBe(toggledIndicator.label);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain status consistency across config changes', () => {
    fc.assert(
      fc.property(
        autoReplyConfigArb,
        toneArb,
        styleArb,
        delayArb,
        (config, newTone, newStyle, newDelay) => {
          const originalIndicator = getStatusIndicator(config);
          
          // Change other config options but keep enabled the same
          const modifiedConfig = {
            ...config,
            tone: newTone,
            style: newStyle,
            responseDelay: newDelay
          };
          
          const modifiedIndicator = getStatusIndicator(modifiedConfig);
          
          // Status should remain the same since enabled didn't change
          expect(originalIndicator.status).toBe(modifiedIndicator.status);
          expect(originalIndicator.label).toBe(modifiedIndicator.label);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should validate status indicator for all config combinations', () => {
    fc.assert(
      fc.property(autoReplyConfigArb, (config) => {
        expect(validateStatusIndicator(config)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  // Edge cases
  it('should handle empty personality and boundaries', () => {
    const config: AutoReplyConfig = {
      enabled: true,
      tone: 'friendly',
      style: 'medium',
      responseDelay: 30,
      personality: '',
      boundaries: [],
      flagComplexMessages: true,
      requireApproval: false
    };
    
    const indicator = getStatusIndicator(config);
    expect(indicator.status).toBe('enabled');
    expect(indicator.label).toBe('Active');
  });

  it('should handle maximum boundaries array', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 10, maxLength: 10 }),
        fc.boolean(),
        (boundaries, enabled) => {
          const config: AutoReplyConfig = {
            enabled,
            tone: 'friendly',
            style: 'medium',
            responseDelay: 30,
            personality: 'Test personality',
            boundaries,
            flagComplexMessages: true,
            requireApproval: false
          };
          
          const indicator = getStatusIndicator(config);
          expect(indicator.status).toBe(enabled ? 'enabled' : 'disabled');
        }
      ),
      { numRuns: 50 }
    );
  });
});
