import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Run Your Business | Huntaze',
  description: 'Manage everything in one place — taxes, payouts, data, and team workflows.',
};

export default function BusinessPage() {
  const items = [
    {
      title: 'Finance & taxes',
      lines: ['Overview and reconciliations', 'Automated exports', 'Tax helpers and reports'],
    },
    {
      title: 'Operations',
      lines: ['SLAs and routing rules', 'Tasking and approvals', 'Audit logs and history'],
    },
    {
      title: 'Data & privacy',
      lines: ['Consent and retention', 'Right‑to‑be‑forgotten flows', 'Security by default'],
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-blue-600 font-medium mb-3">Management</p>
          <h1 className="text-5xl font-semibold text-gray-900 mb-4">Take care of business</h1>
          <p className="text-xl text-gray-600 max-w-3xl">One admin for finances, ops, and data — run your creator business like a pro.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid gap-8 md:grid-cols-3">
          {items.map((b) => (
            <div key={b.title} className="surface rounded-2xl p-6">
              <h3 className="text-2xl font-semibold text-gray-900 mb-2">{b.title}</h3>
              <ul className="space-y-2 text-gray-700">
                {b.lines.map((l) => (
                  <li key={l}>• {l}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex gap-3">
          <Link href="/demo" className="btn-secondary">See how it works</Link>
          <Link href="/auth" className="btn-primary">Get started</Link>
        </div>
      </section>
    </div>
  );
}

