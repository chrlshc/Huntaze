// Minimal homepage - clean and modern design
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const HomePageMinimal = nextDynamic(
  () => import('./page-home-en-minimal').catch((err) => {
    console.error('Failed to load minimal homepage, falling back to simple:', err);
    return import('./page-simple');
  }),
  { ssr: false }
);

export default function HomePage() {
  return <HomePageMinimal />;
}
// Using minimal homepage with subtle animations
