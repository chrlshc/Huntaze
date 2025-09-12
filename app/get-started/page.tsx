import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Get Started | Huntaze',
  description: 'Start selling in no time — three simple steps to launch.',
};

export default function GetStartedPage() {
  const steps = [
    {
      n: '01',
      title: 'Create your account',
      text: 'Sign up with email. No credit card required.',
      cta: { href: '/auth', label: 'Start free' },
    },
    {
      n: '02',
      title: 'Connect platforms',
      text: 'Link Instagram, TikTok, Reddit, and more in minutes.',
      cta: { href: '/integrations', label: 'See integrations' },
    },
    {
      n: '03',
      title: 'Start smarter',
      text: 'Use presets and automations to publish and engage.',
      cta: { href: '/demo', label: 'Watch quick demo' },
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm text-blue-600 font-medium mb-3">Onboarding</p>
          <h1 className="text-5xl font-semibold text-gray-900 mb-4">Start selling in no time</h1>
          <p className="text-xl text-gray-600 max-w-3xl">Three simple steps — from zero to publishing in under a minute.</p>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto grid gap-6 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="surface rounded-2xl p-6">
              <div className="text-sm text-gray-500">{s.n}</div>
              <h3 className="text-2xl font-semibold text-gray-900 mt-1">{s.title}</h3>
              <p className="text-gray-700 mt-2">{s.text}</p>
              <div className="mt-4">
                <Link href={s.cta.href} className="btn-outline-gradient">{s.cta.label}</Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-3">
          <Link href="/pricing" className="btn-secondary">Compare plans</Link>
          <Link href="/support" className="btn-primary">Need help?</Link>
        </div>
      </section>
    </div>
  );
}

