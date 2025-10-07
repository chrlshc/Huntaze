export const dynamic = 'force-dynamic';

import Client from './page.client';

async function getOverview() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/overview`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.json();
}

export default async function AnalyticsModern() {
  const data = await getOverview();
  return <Client data={data} />;
}
