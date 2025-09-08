// Dark homepage - modern black design
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const HomePageDark = nextDynamic(
  () => import('./page-dark').catch((err) => {
    console.error('Failed to load dark homepage, falling back to simple:', err);
    return import('./page-simple');
  }),
  { ssr: false }
);

export default function HomePage() {
  return <HomePageDark />;
}
// Using dark homepage with modern design
