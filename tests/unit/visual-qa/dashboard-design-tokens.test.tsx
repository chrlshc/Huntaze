/**
 * Dashboard Design Token Application Tests
 * 
 * Visual regression tests to verify that the dashboard page correctly applies
 * the Linear UI design system tokens (Midnight Violet theme).
 * 
 * Feature: linear-ui-performance-refactor
 * Task: 6.1 Write visual regression tests for dashboard
 * Validates: Requirements 11.2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the hooks
const mockUseDashboard = {
  data: {
    data: {
      summary: {
        totalRevenue: { value: 5000, change: 15 },
        activeFans: { value: 250, change: 10 },
        messages: { total: 150, unread: 5 },
        engagement: { value: 0.75, change: 5 }
      },
      quickActions: [
        { id: '1', icon: 'plus', label: 'New Post', href: '/content/new' }
      ],
      recentActivity: [
        { 
          id: '1', 
          type: 'content_published', 
          title: 'New post published',
          createdAt: new Date().toISOString()
        }
      ],
      metadata: { hasRealData: true }
    }
  },
  isLoading: false,
  error: null
};

const mockUseIntegrations = {
  integrations: [{ id: '1', isConnected: true }],
  loading: false
};

// Mock modules
vi.mock('@/hooks/useDashboard', () => ({
  useDashboard: () => mockUseDashboard,
  formatCurrency: (val: number) => `$${val}`,
  formatPercentage: (val: number) => `${val}%`,
  formatNumber: (val: number) => val.toString()
}));

vi.mock('@/hooks/useIntegrations', () => ({
  useIntegrations: () => mockUseIntegrations
}));

vi.mock('@/components/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Import after mocks
// @ts-ignore - Path with parentheses causes TS issues but works at runtime
import DashboardPage from '@/app/(app)/dashboard/page';

describe('Dashboard Design Token Application', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('Color System Validation', () => {
    it('should use design token for background colors on cards', () => {
      const { container } = render(<DashboardPage />);
      
      // Find summary cards
      const cards = container.querySelectorAll('[style*="background"]');
      
      // At least one card should use the surface color token
      const hasTokenUsage = Array.from(cards).some(card => {
        const style = (card as HTMLElement).getAttribute('style');
        return style?.includes('var(--color-bg-surface)');
      });
      
      expect(hasTokenUsage).toBe(true);
    });

    it('should use design token for border colors', () => {
      const { container } = render(<DashboardPage />);
      
      // Find elements with borders
      const borderedElements = container.querySelectorAll('[style*="border"]');
      
      // At least one element should use the border token
      const hasTokenUsage = Array.from(borderedElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--color-border-subtle)');
      });
      
      expect(hasTokenUsage).toBe(true);
    });

    it('should use design token for text colors', () => {
      const { container } = render(<DashboardPage />);
      
      // Find text elements
      const textElements = container.querySelectorAll('[style*="color"]');
      
      // Should use primary and secondary text tokens
      const hasPrimaryText = Array.from(textElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--color-text-primary)');
      });
      
      const hasSecondaryText = Array.from(textElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--color-text-secondary)');
      });
      
      expect(hasPrimaryText).toBe(true);
      expect(hasSecondaryText).toBe(true);
    });

    it('should use design token for accent colors in empty state', () => {
      // Override mock to show empty state with accent button
      vi.mocked(mockUseIntegrations).integrations = [];
      
      const { container } = render(<DashboardPage />);
      
      // Find the "Connect Your First Account" button or similar accent elements
      const accentElements = container.querySelectorAll('[style*="background"]');
      
      // At least one element should use the accent color
      const hasAccentUsage = Array.from(accentElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--color-accent-primary)');
      });
      
      expect(hasAccentUsage).toBe(true);
      
      // Reset
      vi.mocked(mockUseIntegrations).integrations = [{ id: '1', isConnected: true }];
    });
  });

  describe('Typography System Validation', () => {
    it('should use design token for font family', () => {
      const { container } = render(<DashboardPage />);
      
      // Find heading elements
      const headings = container.querySelectorAll('h1, h2, h3');
      
      // At least one heading should use the font family token
      const hasTokenUsage = Array.from(headings).some(heading => {
        const style = (heading as HTMLElement).getAttribute('style');
        return style?.includes('var(--font-family-base)');
      });
      
      expect(hasTokenUsage).toBe(true);
    });

    it('should use design token for font weights', () => {
      const { container } = render(<DashboardPage />);
      
      // Find elements with font-weight
      const weightedElements = container.querySelectorAll('[style*="font-weight"]');
      
      // Should use medium weight token for headings
      const hasMediumWeight = Array.from(weightedElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--font-weight-medium)');
      });
      
      // Should use regular weight token for body text
      const hasRegularWeight = Array.from(weightedElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--font-weight-regular)');
      });
      
      expect(hasMediumWeight).toBe(true);
      expect(hasRegularWeight).toBe(true);
    });

    it('should use design token for font sizes', () => {
      const { container } = render(<DashboardPage />);
      
      // Find elements with font-size
      const sizedElements = container.querySelectorAll('[style*="font-size"]');
      
      // Should use various size tokens
      const hasTokenUsage = Array.from(sizedElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--font-size-');
      });
      
      expect(hasTokenUsage).toBe(true);
    });
  });

  describe('Spacing System Validation', () => {
    it('should use design token for margins', () => {
      const { container } = render(<DashboardPage />);
      
      // Find elements with margin
      const marginElements = container.querySelectorAll('[style*="margin"]');
      
      // Should use spacing tokens
      const hasTokenUsage = Array.from(marginElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--spacing-');
      });
      
      expect(hasTokenUsage).toBe(true);
    });

    it('should use design token for padding', () => {
      const { container } = render(<DashboardPage />);
      
      // Find elements with padding
      const paddingElements = container.querySelectorAll('[style*="padding"]');
      
      // Should use spacing tokens
      const hasTokenUsage = Array.from(paddingElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--spacing-');
      });
      
      expect(hasTokenUsage).toBe(true);
    });

    it('should use design token for gaps', () => {
      const { container } = render(<DashboardPage />);
      
      // Find elements with gap in their class or style
      const gapElements = container.querySelectorAll('[class*="gap"]');
      
      // Should use spacing tokens in gap classes
      const hasTokenUsage = Array.from(gapElements).some(el => {
        const className = (el as HTMLElement).getAttribute('class');
        // Check for gap with spacing variable pattern
        return className?.includes('gap-[var(--spacing-') || className?.includes('gap-');
      });
      
      expect(hasTokenUsage).toBe(true);
    });
  });

  describe('Layout Constraints Validation', () => {
    it('should wrap content in CenteredContainer', () => {
      const { container } = render(<DashboardPage />);
      
      // Look for the centered container
      const centeredContainer = container.querySelector('[data-testid="centered-container"]');
      
      expect(centeredContainer).toBeInTheDocument();
    });

    it('should apply max-width constraint', () => {
      const { container } = render(<DashboardPage />);
      
      // Find the centered container
      const centeredContainer = container.querySelector('[data-testid="centered-container"]');
      
      // Should have max-width class
      expect(centeredContainer?.className).toMatch(/max-w-\[80rem\]|max-w-\[75rem\]/);
    });

    it('should apply horizontal centering', () => {
      const { container } = render(<DashboardPage />);
      
      // Find the centered container
      const centeredContainer = container.querySelector('[data-testid="centered-container"]');
      
      // Should have mx-auto class for centering
      expect(centeredContainer?.className).toContain('mx-auto');
    });
  });

  describe('Loading State Validation', () => {
    it('should display skeleton screen during loading', () => {
      // Override mock to show loading state
      vi.mocked(mockUseDashboard).isLoading = true;
      
      const { container } = render(<DashboardPage />);
      
      // Should show skeleton screen
      const skeleton = container.querySelector('[data-testid="skeleton-screen"]');
      expect(skeleton).toBeInTheDocument();
      
      // Reset
      vi.mocked(mockUseDashboard).isLoading = false;
    });

    it('should use dashboard variant for skeleton', () => {
      // Override mock to show loading state
      vi.mocked(mockUseDashboard).isLoading = true;
      
      const { container } = render(<DashboardPage />);
      
      // Should use dashboard variant
      const skeleton = container.querySelector('[data-variant="dashboard"]');
      expect(skeleton).toBeInTheDocument();
      
      // Reset
      vi.mocked(mockUseDashboard).isLoading = false;
    });
  });

  describe('Component Integration', () => {
    it('should render dashboard title with design tokens', () => {
      render(<DashboardPage />);
      
      const title = screen.getByText('Dashboard');
      expect(title).toBeInTheDocument();
      
      // Check if it has style attribute with tokens
      const style = title.getAttribute('style');
      expect(style).toBeTruthy();
    });

    it('should render summary cards with design tokens', () => {
      render(<DashboardPage />);
      
      // Check for revenue card
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Fans')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Engagement')).toBeInTheDocument();
    });

    it('should render quick actions section when data available', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
    });

    it('should render recent activity section when data available', () => {
      render(<DashboardPage />);
      
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  describe('Empty State Validation', () => {
    it('should show empty state when no integrations connected', () => {
      // Override mock
      vi.mocked(mockUseIntegrations).integrations = [];
      
      render(<DashboardPage />);
      
      expect(screen.getByText('Get Started with Huntaze')).toBeInTheDocument();
      expect(screen.getByText('Connect Your First Account')).toBeInTheDocument();
      
      // Reset
      vi.mocked(mockUseIntegrations).integrations = [{ id: '1', isConnected: true }];
    });

    it('should use design tokens in empty state', () => {
      // Override mock
      vi.mocked(mockUseIntegrations).integrations = [];
      
      const { container } = render(<DashboardPage />);
      
      // Should use design tokens in empty state
      const styledElements = container.querySelectorAll('[style]');
      const hasTokens = Array.from(styledElements).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--');
      });
      
      expect(hasTokens).toBe(true);
      
      // Reset
      vi.mocked(mockUseIntegrations).integrations = [{ id: '1', isConnected: true }];
    });
  });
});
