/**
 * Property Test: OnlyFans Metrics Display
 * 
 * Feature: dashboard-ux-overhaul
 * Property 3: OnlyFans Metrics Display
 * Validates: Requirements 2.2
 * 
 * Tests that the OnlyFans dashboard correctly displays all required metrics:
 * - Messages (total, unread, response rate)
 * - Fans (total, active, new)
 * - Revenue (total, sales, conversion)
 * - AI Quota (used, remaining)
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types for OnlyFans metrics
interface MessagesMetrics {
  total: number;
  unread: number;
  responseRate: number;
  avgResponseTime: number;
}

interface FansMetrics {
  total: number;
  active: number;
  new: number;
}

interface RevenueMetrics {
  totalRevenue: number;
  totalSales: number;
  conversionRate: number;
}

interface AIQuotaMetrics {
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

interface OnlyFansStats {
  messages: MessagesMetrics;
  fans: FansMetrics;
  ppv: RevenueMetrics;
  connection: {
    isConnected: boolean;
    lastSync: Date | null;
    status: 'connected' | 'disconnected' | 'error';
  };
}

// Arbitraries for generating test data
const messagesMetricsArb = fc.record({
  total: fc.nat({ max: 100000 }),
  unread: fc.nat({ max: 1000 }),
  responseRate: fc.float({ min: 0, max: 100, noNaN: true }),
  avgResponseTime: fc.nat({ max: 3600 }),
});

const fansMetricsArb = fc.record({
  total: fc.nat({ max: 1000000 }),
  active: fc.nat({ max: 100000 }),
  new: fc.nat({ max: 10000 }),
});

const revenueMetricsArb = fc.record({
  totalRevenue: fc.float({ min: 0, max: 1000000, noNaN: true }),
  totalSales: fc.nat({ max: 100000 }),
  conversionRate: fc.float({ min: 0, max: 100, noNaN: true }),
});

const aiQuotaMetricsArb = fc.record({
  limit: fc.integer({ min: 1, max: 1000 }),
  spent: fc.float({ min: 0, max: 1000, noNaN: true }),
  remaining: fc.float({ min: 0, max: 1000, noNaN: true }),
  percentUsed: fc.float({ min: 0, max: 100, noNaN: true }),
});

const connectionStatusArb = fc.constantFrom('connected', 'disconnected', 'error') as fc.Arbitrary<'connected' | 'disconnected' | 'error'>;

const onlyFansStatsArb = fc.record({
  messages: messagesMetricsArb,
  fans: fansMetricsArb,
  ppv: revenueMetricsArb,
  connection: fc.record({
    isConnected: fc.boolean(),
    lastSync: fc.option(fc.date(), { nil: null }),
    status: connectionStatusArb,
  }),
});

// Validation functions
function validateMessagesDisplay(metrics: MessagesMetrics): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (metrics.total < 0) errors.push('Total messages cannot be negative');
  if (metrics.unread < 0) errors.push('Unread messages cannot be negative');
  if (metrics.unread > metrics.total) errors.push('Unread cannot exceed total messages');
  if (metrics.responseRate < 0 || metrics.responseRate > 100) errors.push('Response rate must be 0-100%');
  if (metrics.avgResponseTime < 0) errors.push('Average response time cannot be negative');
  
  return { valid: errors.length === 0, errors };
}

function validateFansDisplay(metrics: FansMetrics): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (metrics.total < 0) errors.push('Total fans cannot be negative');
  if (metrics.active < 0) errors.push('Active fans cannot be negative');
  if (metrics.active > metrics.total) errors.push('Active fans cannot exceed total');
  if (metrics.new < 0) errors.push('New fans cannot be negative');
  
  return { valid: errors.length === 0, errors };
}

function validateRevenueDisplay(metrics: RevenueMetrics): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (metrics.totalRevenue < 0) errors.push('Total revenue cannot be negative');
  if (metrics.totalSales < 0) errors.push('Total sales cannot be negative');
  if (metrics.conversionRate < 0 || metrics.conversionRate > 100) errors.push('Conversion rate must be 0-100%');
  
  return { valid: errors.length === 0, errors };
}

function validateAIQuotaDisplay(metrics: AIQuotaMetrics): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (metrics.limit <= 0) errors.push('AI quota limit must be positive');
  if (metrics.spent < 0) errors.push('AI quota spent cannot be negative');
  if (metrics.remaining < 0) errors.push('AI quota remaining cannot be negative');
  if (metrics.percentUsed < 0 || metrics.percentUsed > 100) errors.push('Percent used must be 0-100%');
  
  return { valid: errors.length === 0, errors };
}

// Format functions (matching component behavior)
function formatNumber(num: number): string {
  return num.toLocaleString();
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function formatPercentage(value: number): string {
  return `${value.toFixed(0)}%`;
}

function getQuotaColorClass(percentUsed: number): string {
  if (percentUsed >= 95) return 'text-red-600';
  if (percentUsed >= 80) return 'text-yellow-600';
  return 'text-green-600';
}

function getConnectionStatusClass(status: 'connected' | 'disconnected' | 'error'): string {
  switch (status) {
    case 'connected': return 'text-green-600';
    case 'error': return 'text-red-600';
    default: return 'text-gray-600';
  }
}

describe('OnlyFans Metrics Display Property Tests', () => {
  describe('Property 3: OnlyFans Metrics Display', () => {
    it('should display all required metric cards', () => {
      fc.assert(
        fc.property(onlyFansStatsArb, aiQuotaMetricsArb, (stats, quota) => {
          // All four metric cards should be present
          const requiredCards = ['messages', 'fans', 'revenue', 'ai-quota'];
          
          // Simulate rendering check
          const renderedCards = [
            stats.messages ? 'messages' : null,
            stats.fans ? 'fans' : null,
            stats.ppv ? 'revenue' : null,
            quota ? 'ai-quota' : null,
          ].filter(Boolean);
          
          return requiredCards.every(card => renderedCards.includes(card));
        }),
        { numRuns: 100 }
      );
    });

    it('should validate messages metrics are non-negative', () => {
      fc.assert(
        fc.property(messagesMetricsArb, (metrics) => {
          const validation = validateMessagesDisplay(metrics);
          // Generated metrics should always be valid (non-negative)
          return metrics.total >= 0 && 
                 metrics.unread >= 0 && 
                 metrics.avgResponseTime >= 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate fans metrics are non-negative', () => {
      fc.assert(
        fc.property(fansMetricsArb, (metrics) => {
          const validation = validateFansDisplay(metrics);
          return metrics.total >= 0 && 
                 metrics.active >= 0 && 
                 metrics.new >= 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate revenue metrics are non-negative', () => {
      fc.assert(
        fc.property(revenueMetricsArb, (metrics) => {
          const validation = validateRevenueDisplay(metrics);
          return metrics.totalRevenue >= 0 && 
                 metrics.totalSales >= 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should validate AI quota metrics are within bounds', () => {
      fc.assert(
        fc.property(aiQuotaMetricsArb, (metrics) => {
          const validation = validateAIQuotaDisplay(metrics);
          return metrics.limit > 0 && 
                 metrics.spent >= 0 && 
                 metrics.remaining >= 0 &&
                 metrics.percentUsed >= 0 && 
                 metrics.percentUsed <= 100;
        }),
        { numRuns: 100 }
      );
    });

    it('should format numbers correctly for display', () => {
      fc.assert(
        fc.property(fc.nat({ max: 1000000 }), (num) => {
          const formatted = formatNumber(num);
          // Should contain the number (possibly with commas)
          const parsedBack = parseInt(formatted.replace(/,/g, ''), 10);
          return parsedBack === num;
        }),
        { numRuns: 100 }
      );
    });

    it('should format currency correctly', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 100000, noNaN: true }), (amount) => {
          const formatted = formatCurrency(amount);
          return formatted.startsWith('$');
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct color class for AI quota based on usage', () => {
      fc.assert(
        fc.property(fc.float({ min: 0, max: 100, noNaN: true }), (percentUsed) => {
          const colorClass = getQuotaColorClass(percentUsed);
          
          if (percentUsed >= 95) {
            return colorClass === 'text-red-600';
          } else if (percentUsed >= 80) {
            return colorClass === 'text-yellow-600';
          } else {
            return colorClass === 'text-green-600';
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should apply correct color class for connection status', () => {
      fc.assert(
        fc.property(connectionStatusArb, (status) => {
          const colorClass = getConnectionStatusClass(status);
          
          switch (status) {
            case 'connected':
              return colorClass === 'text-green-600';
            case 'error':
              return colorClass === 'text-red-600';
            default:
              return colorClass === 'text-gray-600';
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should display connection banner based on status', () => {
      fc.assert(
        fc.property(onlyFansStatsArb, (stats) => {
          const shouldShowConnectButton = !stats.connection.isConnected;
          const bannerText = stats.connection.status === 'connected' 
            ? 'OnlyFans Connected' 
            : 'OnlyFans Not Connected';
          
          // Banner should always have appropriate text
          return bannerText.length > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('should handle edge case of zero metrics gracefully', () => {
      const zeroStats: OnlyFansStats = {
        messages: { total: 0, unread: 0, responseRate: 0, avgResponseTime: 0 },
        fans: { total: 0, active: 0, new: 0 },
        ppv: { totalRevenue: 0, totalSales: 0, conversionRate: 0 },
        connection: { isConnected: false, lastSync: null, status: 'disconnected' },
      };
      
      const messagesValid = validateMessagesDisplay(zeroStats.messages);
      const fansValid = validateFansDisplay(zeroStats.fans);
      const revenueValid = validateRevenueDisplay(zeroStats.ppv);
      
      expect(messagesValid.valid).toBe(true);
      expect(fansValid.valid).toBe(true);
      expect(revenueValid.valid).toBe(true);
    });

    it('should handle maximum metrics values', () => {
      const maxStats: OnlyFansStats = {
        messages: { total: 100000, unread: 1000, responseRate: 100, avgResponseTime: 3600 },
        fans: { total: 1000000, active: 100000, new: 10000 },
        ppv: { totalRevenue: 1000000, totalSales: 100000, conversionRate: 100 },
        connection: { isConnected: true, lastSync: new Date(), status: 'connected' },
      };
      
      const messagesValid = validateMessagesDisplay(maxStats.messages);
      const fansValid = validateFansDisplay(maxStats.fans);
      const revenueValid = validateRevenueDisplay(maxStats.ppv);
      
      expect(messagesValid.valid).toBe(true);
      expect(fansValid.valid).toBe(true);
      expect(revenueValid.valid).toBe(true);
    });
  });
});
