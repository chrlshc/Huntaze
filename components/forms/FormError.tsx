/**
 * Accessible Form Error Component
 * WCAG AA compliant error display with multi-modal feedback
 * 
 * Requirements:
 * - 5.1: WCAG AA contrast (4.5:1 minimum)
 * - 5.2: Multi-modal error display (color + icons)
 * - 5.3: Error summary list for multiple errors
 */

import { AlertCircle, XCircle } from 'lucide-react';

interface FormErrorProps {
  /** Single error message */
  error?: string;
  /** Multiple errors */
  errors?: string[];
  /** Field ID for ARIA association */
  fieldId?: string;
  /** Show as inline error (default) or summary */
  variant?: 'inline' | 'summary';
  /** Custom className */
  className?: string;
}

export function FormError({ 
  error, 
  errors, 
  fieldId,
  variant = 'inline',
  className = '' 
}: FormErrorProps) {
  const errorList = errors || (error ? [error] : []);
  
  if (errorList.length === 0) {
    return null;
  }

  // Inline error for single field
  if (variant === 'inline') {
    return (
      <div
        id={fieldId ? `${fieldId}-error` : undefined}
        role="alert"
        aria-live="polite"
        className={`
          mt-2 flex items-start gap-2
          text-sm text-red-700
          ${className}
        `}
      >
        <AlertCircle 
          className="w-4 h-4 flex-shrink-0 mt-0.5" 
          aria-hidden="true"
        />
        <span>{errorList[0]}</span>
      </div>
    );
  }

  // Summary for multiple errors
  return (
    <div
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      className={`
        bg-red-50 border-2 border-red-200 rounded-lg p-4
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <XCircle 
          className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" 
          aria-hidden="true"
        />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 mb-2">
            {errorList.length === 1 
              ? 'There is a problem with your submission'
              : `There are ${errorList.length} problems with your submission`
            }
          </h3>
          <ul className="space-y-1 text-sm text-red-800">
            {errorList.map((err, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-600 font-bold" aria-hidden="true">•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * Field Error - Inline error for form fields
 */
export function FieldError({ 
  error, 
  fieldId 
}: { 
  error?: string; 
  fieldId: string;
}) {
  if (!error) return null;

  return (
    <FormError 
      error={error} 
      fieldId={fieldId} 
      variant="inline"
    />
  );
}

/**
 * Error Summary - Summary of all form errors
 */
export function ErrorSummary({ 
  errors,
  className 
}: { 
  errors: string[];
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <FormError 
      errors={errors} 
      variant="summary"
      className={className}
    />
  );
}
