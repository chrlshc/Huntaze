'use client';

import React, { useState } from 'react';
import { Alert } from './alert';
import { Button } from "@/components/ui/button";

/**
 * Alert Component Examples
 * 
 * Demonstrates all variants and features of the Alert component.
 */
export function AlertExamples() {
  const [showDismissible, setShowDismissible] = useState(true);
  const [showAutoDismiss, setShowAutoDismiss] = useState(true);

  return (
    <div style={{ 
      padding: 'var(--space-8)', 
      background: 'var(--bg-primary)',
      minHeight: '100vh',
    }}>
      <h1 style={{ 
        fontSize: 'var(--text-3xl)', 
        fontWeight: 'var(--font-weight-bold)',
        color: 'var(--text-primary)',
        marginBottom: 'var(--space-8)',
      }}>
        Alert Component Examples
      </h1>

      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 'var(--space-6)',
        maxWidth: '800px',
      }}>
        {/* Example 1: Success Alert */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            1. Success Alert
          </h2>
          <Alert variant="success" title="Success!">
            Your changes have been saved successfully.
          </Alert>
        </section>

        {/* Example 2: Warning Alert */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            2. Warning Alert
          </h2>
          <Alert variant="warning" title="Warning">
            Your session will expire in 5 minutes. Please save your work.
          </Alert>
        </section>

        {/* Example 3: Error Alert */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            3. Error Alert
          </h2>
          <Alert variant="error" title="Error">
            Failed to save changes. Please try again or contact support.
          </Alert>
        </section>

        {/* Example 4: Info Alert */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            4. Info Alert
          </h2>
          <Alert variant="info" title="Information">
            New features are available! Check out the latest updates in your dashboard.
          </Alert>
        </section>

        {/* Example 5: Dismissible Alert */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            5. Dismissible Alert
          </h2>
          {showDismissible ? (
            <Alert 
              variant="info" 
              title="Dismissible Alert"
              dismissible
              onDismiss={() => setShowDismissible(false)}
            >
              Click the X button to dismiss this alert.
            </Alert>
          ) : (
            <Button 
              variant="primary" 
              onClick={() => setShowDismissible(true)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-primary)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Show Alert Again
            </Button>
          )}
        </section>

        {/* Example 6: Auto-dismiss Alert */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            6. Auto-dismiss Alert (5 seconds)
          </h2>
          {showAutoDismiss ? (
            <Alert 
              variant="success" 
              title="Auto-dismiss"
              autoDismiss={5000}
              dismissible
              onDismiss={() => setShowAutoDismiss(false)}
            >
              This alert will automatically disappear after 5 seconds.
            </Alert>
          ) : (
            <Button 
              variant="primary" 
              onClick={() => setShowAutoDismiss(true)}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--accent-success)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                cursor: 'pointer',
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-weight-medium)',
              }}
            >
              Show Alert Again
            </Button>
          )}
        </section>

        {/* Example 7: Alert without Title */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            7. Alert without Title
          </h2>
          <Alert variant="info">
            This is a simple alert without a title. It still maintains consistent styling.
          </Alert>
        </section>

        {/* Example 8: Alert with Custom Icon */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            8. Alert with Custom Icon
          </h2>
          <Alert 
            variant="success" 
            title="Custom Icon"
            icon={
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 2L12.5 7L18 8L14 12L15 18L10 15L5 18L6 12L2 8L7.5 7L10 2Z" fill="currentColor"/>
              </svg>
            }
          >
            You can provide a custom icon to override the default variant icon.
          </Alert>
        </section>

        {/* Example 9: Long Content Alert */}
        <section>
          <h2 style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--text-primary)',
            marginBottom: 'var(--space-3)',
          }}>
            9. Alert with Long Content
          </h2>
          <Alert variant="warning" title="Important Notice" dismissible>
            This is an alert with longer content to demonstrate how the component handles
            multiple lines of text. The layout remains consistent and readable even with
            more content. The dismiss button stays aligned at the top right, and the icon
            maintains its position at the top left.
          </Alert>
        </section>
      </div>
    </div>
  );
}

export default AlertExamples;
