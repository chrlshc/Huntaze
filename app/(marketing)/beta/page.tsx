import Link from 'next/link';
import './beta.css';

/**
 * Beta-Specific Landing Page
 * 
 * Features:
 * - Hero section with beta badge and gradient title
 * - Pulsing dot animation on beta badge
 * - Gradient text animation (3 second cycle)
 * - Primary CTA with hover effects (translateY, shadow)
 * - Beta stats section with simulated metrics
 * - Pure black background, rainbow only on CTA
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

// Force dynamic rendering
// Enable static generation for optimal performance and SEO
export const dynamic = 'force-static';
export const revalidate = 0;

interface BetaStat {
  label: string;
  value: string;
  description: string;
  betaLabel: string;
}

export default function BetaLandingPage() {
  const stats: BetaStat[] = [
    {
      label: 'Waitlist',
      value: '2,847',
      description: 'Creators waiting to join',
      betaLabel: 'Beta Metric'
    },
    {
      label: 'Messages Managed',
      value: '1.2M+',
      description: 'AI-powered conversations',
      betaLabel: 'Beta Metric'
    },
    {
      label: 'Response Rate',
      value: '94%',
      description: 'Average AI response accuracy',
      betaLabel: 'Beta Metric'
    },
    {
      label: 'AI Availability',
      value: '24/7',
      description: 'Always-on automation',
      betaLabel: 'Beta Metric'
    }
  ];
  return (
    <main className="beta-landing">
      {/* Hero Section */}
      <section className="beta-hero">
        <div className="beta-hero-content">
          {/* Beta Badge with Pulsing Dot */}
          <div className="beta-badge">
            <span className="beta-badge-dot" aria-hidden="true"></span>
            <span className="beta-badge-text">Now in Beta</span>
          </div>

          {/* Gradient Title with Animation */}
          <h1 className="beta-hero-title">
            <span className="gradient-text">
              Automate Your Creator Business
            </span>
          </h1>

          {/* Subtitle */}
          <p className="beta-hero-subtitle">
            Join the exclusive beta program and get early access to AI-powered tools 
            that help you grow your audience, increase revenue, and save time.
          </p>

          {/* Primary CTA with Hover Effects */}
          <div className="beta-hero-cta">
            <Link href="/auth/register" className="btn-primary btn-primary-large">
              Join Beta Program
            </Link>
            <Link href="/auth/login" className="btn-secondary btn-secondary-large">
              Sign In
            </Link>
          </div>

          {/* Beta Stats Preview */}
          <div className="beta-stats-preview">
            <div className="beta-stat">
              <span className="beta-stat-value">20-50</span>
              <span className="beta-stat-label">Beta Creators</span>
            </div>
            <div className="beta-stat">
              <span className="beta-stat-value">24/7</span>
              <span className="beta-stat-label">AI Support</span>
            </div>
            <div className="beta-stat">
              <span className="beta-stat-value">100%</span>
              <span className="beta-stat-label">Free During Beta</span>
            </div>
          </div>
        </div>
      </section>

      {/* Beta Stats Section */}
      <section className="beta-stats-section">
        <div className="beta-stats-content">
          <h2 className="beta-stats-title">Beta Performance Metrics</h2>
          <p className="beta-stats-subtitle">
            See how our platform is performing during the beta phase
          </p>

          {/* Stats Grid */}
          <div className="beta-stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="beta-stat-card">
                {/* Beta Label */}
                <span className="beta-stat-badge">{stat.betaLabel}</span>
                
                {/* Stat Value */}
                <div className="beta-stat-value">{stat.value}</div>
                
                {/* Stat Label */}
                <div className="beta-stat-label">{stat.label}</div>
                
                {/* Stat Description */}
                <div className="beta-stat-description">{stat.description}</div>
              </div>
            ))}
          </div>

          {/* Disclaimer Text */}
          <p className="beta-stats-disclaimer">
            * These metrics are simulated for demonstration purposes during the beta phase. 
            Actual performance may vary based on usage patterns and platform adoption.
          </p>
        </div>
      </section>

      {/* Beta Features Section */}
      <section className="beta-features">
        <div className="beta-features-content">
          <h2 className="beta-features-title">What You Get in Beta</h2>
          
          <div className="beta-features-grid">
            <div className="beta-feature-card">
              <div className="beta-feature-icon">🚀</div>
              <h3 className="beta-feature-title">Early Access</h3>
              <p className="beta-feature-description">
                Be among the first to experience our AI-powered creator management platform.
              </p>
            </div>

            <div className="beta-feature-card">
              <div className="beta-feature-icon">💬</div>
              <h3 className="beta-feature-title">Direct Feedback</h3>
              <p className="beta-feature-description">
                Shape the product with your feedback and feature requests.
              </p>
            </div>

            <div className="beta-feature-card">
              <div className="beta-feature-icon">🎁</div>
              <h3 className="beta-feature-title">Lifetime Discount</h3>
              <p className="beta-feature-description">
                Lock in special pricing when we launch publicly.
              </p>
            </div>

            <div className="beta-feature-card">
              <div className="beta-feature-icon">🤝</div>
              <h3 className="beta-feature-title">Priority Support</h3>
              <p className="beta-feature-description">
                Get dedicated support from our team during the beta period.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Beta CTA Section */}
      <section className="beta-cta">
        <div className="beta-cta-content">
          <h2 className="beta-cta-title">Ready to Join the Beta?</h2>
          <p className="beta-cta-subtitle">
            Limited spots available. Sign up now to secure your place.
          </p>
          <Link href="/auth/register" className="btn-primary btn-primary-large">
            Get Started Free
          </Link>
        </div>
      </section>
    </main>
  );
}
