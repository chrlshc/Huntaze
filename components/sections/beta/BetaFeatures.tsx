export default function BetaFeatures() {
  const feats = [
    {
      title: 'Audience Management',
      desc: 'Organize your entire audience in one place with smart segmentation and real‑time insights.',
    },
    {
      title: 'Smart Automation',
      desc: 'Automate repetitive tasks—from messages to scheduling—so you can focus on creating.',
    },
    {
      title: 'Privacy‑First',
      desc: 'Your data stays yours. Built on AWS with enterprise‑grade security.',
    },
    {
      title: 'AI‑Powered Insights',
      desc: 'Get actionable recommendations powered by AI. Know what works and what to do next.',
    },
  ]
  return (
    <section className="section py-16 bg-gray-50 dark:bg-zinc-950">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-3 text-center">Everything you need to scale your creator business</h2>
        <div className="grid sm:grid-cols-2 gap-6 mt-8">
          {feats.map((f) => (
            <div key={f.title} className="feature-card card p-6">
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
