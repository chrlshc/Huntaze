'use client';

import React, { useId } from 'react';
import { cn } from '@/lib/utils';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'url' | 'numeric' | 'decimal' | 'search';
  variant?: 'dense' | 'standard';
}

export function FormInput({
  label,
  error,
  helperText,
  className = '',
  id,
  inputMode,
  variant = 'standard',
  ...props
}: FormInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="mb-[var(--spacing-4)]">
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "block",
            "text-[var(--text-sm)]",
            "font-[var(--font-weight-medium)]",
            "text-[var(--color-text-primary)]",
            "mb-[var(--spacing-2)]"
          )}
        >
          {label}
          {props.required && <span className="text-[var(--color-error)] ml-[var(--spacing-1)]">*</span>}
        </label>
      )}
      <input
        id={inputId}
        inputMode={inputMode}
        className={cn(
          // Base styles
          "w-full",
          "border-[length:var(--border-width-thin)]",
          "rounded-[var(--input-border-radius)]",
          // Colors from design tokens
          "bg-[var(--color-bg-input)]",
          "text-[var(--color-text-primary)]",
          "placeholder:text-[var(--color-text-muted)]",
          // Height based on variant (32px dense, 40px standard)
          variant === 'dense' ? "h-[var(--input-height-dense)]" : "h-[var(--input-height-standard)]",
          // Padding using 4px grid system
          "px-[var(--spacing-4)]",
          "py-[var(--spacing-2)]",
          // Focus states
          "focus:outline-none",
          "focus:ring-[length:var(--focus-ring-width)]",
          "focus:ring-offset-[length:var(--focus-ring-offset)]",
          // Disabled state
          "disabled:opacity-50",
          "disabled:cursor-not-allowed",
          // Transitions
          "transition-[border-color,box-shadow]",
          "duration-[var(--transition-base)]",
          // Border and focus colors based on error state
          error 
            ? "border-[var(--color-error)] focus:ring-[var(--color-error)]/30 focus:border-[var(--color-error)]"
            : "border-[var(--color-border-subtle)] focus:ring-[var(--focus-ring-color)] focus:border-[var(--color-border-focus)]",
          className
        )}
        {...props}
      />
      {error && (
        <p 
          className={cn(
            "mt-[var(--spacing-2)]",
            "text-[var(--text-sm)]",
            "text-[var(--color-error)]"
          )} 
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p 
          className={cn(
            "mt-[var(--spacing-2)]",
            "text-[var(--text-sm)]",
            "text-[var(--color-text-muted)]"
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function FormTextarea({
  label,
  error,
  helperText,
  className = '',
  id,
  ...props
}: FormTextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className="mb-[var(--spacing-4)]">
      {label && (
        <label
          htmlFor={textareaId}
          className={cn(
            "block",
            "text-[var(--text-sm)]",
            "font-[var(--font-weight-medium)]",
            "text-[var(--color-text-primary)]",
            "mb-[var(--spacing-2)]"
          )}
        >
          {label}
          {props.required && <span className="text-[var(--color-error)] ml-[var(--spacing-1)]">*</span>}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          // Base styles
          "w-full",
          "border-[length:var(--border-width-thin)]",
          "rounded-[var(--input-border-radius)]",
          // Colors from design tokens
          "bg-[var(--color-bg-input)]",
          "text-[var(--color-text-primary)]",
          "placeholder:text-[var(--color-text-muted)]",
          // Padding using 4px grid system
          "px-[var(--spacing-4)]",
          "py-[var(--spacing-3)]",
          // Focus states
          "focus:outline-none",
          "focus:ring-[length:var(--focus-ring-width)]",
          "focus:ring-offset-[length:var(--focus-ring-offset)]",
          // Disabled state
          "disabled:opacity-50",
          "disabled:cursor-not-allowed",
          // Transitions
          "transition-[border-color,box-shadow]",
          "duration-[var(--transition-base)]",
          // Resize
          "resize-none",
          // Border and focus colors based on error state
          error 
            ? "border-[var(--color-error)] focus:ring-[var(--color-error)]/30 focus:border-[var(--color-error)]"
            : "border-[var(--color-border-subtle)] focus:ring-[var(--focus-ring-color)] focus:border-[var(--color-border-focus)]",
          className
        )}
        {...props}
      />
      {error && (
        <p 
          className={cn(
            "mt-[var(--spacing-2)]",
            "text-[var(--text-sm)]",
            "text-[var(--color-error)]"
          )} 
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p 
          className={cn(
            "mt-[var(--spacing-2)]",
            "text-[var(--text-sm)]",
            "text-[var(--color-text-muted)]"
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: { value: string; label: string }[];
  variant?: 'dense' | 'standard';
}

export function FormSelect({
  label,
  error,
  helperText,
  options,
  className = '',
  id,
  variant = 'standard',
  ...props
}: FormSelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <div className="mb-[var(--spacing-4)]">
      {label && (
        <label
          htmlFor={selectId}
          className={cn(
            "block",
            "text-[var(--text-sm)]",
            "font-[var(--font-weight-medium)]",
            "text-[var(--color-text-primary)]",
            "mb-[var(--spacing-2)]"
          )}
        >
          {label}
          {props.required && <span className="text-[var(--color-error)] ml-[var(--spacing-1)]">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          // Base styles
          "w-full",
          "border-[length:var(--border-width-thin)]",
          "rounded-[var(--input-border-radius)]",
          // Colors from design tokens
          "bg-[var(--color-bg-input)]",
          "text-[var(--color-text-primary)]",
          // Height based on variant (32px dense, 40px standard)
          variant === 'dense' ? "h-[var(--input-height-dense)]" : "h-[var(--input-height-standard)]",
          // Padding using 4px grid system
          "px-[var(--spacing-4)]",
          "py-[var(--spacing-2)]",
          // Focus states
          "focus:outline-none",
          "focus:ring-[length:var(--focus-ring-width)]",
          "focus:ring-offset-[length:var(--focus-ring-offset)]",
          // Disabled state
          "disabled:opacity-50",
          "disabled:cursor-not-allowed",
          // Transitions
          "transition-[border-color,box-shadow]",
          "duration-[var(--transition-base)]",
          // Border and focus colors based on error state
          error 
            ? "border-[var(--color-error)] focus:ring-[var(--color-error)]/30 focus:border-[var(--color-error)]"
            : "border-[var(--color-border-subtle)] focus:ring-[var(--focus-ring-color)] focus:border-[var(--color-border-focus)]",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p 
          className={cn(
            "mt-[var(--spacing-2)]",
            "text-[var(--text-sm)]",
            "text-[var(--color-error)]"
          )} 
          role="alert"
        >
          {error}
        </p>
      )}
      {helperText && !error && (
        <p 
          className={cn(
            "mt-[var(--spacing-2)]",
            "text-[var(--text-sm)]",
            "text-[var(--color-text-muted)]"
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}

interface FormCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  helperText?: string;
}

export function FormCheckbox({
  label,
  helperText,
  className = '',
  id,
  ...props
}: FormCheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="mb-[var(--spacing-4)]">
      <div className="flex items-start">
        <input
          type="checkbox"
          id={checkboxId}
          className={cn(
            // Size (20px = 5 * 4px, follows 4px grid)
            "min-w-[20px]",
            "min-h-[20px]",
            "mt-[var(--spacing-1)]",
            // Border and colors
            "rounded-[var(--border-radius-sm)]",
            "border-[var(--color-border-subtle)]",
            "text-[var(--color-accent-primary)]",
            "bg-[var(--color-bg-input)]",
            // Focus states
            "focus:ring-[length:var(--focus-ring-width)]",
            "focus:ring-[var(--focus-ring-color)]",
            // Transitions
            "transition-[border-color,background-color,box-shadow]",
            "duration-[var(--transition-base)]",
            className
          )}
          {...props}
        />
        <label
          htmlFor={checkboxId}
          className={cn(
            "ml-[var(--spacing-3)]",
            "text-[var(--text-sm)]",
            "text-[var(--color-text-primary)]",
            "cursor-pointer"
          )}
        >
          {label}
        </label>
      </div>
      {helperText && (
        <p 
          className={cn(
            "mt-[var(--spacing-2)]",
            "ml-[28px]", // 20px checkbox + 8px spacing
            "text-[var(--text-sm)]",
            "text-[var(--color-text-muted)]"
          )}
        >
          {helperText}
        </p>
      )}
    </div>
  );
}
