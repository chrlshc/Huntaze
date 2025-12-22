/**
 * REDIRECT: This page has been moved to /onlyfans/ppv
 *
 * Backward compatibility for old URLs (/ppv) that now live
 * under the OnlyFans module.
 */

import { redirect } from 'next/navigation';

export default function PPVRedirectPage() {
  redirect('/onlyfans/ppv');
}

