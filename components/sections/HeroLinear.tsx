export function HeroLinear() {
  return (
    <section className="relative bg-black text-white">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">The platform built for premium creators.</h1>
          <p className="hero-subtitle">Automate conversations, boost revenue, and scale your exclusive content business with AI.</p>
          <div className="hero-buttons">
            <a href="/auth" className="cta-pill-outline">Start for free</a>
            <a href="/pricing" className="btn-secondary">View plans</a>
          </div>

          {/* quick links removed per request */}
        </div>
      </div>
    </section>
  );
}

export default HeroLinear;
