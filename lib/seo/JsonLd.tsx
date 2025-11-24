/**
 * JsonLd Component
 * 
 * React component for injecting JSON-LD structured data into the document head.
 * This component should be used in page components to add schema.org markup.
 * 
 * @example
 * ```tsx
 * import { JsonLd, generateOrganizationSchema } from '@/lib/seo';
 * 
 * export default function HomePage() {
 *   const schema = generateOrganizationSchema();
 *   return (
 *     <>
 *       <JsonLd data={schema} />
 *       <main>...</main>
 *     </>
 *   );
 * }
 * ```
 * 
 * @validates Requirements 4.4
 */

import React from 'react';
import type { OrganizationSchema, ProductSchema, WebSiteSchema } from './json-ld';

interface JsonLdProps {
  data: OrganizationSchema | ProductSchema | WebSiteSchema | Record<string, any>;
}

/**
 * Component for injecting JSON-LD structured data
 * 
 * @param props.data - The schema object to inject
 * @returns Script tag with JSON-LD data
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
