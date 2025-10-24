const faqs = [
  { q: 'What does "beta" mean?', a: 'Beta means we\'re still refining Huntaze with real user feedback. You\'ll get full access, expect regular updates (and the occasional bug) — we fix fast.' },
  { q: 'Is beta access free?', a: 'Yes. Beta testers get full access for free during beta. At launch, you\'ll get exclusive lifetime pricing.' },
  { q: 'What platforms do you support?', a: 'OnlyFans, Instagram, and TikTok. Reddit and others are on the roadmap based on beta feedback.' },
  { q: 'How long is the beta?', a: 'We\'re planning ~3 months, depending on feedback. You\'ll be notified before any changes.' },
  { q: 'Will my data be safe?', a: 'Absolutely. AWS infrastructure with enterprise‑grade encryption. Your data is never shared or sold.' },
  { q: 'What support will I get?', a: 'During beta, you\'ll get direct access to the founder. Typical response under 24 hours.' },
]

import Section from '@/components/marketing/Section'

export default function BetaFAQ() {
  return (
    <Section>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl font-semibold mb-8 text-white">Beta FAQ</h2>
        <div className="divide-y divide-white/10 rounded-xl border border-white/10 overflow-hidden">
          {faqs.map((f, idx) => (
            <details key={f.q} className="faq-item group">
              <summary className="faq-question text-white">
                <span className="font-medium">{f.q}</span>
                <span className="faq-icon text-white/50">+</span>
              </summary>
              <div className="faq-answer faq-accordion-content text-sm text-white/80">{f.a}</div>
              {idx < faqs.length - 1 && <div className="h-px bg-white/10" />}
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}
