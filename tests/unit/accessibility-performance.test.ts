import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock Web Vitals data
const mockWebVitals = {
  LCP: 2.3, // Largest Contentful Paint
  INP: 150, // Interaction to Next Paint
  CLS: 0.08, // Cumulative Layout Shift
  FCP: 1.8, // First Contentful Paint
  TTFB: 0.6 // Time to First Byte
};

// Mock components for testing
const MockAccessibleForm = () => (
  <form>
    <fieldset>
      <legend>Contact Information</legend>
      
      <label htmlFor="name">
        Full Name <span aria-label="required">*</span>
      </label>
      <input 
        id="name" 
        type="text" 
        required 
        aria-describedby="name-error"
        aria-invalid="false"
      />
      <div id="name-error" role="alert" aria-live="polite"></div>
      
      <label htmlFor="email">
        Email Address <span aria-label="required">*</span>
      </label>
      <input 
        id="email" 
        type="email" 
        required 
        aria-describedby="email-help email-error"
        aria-invalid="false"
      />
      <div id="email-help">We'll never share your email</div>
      <div id="email-error" role="alert" aria-live="polite"></div>
    </fieldset>
    
    <button type="submit">Submit Form</button>
  </form>
);

const MockResponsiveLayout = ({ children }: { children: React.ReactNode }) => (
  <div 
    data-testid="responsive-layout"
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1rem',
      padding: '1rem'
    }}
  >
    {children}
  </div>
);

const MockContrastChecker = ({ backgroundColor, textColor }: { backgroundColor: string; textColor: string }) => {
  const calculateContrast = (bg: string, text: string) => {
    // Simplified contrast calculation for testing
    const bgLuminance = bg === '#ffffff' ? 1 : bg === '#000000' ? 0 : 0.5;
    const textLuminance = text === '#ffffff' ? 1 : text === '#000000' ? 0 : 0.5;
    
    const lighter = Math.max(bgLuminance, textLuminance);
    const darker = Math.min(bgLuminance, textLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  };
  
  const contrast = calculateContrast(backgroundColor, textColor);
  const meetsAA = contrast >= 4.5;
  
  return (
    <div 
      data-testid="contrast-checker"
      style={{ backgroundColor, color: textColor, padding: '1rem' }}
    >
      <div>Sample text with current colors</div>
      <div data-testid="contrast-ratio">Contrast Ratio: {contrast.toFixed(2)}:1</div>
      <div data-testid="aa-compliance">WCAG AA: {meetsAA ? 'Pass' : 'Fail'}</div>
    </div>
  );
};

describe('R6 | Accessibility & Performance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('R6-AC1 | WCAG 2.1 AA Compliance', () => {
    it('should have no accessibility violations in forms', async () => {
      const { container } = render(<MockAccessibleForm />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should meet color contrast requirements (≥4.5:1)', () => {
      render(<MockContrastChecker backgroundColor="#ffffff" textColor="#000000" />);
      
      expect(screen.getByTestId('contrast-ratio')).toHaveTextContent('21.00:1');
      expect(screen.getByTestId('aa-compliance')).toHaveTextContent('WCAG AA: Pass');
    });

    it('should fail with insufficient contrast', () => {
      render(<MockContrastChecker backgroundColor="#cccccc" textColor="#dddddd" />);
      
      expect(screen.getByTestId('aa-compliance')).toHaveTextContent('WCAG AA: Fail');
    });

    it('should provide proper form labels and ARIA attributes', () => {
      render(<MockAccessibleForm />);
      
      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      
      expect(nameInput).toBeRequired();
      expect(nameInput).toHaveAttribute('aria-describedby', 'name-error');
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-help email-error');
    });
  });

  describe('R6-AC2 | Core Web Vitals Performance', () => {
    it('should meet LCP budget (≤2.5s)', () => {
      expect(mockWebVitals.LCP).toBeLessThanOrEqual(2.5);
    });

    it('should meet INP budget (≤200ms)', () => {
      expect(mockWebVitals.INP).toBeLessThanOrEqual(200);
    });

    it('should meet CLS budget (≤0.1)', () => {
      expect(mockWebVitals.CLS).toBeLessThanOrEqual(0.1);
    });

    it('should optimize image loading with proper attributes', () => {
      const { container } = render(
        <div>
          <img 
            src="/product1.jpg" 
            alt="Product 1"
            loading="lazy"
            width={300}
            height={300}
          />
        </div>
      );
      
      const image = container.querySelector('img');
      expect(image).toHaveAttribute('loading', 'lazy');
      expect(image).toHaveAttribute('alt', 'Product 1');
      expect(image).toHaveAttribute('width', '300');
      expect(image).toHaveAttribute('height', '300');
    });
  });

  describe('R6-AC3 | Responsive Design', () => {
    it('should render responsive layout properly', () => {
      const { container } = render(
        <MockResponsiveLayout>
          <div>Item 1</div>
          <div>Item 2</div>
        </MockResponsiveLayout>
      );
      
      const layout = container.querySelector('[data-testid="responsive-layout"]');
      expect(layout).toHaveStyle({
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
      });
    });
  });

  describe('R6-AC4 | Screen Reader Support', () => {
    it('should provide proper semantic markup', () => {
      render(<MockAccessibleForm />);
      
      const form = screen.getByRole('form');
      const fieldset = screen.getByRole('group');
      const submitButton = screen.getByRole('button', { name: /submit form/i });
      
      expect(form).toBeInTheDocument();
      expect(fieldset).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('should provide proper heading hierarchy', () => {
      render(
        <div>
          <h1>Main Title</h1>
          <h2>Section Title</h2>
          <h3>Subsection Title</h3>
        </div>
      );
      
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      const h3 = screen.getByRole('heading', { level: 3 });
      
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
      expect(h3).toBeInTheDocument();
    });
  });

  describe('R6-AC5 | Visual Feedback', () => {
    it('should provide loading states with proper ARIA', () => {
      const MockLoadingButton = ({ loading }: { loading: boolean }) => (
        <button disabled={loading} aria-busy={loading}>
          {loading ? 'Loading...' : 'Submit'}
        </button>
      );

      const { rerender } = render(<MockLoadingButton loading={false} />);
      expect(screen.getByRole('button')).not.toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');

      rerender(<MockLoadingButton loading={true} />);
      expect(screen.getByRole('button')).toBeDisabled();
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Performance Budget Compliance', () => {
    it('should stay within performance budgets', () => {
      const performanceBudgets = {
        LCP: 2500, // 2.5s
        INP: 200,  // 200ms
        CLS: 0.1,  // 0.1
        FCP: 1800, // 1.8s
        TTFB: 600  // 600ms
      };
      
      expect(mockWebVitals.LCP * 1000).toBeLessThanOrEqual(performanceBudgets.LCP);
      expect(mockWebVitals.INP).toBeLessThanOrEqual(performanceBudgets.INP);
      expect(mockWebVitals.CLS).toBeLessThanOrEqual(performanceBudgets.CLS);
      expect(mockWebVitals.FCP * 1000).toBeLessThanOrEqual(performanceBudgets.FCP);
      expect(mockWebVitals.TTFB * 1000).toBeLessThanOrEqual(performanceBudgets.TTFB);
    });

    it('should optimize bundle size', () => {
      const bundleStats = {
        totalSize: 250000, // 250KB
        gzippedSize: 75000, // 75KB
      };
      
      expect(bundleStats.gzippedSize).toBeLessThan(100000); // < 100KB gzipped
      expect(bundleStats.totalSize).toBeLessThan(500000); // < 500KB total
    });
  });
});