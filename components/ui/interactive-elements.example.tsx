/**
 * Interactive Elements Examples - Task 41
 * 
 * This file demonstrates the enhanced visual distinction for all interactive elements.
 * Requirements: 9.4 - Clear visual affordance through color, borders, or shadows
 * 
 * All examples show proper:
 * - Distinct colors for interactivity
 * - Visible borders (minimum 0.12 opacity)
 * - Shadows for depth
 * - Clear hover states
 * - Focus rings for keyboard navigation
 */

import { Button } from "./button";
import { Input } from "./input";
import { Link } from "./link";
import { Card } from "./card";

export function InteractiveElementsExample() {
  return (
    <div className="space-y-12 p-8 bg-[var(--bg-primary)]">
      {/* Button Examples */}
      <section>
        <h2 className="text-[var(--text-2xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-6">
          Buttons - All Variants Have Clear Visual Distinction
        </h2>
        
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">
              Primary - Solid Color + Border + Shadow
            </Button>
            <Button variant="secondary">
              Secondary - Border + Subtle Background
            </Button>
            <Button variant="outline">
              Outline - Clear Border + Transparent
            </Button>
            <Button variant="ghost">
              Ghost - Minimal with Hover
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button variant="tonal">
              Tonal - Subtle Background + Border
            </Button>
            <Button variant="danger">
              Danger - High Contrast Error Color
            </Button>
            <Button variant="gradient">
              Gradient - Eye-catching with Shadow
            </Button>
            <Button variant="link">
              Link - Color + Underline
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" size="xl">Extra Large</Button>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" loading>Loading...</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </div>
      </section>

      {/* Input Examples */}
      <section>
        <h2 className="text-[var(--text-2xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-6">
          Inputs - Clear Borders + Focus Rings
        </h2>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-[var(--text-sm)] text-[var(--text-secondary)] mb-2">
              Standard Input
            </label>
            <Input placeholder="Clear border (0.12 opacity minimum)" />
            <p className="mt-1 text-[var(--text-xs)] text-[var(--text-primary)]">
              Hover to see emphasized border (0.18 opacity)
            </p>
          </div>
          
          <div>
            <label className="block text-[var(--text-sm)] text-[var(--text-secondary)] mb-2">
              Input with Error
            </label>
            <Input 
              placeholder="Error state with high contrast" 
              error="This field is required"
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-sm)] text-[var(--text-secondary)] mb-2">
              Dense Variant
            </label>
            <Input 
              variant="dense"
              placeholder="Compact input for tight layouts" 
            />
          </div>
          
          <div>
            <label className="block text-[var(--text-sm)] text-[var(--text-secondary)] mb-2">
              Disabled Input
            </label>
            <Input 
              placeholder="Disabled state" 
              disabled
            />
          </div>
        </div>
      </section>

      {/* Link Examples */}
      <section>
        <h2 className="text-[var(--text-2xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-6">
          Links - Color + Underline for Clear Affordance
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-[var(--text-base)] font-[var(--font-weight-medium)] text-[var(--text-primary)] mb-2">
              Default Links
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link href="/features">Features</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/docs">Documentation</Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-[var(--text-base)] font-[var(--font-weight-medium)] text-[var(--text-primary)] mb-2">
              Subtle Links
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link variant="subtle" href="/about">About Us</Link>
              <Link variant="subtle" href="/contact">Contact</Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-[var(--text-base)] font-[var(--font-weight-medium)] text-[var(--text-primary)] mb-2">
              Inline Links (in text)
            </h3>
            <p className="text-[var(--text-base)] text-[var(--text-primary)]">
              Check out our{" "}
              <Link variant="inline" href="/docs">
                comprehensive documentation
              </Link>{" "}
              to learn more about the features and{" "}
              <Link variant="inline" href="/api">
                API reference
              </Link>
              .
            </p>
          </div>
          
          <div>
            <h3 className="text-[var(--text-base)] font-[var(--font-weight-medium)] text-[var(--text-primary)] mb-2">
              External Links
            </h3>
            <div className="flex flex-wrap gap-4">
              <Link href="https://github.com" external>
                GitHub
              </Link>
              <Link href="https://twitter.com" external>
                Twitter
              </Link>
            </div>
          </div>
          
          <div>
            <h3 className="text-[var(--text-base)] font-[var(--font-weight-medium)] text-[var(--text-primary)] mb-2">
              Navigation Links
            </h3>
            <nav className="flex flex-col gap-2 max-w-xs">
              <Link variant="nav" href="/dashboard">Dashboard</Link>
              <Link variant="nav" href="/analytics">Analytics</Link>
              <Link variant="nav" href="/settings">Settings</Link>
            </nav>
          </div>
        </div>
      </section>

      {/* Card Examples */}
      <section>
        <h2 className="text-[var(--text-2xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-6">
          Cards - Borders + Shadows for Visual Distinction
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <h3 className="text-[var(--text-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-2">
              Default Card
            </h3>
            <p className="text-[var(--text-sm)] text-[var(--text-primary)]">
              Uses nesting-level-1 with visible border and inner glow shadow.
              Hover to see emphasized border.
            </p>
          </Card>
          
          <Card variant="glass">
            <h3 className="text-[var(--text-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-2">
              Glass Card
            </h3>
            <p className="text-[var(--text-sm)] text-[var(--text-primary)]">
              Glass morphism effect with backdrop blur and visible border.
            </p>
          </Card>
          
          <Card variant="elevated">
            <h3 className="text-[var(--text-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-2">
              Elevated Card
            </h3>
            <p className="text-[var(--text-sm)] text-[var(--text-primary)]">
              Enhanced contrast with zinc-800 background on zinc-950 page.
            </p>
          </Card>
          
          <Card nested>
            <h3 className="text-[var(--text-lg)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-2">
              Nested Card
            </h3>
            <p className="text-[var(--text-sm)] text-[var(--text-primary)] mb-4">
              Uses nesting-level-2 for progressive lightening.
            </p>
            <Card nestingLevel={3}>
              <p className="text-[var(--text-sm)] text-[var(--text-primary)]">
                Level 3 nested card with strongest border.
              </p>
            </Card>
          </Card>
        </div>
      </section>

      {/* Combined Example */}
      <section>
        <h2 className="text-[var(--text-2xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-6">
          Combined Example - All Interactive Elements
        </h2>
        
        <Card>
          <h3 className="text-[var(--text-xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-4">
            Contact Form
          </h3>
          
          <form className="space-y-4">
            <div>
              <label className="block text-[var(--text-sm)] text-[var(--text-secondary)] mb-2">
                Name
              </label>
              <Input placeholder="Enter your name" />
            </div>
            
            <div>
              <label className="block text-[var(--text-sm)] text-[var(--text-secondary)] mb-2">
                Email
              </label>
              <Input type="email" placeholder="your@email.com" />
            </div>
            
            <div>
              <label className="block text-[var(--text-sm)] text-[var(--text-secondary)] mb-2">
                Message
              </label>
              <textarea
                className="w-full h-24 px-[var(--space-3)] py-[var(--space-2)] bg-[var(--bg-input)] border-[length:var(--input-border-width)] border-[var(--border-default)] rounded-[var(--input-radius)] text-[var(--text-primary)] placeholder:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-[length:var(--focus-ring-width)] focus-visible:ring-[var(--focus-ring-color)] focus-visible:border-[var(--border-emphasis)] hover:border-[var(--border-emphasis)] transition-[border-color,box-shadow] duration-[var(--transition-base)]"
                placeholder="Your message..."
              />
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="primary" type="submit">
                Send Message
              </Button>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </div>
            
            <p className="text-[var(--text-sm)] text-[var(--text-primary)]">
              By submitting, you agree to our{" "}
              <Link variant="inline" href="/terms">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link variant="inline" href="/privacy">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        </Card>
      </section>

      {/* Accessibility Notes */}
      <section>
        <Card variant="elevated">
          <h2 className="text-[var(--text-2xl)] font-[var(--font-weight-semibold)] text-[var(--text-primary)] mb-4">
            Accessibility Features
          </h2>
          
          <ul className="space-y-2 text-[var(--text-sm)] text-[var(--text-secondary)]">
            <li>✅ All interactive elements have 3:1 contrast ratio minimum</li>
            <li>✅ Focus rings are clearly visible for keyboard navigation</li>
            <li>✅ Hover states provide clear feedback</li>
            <li>✅ Color is not the only indicator (borders/shadows also used)</li>
            <li>✅ Touch targets meet 44x44px minimum</li>
            <li>✅ External links have visual indicators</li>
            <li>✅ Error states use high contrast colors</li>
            <li>✅ Disabled states are clearly distinguishable</li>
          </ul>
          
          <div className="mt-6 p-4 bg-[var(--bg-glass)] rounded-[var(--radius-lg)] border border-[var(--border-default)]">
            <p className="text-[var(--text-sm)] text-[var(--text-primary)] font-[var(--font-weight-medium)]">
              💡 Tip: Try navigating this page with Tab key to see focus rings in action!
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
