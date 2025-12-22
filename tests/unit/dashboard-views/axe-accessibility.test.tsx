/**
 * Axe-core Accessibility Tests
 * 
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5
 * 
 * Tests all dashboard view components for WCAG compliance using axe-core.
 * Ensures components meet accessibility standards for:
 * - Keyboard navigation
 * - Screen reader support
 * - Color contrast
 * - ARIA labels
 * - Semantic HTML
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { StatCard } from '@/components/ui/StatCard';
import { InfoCard } from '@/components/ui/InfoCard';
import { TagChip } from '@/components/ui/TagChip';
import { DashboardEmptyState } from '@/components/ui/DashboardEmptyState';
import { DashboardLoadingState, DashboardErrorState } from '@/components/ui/DashboardLoadingState';
import { Users, Star, TrendingUp, MessageCircle } from 'lucide-react';

expect.extend(toHaveNoViolations);

describe('Axe-core Accessibility Tests', () => {
  describe('StatCard Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <StatCard
          label="Total Revenue"
          value="$4,196"
          icon={<Users />}
          delta={{ value: "+12%", trend: "up" }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with different variants', async () => {
      const { container } = render(
        <div>
          <StatCard label="Success" value="100" variant="success" />
          <StatCard label="Warning" value="50" variant="warning" />
          <StatCard label="Error" value="10" variant="error" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations without icon or delta', async () => {
      const { container } = render(
        <StatCard label="Simple Card" value="42" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('InfoCard Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <InfoCard
          icon={<Star />}
          title="Auto-respond to new subscribers"
          description="Send personalized welcome messages automatically when fans subscribe"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations when clickable', async () => {
      const { container } = render(
        <InfoCard
          icon={<MessageCircle />}
          title="Clickable Card"
          description="This card can be clicked"
          onClick={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('TagChip Component', () => {
    it('should have no accessibility violations for VIP variant', async () => {
      const { container } = render(
        <TagChip label="VIP" variant="vip" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations for all variants', async () => {
      const { container } = render(
        <div>
          <TagChip label="VIP" variant="vip" />
          <TagChip label="Active" variant="active" />
          <TagChip label="At-Risk" variant="at-risk" />
          <TagChip label="Churned" variant="churned" />
          <TagChip label="Low" variant="churn-low" />
          <TagChip label="High" variant="churn-high" />
          <TagChip label="New" variant="nouveau" />
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('DashboardEmptyState Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <DashboardEmptyState
          icon={<TrendingUp />}
          title="No smart rules yet"
          description="Create automated workflows to save time and engage fans more effectively"
          benefits={[
            "Auto-respond to new subscribers",
            "Re-engage inactive fans",
            "Prioritize VIP conversations"
          ]}
          cta={{
            label: "New Smart Rule",
            onClick: () => {},
          }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations without benefits', async () => {
      const { container } = render(
        <DashboardEmptyState
          icon={<Users />}
          title="No data"
          description="Get started by creating your first item"
          cta={{
            label: "Create New",
            onClick: () => {},
          }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with icon in CTA', async () => {
      const { container } = render(
        <DashboardEmptyState
          icon={<Star />}
          title="Empty State"
          description="No content available"
          cta={{
            label: "Add Content",
            onClick: () => {},
            icon: <Users />,
          }}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('DashboardLoadingState Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <DashboardLoadingState message="Loading data..." />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations with default message', async () => {
      const { container } = render(
        <DashboardLoadingState />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('DashboardErrorState Component', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <DashboardErrorState
          message="Failed to load data"
          onRetry={() => {}}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no violations without retry button', async () => {
      const { container } = render(
        <DashboardErrorState message="An error occurred" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Combined Dashboard View', () => {
    it('should have no violations with multiple components', async () => {
      const { container } = render(
        <div>
          <StatCard
            label="Total Fans"
            value="1,234"
            icon={<Users />}
            delta={{ value: "+5%", trend: "up" }}
          />
          <StatCard
            label="VIP Fans"
            value="127"
            icon={<Star />}
          />
          <InfoCard
            icon={<MessageCircle />}
            title="Smart Messages"
            description="Automate your fan engagement"
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <TagChip label="VIP" variant="vip" />
            <TagChip label="Active" variant="active" />
            <TagChip label="Low" variant="churn-low" />
          </div>
        </div>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient contrast for all text elements', async () => {
      const { container } = render(
        <div>
          <StatCard label="Label Text" value="Value Text" />
          <InfoCard
            icon={<Star />}
            title="Title Text"
            description="Description Text"
          />
          <TagChip label="VIP" variant="vip" />
          <TagChip label="Active" variant="active" />
          <TagChip label="Low" variant="churn-low" />
          <TagChip label="High" variant="churn-high" />
        </div>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have proper focus management', async () => {
      const { container } = render(
        <div>
          <StatCard label="Focusable" value="100" />
          <InfoCard
            icon={<Star />}
            title="Clickable"
            description="Can be clicked"
            onClick={() => {}}
          />
          <DashboardEmptyState
            icon={<Users />}
            title="Empty"
            description="No data"
            cta={{ label: "Create", onClick: () => {} }}
          />
        </div>
      );

      const results = await axe(container, {
        rules: {
          'focus-order-semantics': { enabled: true },
          'tabindex': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Labels', () => {
    it('should have proper ARIA labels on all interactive elements', async () => {
      const { container } = render(
        <div>
          <StatCard
            label="Revenue"
            value="$1000"
            delta={{ value: "+10%", trend: "up" }}
          />
          <InfoCard
            icon={<Star />}
            title="Feature"
            description="Description"
            onClick={() => {}}
          />
          <TagChip label="VIP" variant="vip" />
          <DashboardEmptyState
            icon={<Users />}
            title="Empty"
            description="No data"
            cta={{ label: "Create", onClick: () => {} }}
          />
        </div>
      );

      const results = await axe(container, {
        rules: {
          'aria-allowed-attr': { enabled: true },
          'aria-required-attr': { enabled: true },
          'aria-valid-attr': { enabled: true },
          'aria-valid-attr-value': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });
});
