export const dynamic = 'force-static'

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Huntaze Design System</h1>
        <p className="text-text-secondary mb-10">Aperçu rapide des composants clés, pilotés par les tokens.</p>

        {/* Buttons */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <button className="btn-primary px-5 py-2 rounded-full hover-lift-soft">Primary</button>
            <button className="btn-secondary px-5 py-2 rounded-full hover-lift-soft">Secondary</button>
            <button className="btn-outline px-5 py-2 rounded-full hover-lift-soft">Outline</button>
          </div>
        </section>

        {/* Cards */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map((i) => (
              <div key={i} className="rounded-xl border border-border-subtle bg-background-elevated p-6 hover-lift-soft transition">
                <h3 className="font-semibold mb-2">Card {i}</h3>
                <p className="text-text-secondary text-sm">Surface elevée, bordure subtile, lisible en dark et light.</p>
              </div>
            ))}
          </div>
        </section>

        {/* Form controls */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Form</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm mb-2 text-text-secondary">Email</label>
              <input className="w-full rounded-md px-3 py-2 border border-border-default bg-background-secondary" placeholder="you@huntaze.com" />
            </div>
            <div>
              <label className="block text-sm mb-2 text-text-secondary">Plan</label>
              <select className="w-full rounded-md px-3 py-2 border border-border-default bg-background-secondary">
                <option>Starter</option>
                <option>Pro</option>
                <option>Enterprise</option>
              </select>
            </div>
          </div>
        </section>

        {/* Status */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="rounded-full px-3 py-1" style={{ background: `rgba(var(--color-success-rgb, 33,128,141), 0.15)`, color: `var(--color-success)` }}>Success</span>
            <span className="rounded-full px-3 py-1" style={{ background: `rgba(var(--color-warning-rgb, 168,75,47), 0.15)`, color: `var(--color-warning)` }}>Warning</span>
            <span className="rounded-full px-3 py-1" style={{ background: `rgba(var(--color-error-rgb, 192,21,47), 0.15)`, color: `var(--color-error)` }}>Error</span>
            <span className="rounded-full px-3 py-1" style={{ background: `rgba(var(--color-info-rgb, 98,108,113), 0.15)`, color: `var(--color-info)` }}>Info</span>
          </div>
        </section>

        {/* Typography */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Typography</h2>
          <div className="space-y-2">
            <div className="text-3xl font-bold">Heading H1</div>
            <div className="text-2xl font-semibold">Heading H2</div>
            <div className="text-xl font-semibold">Heading H3</div>
            <p className="text-text-secondary">Body text with secondary color for comfortable reading.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

