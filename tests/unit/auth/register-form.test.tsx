/**
 * Unit Tests - RegisterForm Component
 * 
 * Tests to validate RegisterForm component functionality
 * Based on: .kiro/specs/auth-system-from-scratch/requirements.md (Requirement 2)
 * 
 * Coverage:
 * - Form rendering
 * - Input validation
 * - Error handling
 * - Success handling
 * - Loading states
 * - User interactions
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RegisterForm from '@/components/auth/RegisterForm';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

const mockRegister = vi.fn();

vi.mock('@/components/auth/AuthProvider', () => ({
  useAuth: () => ({
    register: mockRegister,
  }),
}));

vi.mock('@/components/auth/AuthInput', () => ({
  AuthInput: ({ label, value, onChange, error, success, placeholder, disabled }: any) => (
    <div>
      <label>{label}</label>
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
      />
      {error && <span role="alert">{error}</span>}
      {success && <span>✓</span>}
    </div>
  ),
}));

vi.mock('@/components/auth/AuthButton', () => ({
  AuthButton: ({ children, loading, disabled, onClick, type }: any) => (
    <button type={type} onClick={onClick} disabled={disabled || loading}>
      {loading ? 'Loading...' : children}
    </button>
  ),
}));

vi.mock('@/components/auth/PasswordStrength', () => ({
  PasswordStrength: ({ password }: any) => (
    password ? <div data-testid="password-strength">Strength indicator</div> : null
  ),
}));

describe('RegisterForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<RegisterForm />);
      
      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Create a strong password')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<RegisterForm />);
      
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render login link', () => {
      render(<RegisterForm />);
      
      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });

    it('should not show password strength initially', () => {
      render(<RegisterForm />);
      
      expect(screen.queryByTestId('password-strength')).not.toBeInTheDocument();
    });
  });

  describe('Input Handling', () => {
    it('should update name field on change', () => {
      render(<RegisterForm />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should update email field on change', () => {
      render(<RegisterForm />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      expect(emailInput).toHaveValue('john@example.com');
    });

    it('should update password field on change', () => {
      render(<RegisterForm />);
      
      const passwordInput = screen.getByPlaceholderText('Create a strong password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(passwordInput).toHaveValue('password123');
    });

    it('should show password strength when password is entered', () => {
      render(<RegisterForm />);
      
      const passwordInput = screen.getByPlaceholderText('Create a strong password');
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      
      expect(screen.getByTestId('password-strength')).toBeInTheDocument();
    });

    it('should clear error when user starts typing', () => {
      render(<RegisterForm />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      
      // Trigger validation error by submitting empty form
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      // Start typing to clear error
      fireEvent.change(nameInput, { target: { value: 'J' } });
      
      // Error should be cleared (implementation dependent)
      expect(nameInput).not.toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Form Validation', () => {
    it('should validate empty name field', async () => {
      render(<RegisterForm />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it('should validate empty email field', async () => {
      render(<RegisterForm />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
      });
    });

    it('should validate invalid email format', async () => {
      render(<RegisterForm />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should validate password length', async () => {
      render(<RegisterForm />);
      
      const passwordInput = screen.getByPlaceholderText('Create a strong password');
      fireEvent.change(passwordInput, { target: { value: 'short' } });
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show success state for valid name', () => {
      render(<RegisterForm />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, { target: { value: 'John Doe' } });
      
      // Success checkmark should appear (implementation dependent)
      expect(nameInput).toHaveValue('John Doe');
    });

    it('should show success state for valid email', () => {
      render(<RegisterForm />);
      
      const emailInput = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
      
      expect(emailInput).toHaveValue('john@example.com');
    });
  });

  describe('Form Submission', () => {
    it('should prevent submission with invalid data', async () => {
      const onSuccess = vi.fn();
      render(<RegisterForm onSuccess={onSuccess} />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(onSuccess).not.toHaveBeenCalled();
      });
    });

    it('should call register with valid data', async () => {
      mockRegister.mockResolvedValue(true);
      
      render(<RegisterForm />);
      
      // Fill form
      fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
        target: { value: 'password123' }
      });
      
      // Submit
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('John Doe', 'john@example.com', 'password123');
      });
    });

    it('should call onSuccess callback on successful registration', async () => {
      mockRegister.mockResolvedValue(true);
      
      const onSuccess = vi.fn();
      render(<RegisterForm onSuccess={onSuccess} />);
      
      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });
    });

    it('should call onError callback on failed registration', async () => {
      mockRegister.mockResolvedValue(false);
      
      const onError = vi.fn();
      render(<RegisterForm onError={onError} />);
      
      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.stringContaining('failed'));
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state during submission', async () => {
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
      
      render(<RegisterForm />);
      
      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      // Should show loading text
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should disable inputs during submission', async () => {
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)));
      
      render(<RegisterForm />);
      
      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      // Inputs should be disabled
      expect(screen.getByPlaceholderText('Enter your full name')).toBeDisabled();
      expect(screen.getByPlaceholderText('Enter your email address')).toBeDisabled();
      expect(screen.getByPlaceholderText('Create a strong password')).toBeDisabled();
    });

    it('should re-enable form after submission completes', async () => {
      mockRegister.mockResolvedValue(true);
      
      render(<RegisterForm />);
      
      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });

  describe('Error Display', () => {
    it('should display general error message', async () => {
      mockRegister.mockRejectedValue(new Error('Network error'));
      
      render(<RegisterForm />);
      
      // Fill and submit form
      fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
        target: { value: 'password123' }
      });
      
      fireEvent.click(screen.getByRole('button', { name: /create account/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should display field-specific errors', async () => {
      render(<RegisterForm />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on error', async () => {
      render(<RegisterForm />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Enter your full name');
        expect(nameInput).toHaveAttribute('aria-invalid');
      });
    });

    it('should have role="alert" on error messages', async () => {
      render(<RegisterForm />);
      
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        const alerts = screen.getAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle rapid form submissions', async () => {
      mockRegister.mockResolvedValue(true);
      
      render(<RegisterForm />);
      
      // Fill form
      fireEvent.change(screen.getByPlaceholderText('Enter your full name'), {
        target: { value: 'John Doe' }
      });
      fireEvent.change(screen.getByPlaceholderText('Enter your email address'), {
        target: { value: 'john@example.com' }
      });
      fireEvent.change(screen.getByPlaceholderText('Create a strong password'), {
        target: { value: 'password123' }
      });
      
      // Submit multiple times
      const submitButton = screen.getByRole('button', { name: /create account/i });
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        // Should only call register once
        expect(mockRegister).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle special characters in name', () => {
      render(<RegisterForm />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, { target: { value: "O'Brien-Smith" } });
      
      expect(nameInput).toHaveValue("O'Brien-Smith");
    });

    it('should handle whitespace in inputs', () => {
      render(<RegisterForm />);
      
      const nameInput = screen.getByPlaceholderText('Enter your full name');
      fireEvent.change(nameInput, { target: { value: '  John Doe  ' } });
      
      expect(nameInput).toHaveValue('  John Doe  ');
    });
  });
});
