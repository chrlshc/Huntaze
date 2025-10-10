import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Use the product analytics (charts) page
export default function AnalyticsAlias() {
  redirect('/app/app/analytics');
}
