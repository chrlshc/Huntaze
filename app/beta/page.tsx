import Link from 'next/link';
import { BetaStatsSection } from '@/components/landing/BetaStatsSection';
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
export default function BetaLandingPage() {
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
      <BetaStatsSection />

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
