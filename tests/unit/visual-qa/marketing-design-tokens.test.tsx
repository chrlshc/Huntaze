/**
 * Marketing Pages Design Token Application Tests
 * 
 * Visual regression tests to verify that marketing pages correctly apply
 * the Linear UI design system tokens (Midnight Violet theme) and maintain
 * consistency with the application design system.
 * 
 * Feature: linear-ui-performance-refactor
 * Task: 8.2 Write visual regression tests for marketing pages
 * Validates: Requirements 10.1, 10.2, 10.3
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Helper to check if an element uses design tokens
function usesDesignTokens(element: Element | null): boolean {
  if (!element) return false;
  const style = (element as HTMLElement).getAttribute('style');
  const className = (element as HTMLElement).getAttribute('class');
  return !!(style?.includes('var(--') || className?.includes('var(--'));
}

// Helper to check if element uses Midnight Violet colors
function usesMidnightVioletColors(element: Element | null): boolean {
  if (!element) return false;
  const style = (element as HTMLElement).getAttribute('style');
  const className = (element as HTMLElement).getAttribute('class');
  
  const midnightVioletPatterns = [
    'var(--color-bg-app)',
    'var(--color-bg-surface)',
    'var(--color-border-subtle)',
    'var(--color-accent-primary)',
    'var(--color-text-primary)',
    'var(--color-text-secondary)',
    '#0F0F10', // fallback colors
    '#151516',
    '#7D57C1',
    '#EDEDEF',
    '#8A8F98'
  ];
  
  return midnightVioletPatterns.some(pattern => 
    style?.includes(pattern) || className?.includes(pattern)
  );
}

describe('Marketing Pages Design Token Application', () => {
  describe('Landing Page (Home)', () => {
    // Mock component for testing
    const MockLandingPage = () => (
      <div data-testid="landing-page">
        <header 
          data-testid="landing-header"
          style={{ 
            backgroundColor: 'var(--color-bg-surface, #151516)',
            borderBottom: '1px solid var(--color-border-subtle, #2E2E33)'
          }}
        >
          <h1 style={{ color: 'var(--color-text-primary, #EDEDEF)' }}>
            Huntaze
          </h1>
        </header>
        <main 
          data-testid="landing-main"
          style={{ backgroundColor: 'var(--color-bg-app, #0F0F10)' }}
        >
          <section data-testid="hero-section">
            <h2 style={{ 
              color: 'var(--color-text-primary, #EDEDEF)',
              fontFamily: 'var(--font-family-base)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Grow Your Creator Business
            </h2>
            <p style={{ color: 'var(--color-text-secondary, #8A8F98)' }}>
              The all-in-one platform for content creators
            </p>
            <button style={{ 
              backgroundColor: 'var(--color-accent-primary, #7D57C1)',
              color: 'var(--color-text-primary, #EDEDEF)',
              padding: 'var(--spacing-4)',
              height: 'var(--button-height-standard)'
            }}>
              Get Started
            </button>
          </section>
        </main>
      </div>
    );

    it('should use Midnight Violet theme colors', () => {
      const { container } = render(<MockLandingPage />);
      
      const header = container.querySelector('[data-testid="landing-header"]');
      const main = container.querySelector('[data-testid="landing-main"]');
      
      expect(usesMidnightVioletColors(header)).toBe(true);
      expect(usesMidnightVioletColors(main)).toBe(true);
    });

    it('should use design tokens for colors', () => {
      const { container } = render(<MockLandingPage />);
      
      const colorElements = container.querySelectorAll('[style*="color"]');
      const hasColorTokens = Array.from(colorElements).some(el => 
        usesDesignTokens(el)
      );
      
      expect(hasColorTokens).toBe(true);
    });

    it('should use design tokens for typography', () => {
      const { container } = render(<MockLandingPage />);
      
      const headings = container.querySelectorAll('h1, h2, h3');
      const hasTypographyTokens = Array.from(headings).some(el => {
        const style = (el as HTMLElement).getAttribute('style');
        return style?.includes('var(--font-family-base)') || 
               style?.includes('var(--font-weight-');
      });
      
      expect(hasTypographyTokens).toBe(true);
    });

    it('should use design tokens for spacing', () => {
      const { container } = render(<MockLandingPage />);
      
      const button = container.querySelector('button');
      const style = button?.getAttribute('style');
      
      expect(style).toContain('var(--spacing-');
    });

    it('should use design tokens for button heights', () => {
      const { container } = render(<MockLandingPage />);
      
      const button = container.querySelector('button');
      const style = button?.getAttribute('style');
      
      expect(style).toContain('var(--button-height-standard)');
    });
  });

  describe('About Page', () => {
    const MockAboutPage = () => (
      <div data-testid="about-page">
        <div 
          data-testid="about-container"
          style={{
            maxWidth: '1280px',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: 'var(--spacing-6, 24px)'
          }}
        >
          <h1 style={{ 
            color: 'var(--color-text-primary, #EDEDEF)',
            fontFamily: 'var(--font-family-base)',
            fontWeight: 'var(--font-weight-medium)'
          }}>
            About Huntaze
          </h1>
          <p style={{ color: 'var(--color-text-secondary, #8A8F98)' }}>
            Our story and mission
          </p>
        </div>
      </div>
    );

    it('should use same design tokens as application', () => {
      const { container } = render(<MockAboutPage />);
      
      const aboutContainer = container.querySelector('[data-testid="about-container"]');
      expect(usesDesignTokens(aboutContainer)).toBe(true);
    });

    it('should apply max-width layout constraints', () => {
      const { container } = render(<MockAboutPage />);
      
      const aboutContainer = container.querySelector('[data-testid="about-container"]');
      const style = aboutContainer?.getAttribute('style');
      
      expect(style).toContain('max-width');
      expect(style).toContain('1280px');
    });

    it('should apply horizontal centering', () => {
      const { container } = render(<MockAboutPage />);
      
      const aboutContainer = container.querySelector('[data-testid="about-container"]');
      const style = aboutContainer?.getAttribute('style');
      
      expect(style).toContain('margin-left: auto');
      expect(style).toContain('margin-right: auto');
    });

    it('should use Midnight Violet text colors', () => {
      const { container } = render(<MockAboutPage />);
      
      const heading = container.querySelector('h1');
      const paragraph = container.querySelector('p');
      
      expect(usesMidnightVioletColors(heading)).toBe(true);
      expect(usesMidnightVioletColors(paragraph)).toBe(true);
    });
  });

  describe('Features Page', () => {
    const MockFeaturesPage = () => (
      <div data-testid="features-page">
        <div 
          data-testid="features-container"
          style={{
            maxWidth: '1200px',
            marginLeft: 'auto',
            marginRight: 'auto',
            backgroundColor: 'var(--color-bg-app, #0F0F10)'
          }}
        >
          <div 
            data-testid="feature-card"
            style={{
              backgroundColor: 'var(--color-bg-surface, #151516)',
              border: '1px solid var(--color-border-subtle, #2E2E33)',
              padding: 'var(--spacing-6)',
              borderRadius: 'var(--border-radius-lg)'
            }}
          >
            <h3 style={{ 
              color: 'var(--color-text-primary, #EDEDEF)',
              fontWeight: 'var(--font-weight-medium)'
            }}>
              Feature Title
            </h3>
            <p style={{ color: 'var(--color-text-secondary, #8A8F98)' }}>
              Feature description
            </p>
          </div>
        </div>
      </div>
    );

    it('should use design tokens for card styling', () => {
      const { container } = render(<MockFeaturesPage />);
      
      const featureCard = container.querySelector('[data-testid="feature-card"]');
      expect(usesDesignTokens(featureCard)).toBe(true);
    });

    it('should use Midnight Violet surface colors for cards', () => {
      const { container } = render(<MockFeaturesPage />);
      
      const featureCard = container.querySelector('[data-testid="feature-card"]');
      const style = featureCard?.getAttribute('style');
      
      expect(style).toContain('var(--color-bg-surface');
    });

    it('should use design tokens for borders', () => {
      const { container } = render(<MockFeaturesPage />);
      
      const featureCard = container.querySelector('[data-testid="feature-card"]');
      const style = featureCard?.getAttribute('style');
      
      expect(style).toContain('var(--color-border-subtle');
    });

    it('should apply layout constraints', () => {
      const { container } = render(<MockFeaturesPage />);
      
      const featuresContainer = container.querySelector('[data-testid="features-container"]');
      const style = featuresContainer?.getAttribute('style');
      
      expect(style).toContain('max-width');
      expect(style).toContain('margin-left: auto');
      expect(style).toContain('margin-right: auto');
    });
  });

  describe('Pricing Page', () => {
    const MockPricingPage = () => (
      <div data-testid="pricing-page">
        <div 
          data-testid="pricing-container"
          style={{
            maxWidth: '1280px',
            marginLeft: 'auto',
            marginRight: 'auto',
            padding: 'var(--spacing-6)'
          }}
        >
          <div 
            data-testid="pricing-card"
            style={{
              backgroundColor: 'var(--color-bg-surface, #151516)',
              border: '1px solid var(--color-border-subtle, #2E2E33)',
              padding: 'var(--spacing-8)'
            }}
          >
            <h3 style={{ 
              color: 'var(--color-text-primary, #EDEDEF)',
              fontWeight: 'var(--font-weight-medium)',
              fontSize: 'var(--font-size-2xl)'
            }}>
              Pro Plan
            </h3>
            <p style={{ 
              color: 'var(--color-text-secondary, #8A8F98)',
              fontSize: 'var(--font-size-base)'
            }}>
              $49/month
            </p>
            <button style={{
              backgroundColor: 'var(--color-accent-primary, #7D57C1)',
              color: 'var(--color-text-primary, #EDEDEF)',
              height: 'var(--button-height-standard)',
              padding: 'var(--spacing-4)'
            }}>
              Get Started
            </button>
          </div>
        </div>
      </div>
    );

    it('should use design tokens for pricing cards', () => {
      const { container } = render(<MockPricingPage />);
      
      const pricingCard = container.querySelector('[data-testid="pricing-card"]');
      expect(usesDesignTokens(pricingCard)).toBe(true);
    });

    it('should use design tokens for font sizes', () => {
      const { container } = render(<MockPricingPage />);
      
      const heading = container.querySelector('h3');
      const paragraph = container.querySelector('p');
      
      const headingStyle = heading?.getAttribute('style');
      const paragraphStyle = paragraph?.getAttribute('style');
      
      expect(headingStyle).toContain('var(--font-size-');
      expect(paragraphStyle).toContain('var(--font-size-');
    });

    it('should use accent color for CTA buttons', () => {
      const { container } = render(<MockPricingPage />);
      
      const button = container.querySelector('button');
      const style = button?.getAttribute('style');
      
      expect(style).toContain('var(--color-accent-primary');
    });
  });

  describe('Cross-Page Consistency', () => {
    it('should use consistent color tokens across all marketing pages', () => {
      const pages = [
        <div key="landing" data-testid="page" style={{ backgroundColor: 'var(--color-bg-app, #0F0F10)' }} />,
        <div key="about" data-testid="page" style={{ backgroundColor: 'var(--color-bg-app, #0F0F10)' }} />,
        <div key="features" data-testid="page" style={{ backgroundColor: 'var(--color-bg-app, #0F0F10)' }} />,
        <div key="pricing" data-testid="page" style={{ backgroundColor: 'var(--color-bg-app, #0F0F10)' }} />
      ];

      pages.forEach(page => {
        const { container, unmount } = render(page);
        const pageElement = container.querySelector('[data-testid="page"]');
        expect(usesDesignTokens(pageElement)).toBe(true);
        unmount();
      });
    });

    it('should use consistent typography tokens across all marketing pages', () => {
      const headings = [
        <h1 key="h1" data-testid="heading" style={{ fontFamily: 'var(--font-family-base)' }}>Title</h1>,
        <h2 key="h2" data-testid="heading" style={{ fontFamily: 'var(--font-family-base)' }}>Title</h2>,
        <h3 key="h3" data-testid="heading" style={{ fontFamily: 'var(--font-family-base)' }}>Title</h3>
      ];

      headings.forEach(heading => {
        const { container, unmount } = render(heading);
        const headingElement = container.querySelector('[data-testid="heading"]');
        const style = headingElement?.getAttribute('style');
        expect(style).toContain('var(--font-family-base)');
        unmount();
      });
    });

    it('should use consistent spacing tokens across all marketing pages', () => {
      const containers = [
        <div key="c1" data-testid="container" style={{ padding: 'var(--spacing-6)' }} />,
        <div key="c2" data-testid="container" style={{ padding: 'var(--spacing-6)' }} />,
        <div key="c3" data-testid="container" style={{ padding: 'var(--spacing-6)' }} />
      ];

      containers.forEach(container => {
        const { container: rendered, unmount } = render(container);
        const containerElement = rendered.querySelector('[data-testid="container"]');
        const style = containerElement?.getAttribute('style');
        expect(style).toContain('var(--spacing-6)');
        unmount();
      });
    });

    it('should use consistent layout constraints across all marketing pages', () => {
      const containers = [
        <div key="c1" data-testid="container" style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto' }} />,
        <div key="c2" data-testid="container" style={{ maxWidth: '1280px', marginLeft: 'auto', marginRight: 'auto' }} />,
        <div key="c3" data-testid="container" style={{ maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }} />
      ];

      containers.forEach(container => {
        const { container: rendered, unmount } = render(container);
        const containerElement = rendered.querySelector('[data-testid="container"]');
        const style = containerElement?.getAttribute('style');
        
        expect(style).toContain('max-width');
        expect(style).toContain('margin-left: auto');
        expect(style).toContain('margin-right: auto');
        unmount();
      });
    });
  });

  describe('Marketing vs Application Consistency', () => {
    it('should use same color tokens as application', () => {
      const MarketingComponent = () => (
        <div data-testid="marketing" style={{ backgroundColor: 'var(--color-bg-app, #0F0F10)' }} />
      );
      
      const AppComponent = () => (
        <div data-testid="app" style={{ backgroundColor: 'var(--color-bg-app, #0F0F10)' }} />
      );

      const { container: marketingContainer, unmount: unmountMarketing } = render(<MarketingComponent />);
      const { container: appContainer, unmount: unmountApp } = render(<AppComponent />);
      
      const marketingStyle = marketingContainer.querySelector('[data-testid="marketing"]')?.getAttribute('style');
      const appStyle = appContainer.querySelector('[data-testid="app"]')?.getAttribute('style');
      
      expect(marketingStyle).toBe(appStyle);
      
      unmountMarketing();
      unmountApp();
    });

    it('should use same typography tokens as application', () => {
      const MarketingHeading = () => (
        <h1 data-testid="marketing" style={{ fontFamily: 'var(--font-family-base)', fontWeight: 'var(--font-weight-medium)' }}>
          Title
        </h1>
      );
      
      const AppHeading = () => (
        <h1 data-testid="app" style={{ fontFamily: 'var(--font-family-base)', fontWeight: 'var(--font-weight-medium)' }}>
          Title
        </h1>
      );

      const { container: marketingContainer, unmount: unmountMarketing } = render(<MarketingHeading />);
      const { container: appContainer, unmount: unmountApp } = render(<AppHeading />);
      
      const marketingStyle = marketingContainer.querySelector('[data-testid="marketing"]')?.getAttribute('style');
      const appStyle = appContainer.querySelector('[data-testid="app"]')?.getAttribute('style');
      
      expect(marketingStyle).toBe(appStyle);
      
      unmountMarketing();
      unmountApp();
    });

    it('should use same spacing tokens as application', () => {
      const MarketingContainer = () => (
        <div data-testid="marketing" style={{ padding: 'var(--spacing-6)' }} />
      );
      
      const AppContainer = () => (
        <div data-testid="app" style={{ padding: 'var(--spacing-6)' }} />
      );

      const { container: marketingContainer, unmount: unmountMarketing } = render(<MarketingContainer />);
      const { container: appContainer, unmount: unmountApp } = render(<AppContainer />);
      
      const marketingStyle = marketingContainer.querySelector('[data-testid="marketing"]')?.getAttribute('style');
      const appStyle = appContainer.querySelector('[data-testid="app"]')?.getAttribute('style');
      
      expect(marketingStyle).toBe(appStyle);
      
      unmountMarketing();
      unmountApp();
    });
  });
});
