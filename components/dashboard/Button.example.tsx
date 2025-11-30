/**
 * Button Component Examples
 * 
 * This file demonstrates all button variants, sizes, and states
 * for the Shopify-inspired dashboard design system.
 */

import React from 'react';
import { Button } from './Button';

export function ButtonExamples() {
  return (
    <div style={{ padding: '32px', background: 'var(--bg-glass)' }}>
      <h1 style={{ marginBottom: '32px', color: 'var(--text-primary)' }}>
        Dashboard Button System
      </h1>

      {/* Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Variants</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Sizes</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>
      </section>

      {/* States */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>States</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button isLoading>Loading</Button>
        </div>
      </section>

      {/* Full Width */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Full Width</h2>
        <Button fullWidth>Full Width Button</Button>
      </section>

      {/* Combinations */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Combinations</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <Button variant="primary" size="large" fullWidth>
            Get Started
          </Button>
          <Button variant="secondary" size="medium" fullWidth>
            Learn More
          </Button>
          <Button variant="ghost" size="small">
            Skip for now
          </Button>
        </div>
      </section>

      {/* Real-world Examples */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
          Real-world Examples
        </h2>
        
        {/* Onboarding Card */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            marginBottom: '24px',
            maxWidth: '400px',
          }}
        >
          <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>
            Connect Your First Account
          </h3>
          <p style={{ marginBottom: '16px', color: 'var(--text-tertiary)' }}>
            Link your social media accounts to start tracking your growth.
          </p>
          <Button variant="primary" fullWidth>
            Connect Account
          </Button>
        </div>

        {/* Form Actions */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            maxWidth: '400px',
          }}
        >
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
            Save Changes?
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button variant="ghost" style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button variant="primary" style={{ flex: 1 }}>
              Save
            </Button>
          </div>
        </div>
      </section>

      {/* Accessibility Note */}
      <section
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '16px',
          border: '1px solid var(--border-subtle)',
          maxWidth: '600px',
        }}
      >
        <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
          ♿ Accessibility Features
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
          <li>Keyboard navigation support (Tab to focus)</li>
          <li>Electric Indigo focus indicators (3px glow)</li>
          <li>Reduced motion support for animations</li>
          <li>Proper ARIA attributes for loading states</li>
          <li>WCAG compliant color contrast ratios</li>
        </ul>
      </section>
    </div>
  );
}

export default ButtonExamples;
