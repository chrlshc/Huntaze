import { createIngestToken } from '@/lib/bridgeTokens';
import { getServerSession } from '@/lib/auth';
import Client from './Client';

export default async function OfConnectPage() {
  const session = await getServerSession().catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  let metaContent = '';
  if (userId) {
    const ingestToken = await createIngestToken({ userId });
    const base = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_ORIGIN || '';
    const apiBase = (base || '').replace(/\/$/, '');
    metaContent = JSON.stringify({ userId, apiBase, ingestToken });
  }

  return (
    <>
      {metaContent ? <meta name="of-bridge" content={metaContent} /> : null}
      <Client />
    </>
  );
}
