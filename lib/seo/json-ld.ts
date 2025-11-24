/**
 * JSON-LD Schema Generation Utilities
 * 
 * This module provides type-safe utilities for generating structured data
 * (JSON-LD) that complies with schema.org specifications for SEO optimization.
 * 
 * @see https://schema.org/
 * @see Requirements 4.4, 4.5
 */

/**
 * Organization schema for representing the company/brand
 * @see https://schema.org/Organization
 */
export interface OrganizationSchema {
  '@context': 'https://schema.org';
  '@type': 'Organization';
  name: string;
  url: string;
  logo: string;
  sameAs?: string[]; // Social media profiles
  description?: string;
  foundingDate?: string;
  contactPoint?: {
    '@type': 'ContactPoint';
    telephone?: string;
    contactType: string;
    email?: string;
  };
}

/**
 * Product schema for representing products/services
 * @see https://schema.org/Product
 */
export interface ProductSchema {
  '@context': 'https://schema.org';
  '@type': 'Product';
  name: string;
  description: string;
  image?: string;
  brand?: {
    '@type': 'Brand';
    name: string;
  };
  offers?: {
    '@type': 'Offer';
    price: string;
    priceCurrency: string;
    availability?: string;
    url?: string;
  };
  aggregateRating?: {
    '@type': 'AggregateRating';
    ratingValue: string;
    reviewCount: string;
  };
}

/**
 * WebSite schema for representing the website
 * @see https://schema.org/WebSite
 */
export interface WebSiteSchema {
  '@context': 'https://schema.org';
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': 'SearchAction';
    target: string;
    'query-input': string;
  };
}

/**
 * Generate Organization schema for Huntaze
 * 
 * @returns OrganizationSchema compliant with schema.org
 * @validates Requirements 4.4
 */
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Huntaze',
    url: 'https://huntaze.com',
    logo: 'https://huntaze.com/logo.png',
    description: 'AI-powered platform for OnlyFans creators to manage content, engage fans, and optimize revenue',
    sameAs: [
      'https://twitter.com/huntaze',
      'https://linkedin.com/company/huntaze',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@huntaze.com',
    },
  };
}

/**
 * Generate Product schema for a specific product/service
 * 
 * @param product - Product details
 * @returns ProductSchema compliant with schema.org
 * @validates Requirements 4.4
 */
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: string;
  image?: string;
  availability?: string;
  url?: string;
}): ProductSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    brand: {
      '@type': 'Brand',
      name: 'Huntaze',
    },
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'USD',
      availability: product.availability || 'https://schema.org/InStock',
      url: product.url,
    },
  };
}

/**
 * Generate WebSite schema for the main site
 * 
 * @returns WebSiteSchema compliant with schema.org
 */
export function generateWebSiteSchema(): WebSiteSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Huntaze',
    url: 'https://huntaze.com',
    description: 'AI-powered platform for OnlyFans creators',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://huntaze.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Validate JSON-LD schema structure
 * 
 * Basic validation to ensure required fields are present.
 * For comprehensive validation, use external tools like Google's Structured Data Testing Tool.
 * 
 * @param schema - The schema object to validate
 * @returns true if valid, false otherwise
 * @validates Requirements 4.5
 */
export function validateJsonLdSchema(
  schema: OrganizationSchema | ProductSchema | WebSiteSchema
): boolean {
  // Check required fields
  if (!schema['@context'] || schema['@context'] !== 'https://schema.org') {
    return false;
  }

  if (!schema['@type']) {
    return false;
  }

  // Type-specific validation
  switch (schema['@type']) {
    case 'Organization':
      const org = schema as OrganizationSchema;
      return !!(org.name && org.url);

    case 'Product':
      const product = schema as ProductSchema;
      return !!(product.name && product.description);

    case 'WebSite':
      const website = schema as WebSiteSchema;
      return !!(website.name && website.url);

    default:
      return false;
  }
}
