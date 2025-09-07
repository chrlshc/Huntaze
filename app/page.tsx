// Force new deployment v4 - Premium homepage with animations
// Render premium page purely on client to avoid SSR/hydration errors
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const CombinedEN = nextDynamic(
  () => import('./page-home-en').catch((err) => {
    console.error('Failed to load combined homepage, falling back to simple:', err);
    return import('./page-simple');
  }),
  { ssr: false }
);

export default function HomePage() {
  return <CombinedEN />;
}
// Using premium homepage with all animations
