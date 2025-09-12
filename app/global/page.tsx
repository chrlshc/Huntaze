import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Growth | Huntaze',
  description: 'Sell and ship everywhere. Built‑in localization, currencies, and global performance.',
};

export default function GlobalPage() {
  const regions = [
    { name: 'North America', stat: '+182% growth' },
    { name: 'Europe', stat: '+234% growth' },
    { name: 'APAC', stat: '+311% growth' },
    { name: 'LATAM', stat: '+205% growth' },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-blue-600 font-medium mb-3">Global</p>
          <h1 className="text-5xl font-semibold text-gray-900 mb-4">Grow around the world</h1>
          <p className="text-xl text-gray-600 max-w-3xl">Multi‑currency, localization, and CDN‑accelerated performance — built‑in for global scale.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-4">
          {regions.map((r) => (
            <div key={r.name} className="surface rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-900">{r.name}</h3>
              <p className="text-gray-700 mt-2">{r.stat}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="surface rounded-2xl p-6">
            <h4 className="text-lg font-semibold mb-2">Localization</h4>
            <p className="text-gray-700">Languages, formats, and content variants by market.</p>
          </div>
          <div className="surface rounded-2xl p-6">
            <h4 className="text-lg font-semibold mb-2">Payments</h4>
            <p className="text-gray-700">Multi‑currency checkout with fraud prevention and SCA.</p>
          </div>
          <div className="surface rounded-2xl p-6">
            <h4 className="text-lg font-semibold mb-2">Performance</h4>
            <p className="text-gray-700">Global edge delivery for fast loads anywhere.</p>
          </div>
        </div>

        <div className="mt-10 flex gap-3">
          <Link href="/auth" className="btn-primary">Start free</Link>
          <Link href="/support" className="btn-secondary">Talk to us</Link>
        </div>
      </section>
    </div>
  );
}

