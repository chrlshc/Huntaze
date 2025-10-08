import Link from 'next/link';

const navigation = [
  { href: '/app', label: 'Product' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/customers', label: 'Customers' },
  { href: '/support', label: 'Support' },
];

const highlights = [
  {
    title: 'AI that sells like you',
    description:
      'Every reply and PPV pitch mirrors your tone, emojis, and sales playbook. Huntaze trains on your real conversations, not a generic script.',
  },
  {
    title: 'Live OnlyFans data',
    description:
      'Dashboard, inbox, analytics, segmentation—everything is powered by the headless browser connection. No mock data, no delays.',
  },
  {
    title: 'Daily revenue plan',
    description:
      'Smart Relance surfaces VIPs, abandoned PPVs, and high-EV opportunities so you always know who to message next.',
  },
];

const stats = [
  { label: 'Messages sent by AI', value: '300%+' },
  { label: 'Average PPV lift', value: '2.4x' },
  { label: 'Fans segmented', value: '10 tiers' },
  { label: 'Response time', value: '1.8s' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-neutral-900/80 bg-black/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-white">
            <img src="/logo.svg" alt="Huntaze" className="h-8 w-auto" />
            <span className="hidden text-sm font-semibold uppercase tracking-[0.18em] md:block">
              Huntaze
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-300 md:flex">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} className="hover:text-white">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="hidden text-sm font-medium text-gray-300 hover:text-white md:block">
              Sign in
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900"
            >
              Open App
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 md:pt-28">
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 text-sm font-medium text-slate-700">
              <span className="inline-flex h-2 w-2 rounded-full bg-slate-900" />
              OnlyFans automation that feels human
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Double your OnlyFans revenue with an AI manager that never sleeps.
            </h1>
            <p className="text-lg text-slate-600 md:text-xl">
              Huntaze connects directly to your OnlyFans account through a secure browser worker. It reads every message,
              identifies who is likely to buy, and sends replies or PPVs in your exact voice—24/7.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/app"
                className="inline-flex items-center rounded-lg bg-black px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900"
              >
                Open the live workspace
              </Link>
              <Link
                href="/app-preview"
                className="inline-flex items-center rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                Explore the product → 
              </Link>
            </div>
          </div>

          <div className="mt-12 rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Live dashboard preview
            </div>
            <div className="aspect-[6/3] w-full overflow-hidden rounded-3xl bg-black">
              <iframe
                title="Huntaze AppVisuel"
                src="/app-visuel"
                className="h-full w-full border-none"
              />
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-12">
            <div className="grid gap-10 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900">Less dashboards. More payouts.</h2>
                <p className="text-sm text-slate-600">
                  The Huntaze browser worker mirrors your real activity: reading DMs, sending PPVs, tagging fans, and tracking revenue.
                  Best hour to send? Which VIP ghosted? Which PPV stalled? It’s all there, updated in seconds.
                </p>
                <ul className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
                Daily “Today’s Money” plan so you know the next five actions to take.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
                AI replies tuned on your voice, price points, and favorite emojis.
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-slate-900" />
                Smart Relance sequences that revive VIPs and close open PPVs automatically.
              </li>
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-slate-100 bg-white px-4 py-6 text-center shadow-sm">
                    <p className="text-2xl font-semibold text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-slate-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-20 max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm md:p-14">
            <div className="grid gap-8 md:grid-cols-[2fr,1fr] md:items-center">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Integrations
                </div>
                <h2 className="text-2xl font-semibold text-slate-900">OnlyFans first, multi-platform ready.</h2>
                <p className="text-sm text-slate-600">
                  Huntaze keeps a secure browser session for each of your accounts (Bright Data proxy, AES-256 session storage).
                  Additional channels—TikTok, Instagram, Reddit—are handled through the same unified inbox and analytics.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800">
                  OnlyFans connection · Status: Live
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  TikTok · Instagram · Reddit · Threads · Fansly (beta)
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto mt-24 max-w-4xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-black px-8 py-10 text-center text-white shadow-[0_25px_120px_-40px_rgba(15,23,42,0.45)] md:px-14 md:py-16">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to run Huntaze for your OnlyFans business?
            </h2>
            <p className="mt-4 text-base text-gray-300">
              Connect your account, pick your niche, and the AI manager takes over—the same workspace you saw above.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link
                href="/auth"
                className="inline-flex items-center rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black shadow-sm transition hover:bg-gray-100"
              >
                Start for free
              </Link>
              <Link
                href="/app-preview"
                className="inline-flex items-center rounded-lg border border-white/40 px-6 py-2.5 text-sm font-semibold text-white transition hover:border-white/60"
              >
                View live product →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-slate-500 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <img src="/logo.svg" alt="Huntaze" className="h-7 w-auto" />
            <span>Huntaze · OnlyFans Revenue OS</span>
          </div>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-slate-700">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              Terms
            </Link>
            <Link href="/support" className="hover:text-slate-700">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
