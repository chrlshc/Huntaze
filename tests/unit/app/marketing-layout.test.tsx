/**
 * Unit Tests for Marketing Layout
 * 
 * Tests that the marketing layout properly injects JSON-LD structured data
 * for SEO optimization.
 * 
 * @validates Requirements 4.4
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import MarketingLayout from '@/app/(marketing)/layout';

describe('Marketing Layout', () => {
  it('should render children', () => {
    const { getByText } = render(
      <MarketingLayout>
        <div>Test Content</div>
      </MarketingLayout>
    );

    expect(getByText('Test Content')).toBeTruthy();
  });

  it('should inject Organization JSON-LD schema', () => {
    const { container } = render(
      <MarketingLayout>
        <div>Test</div>
      </MarketingLayout>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBeGreaterThanOrEqual(1);

    // Find the Organization schema
    const orgScript = Array.from(scripts).find(script => {
      const content = script.textContent || '';
      return content.includes('"@type":"Organization"');
    });

    expect(orgScript).toBeTruthy();
    
    if (orgScript) {
      const schema = JSON.parse(orgScript.textContent || '{}');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Huntaze');
      expect(schema.url).toBe('https://huntaze.com');
    }
  });

  it('should inject WebSite JSON-LD schema', () => {
    const { container } = render(
      <MarketingLayout>
        <div>Test</div>
      </MarketingLayout>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    
    // Find the WebSite schema
    const websiteScript = Array.from(scripts).find(script => {
      const content = script.textContent || '';
      return content.includes('"@type":"WebSite"');
    });

    expect(websiteScript).toBeTruthy();
    
    if (websiteScript) {
      const schema = JSON.parse(websiteScript.textContent || '{}');
      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('Huntaze');
      expect(schema.url).toBe('https://huntaze.com');
    }
  });

  it('should inject both Organization and WebSite schemas', () => {
    const { container } = render(
      <MarketingLayout>
        <div>Test</div>
      </MarketingLayout>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(2);

    const schemas = Array.from(scripts).map(script => 
      JSON.parse(script.textContent || '{}')
    );

    const types = schemas.map(s => s['@type']);
    expect(types).toContain('Organization');
    expect(types).toContain('WebSite');
  });

  it('should generate valid JSON-LD that can be parsed', () => {
    const { container } = render(
      <MarketingLayout>
        <div>Test</div>
      </MarketingLayout>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    
    scripts.forEach(script => {
      const content = script.textContent || '';
      expect(() => JSON.parse(content)).not.toThrow();
    });
  });
});
