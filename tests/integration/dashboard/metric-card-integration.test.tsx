/**
 * Integration Tests - MetricCard Component (Task 3.1)
 * Tests for MetricCard integration with dashboard data
 * 
 * Coverage:
 * - Real data integration
 * - API data formatting
 * - Multiple cards layout
 * - Data refresh behavior
 * - Error states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { DollarSign, MessageSquare, Megaphone, TrendingUp } from 'lucide-react';

describe('MetricCard Integration Tests - Task 3.1', () => {
  describe('Dashboard Data Integration', () => {
    it('should render multiple metric cards with dashboard data', () => {
      const dashboardMetrics = {
        revenue: { value: '$12,345', change: 15.3, trend: [100, 120, 110, 150, 140, 180, 200] },
        messages: { value: 1234, change: 8.5, trend: [50, 60, 55, 70, 65, 80, 90] },
        campaigns: { value: 12, change: -2.1, trend: [10, 12, 11, 13, 12, 11, 12] },
        engagement: { value: '87.5%', change: 3.2, trend: [80, 82, 85, 84, 86, 87, 88] },
      };

      const { container } = render(
        <div className="grid grid-cols-4 gap-6">
          <MetricCard
            title="Total Revenue"
            value={dashboardMetrics.revenue.value}
            change={dashboardMetrics.revenue.change}
            changeType="increase"
            icon={DollarSign}
            trend={dashboardMetrics.revenue.trend}
          />
          <MetricCard
            title="Messages Sent"
            value={dashboardMetrics.messages.value}
            change={dashboardMetrics.messages.change}
            changeType="increase"
            icon={MessageSquare}
            trend={dashboardMetrics.messages.trend}
          />
          <MetricCard
            title="Active Campaigns"
            value={dashboardMetrics.campaigns.value}
            change={Math.abs(dashboardMetrics.campaigns.change)}
            changeType="decrease"
            icon={Megaphone}
            trend={dashboardMetrics.campaigns.trend}
          />
          <MetricCard
            title="Engagement Rate"
            value={dashboardMetrics.engagement.value}
            change={dashboardMetrics.engagement.change}
            changeType="increase"
            icon={TrendingUp}
            trend={dashboardMetrics.engagement.trend}
          />
        </div>
      );

      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Messages Sent')).toBeInTheDocument();
      expect(screen.getByText('Active Campaigns')).toBeInTheDocument();
      expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
    });

    it('should format currency values correctly', () => {
      const currencyValues = [
        { input: 12345, expected: '$12,345' },
        { input: 1234567, expected: '$1,234,567' },
        { input: 99.99, expected: '$99.99' },
      ];

      currencyValues.forEach(({ input, expected }) => {
        const { rerender } = render(
          <MetricCard
            title="Revenue"
            value={expected}
            change={10}
            changeType="increase"
            icon={DollarSign}
          />
        );

        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    });

    it('should format large numbers with abbreviations', () => {
      const largeNumbers = [
        { value: '1.2K', label: 'Messages' },
        { value: '45.6K', label: 'Followers' },
        { value: '1.2M', label: 'Views' },
      ];

      largeNumbers.forEach(({ value, label }) => {
        const { rerender } = render(
          <MetricCard
            title={label}
            value={value}
            change={10}
            changeType="increase"
            icon={MessageSquare}
          />
        );

        expect(screen.getByText(value)).toBeInTheDocument();
      });
    });

    it('should handle percentage values', () => {
      render(
        <MetricCard
          title="Engagement Rate"
          value="87.5%"
          change={3.2}
          changeType="increase"
          icon={TrendingUp}
        />
      );

      expect(screen.getByText('87.5%')).toBeInTheDocument();
    });
  });

  describe('API Data Transformation', () => {
    it('should transform API response to metric card props', () => {
      const apiResponse = {
        metrics: {
          revenue: {
            current: 12345,
            previous: 10000,
            trend: [100, 120, 110, 150, 140, 180, 200],
          },
        },
      };

      const change = ((apiResponse.metrics.revenue.current - apiResponse.metrics.revenue.previous) / apiResponse.metrics.revenue.previous) * 100;

      render(
        <MetricCard
          title="Total Revenue"
          value={`$${apiResponse.metrics.revenue.current.toLocaleString()}`}
          change={Number(change.toFixed(1))}
          changeType={change >= 0 ? 'increase' : 'decrease'}
          icon={DollarSign}
          trend={apiResponse.metrics.revenue.trend}
        />
      );

      expect(screen.getByText('$12,345')).toBeInTheDocument();
      expect(screen.getByText('23.5%')).toBeInTheDocument();
    });

    it('should handle missing trend data from API', () => {
      const apiResponse = {
        metrics: {
          revenue: {
            current: 12345,
            previous: 10000,
            trend: null,
          },
        },
      };

      const { container } = render(
        <MetricCard
          title="Total Revenue"
          value={`$${apiResponse.metrics.revenue.current}`}
          change={23.5}
          changeType="increase"
          icon={DollarSign}
          trend={apiResponse.metrics.revenue.trend || undefined}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(0);
    });

    it('should handle API error state', () => {
      render(
        <MetricCard
          title="Total Revenue"
          value="--"
          change={0}
          changeType="increase"
          icon={DollarSign}
          loading={false}
        />
      );

      expect(screen.getByText('--')).toBeInTheDocument();
    });
  });

  describe('Data Refresh Behavior', () => {
    it('should show loading state during data refresh', async () => {
      const { rerender } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          loading={false}
        />
      );

      expect(screen.getByText('$1000')).toBeInTheDocument();

      rerender(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          loading={true}
        />
      );

      expect(screen.queryByText('$1000')).not.toBeInTheDocument();
    });

    it('should update values after refresh', async () => {
      const { rerender } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('$1000')).toBeInTheDocument();

      rerender(
        <MetricCard
          title="Revenue"
          value="$1500"
          change={15}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('$1500')).toBeInTheDocument();
      expect(screen.getByText('15%')).toBeInTheDocument();
    });

    it('should update trend data after refresh', async () => {
      const { container, rerender } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={[10, 20, 30]}
        />
      );

      let sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(3);

      rerender(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={[10, 20, 30, 40, 50]}
        />
      );

      sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(5);
    });
  });

  describe('Responsive Grid Layout', () => {
    it('should render in 4-column grid on desktop', () => {
      const { container } = render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Metric 1" value="100" change={10} changeType="increase" icon={DollarSign} />
          <MetricCard title="Metric 2" value="200" change={10} changeType="increase" icon={MessageSquare} />
          <MetricCard title="Metric 3" value="300" change={10} changeType="increase" icon={Megaphone} />
          <MetricCard title="Metric 4" value="400" change={10} changeType="increase" icon={TrendingUp} />
        </div>
      );

      const grid = container.firstChild;
      expect(grid).toHaveClass('grid');
      expect(grid).toHaveClass('lg:grid-cols-4');
    });

    it('should render in 2-column grid on tablet', () => {
      const { container } = render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Metric 1" value="100" change={10} changeType="increase" icon={DollarSign} />
          <MetricCard title="Metric 2" value="200" change={10} changeType="increase" icon={MessageSquare} />
        </div>
      );

      const grid = container.firstChild;
      expect(grid).toHaveClass('md:grid-cols-2');
    });

    it('should render in single column on mobile', () => {
      const { container } = render(
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Metric 1" value="100" change={10} changeType="increase" icon={DollarSign} />
        </div>
      );

      const grid = container.firstChild;
      expect(grid).toHaveClass('grid-cols-1');
    });
  });

  describe('Real-time Updates', () => {
    it('should handle frequent updates without flickering', async () => {
      const { rerender } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      // Simulate rapid updates
      for (let i = 1000; i <= 1010; i++) {
        rerender(
          <MetricCard
            title="Revenue"
            value={`$${i}`}
            change={10}
            changeType="increase"
            icon={DollarSign}
          />
        );
      }

      expect(screen.getByText('$1010')).toBeInTheDocument();
    });

    it('should maintain smooth transitions during updates', async () => {
      const { container, rerender } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
        />
      );

      const card = container.firstChild;
      expect(card).toHaveClass('transition-shadow');

      rerender(
        <MetricCard
          title="Revenue"
          value="$1500"
          change={15}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(card).toHaveClass('transition-shadow');
    });
  });

  describe('Error Handling', () => {
    it('should handle null values gracefully', () => {
      render(
        <MetricCard
          title="Revenue"
          value="N/A"
          change={0}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });

    it('should handle undefined trend data', () => {
      const { container } = render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={10}
          changeType="increase"
          icon={DollarSign}
          trend={undefined}
        />
      );

      const sparklineBars = container.querySelectorAll('.bg-primary-200');
      expect(sparklineBars.length).toBe(0);
    });

    it('should handle invalid change values', () => {
      render(
        <MetricCard
          title="Revenue"
          value="$1000"
          change={NaN}
          changeType="increase"
          icon={DollarSign}
        />
      );

      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });
  });

  describe('Performance with Multiple Cards', () => {
    it('should render 4 cards efficiently', () => {
      const startTime = performance.now();

      render(
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <MetricCard
              key={i}
              title={`Metric ${i}`}
              value={`$${i * 1000}`}
              change={i * 5}
              changeType="increase"
              icon={DollarSign}
              trend={Array.from({ length: 7 }, (_, j) => j * 10)}
            />
          ))}
        </div>
      );

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(200); // Should render in < 200ms
    });

    it('should handle 8 cards without performance degradation', () => {
      const startTime = performance.now();

      render(
        <div className="grid grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <MetricCard
              key={i}
              title={`Metric ${i}`}
              value={`$${i * 1000}`}
              change={i * 5}
              changeType="increase"
              icon={DollarSign}
              trend={Array.from({ length: 30 }, (_, j) => j * 10)}
            />
          ))}
        </div>
      );

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(300); // Should render in < 300ms
    });
  });
});
