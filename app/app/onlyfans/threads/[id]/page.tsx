export const dynamic = 'force-dynamic';

import ThreadView from './thread-view';

async function getInitial(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/of/threads/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function Page({ params }: { params: { id: string } }) {
  const initial = await getInitial(params.id);
  return <ThreadView threadId={params.id} initial={initial} />;
}

