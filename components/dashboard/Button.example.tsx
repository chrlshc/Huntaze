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
    <div style={{ padding: '32px', background: '#F8F9FB' }}>
      <h1 style={{ marginBottom: '32px', color: '#111827' }}>
        Dashboard Button System
      </h1>

      {/* Variants */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: '#1F2937' }}>Variants</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button variant="primary">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="ghost">Ghost Button</Button>
        </div>
      </section>

      {/* Sizes */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: '#1F2937' }}>Sizes</h2>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Button size="small">Small</Button>
          <Button size="medium">Medium</Button>
          <Button size="large">Large</Button>
        </div>
      </section>

      {/* States */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: '#1F2937' }}>States</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <Button>Default</Button>
          <Button disabled>Disabled</Button>
          <Button isLoading>Loading</Button>
        </div>
      </section>

      {/* Full Width */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: '#1F2937' }}>Full Width</h2>
        <Button fullWidth>Full Width Button</Button>
      </section>

      {/* Combinations */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ marginBottom: '16px', color: '#1F2937' }}>Combinations</h2>
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
        <h2 style={{ marginBottom: '16px', color: '#1F2937' }}>
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
          <h3 style={{ marginBottom: '8px', color: '#111827' }}>
            Connect Your First Account
          </h3>
          <p style={{ marginBottom: '16px', color: '#6B7280' }}>
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
          <h3 style={{ marginBottom: '16px', color: '#111827' }}>
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
          border: '1px solid #E5E7EB',
          maxWidth: '600px',
        }}
      >
        <h3 style={{ marginBottom: '8px', color: '#111827', fontSize: '14px' }}>
          ♿ Accessibility Features
        </h3>
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#6B7280', fontSize: '14px' }}>
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
