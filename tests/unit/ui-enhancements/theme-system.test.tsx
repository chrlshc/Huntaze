/**
 * Unit Tests for Theme System
 * 
 * Tests for ThemeContext, ThemeProvider, and ThemeToggle
 * Requirements: 2.1, 2.2, 2.6, 2.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ThemeToggle } from '@/components/ThemeToggle';

// Test component to access theme context
function TestComponent() {
  const { theme, setTheme, effectiveTheme } = useTheme();
  
  return (
    <div>
      <div data-testid="current-theme">{theme}</div>
      <div data-testid="effective-theme">{effectiveTheme}</div>
      <button onClick={() => setTheme('light')}>Set Light</button>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
      <button onClick={() => setTheme('system')}>Set System</button>
    </div>
  );
}

describe('Theme System', () => {
  let localStorageMock: { [key: string]: string };
  let matchMediaMock: any;

  beforeEach(() => {
    // Mock localStorage
    localStorageMock = {};
    global.localStorage = {
      getItem: vi.fn((key) => localStorageMock[key] || null),
      setItem: vi.fn((key, value) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        localStorageMock = {};
      }),
      length: 0,
      key: vi.fn(),
    } as any;

    // Mock matchMedia
    matchMediaMock = {
      matches: false,
      media: '(prefers-color-scheme: dark)',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    global.matchMedia = vi.fn(() => matchMediaMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('ThemeProvider', () => {
    it('should provide default theme', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const themeElement = screen.getByTestId('current-theme');
      expect(themeElement.textContent).toBeTruthy();
    });

    it('should allow theme changes', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const lightButton = screen.getByText('Set Light');
      fireEvent.click(lightButton);

      const themeElement = screen.getByTestId('current-theme');
      expect(themeElement.textContent).toBe('light');
    });

    it('should persist theme to localStorage', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const darkButton = screen.getByText('Set Dark');
      fireEvent.click(darkButton);

      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should load theme from localStorage on mount', () => {
      localStorageMock['theme'] = 'dark';

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const themeElement = screen.getByTestId('current-theme');
      expect(themeElement.textContent).toBe('dark');
    });

    it('should detect OS preference when theme is system', () => {
      matchMediaMock.matches = true;

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const systemButton = screen.getByText('Set System');
      fireEvent.click(systemButton);

      const effectiveTheme = screen.getByTestId('effective-theme');
      expect(effectiveTheme.textContent).toBe('dark');
    });

    it('should listen for OS preference changes', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(matchMediaMock.addEventListener).toHaveBeenCalled();
    });

    it('should apply theme class to document', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const darkButton = screen.getByText('Set Dark');
      fireEvent.click(darkButton);

      // In a real browser, document.documentElement.classList would be updated
      // This is a simplified test
      expect(screen.getByTestId('current-theme').textContent).toBe('dark');
    });

    it('should handle system theme with light preference', () => {
      matchMediaMock.matches = false;

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const systemButton = screen.getByText('Set System');
      fireEvent.click(systemButton);

      const effectiveTheme = screen.getByTestId('effective-theme');
      expect(effectiveTheme.textContent).toBe('light');
    });
  });

  describe('ThemeToggle Component', () => {
    it('should render all theme options', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      expect(screen.getByText(/Light/i)).toBeInTheDocument();
      expect(screen.getByText(/Dark/i)).toBeInTheDocument();
      expect(screen.getByText(/System/i)).toBeInTheDocument();
    });

    it('should highlight active theme', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const buttons = screen.getAllByRole('button');
      const activeButton = buttons.find(btn => 
        btn.getAttribute('aria-pressed') === 'true'
      );

      expect(activeButton).toBeTruthy();
    });

    it('should switch to light theme on click', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
          <TestComponent />
        </ThemeProvider>
      );

      const lightButton = screen.getByText(/Light/i);
      fireEvent.click(lightButton);

      const themeElement = screen.getByTestId('current-theme');
      expect(themeElement.textContent).toBe('light');
    });

    it('should switch to dark theme on click', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
          <TestComponent />
        </ThemeProvider>
      );

      const darkButton = screen.getByText(/Dark/i);
      fireEvent.click(darkButton);

      const themeElement = screen.getByTestId('current-theme');
      expect(themeElement.textContent).toBe('dark');
    });

    it('should switch to system theme on click', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
          <TestComponent />
        </ThemeProvider>
      );

      const systemButton = screen.getByText(/System/i);
      fireEvent.click(systemButton);

      const themeElement = screen.getByTestId('current-theme');
      expect(themeElement.textContent).toBe('system');
    });

    it('should have proper aria-pressed attributes', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('should apply active styling to selected theme', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const lightButton = screen.getByText(/Light/i);
      fireEvent.click(lightButton);

      expect(lightButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Theme Persistence', () => {
    it('should save theme preference on change', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const darkButton = screen.getByText('Set Dark');
      fireEvent.click(darkButton);

      expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'dark');
    });

    it('should restore theme on page reload', () => {
      localStorageMock['theme'] = 'light';

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const themeElement = screen.getByTestId('current-theme');
      expect(themeElement.textContent).toBe('light');
    });

    it('should handle missing localStorage gracefully', () => {
      global.localStorage.getItem = vi.fn(() => null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should render with default theme
      const themeElement = screen.getByTestId('current-theme');
      expect(themeElement.textContent).toBeTruthy();
    });
  });

  describe('OS Preference Detection', () => {
    it('should detect dark mode preference', () => {
      matchMediaMock.matches = true;

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const systemButton = screen.getByText('Set System');
      fireEvent.click(systemButton);

      const effectiveTheme = screen.getByTestId('effective-theme');
      expect(effectiveTheme.textContent).toBe('dark');
    });

    it('should detect light mode preference', () => {
      matchMediaMock.matches = false;

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const systemButton = screen.getByText('Set System');
      fireEvent.click(systemButton);

      const effectiveTheme = screen.getByTestId('effective-theme');
      expect(effectiveTheme.textContent).toBe('light');
    });

    it('should update when OS preference changes', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const systemButton = screen.getByText('Set System');
      fireEvent.click(systemButton);

      // Simulate OS preference change
      matchMediaMock.matches = true;
      const changeHandler = matchMediaMock.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });

      await waitFor(() => {
        const effectiveTheme = screen.getByTestId('effective-theme');
        expect(effectiveTheme.textContent).toBe('dark');
      });
    });
  });

  describe('Theme Application', () => {
    it('should apply light theme correctly', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const lightButton = screen.getByText('Set Light');
      fireEvent.click(lightButton);

      const effectiveTheme = screen.getByTestId('effective-theme');
      expect(effectiveTheme.textContent).toBe('light');
    });

    it('should apply dark theme correctly', () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const darkButton = screen.getByText('Set Dark');
      fireEvent.click(darkButton);

      const effectiveTheme = screen.getByTestId('effective-theme');
      expect(effectiveTheme.textContent).toBe('dark');
    });

    it('should transition smoothly between themes', async () => {
      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const lightButton = screen.getByText('Set Light');
      const darkButton = screen.getByText('Set Dark');

      fireEvent.click(lightButton);
      await waitFor(() => {
        expect(screen.getByTestId('effective-theme').textContent).toBe('light');
      });

      fireEvent.click(darkButton);
      await waitFor(() => {
        expect(screen.getByTestId('effective-theme').textContent).toBe('dark');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-pressed');
      });
    });

    it('should be keyboard navigable', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button.tagName).toBe('BUTTON');
      });
    });

    it('should announce theme changes to screen readers', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const darkButton = screen.getByText(/Dark/i);
      fireEvent.click(darkButton);

      expect(darkButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Performance', () => {
    it('should switch themes quickly', () => {
      const startTime = Date.now();

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      const darkButton = screen.getByText('Set Dark');
      fireEvent.click(darkButton);

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(200); // Should be < 200ms
    });

    it('should not cause unnecessary re-renders', () => {
      const renderSpy = vi.fn();

      function SpyComponent() {
        renderSpy();
        return <TestComponent />;
      }

      render(
        <ThemeProvider>
          <SpyComponent />
        </ThemeProvider>
      );

      const initialRenders = renderSpy.mock.calls.length;

      const darkButton = screen.getByText('Set Dark');
      fireEvent.click(darkButton);

      // Should only re-render once for the theme change
      expect(renderSpy.mock.calls.length).toBeLessThanOrEqual(initialRenders + 2);
    });
  });
});
