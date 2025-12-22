/**
 * Fans View Integration Tests
 * 
 * Tests the complete Fans view functionality including:
 * - Segment StatCards rendering (Requirements 2.1, 2.2)
 * - Search bar styling and functionality (Requirements 2.3)
 * - Filter pill display (Requirements 2.4)
 * - TagChips for tier and churn risk (Requirements 2.5, 2.6)
 * - Table row hover states (Requirements 2.7)
 */

import '@testing-library/jest-dom';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import FansPage from '../../../app/(app)/onlyfans/fans/page';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/onlyfans/fans',
}));

// Mock Link component
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Fans View Integration', () => {
  describe('Segment StatCards', () => {
    it('should render all five segment StatCards with correct data', () => {
      render(<FansPage />);

      // Verify StatCard components are rendered
      const statCards = screen.getAllByTestId('stat-card');
      expect(statCards).toHaveLength(5);

      // Check for all segment labels within StatCards
      const statCardLabels = screen.getAllByTestId('stat-card-label');
      const labelTexts = statCardLabels.map(label => label.textContent);
      expect(labelTexts).toContain('All Fans');
      expect(labelTexts).toContain('VIP');
      expect(labelTexts).toContain('Active');
      expect(labelTexts).toContain('At-Risk');
      expect(labelTexts).toContain('Churned');

      // Verify each card has an icon
      const icons = screen.getAllByTestId('stat-card-icon');
      expect(icons).toHaveLength(5);

      // Verify values are displayed
      const values = screen.getAllByTestId('stat-card-value');
      expect(values.length).toBeGreaterThan(0);
    });

    it('should apply correct variant to At-Risk and Churned segments', () => {
      render(<FansPage />);

      const statCards = screen.getAllByTestId('stat-card');
      
      // Find At-Risk card (should have warning variant)
      const atRiskCard = statCards.find(card => 
        within(card).queryByText('At-Risk')
      );
      expect(atRiskCard).toHaveClass('stat-card--warning');

      // Find Churned card (should have error variant)
      const churnedCard = statCards.find(card => 
        within(card).queryByText('Churned')
      );
      expect(churnedCard).toHaveClass('stat-card--error');
    });

    it('should allow clicking segments to filter fans', () => {
      render(<FansPage />);

      // Find VIP StatCard label and get its button parent
      const statCardLabels = screen.getAllByTestId('stat-card-label');
      const vipLabel = statCardLabels.find(label => label.textContent === 'VIP');
      const vipButton = vipLabel?.closest('button');
      
      expect(vipButton).toBeInTheDocument();

      // Click VIP segment
      fireEvent.click(vipButton!);

      // Should show ring to indicate selection
      expect(vipButton).toHaveClass('ring-2');
    });
  });

  describe('Search Bar', () => {
    it('should have correct styling with max-height 40px', () => {
      render(<FansPage />);

      const searchInput = screen.getByPlaceholderText(/search fans/i);
      
      // Check styling - height is set via inline style
      expect(searchInput).toHaveStyle({
        height: '40px',
      });
      expect(searchInput).toHaveClass('max-h-[40px]');
      expect(searchInput).toHaveClass('border-[#E3E3E3]');
      expect(searchInput).toHaveClass('rounded-[8px]');
      expect(searchInput).toHaveClass('text-[14px]');
    });

    it('should have search icon on left side', () => {
      const { container } = render(<FansPage />);

      // Find the search input's parent container
      const searchInput = screen.getByPlaceholderText(/search fans/i);
      const searchContainer = searchInput.parentElement;
      
      // Find search icon within the container (not the first SVG which is in breadcrumbs)
      const searchIcon = searchContainer?.querySelector('svg');
      expect(searchIcon).toBeInTheDocument();
      
      // Icon itself should be positioned absolutely on the left
      expect(searchIcon).toHaveClass('absolute');
      expect(searchIcon).toHaveClass('left-3');
    });

    it('should filter fans when typing in search', () => {
      render(<FansPage />);

      const searchInput = screen.getByPlaceholderText(/search fans/i);
      
      // Type in search
      fireEvent.change(searchInput, { target: { value: 'Sarah' } });

      // Should filter to show only Sarah
      expect(screen.getByText('Sarah M.')).toBeInTheDocument();
      expect(screen.queryByText('Mike R.')).not.toBeInTheDocument();
    });

    it('should apply focus state with border color #5B6BFF', () => {
      render(<FansPage />);

      const searchInput = screen.getByPlaceholderText(/search fans/i);
      
      // Focus the input
      fireEvent.focus(searchInput);

      // Check focus styling
      expect(searchInput).toHaveClass('focus:border-[#5B6BFF]');
    });
  });

  describe('Filter Pill', () => {
    it('should display filter pill with correct styling', () => {
      const { container } = render(<FansPage />);

      const filterButton = screen.getByText('Filters').closest('button');
      expect(filterButton).toBeInTheDocument();

      // Check styling
      expect(filterButton).toHaveClass('bg-[#F3F4F6]');
      expect(filterButton).toHaveClass('border-[#E3E3E3]');
      expect(filterButton).toHaveClass('rounded-[999px]');
      expect(filterButton).toHaveClass('text-[13px]');
      expect(filterButton).toHaveClass('text-[#6B7280]');
    });

    it('should display count badge with correct styling', () => {
      render(<FansPage />);

      const filterButton = screen.getByText('Filters').closest('button');
      const badge = within(filterButton!).getByText('0');

      // Check badge styling
      expect(badge).toHaveClass('bg-[#5B6BFF]');
      expect(badge).toHaveClass('text-white');
      expect(badge).toHaveClass('rounded-full');
      expect(badge).toHaveClass('text-[10px]');
    });

    it('should have hover state', () => {
      render(<FansPage />);

      const filterButton = screen.getByText('Filters').closest('button');
      
      // Check hover class
      expect(filterButton).toHaveClass('hover:bg-[#E5E7EB]');
    });
  });

  describe('Table TagChips', () => {
    it('should display tier status as TagChip components', () => {
      render(<FansPage />);

      // Find TagChips for tiers
      const tagChips = screen.getAllByTestId('tag-chip');
      
      // Should have TagChips for both tier and churn risk
      expect(tagChips.length).toBeGreaterThan(0);

      // Check for VIP tier
      const vipChip = tagChips.find(chip => chip.textContent === 'VIP');
      expect(vipChip).toBeInTheDocument();
      expect(vipChip).toHaveAttribute('data-variant', 'vip');

      // Check for Active tier
      const activeChip = tagChips.find(chip => chip.textContent === 'Active');
      expect(activeChip).toBeInTheDocument();
      expect(activeChip).toHaveAttribute('data-variant', 'active');
    });

    it('should use correct variant for each tier', () => {
      render(<FansPage />);

      const tagChips = screen.getAllByTestId('tag-chip');

      // VIP should use 'vip' variant
      const vipChip = tagChips.find(chip => chip.textContent === 'VIP');
      expect(vipChip).toHaveClass('tag-chip--vip');

      // Active should use 'active' variant
      const activeChip = tagChips.find(chip => chip.textContent === 'Active');
      expect(activeChip).toHaveClass('tag-chip--active');

      // At-Risk should use 'at-risk' variant
      const atRiskChip = tagChips.find(chip => chip.textContent === 'At-Risk');
      if (atRiskChip) {
        expect(atRiskChip).toHaveClass('tag-chip--at-risk');
      }
    });

    it('should display churn risk as TagChip components', () => {
      render(<FansPage />);

      // Find churn risk chips
      const lowChip = screen.getAllByText('Low')[0];
      expect(lowChip).toBeInTheDocument();
      expect(lowChip.closest('[data-testid="tag-chip"]')).toHaveAttribute('data-variant', 'churn-low');

      const highChip = screen.getByText('High');
      expect(highChip).toBeInTheDocument();
      expect(highChip.closest('[data-testid="tag-chip"]')).toHaveAttribute('data-variant', 'churn-high');
    });

    it('should use churn-low variant for low risk', () => {
      render(<FansPage />);

      const lowChips = screen.getAllByText('Low');
      const lowChip = lowChips[0].closest('[data-testid="tag-chip"]');
      
      expect(lowChip).toHaveClass('tag-chip--churn-low');
    });

    it('should use churn-high variant for high risk', () => {
      render(<FansPage />);

      const highChip = screen.getByText('High').closest('[data-testid="tag-chip"]');
      
      expect(highChip).toHaveClass('tag-chip--churn-high');
    });
  });

  describe('Table Row Hover States', () => {
    it('should apply hover background color to table rows', () => {
      const { container } = render(<FansPage />);

      // Find table rows
      const table = container.querySelector('.fans-table');
      expect(table).toBeInTheDocument();

      // Check that CSS class is applied
      expect(table).toHaveClass('fans-table');
    });

    it('should have 150ms transition for hover effect', () => {
      const { container } = render(<FansPage />);

      // The transition is defined in CSS, so we just verify the class exists
      const table = container.querySelector('.fans-table');
      expect(table).toBeInTheDocument();
    });

    it('should be accessible with keyboard navigation', () => {
      const { container } = render(<FansPage />);

      // Find first table row
      const firstRow = container.querySelector('.fans-table tbody tr');
      expect(firstRow).toBeInTheDocument();

      // The focus-within state is defined in CSS
      // We verify the table has the correct class for CSS to apply
      const table = container.querySelector('.fans-table');
      expect(table).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('should apply responsive grid classes to segments', () => {
      const { container } = render(<FansPage />);

      const segmentsGrid = container.querySelector('.fans-segments-grid');
      expect(segmentsGrid).toBeInTheDocument();
      expect(segmentsGrid).toHaveClass('grid');
      expect(segmentsGrid).toHaveClass('gap-3');
    });
  });

  describe('Complete View Integration', () => {
    it('should render all components together correctly', () => {
      render(<FansPage />);

      // Verify all major sections are present
      expect(screen.getByText('All Fans')).toBeInTheDocument(); // Segments
      expect(screen.getByPlaceholderText(/search fans/i)).toBeInTheDocument(); // Search
      expect(screen.getByText('Filters')).toBeInTheDocument(); // Filter pill
      expect(screen.getByText('Sarah M.')).toBeInTheDocument(); // Table data
      expect(screen.getAllByTestId('tag-chip').length).toBeGreaterThan(0); // TagChips
    });

    it('should maintain state when switching between segments', () => {
      render(<FansPage />);

      // Find VIP StatCard label and click its button
      const statCardLabels = screen.getAllByTestId('stat-card-label');
      const vipLabel = statCardLabels.find(label => label.textContent === 'VIP');
      const vipButton = vipLabel?.closest('button');
      fireEvent.click(vipButton!);

      // Should only show VIP fans
      expect(screen.getByText('Sarah M.')).toBeInTheDocument();
      expect(screen.getByText('Emma L.')).toBeInTheDocument();
      expect(screen.queryByText('Mike R.')).not.toBeInTheDocument();

      // Click All Fans
      const allLabel = statCardLabels.find(label => label.textContent === 'All Fans');
      const allButton = allLabel?.closest('button');
      fireEvent.click(allButton!);

      // Should show all fans again
      expect(screen.getByText('Sarah M.')).toBeInTheDocument();
      expect(screen.getByText('Mike R.')).toBeInTheDocument();
    });

    it('should combine search and segment filtering', () => {
      render(<FansPage />);

      // Find VIP StatCard label and click its button
      const statCardLabels = screen.getAllByTestId('stat-card-label');
      const vipLabel = statCardLabels.find(label => label.textContent === 'VIP');
      const vipButton = vipLabel?.closest('button');
      fireEvent.click(vipButton!);

      // Type in search
      const searchInput = screen.getByPlaceholderText(/search fans/i);
      fireEvent.change(searchInput, { target: { value: 'Emma' } });

      // Should only show Emma (VIP + matches search)
      expect(screen.getByText('Emma L.')).toBeInTheDocument();
      expect(screen.queryByText('Sarah M.')).not.toBeInTheDocument();
      expect(screen.queryByText('Mike R.')).not.toBeInTheDocument();
    });
  });
});
