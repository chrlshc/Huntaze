/**
 * Unit Tests - MetricCard Component (Task 3.1)
 * Tests for Huntaze Modern UI dashboard metric cards
 * 
 * Coverage:
 * - Component rendering
 * - Props validation
 * - Loading states
 * - Trend visualization
 * - Change indicators
 * - Responsive behavior
 * - Theme support
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DollarSign, MessageSquare, TrendingUp, Users } from 'lucide-react';

describe('MetricCard Component - Task 3.1', () => {
  describe('Basic Rendering', () => {
    it('should render metric card with all props', () => {
      render(
        <MetricCard
          title="Total Revenue"
          value="$12,345"
          change={15.3}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('$12,345')).toBeInTheDocument();
      expect(screen.getByText('15.3%')).toBeInTheDocument();
      expect(screen.getByText('vs last period')).toBeInTheDocument();
    });

    it('should render with numeric value', () => {
      render(
        <MetricCard
          title="Messages Sent"
          value={1234}
          change={5.2}
          changeType="increase"
          icon={MessageSquare}
        />
      );

      expect(screen.getByText('1234')).toBeInTheDocument();
    });

    it('should render with string value', () => {
      render(
        <MetricCard
          title="Engagement Rate"
          value="87.5%"
          change={2.1}
          changeType="increase"
          icon={Users}
        />
      );

      expect(screen.getByText('87.5%')).toBeInTheDocument();
    });

    it('should render icon component', () => {
      const { container } = render(
        <MetricCard
          title="Total Revenue"
          value="$12,345"
          change={15.3}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const iconContainer = container.querySelector('.bg-primary-50');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Change Indicators', () => {
    it('should show increase indicator with green color', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const changeElement = screen.getByText('10%').parentElement;
      expect(changeElement).toHaveClass('text-green-600');
    });

    it('should show decrease indicator with red color', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={-5}
          changeType="decrease"
          icon={DollarSign}
        />
      );

      const changeElement = screen.getByText('5%').parentElement;
      expect(changeElement).toHaveClass('text-red-600');
    });

    it('should display TrendingUp icon for increase', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      // TrendingUp icon should be present
      const svg = container.querySelector('svg[class*="lucide-trending-up"]');
      expect(svg).toBeInTheDocument();
    });

    it('should display TrendingDown icon for decrease', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={-5}
          changeType="decrease"
          icon={DollarSign}
        />
      );

      // TrendingDown icon should be present
      const svg = container.querySelector('svg[class*="lucide-trending-down"]');
      expect(svg).toBeInTheDocument();
    });

    it('should show absolute value of negative change', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={-15.5}
          changeType="decrease"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('15.5%')).toBeInTheDocument();
    });

    it('should handle zero change', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={0}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should handle decimal change values', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={12.345}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('12.345%')).toBeInTheDocument();
    });
  });

  describe('Trend Visualization', () => {
    it('should render sparkline when trend data is provided', () => {
      const trendData = [10, 20, 15, 30, 25, 35, 40];
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={trendData}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(trendData.length);
    });

    it('should not render sparkline when trend is undefined', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(0);
    });

    it('should not render sparkline when trend is empty array', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={[]}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(0);
    });

    it('should scale sparkline bars relative to max value', () => {
      const trendData = [10, 50, 30]; // max = 50
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={trendData}
        />
      );

      const bars = container.querySelectorAll('.bg-primary-200');
      
      // First bar (10) should be 20% of max (50)
      expect(bars[0]).toHaveStyle({ height: '20%' });
      
      // Second bar (50) should be 100% of max
      expect(bars[1]).toHaveStyle({ height: '100%' });
      
      // Third bar (30) should be 60% of max
      expect(bars[2]).toHaveStyle({ height: '60%' });
    });

    it('should handle single value trend', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={[100]}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(1);
      expect(sparklineBars[0]).toHaveStyle({ height: '100%' });
    });

    it('should handle all zero values in trend', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={[0, 0, 0]}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(3);
    });
  });

  describe('Loading State', () => {
    it('should render loading skeleton when loading is true', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          loading={true}
        />
      );

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('should not show actual content when loading', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          loading={true}
        />
      );

      expect(screen.queryByText('Revenue')).not.toBeInTheDocument();
      expect(screen.queryByText('$1000')).not.toBeInTheDocument();
    });

    it('should show content when loading is false', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          loading={false}
        />
      );

      expect(screen.getByText('Revenue')).toBeInTheDocument();
      expect(screen.getByText('$1000')).toBeInTheDocument();
    });

    it('should render skeleton with correct structure', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          loading={true}
        />
      );

      const skeletonElements = container.querySelectorAll('.bg-neutral-200');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Styling and Layout', () => {
    it('should have proper card styling', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('bg-white');
      expect(card).toHaveClass('rounded-lg');
      expect(card).toHaveClass('p-6');
      expect(card).toHaveClass('border');
    });

    it('should have hover effect', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('hover:shadow-md');
      expect(card).toHaveClass('transition-shadow');
    });

    it('should have proper text hierarchy', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const title = screen.getByText('Revenue');
      expect(title).toHaveClass('text-sm');
      expect(title).toHaveClass('font-medium');

      const value = screen.getByText('$1000');
      expect(value).toHaveClass('text-3xl');
      expect(value).toHaveClass('font-bold');
    });

    it('should have icon container with proper styling', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const iconContainer = container.querySelector('.bg-primary-50');
      expect(iconContainer).toHaveClass('p-3');
      expect(iconContainer).toHaveClass('rounded-lg');
    });
  });

  describe('Dark Mode Support', () => {
    it('should have dark mode classes', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('dark:bg-neutral-800');
      expect(card).toHaveClass('dark:border-neutral-700');
    });

    it('should have dark mode text colors', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const title = screen.getByText('Revenue');
      expect(title).toHaveClass('dark:text-neutral-400');

      const value = screen.getByText('$1000');
      expect(value).toHaveClass('dark:text-neutral-100');
    });

    it('should have dark mode change indicator colors', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const changeElement = screen.getByText('10%').parentElement;
      expect(changeElement).toHaveClass('dark:text-green-400');
    });

    it('should have dark mode icon background', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const iconContainer = container.querySelector('.bg-primary-50');
      expect(iconContainer).toHaveClass('dark:bg-primary-900/20');
    });

    it('should have dark mode sparkline colors', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={[10, 20, 30]}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      sparklineBars.forEach(bar => {
        expect(bar).toHaveClass('dark:bg-primary-800');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have semantic HTML structure', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('should have readable text contrast', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const title = screen.getByText('Revenue');
      expect(title).toHaveClass('text-neutral-600');

      const value = screen.getByText('$1000');
      expect(value).toHaveClass('text-neutral-900');
    });

    it('should have proper spacing for readability', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('p-6');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large values', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$999,999,999"
          change={100}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('$999,999,999')).toBeInTheDocument();
    });

    it('should handle very small change percentages', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={0.01}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('0.01%')).toBeInTheDocument();
    });

    it('should handle very large change percentages', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={999.99}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('999.99%')).toBeInTheDocument();
    });

    it('should handle empty string value', () => {
      render(
        <MetricCard
          title="Revenue"
          value=""
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });

    it('should handle long trend arrays', () => {
      const longTrend = Array.from({ length: 100 }, (_, i) => i);
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={longTrend}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(100);
    });

    it('should handle negative values in trend', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={[-10, -5, 0, 5, 10]}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(5);
    });
  });

  describe('Component Integration', () => {
    it('should work with different icon components', () => {
      const icons = [DollarSign, MessageSquare, TrendingUp, Users];

      icons.forEach(Icon => {
        const { container } = render(
          <MetricCard
            title="Test"
            value="100"
            change={10}
            changeType="increase"
            icon={Icon}
          />
        );

        expect(container.querySelector('.bg-primary-50')).toBeInTheDocument();
      });
    });

    it('should maintain consistent layout with different content lengths', () => {
      const shortValue = render(
        <MetricCard
          title="A"
          value="1"
          change={1}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const longValue = render(
        <MetricCard
          title="Very Long Title That Might Wrap"
          value="$999,999,999.99"
          change={99.99}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(shortValue.container.firstChild).toHaveClass('p-6');
      expect(longValue.container.firstChild).toHaveClass('p-6');
    });
  });

  describe('Performance', () => {
    it('should render quickly with minimal props', () => {
      const startTime = performance.now();
      
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should render in < 100ms
    });

    it('should render quickly with trend data', () => {
      const startTime = performance.now();
      
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={Array.from({ length: 30 }, (_, i) => i)}
        />
      );
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});
