/**
 * Beta Stats Section Component
 * 
 * Displays simulated beta metrics with beta labels and disclaimer.
 * 
 * Features:
 * - Four stat cards: waitlist count, messages managed, response rate, AI availability
 * - Beta labels on each stat
 * - Disclaimer text for simulated metrics
 * - Hover effects: translateY(-4px) and border emphasis
 * 
 * Requirements: 2.5, 2.6, 2.7
 */

import './beta-stats-section.css';

interface BetaStat {
  label: string;
  value: string;
  description: string;
  betaLabel: string;
}

export function BetaStatsSection() {
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
  );
}
