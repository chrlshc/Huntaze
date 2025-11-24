# SEO Utilities

This module provides utilities for SEO optimization through JSON-LD structured data generation.

## Overview

JSON-LD (JavaScript Object Notation for Linked Data) is a method of encoding structured data using JSON. Search engines like Google use this data to better understand your website's content and display rich results in search.

## Features

- ✅ Type-safe schema generation
- ✅ Schema.org compliant markup
- ✅ Organization, Product, and WebSite schemas
- ✅ Built-in validation
- ✅ React component for easy injection

## Usage

### Basic Usage in Marketing Pages

The marketing layout automatically injects Organization and WebSite schemas:

```tsx
// app/(marketing)/layout.tsx
import { JsonLd, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo';

export default function MarketingLayout({ children }) {
  const organizationSchema = generateOrganizationSchema();
  const websiteSchema = generateWebSiteSchema();

  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={websiteSchema} />
      {children}
    </>
  );
}
```

### Adding Product Schema to a Page

```tsx
// app/(marketing)/pricing/page.tsx
import { JsonLd, generateProductSchema } from '@/lib/seo';

export default function PricingPage() {
  const productSchema = generateProductSchema({
    name: 'Huntaze Pro',
    description: 'Premium AI tools for OnlyFans creators',
    price: '99.00',
    image: 'https://huntaze.com/product.png',
    url: 'https://huntaze.com/pricing',
  });

  return (
    <>
      <JsonLd data={productSchema} />
      <main>
        {/* Page content */}
      </main>
    </>
  );
}
```

### Custom Schema

You can also create custom schemas:

```tsx
import { JsonLd } from '@/lib/seo';

const customSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'How to Optimize Your OnlyFans Profile',
  author: {
    '@type': 'Organization',
    name: 'Huntaze',
  },
  datePublished: '2024-01-15',
};

<JsonLd data={customSchema} />
```

## API Reference

### `generateOrganizationSchema()`

Generates Organization schema for Huntaze.

**Returns:** `OrganizationSchema`

**Example:**
```typescript
const schema = generateOrganizationSchema();
// {
//   '@context': 'https://schema.org',
//   '@type': 'Organization',
//   name: 'Huntaze',
//   url: 'https://huntaze.com',
//   ...
// }
```

### `generateProductSchema(product)`

Generates Product schema for a product/service.

**Parameters:**
- `product.name` (string, required) - Product name
- `product.description` (string, required) - Product description
- `product.price` (string, required) - Price as string (e.g., "99.00")
- `product.image` (string, optional) - Product image URL
- `product.availability` (string, optional) - Availability status (defaults to "InStock")
- `product.url` (string, optional) - Product page URL

**Returns:** `ProductSchema`

### `generateWebSiteSchema()`

Generates WebSite schema with search action.

**Returns:** `WebSiteSchema`

### `validateJsonLdSchema(schema)`

Validates a JSON-LD schema structure.

**Parameters:**
- `schema` - The schema object to validate

**Returns:** `boolean` - true if valid, false otherwise

**Example:**
```typescript
const schema = generateOrganizationSchema();
const isValid = validateJsonLdSchema(schema); // true
```

### `<JsonLd data={schema} />`

React component for injecting JSON-LD into the document.

**Props:**
- `data` - The schema object to inject

**Example:**
```tsx
<JsonLd data={generateOrganizationSchema()} />
```

## Schema Types

### OrganizationSchema

Represents your company/brand. Includes:
- Basic info (name, url, logo)
- Social media profiles (sameAs)
- Contact information
- Description

### ProductSchema

Represents a product or service. Includes:
- Product details (name, description, image)
- Brand information
- Pricing and availability
- Optional ratings

### WebSiteSchema

Represents your website. Includes:
- Site information (name, url)
- Search functionality
- Description

## Validation

All generated schemas are validated to ensure they meet schema.org requirements:

```typescript
import { generateOrganizationSchema, validateJsonLdSchema } from '@/lib/seo';

const schema = generateOrganizationSchema();
const isValid = validateJsonLdSchema(schema); // true
```

For comprehensive validation, use external tools:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

## Testing

The module includes comprehensive unit tests:

```bash
# Run all SEO tests
npm test -- tests/unit/lib/seo --run

# Run specific test file
npm test -- tests/unit/lib/seo/json-ld.test.ts --run
```

## Requirements

This implementation satisfies:
- **Requirement 4.4**: JSON-LD injection in production pages
- **Requirement 4.5**: Schema.org validation

## Best Practices

1. **Always validate schemas** before deploying to production
2. **Use semantic types** - Choose the most specific schema type for your content
3. **Keep data accurate** - Ensure schema data matches visible page content
4. **Test with Google** - Use Google's Rich Results Test to verify
5. **Update regularly** - Keep schema data in sync with page updates

## Resources

- [Schema.org Documentation](https://schema.org/)
- [Google Search Central - Structured Data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [JSON-LD Specification](https://json-ld.org/)

## Troubleshooting

### Schema not appearing in search results

1. Verify the schema is valid using Google's Rich Results Test
2. Ensure the schema is only injected in production (not staging)
3. Wait for Google to recrawl your pages (can take days/weeks)

### TypeScript errors

Make sure you're importing from the correct path:
```typescript
import { JsonLd, generateOrganizationSchema } from '@/lib/seo';
```

### Schema validation fails

Check that all required fields are present:
- Organization: name, url
- Product: name, description
- WebSite: name, url
