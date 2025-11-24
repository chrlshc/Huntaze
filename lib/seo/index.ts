/**
 * SEO Utilities
 * 
 * This module provides utilities for SEO optimization including:
 * - JSON-LD structured data generation
 * - Schema.org compliant markup
 * - Type-safe schema interfaces
 * 
 * @module lib/seo
 */

export {
  generateOrganizationSchema,
  generateProductSchema,
  generateWebSiteSchema,
  validateJsonLdSchema,
  type OrganizationSchema,
  type ProductSchema,
  type WebSiteSchema,
} from './json-ld';

export { JsonLd } from './JsonLd';
