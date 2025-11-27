/**
 * REDIRECT: This page has been moved to /onlyfans/messages
 * 
 * This redirect is maintained for backward compatibility with:
 * - Bookmarked URLs
 * - External links
 * - Old navigation patterns
 * 
 * The messages functionality is now part of the OnlyFans section.
 */

import { redirect } from 'next/navigation';

export default function MessagesPage() {
  // Redirect to the new location
  redirect('/onlyfans/messages');
}
