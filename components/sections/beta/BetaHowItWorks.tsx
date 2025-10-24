export default function BetaHowItWorks() {
  const steps = [
    { t: 'Sign Up', d: 'Create your account and connect your platforms. No credit card required during beta.' },
    { t: 'Set Up Automation', d: 'Choose from pre‑built workflows or customize your own. AI helps you optimize.' },
    { t: 'Grow Smarter', d: 'Watch your audience grow while Huntaze handles the busywork. Track everything in real‑time.' },
  ]
  return (
    <section id="how-it-works" className="steps-section section">
      <h2 className="text-3xl font-bold text-center">Get started in minutes, not hours</h2>
      <div className="steps-grid">
        {steps.map((s, i) => (
          <div key={s.t} className="step-card card">
            <div className="step-number">{i + 1}</div>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
