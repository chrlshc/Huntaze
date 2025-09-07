// Force new deployment v4 - Premium homepage with animations
// Render premium page purely on client to avoid SSR/hydration errors
import nextDynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export const dynamic = 'force-dynamic';

const PremiumPage = nextDynamic(
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

const OriginalPage = nextDynamic(() => import('./page-original'), { ssr: false });

function HomeChooser() {
  const params = useSearchParams();
  const [locale, setLocale] = useState<'fr' | 'en'>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|; )locale=([^;]+)/);
      if (match) return (decodeURIComponent(match[1]) as 'fr' | 'en');
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
    }
    return 'en';
  });

  useEffect(() => {
    const q = params.get('lang');
    if (q === 'fr' || q === 'en') setLocale(q);
  }, [params]);

  return locale === 'en' ? <OriginalPage /> : <PremiumPage />;
}

export default function HomePage() {
  return <HomeChooser />;
}
// Using premium homepage with all animations
