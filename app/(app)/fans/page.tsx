/**
 * REDIRECT: This page has been moved to /onlyfans/fans
 *
 * Backward compatibility for old URLs (/fans) that now live
 * under the OnlyFans module.
 */

import { redirect } from 'next/navigation';

export default function FansPage() {
  redirect('/onlyfans/fans');
}
