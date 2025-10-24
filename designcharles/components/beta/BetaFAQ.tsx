// Snapshot of components/sections/beta/BetaFAQ.tsx
const faqs = [
  { q: 'What does "beta" mean?', a: 'Beta means we\'re still refining Huntaze with real user feedback. You\'ll get full access, expect regular updates (and the occasional bug) — we fix fast.' },
  { q: 'Is beta access free?', a: 'Yes. Beta testers get full access for free during beta. At launch, you\'ll get exclusive lifetime pricing.' },
  { q: 'What platforms do you support?', a: 'OnlyFans, Instagram, and TikTok. Reddit and others are on the roadmap based on beta feedback.' },
  { q: 'How long is the beta?', a: 'We\'re planning ~3 months, depending on feedback. You\'ll be notified before any changes.' },
  { q: 'Will my data be safe?', a: 'Absolutely. AWS infrastructure with enterprise‑grade encryption. Your data is never shared or sold.' },
  { q: 'What support will I get?', a: 'During beta, you\'ll get direct access to the founder. Typical response under 24 hours.' },
]

export default function BetaFAQ() {
  return (
    <section className="py-16 bg-white dark:bg-black">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8">Beta FAQ</h2>
        <div className="divide-y divide-gray-200/70 dark:divide-white/10 rounded-xl border border-gray-200/70 dark:border-white/10 overflow-hidden">
          {faqs.map((f, idx) => (
            <details key={f.q} className="faq-item group">
              <summary className="faq-question">
                <span className="font-medium">{f.q}</span>
                <span className="faq-icon text-gray-500">+</span>
              </summary>
              <div className="faq-answer faq-accordion-content text-sm text-gray-600 dark:text-gray-300">{f.a}</div>
              {idx < faqs.length - 1 && <div className="h-px bg-gray-200/70 dark:bg-white/10" />}
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

