/**
 * Unit Tests - TikTok Dashboard Widget Logic (Task 7.3)
 * 
 * Tests to validate TikTok dashboard widget helper functions and data formatting
 * Based on: .kiro/specs/social-integrations/tasks.md (Task 7.3)
 * 
 * Coverage:
 * - Number formatting (K, M suffixes)
 * - Date formatting (relative dates)
 * - Engagement rate calculation
 * - Status badge styling
 * - Account data validation
 */

import { describe, it, expect } from 'vitest';

// Helper Functions for TikTok Dashboard Widget

/**
 * Format large numbers with K/M suffixes
 */
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format date as relative time
 */
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Calculate engagement rate
 */
function calculateEngagementRate(
  likes: number,
  comments: number,
  shares: number,
  views: number
): number {
  if (views === 0) return 0;
  const totalEngagements = likes + comments + shares;
  return totalEngagements / views;
}

/**
 * Format engagement rate as percentage
 */
function formatEngagementRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Get status badge class
 */
function getStatusBadgeClass(status: string): string {
  const statusMap: Record<string, string> = {
    'PUBLISHED': 'status-published',
    'PROCESSING': 'status-processing',
    'FAILED': 'status-failed',
    'PENDING': 'status-pending',
  };
  
  return statusMap[status] || 'status-unknown';
}

/**
 * Get status badge color
 */
function getStatusBadgeColor(status: string): string {
  const colorMap: Record<string, string> = {
    'PUBLISHED': 'green',
    'PROCESSING': 'blue',
    'FAILED': 'red',
    'PENDING': 'yellow',
  };
  
  return colorMap[status] || 'gray';
}

/**
 * Validate account data
 */
function validateAccountData(account: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!account) {
    errors.push('Account data is required');
    return { valid: false, errors };
  }
  
  if (!account.username) {
    errors.push('Username is required');
  }
  
  if (!account.display_name) {
    errors.push('Display name is required');
  }
  
  if (typeof account.follower_count !== 'number' || account.follower_count < 0) {
    errors.push('Follower count must be a non-negative number');
  }
  
  if (typeof account.video_count !== 'number' || account.video_count < 0) {
    errors.push('Video count must be a non-negative number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate total analytics
 */
function calculateTotalAnalytics(uploads: Array<{
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
}>): {
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  engagement_rate: number;
} {
  const totals = uploads.reduce(
    (acc, upload) => ({
      views: acc.views + (upload.views || 0),
      likes: acc.likes + (upload.likes || 0),
      shares: acc.shares + (upload.shares || 0),
      comments: acc.comments + (upload.comments || 0),
    }),
    { views: 0, likes: 0, shares: 0, comments: 0 }
  );
  
  const engagement_rate = calculateEngagementRate(
    totals.likes,
    totals.comments,
    totals.shares,
    totals.views
  );
  
  return {
    total_views: totals.views,
    total_likes: totals.likes,
    total_shares: totals.shares,
    total_comments: totals.comments,
    engagement_rate,
  };
}

describe('TikTok Dashboard Widget Logic - Unit Tests (Task 7.3)', () => {
  describe('Requirement 4.4 - Number Formatting', () => {
    it('should format numbers under 1000 without suffix', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(42)).toBe('42');
      expect(formatNumber(999)).toBe('999');
    });

    it('should format thousands with K suffix', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1500)).toBe('1.5K');
      expect(formatNumber(15000)).toBe('15.0K');
      expect(formatNumber(999999)).toBe('1000.0K');
    });

    it('should format millions with M suffix', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(2500000)).toBe('2.5M');
      expect(formatNumber(15000000)).toBe('15.0M');
    });

    it('should round to one decimal place', () => {
      expect(formatNumber(1234)).toBe('1.2K');
      expect(formatNumber(1567)).toBe('1.6K');
      expect(formatNumber(1234567)).toBe('1.2M');
    });

    it('should handle edge cases', () => {
      expect(formatNumber(1000)).toBe('1.0K');
      expect(formatNumber(1000000)).toBe('1.0M');
    });
  });

  describe('Requirement 4.4 - Date Formatting', () => {
    it('should format today as "Today"', () => {
      const today = new Date().toISOString();
      expect(formatRelativeDate(today)).toBe('Today');
    });

    it('should format yesterday as "Yesterday"', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeDate(yesterday)).toBe('Yesterday');
    });

    it('should format recent days as "X days ago"', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
    });

    it('should format weeks as "X weeks ago"', () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeDate(twoWeeksAgo)).toBe('2 weeks ago');
    });

    it('should format months as "X months ago"', () => {
      const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeDate(twoMonthsAgo)).toBe('2 months ago');
    });

    it('should format years as "X years ago"', () => {
      const twoYearsAgo = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeDate(twoYearsAgo)).toBe('2 years ago');
    });
  });

  describe('Requirement 4.4 - Engagement Rate Calculation', () => {
    it('should calculate engagement rate correctly', () => {
      const rate = calculateEngagementRate(100, 20, 10, 1000);
      expect(rate).toBe(0.13); // (100 + 20 + 10) / 1000
    });

    it('should return 0 for zero views', () => {
      const rate = calculateEngagementRate(100, 20, 10, 0);
      expect(rate).toBe(0);
    });

    it('should handle zero engagements', () => {
      const rate = calculateEngagementRate(0, 0, 0, 1000);
      expect(rate).toBe(0);
    });

    it('should calculate high engagement rate', () => {
      const rate = calculateEngagementRate(500, 100, 50, 1000);
      expect(rate).toBe(0.65); // (500 + 100 + 50) / 1000
    });

    it('should handle decimal results', () => {
      const rate = calculateEngagementRate(123, 45, 67, 1000);
      expect(rate).toBe(0.235); // (123 + 45 + 67) / 1000
    });
  });

  describe('Requirement 4.4 - Engagement Rate Formatting', () => {
    it('should format engagement rate as percentage', () => {
      expect(formatEngagementRate(0.082)).toBe('8.20%');
      expect(formatEngagementRate(0.1)).toBe('10.00%');
      expect(formatEngagementRate(0.5)).toBe('50.00%');
    });

    it('should format with two decimal places', () => {
      expect(formatEngagementRate(0.12345)).toBe('12.35%');
      expect(formatEngagementRate(0.001)).toBe('0.10%');
    });

    it('should handle zero rate', () => {
      expect(formatEngagementRate(0)).toBe('0.00%');
    });

    it('should handle 100% rate', () => {
      expect(formatEngagementRate(1)).toBe('100.00%');
    });
  });

  describe('Requirement 4.4 - Status Badge Styling', () => {
    it('should return correct class for PUBLISHED status', () => {
      expect(getStatusBadgeClass('PUBLISHED')).toBe('status-published');
    });

    it('should return correct class for PROCESSING status', () => {
      expect(getStatusBadgeClass('PROCESSING')).toBe('status-processing');
    });

    it('should return correct class for FAILED status', () => {
      expect(getStatusBadgeClass('FAILED')).toBe('status-failed');
    });

    it('should return correct class for PENDING status', () => {
      expect(getStatusBadgeClass('PENDING')).toBe('status-pending');
    });

    it('should return default class for unknown status', () => {
      expect(getStatusBadgeClass('UNKNOWN')).toBe('status-unknown');
    });

    it('should return correct color for each status', () => {
      expect(getStatusBadgeColor('PUBLISHED')).toBe('green');
      expect(getStatusBadgeColor('PROCESSING')).toBe('blue');
      expect(getStatusBadgeColor('FAILED')).toBe('red');
      expect(getStatusBadgeColor('PENDING')).toBe('yellow');
      expect(getStatusBadgeColor('UNKNOWN')).toBe('gray');
    });
  });

  describe('Requirement 4.4 - Account Data Validation', () => {
    it('should validate complete account data', () => {
      const account = {
        username: 'testuser',
        display_name: 'Test User',
        follower_count: 15000,
        video_count: 42,
      };
      
      const result = validateAccountData(account);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject null account', () => {
      const result = validateAccountData(null);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Account data is required');
    });

    it('should reject account without username', () => {
      const account = {
        display_name: 'Test User',
        follower_count: 15000,
        video_count: 42,
      };
      
      const result = validateAccountData(account);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Username is required');
    });

    it('should reject account without display name', () => {
      const account = {
        username: 'testuser',
        follower_count: 15000,
        video_count: 42,
      };
      
      const result = validateAccountData(account);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Display name is required');
    });

    it('should reject negative follower count', () => {
      const account = {
        username: 'testuser',
        display_name: 'Test User',
        follower_count: -100,
        video_count: 42,
      };
      
      const result = validateAccountData(account);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Follower count must be a non-negative number');
    });

    it('should reject negative video count', () => {
      const account = {
        username: 'testuser',
        display_name: 'Test User',
        follower_count: 15000,
        video_count: -5,
      };
      
      const result = validateAccountData(account);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Video count must be a non-negative number');
    });

    it('should accept zero followers and videos', () => {
      const account = {
        username: 'newuser',
        display_name: 'New User',
        follower_count: 0,
        video_count: 0,
      };
      
      const result = validateAccountData(account);
      
      expect(result.valid).toBe(true);
    });

    it('should collect multiple validation errors', () => {
      const account = {
        follower_count: -100,
        video_count: -5,
      };
      
      const result = validateAccountData(account);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('Analytics Calculation', () => {
    it('should calculate total analytics from uploads', () => {
      const uploads = [
        { views: 1000, likes: 100, shares: 10, comments: 20 },
        { views: 2000, likes: 200, shares: 20, comments: 40 },
        { views: 500, likes: 50, shares: 5, comments: 10 },
      ];
      
      const result = calculateTotalAnalytics(uploads);
      
      expect(result.total_views).toBe(3500);
      expect(result.total_likes).toBe(350);
      expect(result.total_shares).toBe(35);
      expect(result.total_comments).toBe(70);
      expect(result.engagement_rate).toBeCloseTo(0.13, 2);
    });

    it('should handle uploads with missing metrics', () => {
      const uploads = [
        { views: 1000, likes: 100 },
        { views: 2000, comments: 40 },
        { shares: 5 },
      ];
      
      const result = calculateTotalAnalytics(uploads);
      
      expect(result.total_views).toBe(3000);
      expect(result.total_likes).toBe(100);
      expect(result.total_shares).toBe(5);
      expect(result.total_comments).toBe(40);
    });

    it('should handle empty uploads array', () => {
      const result = calculateTotalAnalytics([]);
      
      expect(result.total_views).toBe(0);
      expect(result.total_likes).toBe(0);
      expect(result.total_shares).toBe(0);
      expect(result.total_comments).toBe(0);
      expect(result.engagement_rate).toBe(0);
    });

    it('should calculate engagement rate correctly', () => {
      const uploads = [
        { views: 1000, likes: 100, shares: 50, comments: 50 },
      ];
      
      const result = calculateTotalAnalytics(uploads);
      
      expect(result.engagement_rate).toBe(0.2); // (100 + 50 + 50) / 1000
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      expect(formatNumber(1000000000)).toBe('1000.0M');
      expect(formatNumber(999999999)).toBe('1000.0M');
    });

    it('should handle very small engagement rates', () => {
      const rate = calculateEngagementRate(1, 0, 0, 1000000);
      expect(rate).toBe(0.000001);
      expect(formatEngagementRate(rate)).toBe('0.00%');
    });

    it('should handle 100% engagement rate', () => {
      const rate = calculateEngagementRate(500, 300, 200, 1000);
      expect(rate).toBe(1);
      expect(formatEngagementRate(rate)).toBe('100.00%');
    });

    it('should handle engagement rate over 100%', () => {
      const rate = calculateEngagementRate(600, 400, 200, 1000);
      expect(rate).toBe(1.2);
      expect(formatEngagementRate(rate)).toBe('120.00%');
    });

    it('should handle date at exact boundaries', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const result = formatRelativeDate(sevenDaysAgo);
      expect(result).toMatch(/week|days/);
    });
  });
});
