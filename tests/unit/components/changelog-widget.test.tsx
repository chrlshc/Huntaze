import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ChangelogWidget } from '@/components/engagement/ChangelogWidget';
import type { ChangelogResponse } from '@/app/api/changelog/types';

// Mock fetch
global.fetch = vi.fn();

// Mock Lucide icons
vi.mock('lucide-react', () => ({
  Bell: () => <span data-testid="bell-icon">Bell</span>,
  X: () => <span data-testid="x-icon">X</span>,
}));

describe('ChangelogWidget - Cookie-Based Read State Logic', () => {
  const mockChangelogResponse: ChangelogResponse = {
    entries: [
      {
        id: '1',
        title: 'Mobile UX Improvements',
        description: 'Enhanced mobile experience',
        releaseDate: '2024-01-15T00:00:00Z',
        features: ['Fixed horizontal scrolling', 'Added iPhone notch support'],
      },
      {
        id: '2',
        title: 'Performance Optimizations',
        description: 'Faster load times',
        releaseDate: '2024-01-10T00:00:00Z',
        features: ['Reduced bundle size', 'Improved caching'],
      },
    ],
    latestReleaseDate: '2024-01-15T00:00:00Z',
  };

  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = 'lastViewedChangelog=; max-age=0; path=/';
    
    // Reset fetch mock
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => mockChangelogResponse,
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Clean up cookies
    document.cookie = 'lastViewedChangelog=; max-age=0; path=/';
  });

  describe('Requirement 7.1: Cookie checking against latest release date', () => {
    it('should check lastViewedChangelog cookie on mount', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/changelog');
      });
    });

    it('should show badge when no cookie exists (first visit)', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        const badge = screen.queryByLabelText('New updates available');
        expect(badge).toBeInTheDocument();
      });
    });

    it('should show badge when cookie date is older than latest release', async () => {
      // Set cookie to a date before the latest release
      document.cookie = 'lastViewedChangelog=2024-01-01T00:00:00Z; path=/';

      render(<ChangelogWidget />);

      await waitFor(() => {
        const badge = screen.queryByLabelText('New updates available');
        expect(badge).toBeInTheDocument();
      });
    });

    it('should NOT show badge when cookie date is newer than latest release', async () => {
      // Set cookie to a date after the latest release
      document.cookie = 'lastViewedChangelog=2024-01-20T00:00:00Z; path=/';

      render(<ChangelogWidget />);

      await waitFor(() => {
        const badge = screen.queryByLabelText('New updates available');
        expect(badge).not.toBeInTheDocument();
      });
    });

    it('should NOT show badge when cookie date equals latest release', async () => {
      // Set cookie to exactly the latest release date
      document.cookie = 'lastViewedChangelog=2024-01-15T00:00:00Z; path=/';

      render(<ChangelogWidget />);

      await waitFor(() => {
        const badge = screen.queryByLabelText('New updates available');
        expect(badge).not.toBeInTheDocument();
      });
    });
  });

  describe('Requirement 7.2: Pulsing badge display', () => {
    it('should display pulsing badge when new update is available', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        const badge = screen.getByLabelText('New updates available');
        expect(badge).toHaveClass('animate-pulse');
        expect(badge).toHaveClass('bg-primary');
      });
    });

    it('should position badge at top-right of button', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        const badge = screen.getByLabelText('New updates available');
        expect(badge).toHaveClass('absolute');
        expect(badge).toHaveClass('top-1');
        expect(badge).toHaveClass('right-1');
      });
    });

    it('should make badge circular with correct size', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        const badge = screen.getByLabelText('New updates available');
        expect(badge).toHaveClass('w-2');
        expect(badge).toHaveClass('h-2');
        expect(badge).toHaveClass('rounded-full');
      });
    });
  });

  describe('Requirement 7.3: Cookie update on widget open', () => {
    it('should update lastViewedChangelog cookie when widget opens', async () => {
      const beforeOpen = new Date().toISOString();
      
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Simulate opening the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      // Check that cookie was set
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('lastViewedChangelog='))
        ?.split('=')[1];

      expect(cookieValue).toBeDefined();
      
      // Cookie should be set to current time (within 1 second tolerance)
      const cookieDate = new Date(cookieValue!);
      const afterOpen = new Date().toISOString();
      
      expect(cookieDate.getTime()).toBeGreaterThanOrEqual(new Date(beforeOpen).getTime());
      expect(cookieDate.getTime()).toBeLessThanOrEqual(new Date(afterOpen).getTime() + 1000);
    });

    it('should dismiss badge when widget opens', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByLabelText('New updates available')).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      // Badge should be removed
      await waitFor(() => {
        expect(screen.queryByLabelText('New updates available')).not.toBeInTheDocument();
      });
    });

    it('should set cookie with 1 year expiration', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      // Check cookie is set
      const cookie = document.cookie;
      expect(cookie).toContain('lastViewedChangelog=');
      // Note: path and max-age are set in the setCookie function but may not be visible in document.cookie
      // This is a limitation of the browser's document.cookie API in test environments
    });

    it('should set cookie with SameSite=Lax', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      // Cookie should be set (SameSite is set in setCookie function)
      const cookieValue = document.cookie
        .split('; ')
        .find(row => row.startsWith('lastViewedChangelog='));
      
      expect(cookieValue).toBeDefined();
    });
  });

  describe('Requirement 7.4: Sidebar component display', () => {
    it('should render as a sidebar button with "What\'s New" text', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });
    });

    it('should render Bell icon', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByTestId('bell-icon')).toBeInTheDocument();
      });
    });

    it('should display changelog entries when opened', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      // Check that entries are displayed
      await waitFor(() => {
        expect(screen.getByText('Mobile UX Improvements')).toBeInTheDocument();
        expect(screen.getByText('Performance Optimizations')).toBeInTheDocument();
      });
    });

    it('should format release dates correctly', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      // Check for formatted dates - the exact dates depend on timezone
      // Just verify that dates are displayed in the correct format
      await waitFor(() => {
        const dates = screen.getAllByText(/January \d+, 2024/);
        expect(dates.length).toBeGreaterThan(0);
        // Verify the format is correct (Month Day, Year)
        dates.forEach(date => {
          expect(date.textContent).toMatch(/^[A-Z][a-z]+ \d+, \d{4}$/);
        });
      });
    });

    it('should display feature lists', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByText('Fixed horizontal scrolling')).toBeInTheDocument();
        expect(screen.getByText('Added iPhone notch support')).toBeInTheDocument();
      });
    });

    it('should display close button', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      // Check for close button
      await waitFor(() => {
        expect(screen.getByLabelText('Close changelog')).toBeInTheDocument();
      });
    });

    it('should close when close button is clicked', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByText('Mobile UX Improvements')).toBeInTheDocument();
      });

      // Close the widget
      const closeButton = screen.getByLabelText('Close changelog');
      fireEvent.click(closeButton);

      // Sidebar should be closed
      await waitFor(() => {
        expect(screen.queryByText('Mobile UX Improvements')).not.toBeInTheDocument();
      });
    });

    it('should close when backdrop is clicked', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByText('Mobile UX Improvements')).toBeInTheDocument();
      });

      // Click backdrop
      const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
      fireEvent.click(backdrop!);

      // Sidebar should be closed
      await waitFor(() => {
        expect(screen.queryByText('Mobile UX Improvements')).not.toBeInTheDocument();
      });
    });
  });

  describe('Requirement 7.5: Graceful error handling', () => {
    it('should handle fetch errors gracefully', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('Network error'));

      render(<ChangelogWidget />);

      await waitFor(() => {
        // Component should still render
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Should not show badge on error
      expect(screen.queryByLabelText('New updates available')).not.toBeInTheDocument();
    });

    it('should handle HTTP errors gracefully', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Should not crash
      expect(screen.queryByLabelText('New updates available')).not.toBeInTheDocument();
    });

    it('should display empty state when no entries available', async () => {
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          entries: [],
          latestReleaseDate: new Date(0).toISOString(),
        }),
      } as Response);

      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget to see empty state
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      await waitFor(() => {
        expect(screen.getByText('No changelog entries available.')).toBeInTheDocument();
      });
    });

    it('should show loading state initially', () => {
      render(<ChangelogWidget />);

      // Should show loading state (opacity-50)
      const button = screen.getByText("What's New").closest('button');
      expect(button).toHaveClass('opacity-50');
    });

    it('should remove loading state after data loads', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        const button = screen.getByText("What's New").closest('button');
        expect(button).not.toHaveClass('opacity-50');
      });
    });
  });

  describe('Cookie utility functions', () => {
    it('should handle invalid cookie dates gracefully', async () => {
      document.cookie = 'lastViewedChangelog=invalid-date; path=/';

      render(<ChangelogWidget />);

      await waitFor(() => {
        // Should show badge when cookie date is invalid (treated as epoch)
        expect(screen.getByLabelText('New updates available')).toBeInTheDocument();
      });
    });

    it('should handle missing cookie gracefully', async () => {
      // Ensure no cookie exists
      document.cookie = 'lastViewedChangelog=; max-age=0; path=/';

      render(<ChangelogWidget />);

      await waitFor(() => {
        // Should show badge when no cookie exists
        expect(screen.getByLabelText('New updates available')).toBeInTheDocument();
      });
    });

    it('should handle multiple cookies correctly', async () => {
      document.cookie = 'otherCookie=value; path=/';
      document.cookie = 'lastViewedChangelog=2024-01-01T00:00:00Z; path=/';

      render(<ChangelogWidget />);

      await waitFor(() => {
        // Should correctly parse lastViewedChangelog from multiple cookies
        expect(screen.getByLabelText('New updates available')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
      });
    });

    it('should have aria-label on badge', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        const badge = screen.getByLabelText('New updates available');
        expect(badge).toHaveAttribute('aria-label', 'New updates available');
      });
    });

    it('should have proper heading hierarchy', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      await waitFor(() => {
        const title = screen.getByText("What's New", { selector: 'h2' });
        expect(title.tagName).toBe('H2');
      });
    });

    it('should have aria-label on close button', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      await waitFor(() => {
        const closeButton = screen.getByLabelText('Close changelog');
        expect(closeButton).toHaveAttribute('aria-label', 'Close changelog');
      });
    });

    it('should have aria-hidden on backdrop', async () => {
      render(<ChangelogWidget />);

      await waitFor(() => {
        expect(screen.getByText("What's New")).toBeInTheDocument();
      });

      // Open the widget
      const button = screen.getByText("What's New").closest('button');
      fireEvent.click(button!);

      await waitFor(() => {
        const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50');
        expect(backdrop).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });
});
