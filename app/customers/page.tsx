import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Your Customers | Huntaze',
  description: 'Reach the right customers for less with targeting, experiments, and retention built in.',
};

export default function CustomersPage() {
  const blocks = [
    {
      title: 'Acquire smarter',
      points: [
        'Audience lookalikes and interest maps',
        'Auto‑UTM, cohorts, and attribution',
        'Campaign templates by platform',
      ],
    },
    {
      title: 'Convert better',
      points: [
        'A/B offers and pricing experiments',
        'Fast landing with social proof',
        'Post‑click analytics and drop‑off fixes',
      ],
    },
    {
      title: 'Retain longer',
      points: [
        'Lifecycle automations and win‑backs',
        'VIP segments and upsell flows',
        'Churn risk alerts and playbooks',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white" style={{ backgroundColor: 'white' }}>
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-blue-600 font-medium mb-3">Growth</p>
          <h1 className="text-5xl font-semibold text-gray-900 mb-4">Find your forever customers</h1>
          <p className="text-xl text-gray-600 max-w-3xl">Reduce acquisition costs, improve conversion, and grow lifetime value — all from one place.</p>
        </div>
      </section>

      <section className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3">
          {blocks.map((b) => (
            <div key={b.title} className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">{b.title}</h3>
              <ul className="space-y-2 text-gray-700">
                {b.points.map((p) => (
                  <li key={p}>• {p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex gap-3">
          <Link href="/demo" className="px-6 py-3 rounded-lg font-medium transition-all bg-gray-100 text-gray-900 border border-gray-300 hover:bg-gray-200">See a live walkthrough</Link>
          <Link href="/pricing" className="px-6 py-3 rounded-lg font-medium transition-all bg-blue-600 text-white hover:bg-blue-700">Choose a plan</Link>
        </div>
      </section>
    </div>
  );
}

