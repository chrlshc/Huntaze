import Image from "next/image";

export default function VisualSimilar() {
  return (
    <section className="relative overflow-hidden bg-surface-base py-24">
      {/* Decorative background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(1200px 500px at 10% -10%, rgba(107,70,255,0.08), transparent 60%), radial-gradient(900px 400px at 90% 0%, rgba(236,72,153,0.08), transparent 60%)",
        }}
      />

      <div className="container-default relative">
        {/* Eyebrow / badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-border-subtle bg-surface-muted px-4 py-1 text-xs font-semibold uppercase tracking-wide text-content-subtle">
          New • Creator OS
        </span>

        {/* Headline */}
        <div className="mt-6 max-w-2xl">
          <h1 className="text-4xl font-semibold text-content-primary sm:text-5xl">
            Double your revenue, halve the work
          </h1>
          <p className="mt-4 text-lg text-content-secondary">
            Automate DMs, funnels and reporting across IG/TikTok → OnlyFans. One simple, fast command
            center with the KPIs that matter.
          </p>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a href="/auth" className="btn btn-primary">
            Start free
          </a>
          <a href="/pricing" className="btn btn-secondary">
            See plans
          </a>
        </div>

        {/* Mockup */}
        <div className="relative mt-14 rounded-2xl border border-border-subtle bg-surface-raised p-4 shadow-md">
          <div className="relative mx-auto aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-xl border border-border-subtle">
            <Image
              src="/dashboard-preview.png"
              alt="Product preview"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1024px"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

