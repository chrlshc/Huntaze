import Link from "next/link";

export const dynamic = "force-dynamic";

const NAVIGATION = [
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/customers", label: "Customers" },
  { href: "/support", label: "Support" },
];

const HIGHLIGHTS = [
  {
    title: "AI that sells like you",
    description:
      "Every reply and PPV pitch mirrors your tone, emojis, and sales playbook. Huntaze apprend sur vos vraies conversations.",
  },
  {
    title: "Live OnlyFans data",
    description:
      "Dashboard, inbox, analytics, segmentation — le tout alimenté par la connexion navigateur sécurisée. Aucun mock.",
  },
  {
    title: "Daily revenue plan",
    description:
      "Smart Relance fait remonter VIPs, PPV en attente et opportunités high-EV pour guider vos actions du jour.",
  },
];

const METRICS = [
  { label: "Messages envoyés par l’IA", value: "300%+" },
  { label: "Lift PPV moyen", value: "2.4×" },
  { label: "Segments fans", value: "10 tiers" },
  { label: "Temps de réponse", value: "1.8 s" },
];

const DAILY_PLAN = [
  "Plan d’actions “Today’s Money” mis à jour en continu.",
  "Réponses IA calibrées sur votre voix, vos prix et emojis favoris.",
  "Relances automatiques qui réveillent VIPs et concluent les PPV ouverts.",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-30 bg-black/95 border-b border-gray-800">
        <div className="container-default h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 focus-ring">
            <img src="/logo.svg" alt="Huntaze" className="h-6" />
            <span className="sr-only">Huntaze</span>
          </Link>
          <nav className="hidden md:flex actions-row text-sm font-medium text-gray-300">
            {NAVIGATION.map((item) => (
              <Link key={item.href} className="btn btn-ghost" href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="actions-row">
            <Link className="btn btn-ghost" href="/auth">
              Sign in
            </Link>
            <Link className="btn btn-primary" href="/app">
              Open App
            </Link>
          </div>
        </div>
      </header>

      <main className="space-y-24 pb-24">
        <section className="container-default pt-20 sm:pt-24 md:pt-28">
          <h1 className="h1-hero max-w-5xl">
            Double your OnlyFans revenue with an AI manager that never sleeps.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-gray-300">
            Huntaze connecte votre compte via un navigateur sécurisé. Il lit chaque message, identifie les fans prêts à
            acheter et envoie des réponses ou PPV dans votre voix — 24&#8260;7.
          </p>
          <div className="actions-row mt-8">
            <Link href="/app" className="btn btn-secondary">
              Open the live workspace
            </Link>
            <Link href="/product" className="btn btn-primary">
              Explore the product →
            </Link>
          </div>
        </section>

        <section className="container-default">
          <div className="surface elevation-1 p-6">
            <div className="text-xs tracking-widest text-gray-400 mb-3">LIVE DASHBOARD PREVIEW</div>
            <div className="aspect-video rounded-lg bg-gray-900 border border-gray-800" />
          </div>
        </section>

        <section className="container-default">
          <div className="grid gap-6 md:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.title} className="surface elevation-1 p-6 text-gray-900">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container-default">
          <div className="surface elevation-1 p-8 md:p-12">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="space-y-4 text-gray-900">
                <h2 className="text-2xl font-semibold">Less dashboards. More payouts.</h2>
                <p className="text-sm text-gray-600">
                  Le navigateur Huntaze réplique votre activité réelle&nbsp;: lecture des DMs, envoi des PPV, tags fans et
                  suivi revenus. Pics d’audience, VIP en dormance, PPV en attente&nbsp;: tout est mis à jour en secondes.
                </p>
                <ul className="space-y-3 text-sm text-gray-700">
                  {DAILY_PLAN.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gray-900" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-6">
                {METRICS.map((stat) => (
                  <div key={stat.label} className="surface elevation-0 border border-gray-200 p-6 text-center">
                    <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.24em] text-gray-500">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container-default">
          <div className="surface elevation-1 p-10 md:p-14">
            <div className="grid gap-8 md:grid-cols-[2fr,1fr] md:items-center text-gray-900">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-600">
                  Integrations
                </div>
                <h2 className="text-2xl font-semibold">OnlyFans first, multi-platform ready.</h2>
                <p className="text-sm text-gray-600">
                  Huntaze conserve une session navigateur sécurisée par compte (proxy Bright Data, stockage chiffré). Les
                  autres canaux — TikTok, Instagram, Reddit — rejoignent la même inbox et analytics.
                </p>
              </div>
              <div className="grid gap-3">
                <div className="surface elevation-0 border border-gray-300 px-4 py-3 text-sm font-semibold">
                  OnlyFans connection · Status: Live
                </div>
                <div className="surface elevation-0 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  TikTok · Instagram · Reddit · Threads · Fansly (beta)
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container-default">
          <div className="surface elevation-2 border-gray-800 bg-gray-900 text-white px-8 py-12 text-center md:px-14 md:py-16">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready to run Huntaze for your OnlyFans business?
            </h2>
            <p className="mt-4 text-base text-gray-300">
              Connectez votre compte, choisissez votre niche, et laissez l’IA gérer le support et les ventes — dans le
              même workspace live.
            </p>
            <div className="actions-row mt-6 justify-center">
              <Link href="/auth" className="btn bg-white text-black hover:bg-gray-100">
                Start for free
              </Link>
              <Link href="/product" className="btn btn-primary">
                Book a product tour →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
