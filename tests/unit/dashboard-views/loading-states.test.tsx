import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  Skeleton,
  StatCardSkeleton,
  InfoCardSkeleton,
  TableRowSkeleton,
  TableSkeleton,
  DashboardViewSkeleton,
} from '@/components/ui/DashboardSkeleton';

/**
 * Loading States Tests
 * 
 * Tests for skeleton loading components that display while data is fetching.
 */

describe('Skeleton', () => {
  it('renders with default props', () => {
    render(<Skeleton />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies custom width and height', () => {
    render(<Skeleton width="200px" height="50px" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
  });

  it('applies custom border radius', () => {
    render(<Skeleton borderRadius="8px" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveStyle({ borderRadius: '8px' });
  });

  it('applies custom className', () => {
    render(<Skeleton className="custom-skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton).toHaveClass('custom-skeleton');
  });
});

describe('StatCardSkeleton', () => {
  it('renders skeleton for StatCard', () => {
    render(<StatCardSkeleton />);
    expect(screen.getByTestId('stat-card-skeleton')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<StatCardSkeleton />);
    const skeleton = screen.getByTestId('stat-card-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading metric');
  });

  it('displays screen reader text', () => {
    render(<StatCardSkeleton />);
    expect(screen.getByText('Loading metric data')).toHaveClass('sr-only');
  });

  it('renders multiple skeleton elements', () => {
    const { container } = render(<StatCardSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('matches StatCard dimensions', () => {
    const { container } = render(<StatCardSkeleton />);
    const skeleton = container.querySelector('.stat-card-skeleton');
    expect(skeleton).toHaveStyle({
      padding: '10px 12px',
      borderRadius: 'var(--dashboard-card-radius, 12px)',
    });
  });
});

describe('InfoCardSkeleton', () => {
  it('renders skeleton for InfoCard', () => {
    render(<InfoCardSkeleton />);
    expect(screen.getByTestId('info-card-skeleton')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<InfoCardSkeleton />);
    const skeleton = screen.getByTestId('info-card-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading information');
  });

  it('displays screen reader text', () => {
    render(<InfoCardSkeleton />);
    expect(screen.getByText('Loading information card')).toHaveClass('sr-only');
  });

  it('renders icon and content skeletons', () => {
    const { container } = render(<InfoCardSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    // Should have icon + title + 2 description lines
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });

  it('matches InfoCard dimensions', () => {
    const { container } = render(<InfoCardSkeleton />);
    const skeleton = container.querySelector('.info-card-skeleton');
    expect(skeleton).toHaveStyle({
      padding: '12px 14px',
      borderRadius: 'var(--dashboard-card-radius, 12px)',
    });
  });
});

describe('TableRowSkeleton', () => {
  it('renders skeleton for table row', () => {
    render(<TableRowSkeleton />);
    expect(screen.getByTestId('table-row-skeleton')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<TableRowSkeleton />);
    const skeleton = screen.getByTestId('table-row-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading table row');
  });

  it('renders default number of columns', () => {
    const { container } = render(<TableRowSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(5); // Default columns
  });

  it('renders custom number of columns', () => {
    const { container } = render(<TableRowSkeleton columns={3} />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons.length).toBe(3);
  });

  it('displays screen reader text', () => {
    render(<TableRowSkeleton />);
    expect(screen.getByText('Loading table data')).toHaveClass('sr-only');
  });
});

describe('TableSkeleton', () => {
  it('renders skeleton for table', () => {
    render(<TableSkeleton />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<TableSkeleton />);
    const skeleton = screen.getByTestId('table-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading table');
  });

  it('renders default number of rows', () => {
    render(<TableSkeleton />);
    const rows = screen.getAllByTestId('table-row-skeleton');
    expect(rows.length).toBe(10); // Default rows
  });

  it('renders custom number of rows', () => {
    render(<TableSkeleton rows={5} />);
    const rows = screen.getAllByTestId('table-row-skeleton');
    expect(rows.length).toBe(5);
  });

  it('renders header row', () => {
    const { container } = render(<TableSkeleton />);
    const header = container.querySelector('.table-skeleton__header');
    expect(header).toBeInTheDocument();
  });

  it('displays screen reader text with row count', () => {
    render(<TableSkeleton rows={7} />);
    expect(screen.getByText('Loading table with 7 rows')).toHaveClass('sr-only');
  });
});

describe('DashboardViewSkeleton', () => {
  it('renders complete dashboard skeleton', () => {
    render(<DashboardViewSkeleton />);
    expect(screen.getByTestId('dashboard-view-skeleton')).toBeInTheDocument();
  });

  it('has proper ARIA attributes', () => {
    render(<DashboardViewSkeleton />);
    const skeleton = screen.getByTestId('dashboard-view-skeleton');
    expect(skeleton).toHaveAttribute('role', 'status');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading dashboard');
  });

  it('renders default number of metric cards', () => {
    render(<DashboardViewSkeleton />);
    const metrics = screen.getAllByTestId('stat-card-skeleton');
    expect(metrics.length).toBe(4); // Default metrics
  });

  it('renders custom number of metric cards', () => {
    render(<DashboardViewSkeleton metrics={3} />);
    const metrics = screen.getAllByTestId('stat-card-skeleton');
    expect(metrics.length).toBe(3);
  });

  it('renders search bar when showSearch is true', () => {
    const { container } = render(<DashboardViewSkeleton showSearch={true} />);
    const search = container.querySelector('.dashboard-view-skeleton__search');
    expect(search).toBeInTheDocument();
  });

  it('hides search bar when showSearch is false', () => {
    const { container } = render(<DashboardViewSkeleton showSearch={false} />);
    const search = container.querySelector('.dashboard-view-skeleton__search');
    expect(search).not.toBeInTheDocument();
  });

  it('renders table when showTable is true', () => {
    render(<DashboardViewSkeleton showTable={true} />);
    expect(screen.getByTestId('table-skeleton')).toBeInTheDocument();
  });

  it('hides table when showTable is false', () => {
    render(<DashboardViewSkeleton showTable={false} />);
    expect(screen.queryByTestId('table-skeleton')).not.toBeInTheDocument();
  });

  it('renders custom number of table rows', () => {
    render(<DashboardViewSkeleton tableRows={5} />);
    const rows = screen.getAllByTestId('table-row-skeleton');
    expect(rows.length).toBe(5);
  });

  it('displays screen reader text', () => {
    render(<DashboardViewSkeleton />);
    expect(screen.getByText('Loading dashboard view')).toHaveClass('sr-only');
  });
});

describe('Loading State Dimensions', () => {
  it('StatCardSkeleton matches StatCard dimensions', () => {
    const { container } = render(<StatCardSkeleton />);
    const skeleton = container.querySelector('.stat-card-skeleton');
    
    // Should have same padding and border radius as StatCard
    const styles = window.getComputedStyle(skeleton!);
    expect(styles.padding).toBeTruthy();
    expect(styles.borderRadius).toBeTruthy();
  });

  it('InfoCardSkeleton matches InfoCard dimensions', () => {
    const { container } = render(<InfoCardSkeleton />);
    const skeleton = container.querySelector('.info-card-skeleton');
    
    // Should have same padding and border radius as InfoCard
    const styles = window.getComputedStyle(skeleton!);
    expect(styles.padding).toBeTruthy();
    expect(styles.borderRadius).toBeTruthy();
  });
});
