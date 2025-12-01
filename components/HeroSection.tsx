import Link from "next/link";

export function HeroSection() {
  return (
    <section className="mx-auto max-w-4xl space-y-8 py-16 text-center sm:py-24">
      <span className="inline-flex items-center rounded-full border border-[var(--border-default)] bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gray-400">
        Huntaze · Revenue OS
      </span>
      <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
        Double your OnlyFans revenue with an AI manager that never sleeps.
      </h1>
      <p className="text-lg text-gray-300">
        Huntaze connects to your account through a secure browser worker, identifies buyers, and sends replies or PPVs in
        your exact voice — 24/7, without sacrificing authenticity.
      </p>
      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href="/auth/login"
          className="inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 text-base font-semibold text-white transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          Open the app
        </Link>
        <Link
          href="/support"
          className="text-sm font-semibold text-gray-300 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
        >
          Explore documentation →
        </Link>
      </div>
    </section>
  );
}
