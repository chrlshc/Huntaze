import React from 'react';
import Link from 'next/link';
import { Zap, Users, TrendingUp, Shield, Sparkles, BarChart3 } from 'lucide-react';

// Use dynamic rendering
export const dynamicParams = true;
export const revalidate = 0;

export default function HomePage() {
  return (
    <div style={{ 
      backgroundColor: '#0F0F10',
      minHeight: '100vh',
      color: '#EDEDEF'
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #2E2E33',
        backgroundColor: '#151516',
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
            Run Your Creator Business on Autopilot
          </h1>
          <p style={{
            fontSize: 'var(--font-size-lg)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)',
            marginBottom: 'var(--spacing-8)',
            maxWidth: '600px',
            margin: '0 auto var(--spacing-8)'
          }}>
            Focus on creating content. We handle the analytics, marketing, and growth.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)', alignItems: 'center' }}>
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
              Request Early Access
            </Link>
            <span style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)'
            }}>
              Closed Beta • Invite only
            </span>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section style={{
        padding: 'var(--spacing-20) var(--content-padding)',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-primary)'
          }}>
            Stop juggling apps
          </h3>
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)'
          }}>
            Being a creator shouldn't mean being a data analyst or a manager. Huntaze brings calm to your workflow by putting everything in one place.
          </p>
        </div>
      </section>

      {/* The Benefits */}
      <section style={{
        padding: 'var(--spacing-20) var(--content-padding)'
      }}>
        <div style={{ maxWidth: 'var(--content-max-width-sm)', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--spacing-8)'
          }}>
            {[
              { 
                icon: BarChart3, 
                title: 'Clarity', 
                subtitle: 'See clearly',
                desc: 'Track your revenue and growth across all platforms instantly. No more spreadsheets.' 
              },
              { 
                icon: Sparkles, 
                title: 'Freedom', 
                subtitle: 'Save time',
                desc: 'Your AI assistant works 24/7. It handles messages and routine tasks so you can sleep.' 
              },
              { 
                icon: Users, 
                title: 'Connection', 
                subtitle: 'Know your fans',
                desc: 'Identify your top supporters and build real relationships with the people who matter most.' 
              }
            ].map((feature, i) => (
              <div key={i} style={{
                padding: 'var(--spacing-6)',
                backgroundColor: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: 'var(--border-radius-lg)'
              }}>
                <feature.icon style={{
                  width: '32px',
                  height: '32px',
                  color: 'var(--color-accent-primary)',
                  marginBottom: 'var(--spacing-4)'
                }} />
                <div style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-medium)',
                  color: 'var(--color-text-muted)',
                  marginBottom: 'var(--spacing-1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {feature.title}
                </div>
                <h3 style={{
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 'var(--font-weight-medium)',
                  marginBottom: 'var(--spacing-3)',
                  color: 'var(--color-text-primary)'
                }}>
                  {feature.subtitle}
                </h3>
                <p style={{
                  fontSize: 'var(--font-size-base)',
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

      {/* Safety */}
      <section style={{
        padding: 'var(--spacing-20) var(--content-padding)',
        backgroundColor: 'var(--color-bg-surface)'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <h3 style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-medium)',
            marginBottom: 'var(--spacing-4)',
            color: 'var(--color-text-primary)'
          }}>
            Your business, safe and secure
          </h3>
          <p style={{
            fontSize: 'var(--font-size-base)',
            color: 'var(--color-text-secondary)',
            lineHeight: 'var(--line-height-relaxed)'
          }}>
            We built Huntaze to protect your work. We never see your passwords, and your data stays yours. Forever.
          </p>
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
            marginBottom: 'var(--spacing-8)',
            color: 'var(--color-text-primary)'
          }}>
            Ready to upgrade your workflow?
          </h2>
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
            Request Access
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
