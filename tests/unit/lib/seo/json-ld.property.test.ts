/**
 * Property-Based Tests for JSON-LD Schema Validation
 * 
 * Tests universal properties that should hold for JSON-LD schema generation
 * using fast-check for property-based testing.
 * 
 * Feature: mobile-ux-marketing-refactor
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  generateOrganizationSchema,
  generateProductSchema,
  generateWebSiteSchema,
  validateJsonLdSchema,
  type OrganizationSchema,
  type ProductSchema,
  type WebSiteSchema,
} from '@/lib/seo/json-ld';

describe('JSON-LD Schema Property Tests', () => {
  /**
   * Property 16: JSON-LD schema validation
   * 
   * For any generated JSON-LD data, it should validate successfully against
   * schema.org specifications for Organization or Product schemas
   * 
   * Validates: Requirements 4.5
   * 
   * Feature: mobile-ux-marketing-refactor, Property 16: JSON-LD schema validation
   */
  describe('Property 16: JSON-LD schema validation', () => {
    it('should generate valid Organization schema for any invocation', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random number of invocations
          fc.integer({ min: 1, max: 10 }),
          async (invocations) => {
            // Generate schema multiple times
            for (let i = 0; i < invocations; i++) {
              const schema = generateOrganizationSchema();
              
              // Verify schema is valid
              expect(
                validateJsonLdSchema(schema),
                'Organization schema should be valid'
              ).toBe(true);

              // Verify required fields
              expect(schema['@context']).toBe('https://schema.org');
              expect(schema['@type']).toBe('Organization');
              expect(schema.name).toBeTruthy();
              expect(schema.url).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid Product schema for any product data', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random product data
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.integer({ min: 1, max: 999999 }).map(n => (n / 100).toFixed(2)),
          async (name, description, price) => {
            const product = { name, description, price };
            const schema = generateProductSchema(product);
            
            // Verify schema is valid
            expect(
              validateJsonLdSchema(schema),
              'Product schema should be valid'
            ).toBe(true);

            // Verify required fields
            expect(schema['@context']).toBe('https://schema.org');
            expect(schema['@type']).toBe('Product');
            expect(schema.name).toBe(name);
            expect(schema.description).toBe(description);
            expect(schema.offers?.price).toBe(price);
            expect(schema.offers?.priceCurrency).toBe('USD');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid WebSite schema for any invocation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (invocations) => {
            for (let i = 0; i < invocations; i++) {
              const schema = generateWebSiteSchema();
              
              // Verify schema is valid
              expect(
                validateJsonLdSchema(schema),
                'WebSite schema should be valid'
              ).toBe(true);

              // Verify required fields
              expect(schema['@context']).toBe('https://schema.org');
              expect(schema['@type']).toBe('WebSite');
              expect(schema.name).toBeTruthy();
              expect(schema.url).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any schema without @context', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (type, name) => {
            const invalidSchema = {
              '@type': type,
              name: name,
              url: 'https://example.com',
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'Schema without @context should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any schema with wrong @context', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          fc.constantFrom('Organization', 'Product', 'WebSite'),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (wrongContext, type, name) => {
            // Ensure it's not the correct context
            fc.pre(wrongContext !== 'https://schema.org');

            const invalidSchema = {
              '@context': wrongContext,
              '@type': type,
              name: name,
              url: 'https://example.com',
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'Schema with wrong @context should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any schema without @type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.webUrl(),
          async (name, url) => {
            const invalidSchema = {
              '@context': 'https://schema.org',
              name: name,
              url: url,
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'Schema without @type should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject Organization schema without required name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          async (url) => {
            const invalidSchema = {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              url: url,
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'Organization without name should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject Organization schema without required url', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (name) => {
            const invalidSchema = {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: name,
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'Organization without url should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject Product schema without required name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 500 }),
          async (description) => {
            const invalidSchema = {
              '@context': 'https://schema.org',
              '@type': 'Product',
              description: description,
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'Product without name should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject Product schema without required description', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (name) => {
            const invalidSchema = {
              '@context': 'https://schema.org',
              '@type': 'Product',
              name: name,
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'Product without description should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject WebSite schema without required name', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.webUrl(),
          async (url) => {
            const invalidSchema = {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              url: url,
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'WebSite without name should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject WebSite schema without required url', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          async (name) => {
            const invalidSchema = {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: name,
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'WebSite without url should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject any schema with unknown type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
            !['Organization', 'Product', 'WebSite'].includes(s)
          ),
          fc.string({ minLength: 1, maxLength: 100 }),
          async (unknownType, name) => {
            const invalidSchema = {
              '@context': 'https://schema.org',
              '@type': unknownType,
              name: name,
              url: 'https://example.com',
            } as any;

            expect(
              validateJsonLdSchema(invalidSchema),
              'Schema with unknown type should be invalid'
            ).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate JSON-serializable schemas for any product', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.integer({ min: 1, max: 999999 }).map(n => (n / 100).toFixed(2)),
          async (name, description, price) => {
            const product = { name, description, price };
            const schema = generateProductSchema(product);

            // Should be JSON-serializable
            expect(() => JSON.stringify(schema)).not.toThrow();

            // Should round-trip correctly
            const json = JSON.stringify(schema);
            const parsed = JSON.parse(json);
            expect(parsed).toEqual(schema);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have consistent schema structure across multiple generations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 2, max: 10 }),
          async (count) => {
            // Generate multiple Organization schemas
            const schemas = Array.from({ length: count }, () => 
              generateOrganizationSchema()
            );

            // All schemas should have the same structure
            for (let i = 1; i < schemas.length; i++) {
              expect(schemas[i]).toEqual(schemas[0]);
            }

            // All should be valid
            for (const schema of schemas) {
              expect(validateJsonLdSchema(schema)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include brand information in any Product schema', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.integer({ min: 1, max: 999999 }).map(n => (n / 100).toFixed(2)),
          async (name, description, price) => {
            const product = { name, description, price };
            const schema = generateProductSchema(product);

            // Should include brand
            expect(schema.brand).toBeDefined();
            expect(schema.brand?.['@type']).toBe('Brand');
            expect(schema.brand?.name).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include offer information in any Product schema', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.integer({ min: 1, max: 999999 }).map(n => (n / 100).toFixed(2)),
          async (name, description, price) => {
            const product = { name, description, price };
            const schema = generateProductSchema(product);

            // Should include offer
            expect(schema.offers).toBeDefined();
            expect(schema.offers?.['@type']).toBe('Offer');
            expect(schema.offers?.price).toBe(price);
            expect(schema.offers?.priceCurrency).toBe('USD');
            expect(schema.offers?.availability).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include social profiles in any Organization schema', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (invocations) => {
            for (let i = 0; i < invocations; i++) {
              const schema = generateOrganizationSchema();

              // Should include sameAs with social profiles
              expect(schema.sameAs).toBeDefined();
              expect(Array.isArray(schema.sameAs)).toBe(true);
              expect(schema.sameAs!.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include search action in any WebSite schema', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }),
          async (invocations) => {
            for (let i = 0; i < invocations; i++) {
              const schema = generateWebSiteSchema();

              // Should include potentialAction for search
              expect(schema.potentialAction).toBeDefined();
              expect(schema.potentialAction?.['@type']).toBe('SearchAction');
              expect(schema.potentialAction?.target).toBeTruthy();
              expect(schema.potentialAction?.['query-input']).toBeTruthy();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle optional product fields correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }),
          fc.string({ minLength: 10, maxLength: 500 }),
          fc.integer({ min: 1, max: 999999 }).map(n => (n / 100).toFixed(2)),
          fc.option(fc.webUrl()),
          fc.option(fc.webUrl()),
          async (name, description, price, image, url) => {
            const product: any = { name, description, price };
            if (image) product.image = image;
            if (url) product.url = url;

            const schema = generateProductSchema(product);

            // Should be valid regardless of optional fields
            expect(validateJsonLdSchema(schema)).toBe(true);

            // Optional fields should be included if provided
            if (image) {
              expect(schema.image).toBe(image);
            }
            if (url) {
              expect(schema.offers?.url).toBe(url);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not have circular references in any schema', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom(
            () => generateOrganizationSchema(),
            () => generateProductSchema({ name: 'Test', description: 'Test', price: '99.00' }),
            () => generateWebSiteSchema()
          ),
          async (schemaGenerator) => {
            const schema = schemaGenerator();

            // Should be JSON-serializable (no circular refs)
            expect(() => JSON.stringify(schema)).not.toThrow();

            // Should round-trip correctly
            const json = JSON.stringify(schema);
            const parsed = JSON.parse(json);
            expect(parsed).toEqual(schema);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
