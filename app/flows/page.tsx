export const dynamic = 'force-static'

const Step = ({ index, title, desc }: { index: number; title: string; desc: string }) => (
  <div className="rounded-xl border border-border-subtle bg-background-elevated p-5 hover-lift-soft">
    <div className="text-sm text-text-tertiary mb-1">Step {index}</div>
    <div className="font-semibold mb-1">{title}</div>
    <div className="text-sm text-text-secondary">{desc}</div>
  </div>
)

export default function FlowsPage() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Huntaze Flows</h1>
        <p className="text-text-secondary mb-10">Aperçu interactif des 3 flux: App, Pricing, Onboarding.</p>

        {/* App Flow */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">App Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Step index={1} title="Discover" desc="Landing > Value prop > CTA" />
            <Step index={2} title="Sign Up" desc="Email + password or OAuth" />
            <Step index={3} title="Setup Dashboard" desc="Connect channels, import data" />
            <Step index={4} title="Engage & Earn" desc="Automation + analytics loop" />
          </div>
        </section>

        {/* Pricing Flow */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Pricing Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Starter', price: '€29/mo', points: ['DM basics', 'Single account', 'Email support'] },
              { name: 'Pro', price: '€99/mo', points: ['DM automation', 'Multi account', 'Priority support'] },
              { name: 'Enterprise', price: 'Custom', points: ['SLA', 'SSO', 'Dedicated CSM'] },
            ].map((p) => (
              <div key={p.name} className="rounded-xl border border-border-subtle bg-background-elevated p-6 hover-lift-soft">
                <div className="text-sm text-text-tertiary mb-1">Plan</div>
                <div className="flex items-baseline justify-between">
                  <h3 className="font-semibold">{p.name}</h3>
                  <div className="text-lg">{p.price}</div>
                </div>
                <ul className="mt-3 space-y-1 text-sm text-text-secondary">
                  {p.points.map(pt => <li key={pt}>• {pt}</li>)}
                </ul>
                <button className="btn-primary w-full mt-4 rounded-full py-2 animate-pulse-soft">Choose {p.name}</button>
              </div>
            ))}
          </div>
        </section>

        {/* Onboarding Flow */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Onboarding Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Step index={1} title="Profile" desc="Creator / Agency / Manager" />
            <Step index={2} title="Integrations" desc="OnlyFans / Instagram / TikTok / Twitter" />
            <Step index={3} title="Goals" desc="Revenue / Audience / Retention" />
            <Step index={4} title="Personalize" desc="Playbooks + tone + targeting" />
            <Step index={5} title="Preview" desc="Dashboard tailored to your choices" />
          </div>
        </section>
      </div>
    </div>
  )
}

