/**
 * Unit Tests for JsonLd Component
 * 
 * Tests the React component that injects JSON-LD structured data
 * into the document.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { JsonLd } from '@/lib/seo/JsonLd';
import { generateOrganizationSchema, generateProductSchema } from '@/lib/seo/json-ld';

describe('JsonLd Component', () => {
  it('should render script tag with type application/ld+json', () => {
    const schema = generateOrganizationSchema();
    const { container } = render(<JsonLd data={schema} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
  });

  it('should render Organization schema as JSON string', () => {
    const schema = generateOrganizationSchema();
    const { container } = render(<JsonLd data={schema} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).toBe(JSON.stringify(schema));
  });

  it('should render Product schema as JSON string', () => {
    const schema = generateProductSchema({
      name: 'Test Product',
      description: 'Test Description',
      price: '99.00',
    });
    const { container } = render(<JsonLd data={schema} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).toBe(JSON.stringify(schema));
  });

  it('should handle custom schema objects', () => {
    const customSchema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'Test Article',
    };
    const { container } = render(<JsonLd data={customSchema} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).toBe(JSON.stringify(customSchema));
  });

  it('should properly escape JSON content', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Test "Company" with quotes',
    };
    const { container } = render(<JsonLd data={schema} />);

    const script = container.querySelector('script[type="application/ld+json"]');
    const content = script?.textContent || '';
    
    // JSON.stringify should properly escape quotes
    expect(content).toContain('\\"Company\\"');
    
    // Verify the JSON is valid and parseable
    expect(() => JSON.parse(content)).not.toThrow();
    const parsed = JSON.parse(content);
    expect(parsed.name).toBe('Test "Company" with quotes');
  });

  it('should render multiple JsonLd components independently', () => {
    const orgSchema = generateOrganizationSchema();
    const productSchema = generateProductSchema({
      name: 'Test',
      description: 'Test',
      price: '99.00',
    });

    const { container } = render(
      <>
        <JsonLd data={orgSchema} />
        <JsonLd data={productSchema} />
      </>
    );

    const scripts = container.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(2);
    expect(scripts[0]?.textContent).toBe(JSON.stringify(orgSchema));
    expect(scripts[1]?.textContent).toBe(JSON.stringify(productSchema));
  });
});
