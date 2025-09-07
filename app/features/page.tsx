export default function FeaturesPage() {
  return (
    <section className="features-page">
      {/* Hero */}
      <div className="features-hero">
        <div className="container max-w-7xl mx-auto px-6 py-20">
          <h1 className="text-5xl font-bold mb-6">Features that transform your productivity</h1>
          <p className="text-xl text-gray-600 max-w-3xl">
            Discover how Huntaze streamlines your workflow with powerful tools and an intuitive interface.
          </p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="features-grid container max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card group">
              <div className="feature-icon mb-4">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${f.gradient} group-hover:scale-110 transition-transform duration-300`} />
              </div>
              <h3 className="text-2xl font-semibold mb-3">{f.title}</h3>
              <p className="text-gray-600 mb-4">{f.desc}</p>
              <div className="feature-metrics text-sm font-medium text-blue-600">{f.metric}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="demo-section bg-gray-50 py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">See Huntaze in action</h2>
          <div className="demo-container min-h-[360px] grid place-items-center border border-gray-200 rounded-2xl bg-white p-8 text-center">
            <p className="text-gray-600 mb-4">Walk through a 5‑step guided tour.</p>
            <a href="/demo" className="inline-flex items-center px-5 py-3 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700">Start the interactive demo</a>
          </div>
        </div>
      </div>

      {/* Comparison placeholder */}
      <div className="comparison-section py-20">
        <div className="container max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Huntaze vs. alternatives</h2>
          <div className="overflow-x-auto">
            <table className="comparison-table w-full text-left text-sm">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="px-4 py-3">Feature</th>
                  <th className="px-4 py-3">Huntaze</th>
                  <th className="px-4 py-3">Agency</th>
                  <th className="px-4 py-3">Tool A</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row) => (
                  <tr key={row.key} className="border-t">
                    <td className="px-4 py-3 font-medium">{row.label}</td>
                    <td className="px-4 py-3 text-green-600">{row.huntaze}</td>
                    <td className="px-4 py-3 text-gray-500">{row.agency}</td>
                    <td className="px-4 py-3 text-gray-500">{row.tool}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { title: 'Smart automation', desc: 'Save ~10h/week with AI workflows and templates.', metric: '10h saved / week', gradient: 'from-blue-500 to-purple-600' },
  { title: 'Real‑time analytics', desc: 'Decide faster with live LTV, retention and ARPU.', metric: '3× faster decisions', gradient: 'from-green-500 to-emerald-600' },
  { title: 'Seamless collaboration', desc: 'Roles, approvals and shared content library.', metric: '−50% meetings', gradient: 'from-fuchsia-500 to-rose-500' },
  { title: 'Strong security', desc: 'AES‑256 encryption, 2FA and audit logs.', metric: 'AES‑256 / 2FA', gradient: 'from-indigo-500 to-sky-500' },
  { title: 'Native integrations', desc: '100+ tools connected out‑of‑the‑box.', metric: '100+ integrations', gradient: 'from-amber-500 to-orange-600' },
  { title: '24/7 Support', desc: 'Human support with < 2 min response.', metric: '< 2 min reply', gradient: 'from-cyan-500 to-blue-600' },
];

const COMPARE = [
  { key: 'inbox', label: 'Unified inbox', huntaze: '✓', agency: '✕', tool: 'Partial' },
  { key: 'ai', label: 'AI assistant', huntaze: '✓', agency: 'Depends', tool: '✕' },
  { key: 'analytics', label: 'Revenue analytics', huntaze: '✓', agency: '✕', tool: '✕' },
  { key: 'payments', label: 'Payments & offers', huntaze: '✓', agency: '✕', tool: '✕' },
];
