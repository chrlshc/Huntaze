/**
 * Unit Tests for JSON-LD Schema Generation
 * 
 * Tests the generation and validation of schema.org compliant JSON-LD
 * structured data for SEO optimization.
 */

import { describe, it, expect } from 'vitest';
import {
  generateOrganizationSchema,
  generateProductSchema,
  generateWebSiteSchema,
  validateJsonLdSchema,
  type OrganizationSchema,
  type ProductSchema,
  type WebSiteSchema,
} from '@/lib/seo/json-ld';

describe('JSON-LD Schema Generation', () => {
  describe('generateOrganizationSchema', () => {
    it('should generate valid Organization schema', () => {
      const schema = generateOrganizationSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema.name).toBe('Huntaze');
      expect(schema.url).toBe('https://huntaze.com');
      expect(schema.logo).toBe('https://huntaze.com/logo.png');
    });

    it('should include social media profiles in sameAs', () => {
      const schema = generateOrganizationSchema();

      expect(schema.sameAs).toBeDefined();
      expect(schema.sameAs).toContain('https://twitter.com/huntaze');
      expect(schema.sameAs).toContain('https://linkedin.com/company/huntaze');
    });

    it('should include contact point information', () => {
      const schema = generateOrganizationSchema();

      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint?.['@type']).toBe('ContactPoint');
      expect(schema.contactPoint?.contactType).toBe('Customer Support');
      expect(schema.contactPoint?.email).toBe('support@huntaze.com');
    });

    it('should include description', () => {
      const schema = generateOrganizationSchema();

      expect(schema.description).toBeDefined();
      expect(schema.description).toContain('AI-powered');
    });
  });

  describe('generateProductSchema', () => {
    it('should generate valid Product schema with required fields', () => {
      const product = {
        name: 'Huntaze Pro',
        description: 'Premium AI tools for creators',
        price: '99.00',
      };

      const schema = generateProductSchema(product);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema.name).toBe(product.name);
      expect(schema.description).toBe(product.description);
    });

    it('should include brand information', () => {
      const product = {
        name: 'Huntaze Pro',
        description: 'Premium AI tools',
        price: '99.00',
      };

      const schema = generateProductSchema(product);

      expect(schema.brand).toBeDefined();
      expect(schema.brand?.['@type']).toBe('Brand');
      expect(schema.brand?.name).toBe('Huntaze');
    });

    it('should include offer information with price and currency', () => {
      const product = {
        name: 'Huntaze Pro',
        description: 'Premium AI tools',
        price: '99.00',
      };

      const schema = generateProductSchema(product);

      expect(schema.offers).toBeDefined();
      expect(schema.offers?.['@type']).toBe('Offer');
      expect(schema.offers?.price).toBe('99.00');
      expect(schema.offers?.priceCurrency).toBe('USD');
    });

    it('should use default availability when not provided', () => {
      const product = {
        name: 'Huntaze Pro',
        description: 'Premium AI tools',
        price: '99.00',
      };

      const schema = generateProductSchema(product);

      expect(schema.offers?.availability).toBe('https://schema.org/InStock');
    });

    it('should use custom availability when provided', () => {
      const product = {
        name: 'Huntaze Pro',
        description: 'Premium AI tools',
        price: '99.00',
        availability: 'https://schema.org/PreOrder',
      };

      const schema = generateProductSchema(product);

      expect(schema.offers?.availability).toBe('https://schema.org/PreOrder');
    });

    it('should include optional image and url', () => {
      const product = {
        name: 'Huntaze Pro',
        description: 'Premium AI tools',
        price: '99.00',
        image: 'https://huntaze.com/product.png',
        url: 'https://huntaze.com/pricing',
      };

      const schema = generateProductSchema(product);

      expect(schema.image).toBe('https://huntaze.com/product.png');
      expect(schema.offers?.url).toBe('https://huntaze.com/pricing');
    });
  });

  describe('generateWebSiteSchema', () => {
    it('should generate valid WebSite schema', () => {
      const schema = generateWebSiteSchema();

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema.name).toBe('Huntaze');
      expect(schema.url).toBe('https://huntaze.com');
    });

    it('should include search action for site search', () => {
      const schema = generateWebSiteSchema();

      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction?.['@type']).toBe('SearchAction');
      expect(schema.potentialAction?.target).toContain('search?q=');
      expect(schema.potentialAction?.['query-input']).toBe('required name=search_term_string');
    });

    it('should include description', () => {
      const schema = generateWebSiteSchema();

      expect(schema.description).toBeDefined();
      expect(schema.description).toContain('AI-powered');
    });
  });

  describe('validateJsonLdSchema', () => {
    it('should validate correct Organization schema', () => {
      const schema = generateOrganizationSchema();
      expect(validateJsonLdSchema(schema)).toBe(true);
    });

    it('should validate correct Product schema', () => {
      const schema = generateProductSchema({
        name: 'Test Product',
        description: 'Test Description',
        price: '99.00',
      });
      expect(validateJsonLdSchema(schema)).toBe(true);
    });

    it('should validate correct WebSite schema', () => {
      const schema = generateWebSiteSchema();
      expect(validateJsonLdSchema(schema)).toBe(true);
    });

    it('should reject schema without @context', () => {
      const invalidSchema = {
        '@type': 'Organization',
        name: 'Test',
        url: 'https://test.com',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject schema with wrong @context', () => {
      const invalidSchema = {
        '@context': 'https://wrong.com',
        '@type': 'Organization',
        name: 'Test',
        url: 'https://test.com',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject schema without @type', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        name: 'Test',
        url: 'https://test.com',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject Organization schema without required name', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        url: 'https://test.com',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject Organization schema without required url', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject Product schema without required name', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        description: 'Test',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject Product schema without required description', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject WebSite schema without required name', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        url: 'https://test.com',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject WebSite schema without required url', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Test',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });

    it('should reject schema with unknown type', () => {
      const invalidSchema = {
        '@context': 'https://schema.org',
        '@type': 'UnknownType',
        name: 'Test',
      } as any;

      expect(validateJsonLdSchema(invalidSchema)).toBe(false);
    });
  });

  describe('Schema Structure', () => {
    it('should generate JSON-serializable schemas', () => {
      const orgSchema = generateOrganizationSchema();
      const productSchema = generateProductSchema({
        name: 'Test',
        description: 'Test',
        price: '99.00',
      });
      const websiteSchema = generateWebSiteSchema();

      expect(() => JSON.stringify(orgSchema)).not.toThrow();
      expect(() => JSON.stringify(productSchema)).not.toThrow();
      expect(() => JSON.stringify(websiteSchema)).not.toThrow();
    });

    it('should generate valid JSON without circular references', () => {
      const schema = generateOrganizationSchema();
      const json = JSON.stringify(schema);
      const parsed = JSON.parse(json);

      expect(parsed).toEqual(schema);
    });
  });
});
