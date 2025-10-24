// Snapshot of components/sections/beta/BetaBenefits.tsx
"use client";
import { CheckCircle2, Sparkles, Shield, Rocket, Gift } from 'lucide-react'
export default function BetaBenefits() {
  const items = [
    { icon: Sparkles, title: 'Early Access', desc: 'Be the first to use new features before public launch.' },
    { icon: Shield, title: 'Special Pricing', desc: 'Lock in beta pricing for life when we go public.' },
    { icon: CheckCircle2, title: 'Direct Impact', desc: 'Your feedback directly influences product development.' },
    { icon: Rocket, title: 'Priority Support', desc: 'Get help from the founder personally during beta.' },
    { icon: Gift, title: 'Exclusive Perks', desc: 'Private community and beta‑only features.' },
  ]
  return (
    <section className="benefits-section section">
      <h2>Be part of something new</h2>
      <p className="section-intro">
        We’re building Huntaze with creators in mind. As a beta tester, you’ll get early access to powerful automation tools, priority support, and the chance to shape the future of creator management.
      </p>
      <div className="benefits-grid">
        {items.map((it) => (
          <div key={it.title} className="benefit-card card">
            <div className="benefit-icon"><it.icon className="w-6 h-6 text-purple-300" /></div>
            <h3>{it.title}</h3>
            <p>{it.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

