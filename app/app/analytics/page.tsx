export const revalidate = 60;

import Client from './page.client';

async function getOverview() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/analytics/overview`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Upstream ${res.status}`);
  return res.json();
}

export default async function AnalyticsModern() {
  const data = await getOverview();
  return <Client data={data} />;
}
