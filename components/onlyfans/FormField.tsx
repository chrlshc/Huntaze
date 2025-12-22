/**
 * FormField Component
 * Feature: onlyfans-settings-saas-transformation
 * Property 7: Form Label Positioning
 * Property 8: Validation Message Presence
 * 
 * Consistent form field pattern with proper label/helper hierarchy.
 * 
 * @requirements
 * - Label above input (14px semibold)
 * - Helper text below input (12px, #6B7280)
 * - Error text (12px, #EF4444)
 * - 4px spacing between elements
 * - Required indicator support
 */

import React from 'react';
import './FormField.css';

export interface FormFieldProps {
  /** Field label */
  label: string;
  /** Field ID (for label association) */
  id: string;
  /** Input element */
  children: React.ReactNode;
  /** Optional helper text below input */
  helperText?: string;
  /** Optional error message */
  error?: string;
  /** Mark field as required */
  required?: boolean;
  /** Optional CSS class name */
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  id,
  children,
  helperText,
  error,
  required = false,
  className = '',
}) => {
  return (
    <div className={`of-form-field ${error ? 'of-form-field--error' : ''} ${className}`}>
      {/* Label */}
      <label
        htmlFor={id}
        className="of-form-field__label"
      >
        {label}
        {required && (
          <span className="of-form-field__required" aria-label="required">
            *
          </span>
        )}
      </label>

      {/* Input Element */}
      <div className="of-form-field__input">
        {children}
      </div>

      {/* Helper Text or Error Message */}
      {error ? (
        <p className="of-form-field__error" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p className="of-form-field__helper">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
