import type { ReactNode } from 'react';
import { JsonLd, generateOrganizationSchema, generateWebSiteSchema } from '@/lib/seo';

/**
 * Marketing Layout
 * 
 * This layout is for public marketing pages (SEO-first, scrollable).
 * Unlike the (app) layout, this allows traditional scrolling behavior
 * and is optimized for search engine crawling and static generation.
 * 
 * Includes JSON-LD structured data for Organization and WebSite schemas
 * to improve SEO and search engine understanding of the site.
 * 
 * @validates Requirements 4.4
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
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
