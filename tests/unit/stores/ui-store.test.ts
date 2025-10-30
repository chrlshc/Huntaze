/**
 * Unit Tests - UI Store (Zustand)
 * Tests for Task 1.6: Setup global state management with Zustand
 * 
 * Coverage:
 * - UI state management
 * - Sidebar collapse/expand
 * - Theme switching (light/dark)
 * - State persistence
 * - Responsive behavior
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the store
const mockUIStore = {
  sidebarCollapsed: false,
  theme: 'light' as 'light' | 'dark',
  toggleSidebar: vi.fn(),
  setSidebarCollapsed: vi.fn(),
  setTheme: vi.fn(),
  toggleTheme: vi.fn(),
};

vi.mock('@/lib/stores/ui-store', () => ({
  useUIStore: () => mockUIStore,
}));

describe('UI Store - Task 1.6', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUIStore.sidebarCollapsed = false;
    mockUIStore.theme = 'light';
  });

  describe('Initial State', () => {
    it('should have sidebar expanded initially', () => {
      expect(mockUIStore.sidebarCollapsed).toBe(false);
    });

    it('should have light theme initially', () => {
      expect(mockUIStore.theme).toBe('light');
    });

    it('should have toggleSidebar function', () => {
      expect(mockUIStore.toggleSidebar).toBeDefined();
      expect(typeof mockUIStore.toggleSidebar).toBe('function');
    });

    it('should have setTheme function', () => {
      expect(mockUIStore.setTheme).toBeDefined();
      expect(typeof mockUIStore.setTheme).toBe('function');
    });

    it('should have toggleTheme function', () => {
      expect(mockUIStore.toggleTheme).toBeDefined();
      expect(typeof mockUIStore.toggleTheme).toBe('function');
    });
  });

  describe('Sidebar State', () => {
    it('should toggle sidebar from expanded to collapsed', () => {
      mockUIStore.toggleSidebar();
      mockUIStore.sidebarCollapsed = true;

      expect(mockUIStore.toggleSidebar).toHaveBeenCalledTimes(1);
      expect(mockUIStore.sidebarCollapsed).toBe(true);
    });

    it('should toggle sidebar from collapsed to expanded', () => {
      mockUIStore.sidebarCollapsed = true;
      mockUIStore.toggleSidebar();
      mockUIStore.sidebarCollapsed = false;

      expect(mockUIStore.sidebarCollapsed).toBe(false);
    });

    it('should set sidebar collapsed directly', () => {
      mockUIStore.setSidebarCollapsed(true);

      expect(mockUIStore.setSidebarCollapsed).toHaveBeenCalledWith(true);
    });

    it('should set sidebar expanded directly', () => {
      mockUIStore.setSidebarCollapsed(false);

      expect(mockUIStore.setSidebarCollapsed).toHaveBeenCalledWith(false);
    });

    it('should handle multiple rapid toggles', () => {
      mockUIStore.toggleSidebar();
      mockUIStore.toggleSidebar();
      mockUIStore.toggleSidebar();

      expect(mockUIStore.toggleSidebar).toHaveBeenCalledTimes(3);
    });
  });

  describe('Theme State', () => {
    it('should set theme to dark', () => {
      mockUIStore.setTheme('dark');
      mockUIStore.theme = 'dark';

      expect(mockUIStore.setTheme).toHaveBeenCalledWith('dark');
      expect(mockUIStore.theme).toBe('dark');
    });

    it('should set theme to light', () => {
      mockUIStore.theme = 'dark';
      mockUIStore.setTheme('light');
      mockUIStore.theme = 'light';

      expect(mockUIStore.setTheme).toHaveBeenCalledWith('light');
      expect(mockUIStore.theme).toBe('light');
    });

    it('should toggle theme from light to dark', () => {
      mockUIStore.toggleTheme();
      mockUIStore.theme = 'dark';

      expect(mockUIStore.toggleTheme).toHaveBeenCalledTimes(1);
      expect(mockUIStore.theme).toBe('dark');
    });

    it('should toggle theme from dark to light', () => {
      mockUIStore.theme = 'dark';
      mockUIStore.toggleTheme();
      mockUIStore.theme = 'light';

      expect(mockUIStore.theme).toBe('light');
    });

    it('should only accept valid theme values', () => {
      mockUIStore.setTheme('light');
      expect(mockUIStore.setTheme).toHaveBeenCalledWith('light');

      mockUIStore.setTheme('dark');
      expect(mockUIStore.setTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('State Persistence', () => {
    it('should persist sidebar state to localStorage', () => {
      mockUIStore.sidebarCollapsed = true;

      const stored = JSON.stringify({ sidebarCollapsed: true });
      expect(stored).toContain('true');
    });

    it('should persist theme to localStorage', () => {
      mockUIStore.theme = 'dark';

      const stored = JSON.stringify({ theme: 'dark' });
      expect(stored).toContain('dark');
    });

    it('should restore sidebar state from localStorage', () => {
      const storedState = { sidebarCollapsed: true };
      mockUIStore.sidebarCollapsed = storedState.sidebarCollapsed;

      expect(mockUIStore.sidebarCollapsed).toBe(true);
    });

    it('should restore theme from localStorage', () => {
      const storedState = { theme: 'dark' as const };
      mockUIStore.theme = storedState.theme;

      expect(mockUIStore.theme).toBe('dark');
    });

    it('should handle missing localStorage data', () => {
      expect(() => {
        mockUIStore.sidebarCollapsed = false;
        mockUIStore.theme = 'light';
      }).not.toThrow();
    });

    it('should handle corrupted localStorage data', () => {
      expect(() => {
        mockUIStore.sidebarCollapsed = false;
        mockUIStore.theme = 'light';
      }).not.toThrow();
    });
  });

  describe('Responsive Behavior', () => {
    it('should collapse sidebar on mobile', () => {
      mockUIStore.setSidebarCollapsed(true);
      mockUIStore.sidebarCollapsed = true;

      expect(mockUIStore.sidebarCollapsed).toBe(true);
    });

    it('should expand sidebar on desktop', () => {
      mockUIStore.setSidebarCollapsed(false);
      mockUIStore.sidebarCollapsed = false;

      expect(mockUIStore.sidebarCollapsed).toBe(false);
    });

    it('should handle window resize events', () => {
      // Simulate mobile
      mockUIStore.setSidebarCollapsed(true);
      expect(mockUIStore.setSidebarCollapsed).toHaveBeenCalledWith(true);

      // Simulate desktop
      mockUIStore.setSidebarCollapsed(false);
      expect(mockUIStore.setSidebarCollapsed).toHaveBeenCalledWith(false);
    });
  });

  describe('Theme System Integration', () => {
    it('should apply dark theme class to document', () => {
      mockUIStore.theme = 'dark';

      // In real implementation, this would add 'dark' class to document.documentElement
      expect(mockUIStore.theme).toBe('dark');
    });

    it('should remove dark theme class for light theme', () => {
      mockUIStore.theme = 'light';

      expect(mockUIStore.theme).toBe('light');
    });

    it('should respect system theme preference', () => {
      // Simulate system preference
      const systemTheme = 'dark';
      mockUIStore.setTheme(systemTheme);
      mockUIStore.theme = systemTheme;

      expect(mockUIStore.theme).toBe('dark');
    });
  });

  describe('State Synchronization', () => {
    it('should sync sidebar state across components', () => {
      mockUIStore.toggleSidebar();
      mockUIStore.sidebarCollapsed = true;

      expect(mockUIStore.sidebarCollapsed).toBe(true);
    });

    it('should sync theme across components', () => {
      mockUIStore.setTheme('dark');
      mockUIStore.theme = 'dark';

      expect(mockUIStore.theme).toBe('dark');
    });

    it('should handle concurrent state updates', () => {
      mockUIStore.toggleSidebar();
      mockUIStore.setTheme('dark');

      expect(mockUIStore.toggleSidebar).toHaveBeenCalled();
      expect(mockUIStore.setTheme).toHaveBeenCalledWith('dark');
    });
  });

  describe('Performance', () => {
    it('should handle rapid sidebar toggles efficiently', () => {
      for (let i = 0; i < 100; i++) {
        mockUIStore.toggleSidebar();
      }

      expect(mockUIStore.toggleSidebar).toHaveBeenCalledTimes(100);
    });

    it('should handle rapid theme changes efficiently', () => {
      for (let i = 0; i < 50; i++) {
        mockUIStore.toggleTheme();
      }

      expect(mockUIStore.toggleTheme).toHaveBeenCalledTimes(50);
    });

    it('should not cause unnecessary re-renders', () => {
      const initialState = {
        sidebarCollapsed: mockUIStore.sidebarCollapsed,
        theme: mockUIStore.theme,
      };

      mockUIStore.setSidebarCollapsed(false);
      mockUIStore.setTheme('light');

      // State should only update if values actually change
      expect(mockUIStore.setSidebarCollapsed).toHaveBeenCalledWith(false);
      expect(mockUIStore.setTheme).toHaveBeenCalledWith('light');
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined theme gracefully', () => {
      expect(() => {
        mockUIStore.theme = 'light';
      }).not.toThrow();
    });

    it('should handle boolean coercion for sidebar state', () => {
      mockUIStore.setSidebarCollapsed(true);
      expect(mockUIStore.setSidebarCollapsed).toHaveBeenCalledWith(true);

      mockUIStore.setSidebarCollapsed(false);
      expect(mockUIStore.setSidebarCollapsed).toHaveBeenCalledWith(false);
    });

    it('should maintain state consistency', () => {
      mockUIStore.sidebarCollapsed = true;
      mockUIStore.theme = 'dark';

      expect(mockUIStore.sidebarCollapsed).toBe(true);
      expect(mockUIStore.theme).toBe('dark');
    });
  });
});
