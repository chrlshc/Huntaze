'use client';

import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, CSSProperties } from 'react';

interface PolarisFieldProps {
  label: string;
  helpText?: string;
  error?: string;
  children: ReactNode;
}

interface PolarisInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

interface PolarisSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  children: ReactNode;
}

interface PolarisTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

const inputBaseStyle: CSSProperties = {
  width: '100%',
  height: '36px',
  padding: '0 12px',
  fontSize: '14px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  color: 'rgba(48, 48, 48, 1)',
  backgroundColor: 'rgba(255, 255, 255, 1)',
  border: '1px solid rgba(227, 227, 227, 1)',
  borderRadius: '4px',
  outline: 'none',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
};

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: 'rgba(48, 48, 48, 1)',
  marginBottom: '4px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

const helpTextStyle: CSSProperties = {
  fontSize: '12px',
  color: 'rgba(97, 97, 97, 1)',
  marginTop: '4px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
};

export function PolarisField({ label, helpText, error, children }: PolarisFieldProps) {
  return (
    <div style={{ marginBottom: '0' }}>
      <label style={labelStyle}>
        {label}
      </label>
      {children}
      {helpText && !error && (
        <p style={helpTextStyle}>{helpText}</p>
      )}
      {error && (
        <p style={{ ...helpTextStyle, color: 'rgba(215, 44, 13, 1)' }}>{error}</p>
      )}
    </div>
  );
}

export function PolarisInput({ error, className = '', style, ...props }: PolarisInputProps) {
  return (
    <input
      className={`polaris-input ${className}`}
      style={{
        ...inputBaseStyle,
        ...(error ? { borderColor: 'rgba(215, 44, 13, 1)' } : {}),
        ...style,
      }}
      {...props}
    />
  );
}

export function PolarisSelect({ error, children, className = '', style, ...props }: PolarisSelectProps) {
  return (
    <select
      className={`polaris-select ${className}`}
      style={{
        ...inputBaseStyle,
        cursor: 'pointer',
        ...(error ? { borderColor: 'rgba(215, 44, 13, 1)' } : {}),
        ...style,
      }}
      {...props}
    >
      {children}
    </select>
  );
}

export function PolarisTextarea({ error, className = '', style, ...props }: PolarisTextareaProps) {
  return (
    <textarea
      className={`polaris-textarea ${className}`}
      style={{
        width: '100%',
        padding: '8px 12px',
        fontSize: '14px',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        color: 'rgba(48, 48, 48, 1)',
        backgroundColor: 'rgba(255, 255, 255, 1)',
        border: '1px solid rgba(227, 227, 227, 1)',
        borderRadius: '4px',
        outline: 'none',
        resize: 'vertical',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        ...(error ? { borderColor: 'rgba(215, 44, 13, 1)' } : {}),
        ...style,
      }}
      {...props}
    />
  );
}

export function PolarisHelpText({ children }: { children: ReactNode }) {
  return (
    <p style={helpTextStyle}>
      {children}
    </p>
  );
}
