// Force new deployment v4 - Premium homepage with animations
// Render premium page purely on client to avoid SSR/hydration errors
import nextDynamic from 'next/dynamic';

export const dynamic = 'force-dynamic';

const HomePagePremium = nextDynamic(
  () => import('./page-premium').catch((err) => {
    console.error('Failed to load premium homepage, falling back to simple:', err);
    return import('./page-simple');
  }),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
          <p className="mt-4 text-gray-300">Chargement de l’expérience premium…</p>
        </div>
      </div>
  ),
});

export default function HomePage() {
  return (
    <>
      <div style={{ background: 'red', color: 'white', padding: '10px', textAlign: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        🚀 PREMIUM VERSION DEPLOYED - {new Date().toISOString()}
      </div>
      <HomePagePremium />
    </>
  );
}
// Using premium homepage with all animations
