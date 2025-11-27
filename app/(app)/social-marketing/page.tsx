/**
 * REDIRECT: This page has been moved to /marketing/social
 * 
 * This redirect is maintained for backward compatibility with:
 * - Bookmarked URLs
 * - External links
 * - Old navigation patterns
 * 
 * The social marketing functionality is now part of the Marketing section
 * at /marketing/social for better organization.
 */

import { redirect } from 'next/navigation';

export default function SocialMarketingPage() {
  // Redirect to the new location
  redirect('/marketing/social');
}
