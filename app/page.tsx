// Force new deployment v4 - Premium homepage with animations
// Render premium page purely on client to avoid SSR/hydration errors
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const OriginalPage = nextDynamic(
  () => import('./page-original').catch((err) => {
    console.error('Failed to load original homepage, falling back to simple:', err);
    return import('./page-simple');
  }),
  { ssr: false }
);

export default function HomePage() {
  return <OriginalPage />;
}
// Using premium homepage with all animations
