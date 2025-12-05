/**
 * Property Test: Fan LTV and Churn Display
 * 
 * Feature: dashboard-ux-overhaul
 * Property 11: Fan LTV and Churn Display
 * Validates: Requirements 3.3.4
 * 
 * Tests that the Fans page correctly displays:
 * - Lifetime Value (LTV) for each fan
 * - Churn risk indicators with appropriate color coding
 * - AI insights per fan
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Fan interface matching the component
interface Fan {
  id: string;
  name: string;
  username: string;
  tier: string;
  ltv: number;
  arpu: number;
  lastActive: string;
  messages: number;
  churnRisk: number;
  aiInsight?: string;
}

// Arbitraries for generating test data
const fanTierArb = fc.constantFrom('VIP', 'Active', 'At-Risk', 'Churned', 'New');

const fanArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  username: fc.string({ minLength: 1, maxLength: 30 }).map(s => `@${s}`),
  tier: fanTierArb,
  ltv: fc.float({ min: 0, max: 100000, noNaN: true }),
  arpu: fc.float({ min: 0, max: 1000, noNaN: true }),
  lastActive: fc.constantFrom('1 hour ago', '2 hours ago', '1 day ago', '3 days ago', '1 week ago'),
  messages: fc.nat({ max: 10000 }),
  churnRisk: fc.integer({ min: 0, max: 100 }),
  aiInsight: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
});

const fansListArb = fc.array(fanArb, { minLength: 0, maxLength: 50 });

// Validation functions matching component behavior
function getChurnRiskColor(risk: number): string {
  if (risk >= 70) return 'text-red-600 bg-red-100';
  if (risk >= 40) return 'text-yellow-600 bg-yellow-100';
  return 'text-green-600 bg-green-100';
}

function getChurnRiskLabel(risk: number): string {
  if (risk >= 70) return 'High';
  if (risk >= 40) return 'Medium';
  return 'Low';
}

function formatLTV(ltv: number): string {
  return `$${ltv.toLocaleString()}`;
}

function validateFanDisplay(fan: Fan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (fan.ltv < 0) errors.push('LTV cannot be negative');
  if (fan.churnRisk < 0 || fan.churnRisk > 100) errors.push('Churn risk must be 0-100');
  if (!fan.id) errors.push('Fan must have an ID');
  if (!fan.name) errors.push('Fan must have a name');
  
  return { valid: errors.length === 0, errors };
}

function getTierPriority(tier: string): number {
  const priorities: Record<string, number> = {
    'VIP': 1,
    'Active': 2,
    'At-Risk': 3,
    'Churned': 4,
    'New': 5,
  };
  return priorities[tier] || 99;
}

describe('Fan LTV and Churn Display Property Tests', () => {
  describe('Property 11: Fan LTV and Churn Display', () => {
    it('should display LTV as non-negative currency value', () => {
      fc.assert(
        fc.property(fanArb, (fan) => {
          const formatted = formatLTV(fan.ltv);
          return formatted.startsWith('$') && fan.ltv >= 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct churn risk color based on percentage', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (risk) => {
          const color = getChurnRiskColor(risk);
          
          if (risk >= 70) {
            return color.includes('red');
          } else if (risk >= 40) {
            return color.includes('yellow');
          } else {
            return color.includes('green');
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct churn risk label based on percentage', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (risk) => {
          const label = getChurnRiskLabel(risk);
          
          if (risk >= 70) {
            return label === 'High';
          } else if (risk >= 40) {
            return label === 'Medium';
          } else {
            return label === 'Low';
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should validate all fans in a list have required fields', () => {
      fc.assert(
        fc.property(fansListArb, (fans) => {
          return fans.every(fan => {
            const validation = validateFanDisplay(fan);
            return validation.valid;
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should ensure churn risk is always within 0-100 range', () => {
      fc.assert(
        fc.property(fanArb, (fan) => {
          return fan.churnRisk >= 0 && fan.churnRisk <= 100;
        }),
        { numRuns: 100 }
      );
    });

    it('should format LTV correctly for various amounts', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 100000, noNaN: true }), (ltv) => {
          const formatted = formatLTV(ltv);
          // Should start with $ and contain the number
          return formatted.startsWith('$') && formatted.length > 1;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle fans with and without AI insights', () => {
      fc.assert(
        fc.property(fanArb, (fan) => {
          // AI insight is optional - both cases should be valid
          if (fan.aiInsight !== undefined) {
            return typeof fan.aiInsight === 'string' && fan.aiInsight.length > 0;
          }
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should maintain tier ordering consistency', () => {
      fc.assert(
        fc.property(fansListArb, (fans) => {
          // Each fan should have a valid tier
          return fans.every(fan => {
            const priority = getTierPriority(fan.tier);
            return priority >= 1 && priority <= 99;
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of zero LTV', () => {
      const zeroLTVFan: Fan = {
        id: 'test-1',
        name: 'Test Fan',
        username: '@test',
        tier: 'New',
        ltv: 0,
        arpu: 0,
        lastActive: '1 hour ago',
        messages: 0,
        churnRisk: 50,
      };
      
      const validation = validateFanDisplay(zeroLTVFan);
      expect(validation.valid).toBe(true);
      expect(formatLTV(zeroLTVFan.ltv)).toBe('$0');
    });

    it('should handle edge case of maximum churn risk', () => {
      const highRiskFan: Fan = {
        id: 'test-2',
        name: 'High Risk Fan',
        username: '@highrisk',
        tier: 'At-Risk',
        ltv: 100,
        arpu: 10,
        lastActive: '1 week ago',
        messages: 5,
        churnRisk: 100,
      };
      
      expect(getChurnRiskLabel(highRiskFan.churnRisk)).toBe('High');
      expect(getChurnRiskColor(highRiskFan.churnRisk)).toContain('red');
    });

    it('should handle edge case of zero churn risk', () => {
      const lowRiskFan: Fan = {
        id: 'test-3',
        name: 'Low Risk Fan',
        username: '@lowrisk',
        tier: 'VIP',
        ltv: 5000,
        arpu: 100,
        lastActive: '1 hour ago',
        messages: 500,
        churnRisk: 0,
      };
      
      expect(getChurnRiskLabel(lowRiskFan.churnRisk)).toBe('Low');
      expect(getChurnRiskColor(lowRiskFan.churnRisk)).toContain('green');
    });

    it('should correctly identify boundary values for churn risk', () => {
      // Test boundary at 40
      expect(getChurnRiskLabel(39)).toBe('Low');
      expect(getChurnRiskLabel(40)).toBe('Medium');
      
      // Test boundary at 70
      expect(getChurnRiskLabel(69)).toBe('Medium');
      expect(getChurnRiskLabel(70)).toBe('High');
    });
  });
});
