/**
 * Form Example Component
 * 
 * Demonstrates the migrated form components using the Linear design system:
 * - Design token usage for colors, spacing, and typography
 * - Standard heights (32px dense, 40px standard)
 * - 4px grid system compliance
 * - CenteredContainer for proper layout
 * - Skeleton loading states
 * 
 * Part of the Linear UI Performance Refactor
 * Validates: Requirements 1.1-1.7, 2.1-2.4, 3.1-3.5, 4.1-4.5, 6.1-6.5
 */

'use client';

import React, { useState } from 'react';
import { FormInput, FormTextarea, FormSelect, FormCheckbox } from './FormInput';
import { Button } from '@/components/ui/button';
import { CenteredContainer } from '@/components/layout/CenteredContainer';
import { SkeletonScreen } from '@/components/layout/SkeletonScreen';

export function FormExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'general',
    message: '',
    subscribe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate loading state
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsLoading(false);
    
    // Reset form
    setFormData({
      name: '',
      email: '',
      category: 'general',
      message: '',
      subscribe: false,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <CenteredContainer maxWidth="sm" padding={24}>
      <div className="py-[var(--spacing-8)]">
        <div className="mb-[var(--spacing-8)]">
          <h1 className="text-[var(--text-3xl)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)] mb-[var(--spacing-2)]">
            Contact Form
          </h1>
          <p className="text-[var(--text-base)] text-[var(--color-text-secondary)]">
            Example form using the Linear design system with design tokens
          </p>
        </div>

        {isLoading ? (
          <SkeletonScreen variant="form" animate={true} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-[var(--spacing-6)]">
            {/* Standard height inputs (40px) */}
            <FormInput
              label="Full Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
              error={errors.name}
              helperText="We'll use this to personalize your experience"
              variant="standard"
            />

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              required
              error={errors.email}
              variant="standard"
            />

            {/* Dense height input (32px) */}
            <FormInput
              label="Phone (Optional)"
              name="phone"
              type="tel"
              placeholder="(555) 123-4567"
              variant="dense"
              helperText="Dense variant (32px height)"
            />

            <FormSelect
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              options={[
                { value: 'general', label: 'General Inquiry' },
                { value: 'support', label: 'Technical Support' },
                { value: 'sales', label: 'Sales Question' },
                { value: 'feedback', label: 'Feedback' },
              ]}
              variant="standard"
            />

            <FormTextarea
              label="Message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us more about your inquiry..."
              rows={5}
              required
              error={errors.message}
              helperText="Please provide as much detail as possible"
            />

            <FormCheckbox
              label="Subscribe to newsletter"
              name="subscribe"
              checked={formData.subscribe}
              onChange={handleChange}
              helperText="Get updates about new features and improvements"
            />

            <div className="flex gap-[var(--spacing-3)] pt-[var(--spacing-4)]">
              <Button
                type="submit"
                variant="primary"
                size="md"
              >
                Submit Form
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setFormData({
                    name: '',
                    email: '',
                    category: 'general',
                    message: '',
                    subscribe: false,
                  });
                  setErrors({});
                }}
              >
                Reset
              </Button>
              
              <Button
                type="button"
                variant="outline"
                size="sm"
              >
                Dense Button (32px)
              </Button>
            </div>
          </form>
        )}

        {/* Design System Reference */}
        <div className="mt-[var(--spacing-12)] p-[var(--spacing-6)] bg-[var(--color-bg-surface)] border-[length:var(--border-width-thin)] border-[var(--color-border-subtle)] rounded-[var(--border-radius-lg)]">
          <h3 className="text-[var(--text-lg)] font-[var(--font-weight-medium)] text-[var(--color-text-primary)] mb-[var(--spacing-4)]">
            Design System Features
          </h3>
          <ul className="space-y-[var(--spacing-2)] text-[var(--text-sm)] text-[var(--color-text-secondary)]">
            <li>✓ Design tokens for colors, spacing, and typography</li>
            <li>✓ Standard input height: 40px (2.5rem)</li>
            <li>✓ Dense input height: 32px (2rem)</li>
            <li>✓ Standard button height: 40px (2.5rem)</li>
            <li>✓ Dense button height: 32px (2rem)</li>
            <li>✓ 4px grid system for all spacing</li>
            <li>✓ Midnight Violet color palette</li>
            <li>✓ Inter typography (Medium/Regular weights)</li>
            <li>✓ CenteredContainer with max-width constraints</li>
            <li>✓ Skeleton loading states</li>
          </ul>
        </div>
      </div>
    </CenteredContainer>
  );
}

export default FormExample;
