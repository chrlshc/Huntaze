import React from 'react';
import Link from 'next/link';
import { Zap, Users, TrendingUp, Shield, Sparkles, BarChart3 } from 'lucide-react';

// Use dynamic rendering
export const dynamicParams = true;
export const revalidate = 0;

export default function HomePage() {
  return (
    <div style={{ 
      backgroundColor: 'var(--color-bg-app)',
      minHeight: '100vh',
      color: 'var(--color-text-primary)'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--color-border-subtle)',
        backgroundColor: 'var(--color-bg-surface)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: 'var(--content-max-width-sm)',
          margin: '0 auto',
          padding: 'var(--spacing-4) var(--content-padding)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-text-primary)'
          }}>
            Huntaze
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
            <Link 
              href="/auth/login"
              style={{
                color: 'var(--color-text-secondary)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)'
              }}
            >
              Login
            </Link>
            <Link
              href="/auth/register"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'var(--color-text-inverse)',
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--border-radius-md)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 'var(--font-weight-medium)',
                transition: 'var(--transition-fast)'
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        padding: 'var(--spacing-24) var(--content-padding)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: 'var(--content-max-width-sm)', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'var(--font-size-4xl)',
            fontWeight: 'var(--font-weight-medium)',
            lineHeight: 'var(--line-height-tight)',
            marginBottom: 'var(--spacing-6)',
            color: 'var(--color-text-primary)'
          }}>
            Double Your Revenue, Half the Work
          </h1>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
            marginBottom: 'var(--spacing-8)',
            maxWidth: '600px',
            margin: '0 auto var(--spacing-8)'
          }}>
            Automate your creator business with smart AI. Focus on creating, we handle the rest.
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-4)', justifyContent: 'center' }}>
            <Link
              href="/auth/register"
              style={{
                backgroundColor: 'var(--color-accent-primary)',
                color: 'var(--color-text-inverse)',
                padding: 'var(--spacing-3) var(--spacing-6)',
                borderRadius: 'var(--border-radius-md)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                display: 'inline-block'
              }}
            >
              Start Free Trial
            </Link>
            <Link
              href="/demo"
              style={{
                backgroundColor: 'var(--color-bg-surface)',
                color: 'var(--color-text-primary)',
                padding: 'var(--spacing-3) var(--spacing-6)',
                borderRadius: 'var(--border-radius-md)',
                textDecoration: 'none',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-medium)',
                border: '1px solid var(--color-border-subtle)',
                display: 'inline-block'
              }}
            >
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: 'var(--spacing-20) var(--content-padding)',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        <div style={{ maxWidth: 'var(--content-max-width-sm)', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-medium)',
            textAlign: 'center',
            marginBottom: 'var(--spacing-12)',
            color: 'var(--color-text-primary)'
          }}>
            Everything you need to succeed
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'var(--spacing-6)'
          }}>
            {[
              { icon: Zap, title: 'Lightning Fast', desc: 'Get started in minutes with our intuitive platform' },
              { icon: Users, title: 'Grow Your Audience', desc: 'Connect with fans across multiple platforms' },
              { icon: TrendingUp, title: 'Increase Revenue', desc: 'Monetize effectively with powerful tools' },
              { icon: Shield, title: 'Secure & Private', desc: 'Enterprise-grade security and encryption' },
              { icon: Sparkles, title: 'AI-Powered', desc: 'Leverage AI to optimize your strategy' },
              { icon: BarChart3, title: 'Advanced Analytics', desc: 'Track performance with detailed insights' }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: 'var(--spacing-6)',
                backgroundColor: 'var(--color-bg-app)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--border-radius-lg)'
              }}>
                <feature.icon style={{
                  width: '24px',
                  height: '24px',
                  color: 'var(--color-accent-primary)',
                  marginBottom: 'var(--spacing-4)'
                }} />
                <h3 style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 'var(--spacing-2)',
                  color: 'var(--color-text-primary)'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-relaxed)'
                }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: 'var(--spacing-24) var(--content-padding)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{
            fontSize: 'var(--font-size-3xl)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-primary)'
          }}>
            Ready to grow your business?
          </h2>
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-8)',
            lineHeight: 'var(--line-height-relaxed)'
          }}>
            Start automating your creator business today. No credit card required.
          </p>
          <Link
            href="/auth/register"
            style={{
              backgroundColor: 'var(--color-accent-primary)',
              color: 'var(--color-text-inverse)',
              padding: 'var(--spacing-3) var(--spacing-8)',
              borderRadius: 'var(--border-radius-md)',
              textDecoration: 'none',
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-medium)',
              display: 'inline-block'
            }}
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--color-border-subtle)',
        padding: 'var(--spacing-8) var(--content-padding)',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        <div style={{
          maxWidth: 'var(--content-max-width-sm)',
          margin: '0 auto',
          textAlign: 'center',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-muted)'
        }}>
          © 2025 Huntaze. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
