import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalSearch } from '@/components/dashboard/GlobalSearch';

// Feature: dashboard-shopify-migration, Property 36: Search Input Unfocused State
// Validates: Requirements 12.2
describe('Property 36: Search Input Unfocused State', () => {
  it('should render search input with proper structure when unfocused', () => {
    const { container } = render(<GlobalSearch />);
    const searchContainer = container.querySelector('[data-testid="global-search"]');
    const input = screen.getByTestId('search-input');
    
    expect(searchContainer).toBeTruthy();
    expect(input).toBeTruthy();
    expect(input).toHaveAttribute('placeholder', 'Search dashboard...');
  });
});

// Feature: dashboard-shopify-migration, Property 37: Search Input Focus Background
// Validates: Requirements 12.3
describe('Property 37: Search Input Focus Background', () => {
  it('should apply focused class when input receives focus', async () => {
    const { container } = render(<GlobalSearch />);
    const input = screen.getByTestId('search-input');
    const searchContainer = container.querySelector('[data-testid="global-search"]');
    
    // Initially not focused
    expect(searchContainer?.className).not.toContain('focused');
    
    // Focus the input
    fireEvent.focus(input);
    
    await waitFor(() => {
      const updatedContainer = container.querySelector('[data-testid="global-search"]');
      expect(updatedContainer?.className).toContain('focused');
    });
  });
});

// Feature: dashboard-shopify-migration, Property 38: Search Input Focus Shadow
// Validates: Requirements 12.4
describe('Property 38: Search Input Focus Shadow', () => {
  it('should apply focused styling class on focus', async () => {
    const { container } = render(<GlobalSearch />);
    const input = screen.getByTestId('search-input');
    
    fireEvent.focus(input);
    
    await waitFor(() => {
      const searchContainer = container.querySelector('[data-testid="global-search"]');
      // Verify the focused class is applied (which includes shadow in CSS)
      expect(searchContainer?.className).toContain('focused');
    });
  });
});

// Feature: dashboard-shopify-migration, Property 10: Search Input Focus State
// Validates: Requirements 3.3
describe('Property 10: Search Input Focus State', () => {
  it('should maintain focused state while input has focus', async () => {
    const { container } = render(<GlobalSearch />);
    const input = screen.getByTestId('search-input');
    
    fireEvent.focus(input);
    
    await waitFor(() => {
      const searchContainer = container.querySelector('[data-testid="global-search"]');
      expect(searchContainer?.className).toContain('focused');
    });
    
    // Verify the focused class is applied (Electric Indigo glow is in CSS)
    const searchContainer = container.querySelector('[data-testid="global-search"]');
    expect(searchContainer?.className).toContain('focused');
  });
});

// Feature: dashboard-shopify-migration, Property 39: Real-time Search Results
// Validates: Requirements 12.5
describe('Property 39: Real-time Search Results', () => {
  it('should call onSearch callback for any non-empty query', () => {
    const testQueries = ['test', 'search', 'TikTok', 'analytics'];
    
    testQueries.forEach(query => {
      const onSearch = vi.fn();
      const { unmount } = render(<GlobalSearch onSearch={onSearch} />);
      
      const input = screen.getByTestId('search-input');
      
      // Type in the search input
      fireEvent.change(input, { target: { value: query } });
      
      expect(onSearch).toHaveBeenCalledWith(query);
      
      unmount();
    });
  });

  it('should display categorized results when query matches', async () => {
    const mockResults = [
      {
        id: 'nav-1',
        type: 'navigation' as const,
        title: 'Navigation Item',
        href: '/nav',
      },
      {
        id: 'stat-1',
        type: 'stat' as const,
        title: 'Stat Item',
        href: '/stat',
      },
      {
        id: 'content-1',
        type: 'content' as const,
        title: 'Content Item',
        href: '/content',
      },
    ];
    
    const { container } = render(<GlobalSearch results={mockResults} />);
    
    const input = screen.getByTestId('search-input');
    
    // Type and focus
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);
    
    await waitFor(() => {
      const resultsContainer = container.querySelector('[data-testid="search-results"]');
      expect(resultsContainer).toBeTruthy();
      
      // Verify all result items are rendered
      expect(screen.getByTestId('search-result-nav-1')).toBeTruthy();
      expect(screen.getByTestId('search-result-stat-1')).toBeTruthy();
      expect(screen.getByTestId('search-result-content-1')).toBeTruthy();
    });
  });

  it('should group results by type', async () => {
    const mockResults = [
      {
        id: 'nav-1',
        type: 'navigation' as const,
        title: 'Nav 1',
        href: '/nav1',
      },
      {
        id: 'nav-2',
        type: 'navigation' as const,
        title: 'Nav 2',
        href: '/nav2',
      },
      {
        id: 'stat-1',
        type: 'stat' as const,
        title: 'Stat 1',
        href: '/stat1',
      },
    ];
    
    render(<GlobalSearch results={mockResults} />);
    
    const input = screen.getByTestId('search-input');
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);
    
    await waitFor(() => {
      // Check that results are displayed
      expect(screen.getByText('Nav 1')).toBeTruthy();
      expect(screen.getByText('Nav 2')).toBeTruthy();
      expect(screen.getByText('Stat 1')).toBeTruthy();
      
      // Check category titles
      expect(screen.getByText('Navigation')).toBeTruthy();
      expect(screen.getByText('Stat')).toBeTruthy();
    });
  });
});

// Additional property: Search input structure
describe('Search Input Structure', () => {
  it('should include search icon', () => {
    const { container } = render(<GlobalSearch />);
    
    // Check for SVG icon
    const icon = container.querySelector('svg');
    expect(icon).toBeTruthy();
  });

  it('should have proper input attributes', () => {
    render(<GlobalSearch />);
    
    const input = screen.getByTestId('search-input');
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveAttribute('placeholder', 'Search dashboard...');
  });
});

// Additional property: Search results dropdown
describe('Search Results Dropdown', () => {
  it('should show results dropdown when query has results', async () => {
    const mockResults = [
      {
        id: '1',
        type: 'navigation' as const,
        title: 'Test',
        href: '/test',
      },
    ];
    
    const { container } = render(<GlobalSearch results={mockResults} />);
    const input = screen.getByTestId('search-input');
    
    // Initially no results shown
    expect(container.querySelector('[data-testid="search-results"]')).toBeFalsy();
    
    // Focus and type
    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.focus(input);
    
    await waitFor(() => {
      const resultsDropdown = container.querySelector('[data-testid="search-results"]');
      expect(resultsDropdown).toBeTruthy();
    });
  });

  it('should not show results when query is empty', () => {
    const mockResults = [
      {
        id: '1',
        type: 'navigation' as const,
        title: 'Test',
        href: '/test',
      },
    ];
    
    const { container } = render(<GlobalSearch results={mockResults} />);
    const input = screen.getByTestId('search-input');
    
    // Focus with empty query
    fireEvent.focus(input);
    
    // Results should not be shown
    expect(container.querySelector('[data-testid="search-results"]')).toBeFalsy();
  });
});
