const features = [
  {
    title: "AI in your voice",
    description: "Reply, upsell, and nurture without losing the tone that keeps your fans engaged.",
    colorClass: "bg-primary",
  },
  {
    title: "Live revenue cockpit",
    description: "Real-time segments, Smart Relance, and actionable insights across your funnel.",
    colorClass: "bg-secondary",
  },
  {
    title: "Secure browser worker",
    description: "No shared APIs. A dedicated worker mirrors your activity with enterprise-grade security.",
    colorClass: "bg-tertiary",
  },
];

export function ProductSection() {
  return (
    <section className="mx-auto max-w-5xl space-y-8 py-16">
      <div>
        <h2 className="text-2xl font-bold text-white">Product</h2>
        <p className="mt-2 text-base text-gray-400">
          Everything you need to operate a high-performing OnlyFans business from one workspace.
        </p>
      </div>
      <ul className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <li key={feature.title} className="rounded-lg border border-gray-800 bg-gray-800/60 p-6">
            <div className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${feature.colorClass}`} aria-hidden="true" />
              <p className="text-lg font-semibold text-white">{feature.title}</p>
            </div>
            <p className="mt-3 text-sm text-gray-400">{feature.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
