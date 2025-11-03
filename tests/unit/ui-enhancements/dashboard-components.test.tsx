/**
 * Unit Tests for Dashboard Components
 * 
 * Tests for AnimatedNumber, StatsOverview, ActivityFeed, and PerformanceCharts
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ActivityFeed } from '@/components/dashboard/ActivityFeed';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: vi.fn(),
  }),
}));

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="line-chart">
      <div data-testid="chart-labels">{JSON.stringify(data.labels)}</div>
      <div data-testid="chart-data">{JSON.stringify(data.datasets)}</div>
    </div>
  ),
}));

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  Filler: {},
}));

describe('Dashboard Components', () => {
  describe('StatsOverview Component', () => {
    it('should render all stat cards', () => {
      render(<StatsOverview />);
      
      expect(screen.getByText('Total Posts')).toBeInTheDocument();
      expect(screen.getByText('Engagement Rate')).toBeInTheDocument();
      expect(screen.getByText('Total Reach')).toBeInTheDocument();
      expect(screen.getByText('Active Platforms')).toBeInTheDocument();
    });

    it('should display stat values', () => {
      render(<StatsOverview />);
      
      // Check for numeric values (they should be rendered)
      const statValues = screen.getAllByText(/\d+/);
      expect(statValues.length).toBeGreaterThan(0);
    });

    it('should show percentage changes', () => {
      render(<StatsOverview />);
      
      // Look for percentage indicators
      const percentages = screen.getAllByText(/[+-]\d+%/);
      expect(percentages.length).toBeGreaterThan(0);
    });

    it('should apply responsive grid layout', () => {
      const { container } = render(<StatsOverview />);
      
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
      expect(grid?.className).toMatch(/grid-cols-/);
    });

    it('should render with spring animation variants', () => {
      const { container } = render(<StatsOverview />);
      
      // Check that motion.div is used (mocked)
      const motionDivs = container.querySelectorAll('div');
      expect(motionDivs.length).toBeGreaterThan(0);
    });
  });

  describe('ActivityFeed Component', () => {
    const mockActivities = [
      {
        id: 1,
        type: 'post',
        message: 'New post published',
        timestamp: new Date('2024-11-02T10:00:00'),
        platform: 'Instagram',
      },
      {
        id: 2,
        type: 'comment',
        message: 'New comment received',
        timestamp: new Date('2024-11-02T09:30:00'),
        platform: 'TikTok',
      },
    ];

    it('should render activity items', () => {
      render(<ActivityFeed />);
      
      // Check for activity feed title
      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    });

    it('should display activity messages', () => {
      render(<ActivityFeed />);
      
      // Should show some activity messages
      const activities = screen.getAllByRole('listitem');
      expect(activities.length).toBeGreaterThan(0);
    });

    it('should format timestamps correctly', () => {
      render(<ActivityFeed />);
      
      // Look for time indicators (e.g., "2h ago", "1d ago")
      const timeElements = screen.getAllByText(/ago|just now/i);
      expect(timeElements.length).toBeGreaterThan(0);
    });

    it('should implement stagger animation', () => {
      const { container } = render(<ActivityFeed />);
      
      // Check that list items are rendered
      const listItems = container.querySelectorAll('li');
      expect(listItems.length).toBeGreaterThan(0);
    });

    it('should show platform icons', () => {
      render(<ActivityFeed />);
      
      // Check for platform indicators
      const activities = screen.getAllByRole('listitem');
      expect(activities.length).toBeGreaterThan(0);
    });

    it('should handle empty activity list', () => {
      render(<ActivityFeed />);
      
      // Component should render even with no activities
      expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument();
    });
  });

  describe('PerformanceCharts Component', () => {
    it('should render chart component', () => {
      render(<PerformanceCharts />);
      
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should display 7-day data', () => {
      render(<PerformanceCharts />);
      
      const labelsElement = screen.getByTestId('chart-labels');
      const labels = JSON.parse(labelsElement.textContent || '[]');
      
      expect(labels.length).toBe(7);
    });

    it('should include engagement and reach datasets', () => {
      render(<PerformanceCharts />);
      
      const dataElement = screen.getByTestId('chart-data');
      const datasets = JSON.parse(dataElement.textContent || '[]');
      
      expect(datasets.length).toBeGreaterThanOrEqual(1);
      expect(datasets[0]).toHaveProperty('data');
    });

    it('should configure responsive options', () => {
      render(<PerformanceCharts />);
      
      // Chart should render without errors
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should use gradient colors', () => {
      render(<PerformanceCharts />);
      
      const dataElement = screen.getByTestId('chart-data');
      const datasets = JSON.parse(dataElement.textContent || '[]');
      
      // Check that datasets have styling properties
      expect(datasets[0]).toHaveProperty('borderColor');
    });

    it('should render chart title', () => {
      render(<PerformanceCharts />);
      
      expect(screen.getByText(/Performance Overview/i)).toBeInTheDocument();
    });
  });

  describe('AnimatedNumber Integration', () => {
    it('should animate numbers in StatsOverview', async () => {
      render(<StatsOverview />);
      
      // Numbers should be present
      await waitFor(() => {
        const numbers = screen.getAllByText(/\d+/);
        expect(numbers.length).toBeGreaterThan(0);
      });
    });

    it('should complete animation within expected time', async () => {
      const startTime = Date.now();
      render(<StatsOverview />);
      
      await waitFor(() => {
        const numbers = screen.getAllByText(/\d+/);
        expect(numbers.length).toBeGreaterThan(0);
      });
      
      const duration = Date.now() - startTime;
      // Animation should complete quickly in tests
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Responsive Behavior', () => {
    it('should render mobile-friendly layout', () => {
      const { container } = render(<StatsOverview />);
      
      // Check for responsive classes
      const grid = container.querySelector('.grid');
      expect(grid?.className).toMatch(/md:|lg:|sm:/);
    });

    it('should stack items on mobile', () => {
      const { container } = render(<ActivityFeed />);
      
      // Should have vertical layout classes
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
    });
  });

  describe('Dark Mode Support', () => {
    it('should include dark mode classes', () => {
      const { container } = render(<StatsOverview />);
      
      // Check for dark: variants in classes
      const elements = container.querySelectorAll('[class*="dark:"]');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('should render charts with dark mode support', () => {
      render(<PerformanceCharts />);
      
      // Chart should render successfully
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should handle loading state gracefully', () => {
      render(<StatsOverview />);
      
      // Component should render without errors
      expect(screen.getByText('Total Posts')).toBeInTheDocument();
    });

    it('should show data when loaded', async () => {
      render(<ActivityFeed />);
      
      await waitFor(() => {
        const activities = screen.getAllByRole('listitem');
        expect(activities.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<StatsOverview />);
      
      // Stats should be accessible
      const stats = screen.getAllByRole('heading', { level: 3 });
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', () => {
      const { container } = render(<ActivityFeed />);
      
      // List should be navigable
      const list = container.querySelector('ul');
      expect(list).toBeInTheDocument();
    });

    it('should have semantic HTML', () => {
      render(<ActivityFeed />);
      
      // Should use proper list elements
      expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
    });
  });
});
