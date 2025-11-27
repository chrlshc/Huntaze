/**
 * REDIRECT: This page has been moved to /marketing
 * 
 * This redirect is maintained for backward compatibility with:
 * - Bookmarked URLs
 * - External links
 * - Old navigation patterns
 * 
 * The integrations functionality is now part of the Marketing section,
 * with detailed management available at /marketing/social
 */

import { redirect } from 'next/navigation';

export default function IntegrationsPage() {
  // Redirect to the new location
  redirect('/marketing');
}
