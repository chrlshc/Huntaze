import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { vi } from 'vitest';

// Mock React for components that use hooks
global.React = React;

// Test utilities and providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock implementations for common browser APIs
export const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

export const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock fetch for API calls
export const mockFetch = vi.fn();

// Setup global mocks
beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage,
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    value: mockSessionStorage,
  });
  
  global.fetch = mockFetch;
  
  // Reset all mocks
  vi.clearAllMocks();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

export default customRender;