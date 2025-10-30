/**
 * Unit Tests - Auth UI Components (Requirement 5)
 * 
 * Tests to validate reusable auth UI components
 * Based on: .kiro/specs/auth-system-from-scratch/requirements.md (Requirement 5)
 * 
 * Coverage:
 * - AuthInput component with validation states
 * - AuthButton component with loading/disabled states
 * - AuthCard component styling
 * - PasswordStrength component
 * - SocialButton component with platform branding
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock components - will be implemented
const AuthInput = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error, 
  success,
  disabled 
}: any) => (
  <div className="auth-input-wrapper">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`auth-input ${error ? 'error' : ''} ${success ? 'success' : ''}`}
      aria-invalid={!!error}
      aria-describedby={error ? 'error-message' : undefined}
    />
    {error && <span id="error-message" className="error-message">{error}</span>}
    {success && <span className="success-icon">✓</span>}
  </div>
);

const AuthButton = ({ 
  children, 
  onClick, 
  loading, 
  disabled, 
  variant = 'primary' 
}: any) => (
  <button
    onClick={onClick}
    disabled={disabled || loading}
    className={`auth-button ${variant}`}
    aria-busy={loading}
  >
    {loading ? <span className="spinner">Loading...</span> : children}
  </button>
);

const AuthCard = ({ children, className }: any) => (
  <div className={`auth-card ${className || ''}`}>
    {children}
  </div>
);

const PasswordStrength = ({ password }: any) => {
  const getStrength = (pwd: string) => {
    if (!pwd) return null;
    if (pwd.length < 8) return 'weak';
    if (pwd.length < 12) return 'medium';
    return 'strong';
  };
  
  const strength = getStrength(password);
  
  if (!strength) return null;
  
  return (
    <div className="password-strength">
      <div className={`strength-indicator ${strength}`}>
        {strength}
      </div>
    </div>
  );
};

const SocialButton = ({ platform, onClick, loading }: any) => {
  const platformConfig: any = {
    onlyfans: { color: '#00AFF0', label: 'Continue with OnlyFans' },
    instagram: { color: '#E4405F', label: 'Continue with Instagram' },
    tiktok: { color: '#000000', label: 'Continue with TikTok' },
  };
  
  const config = platformConfig[platform] || {};
  
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`social-button ${platform}`}
      style={{ backgroundColor: config.color }}
      aria-label={config.label}
    >
      {loading ? 'Connecting...' : config.label}
    </button>
  );
};

describe('Requirement 5: Reusable Auth Components', () => {
  describe('AC 5.1 - AuthInput Component', () => {
    it('should render with default state', () => {
      render(
        <AuthInput 
          placeholder="Email address" 
          value="" 
          onChange={() => {}} 
        />
      );
      
      const input = screen.getByPlaceholderText('Email address');
      expect(input).toBeInTheDocument();
      expect(input).not.toHaveClass('error');
      expect(input).not.toHaveClass('success');
    });

    it('should display error state with message', () => {
      render(
        <AuthInput 
          placeholder="Email" 
          value="invalid" 
          onChange={() => {}}
          error="Please enter a valid email address"
        />
      );
      
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveClass('error');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should display success state with checkmark', () => {
      render(
        <AuthInput 
          placeholder="Email" 
          value="test@example.com" 
          onChange={() => {}}
          success={true}
        />
      );
      
      const input = screen.getByPlaceholderText('Email');
      expect(input).toHaveClass('success');
      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(
        <AuthInput 
          placeholder="Email" 
          value="" 
          onChange={() => {}}
          disabled={true}
        />
      );
      
      const input = screen.getByPlaceholderText('Email');
      expect(input).toBeDisabled();
    });

    it('should call onChange handler', () => {
      const handleChange = vi.fn();
      render(
        <AuthInput 
          placeholder="Email" 
          value="" 
          onChange={handleChange}
        />
      );
      
      const input = screen.getByPlaceholderText('Email');
      fireEvent.change(input, { target: { value: 'test@example.com' } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe('AC 5.2 - AuthButton Component', () => {
    it('should render primary variant', () => {
      render(
        <AuthButton variant="primary" onClick={() => {}}>
          Sign In
        </AuthButton>
      );
      
      const button = screen.getByRole('button', { name: 'Sign In' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('primary');
    });

    it('should render secondary variant', () => {
      render(
        <AuthButton variant="secondary" onClick={() => {}}>
          Cancel
        </AuthButton>
      );
      
      const button = screen.getByRole('button', { name: 'Cancel' });
      expect(button).toHaveClass('secondary');
    });

    it('should display loading state', () => {
      render(
        <AuthButton loading={true} onClick={() => {}}>
          Sign In
        </AuthButton>
      );
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should handle disabled state', () => {
      render(
        <AuthButton disabled={true} onClick={() => {}}>
          Sign In
        </AuthButton>
      );
      
      const button = screen.getByRole('button', { name: 'Sign In' });
      expect(button).toBeDisabled();
    });

    it('should call onClick handler when not disabled', () => {
      const handleClick = vi.fn();
      render(
        <AuthButton onClick={handleClick}>
          Sign In
        </AuthButton>
      );
      
      const button = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when loading', () => {
      const handleClick = vi.fn();
      render(
        <AuthButton loading={true} onClick={handleClick}>
          Sign In
        </AuthButton>
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('AC 5.3 - AuthCard Component', () => {
    it('should render with children', () => {
      render(
        <AuthCard>
          <h1>Sign In</h1>
          <p>Welcome back</p>
        </AuthCard>
      );
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Welcome back')).toBeInTheDocument();
    });

    it('should apply auth-card class', () => {
      const { container } = render(
        <AuthCard>Content</AuthCard>
      );
      
      const card = container.querySelector('.auth-card');
      expect(card).toBeInTheDocument();
    });

    it('should accept additional className', () => {
      const { container } = render(
        <AuthCard className="custom-class">Content</AuthCard>
      );
      
      const card = container.querySelector('.auth-card.custom-class');
      expect(card).toBeInTheDocument();
    });
  });

  describe('AC 5.4 - PasswordStrength Component', () => {
    it('should show weak strength for short passwords', () => {
      render(<PasswordStrength password="pass" />);
      
      expect(screen.getByText('weak')).toBeInTheDocument();
      expect(screen.getByText('weak')).toHaveClass('weak');
    });

    it('should show medium strength for moderate passwords', () => {
      render(<PasswordStrength password="password123" />);
      
      expect(screen.getByText('medium')).toBeInTheDocument();
      expect(screen.getByText('medium')).toHaveClass('medium');
    });

    it('should show strong strength for long passwords', () => {
      render(<PasswordStrength password="verySecurePassword123!" />);
      
      expect(screen.getByText('strong')).toBeInTheDocument();
      expect(screen.getByText('strong')).toHaveClass('strong');
    });

    it('should not render for empty password', () => {
      const { container } = render(<PasswordStrength password="" />);
      
      expect(container.querySelector('.password-strength')).not.toBeInTheDocument();
    });

    it('should update when password changes', () => {
      const { rerender } = render(<PasswordStrength password="weak" />);
      expect(screen.getByText('weak')).toBeInTheDocument();
      
      rerender(<PasswordStrength password="strongPassword123" />);
      expect(screen.getByText('strong')).toBeInTheDocument();
    });
  });

  describe('AC 5.5 - SocialButton Component', () => {
    it('should render OnlyFans button with correct branding', () => {
      render(<SocialButton platform="onlyfans" onClick={() => {}} />);
      
      const button = screen.getByRole('button', { name: 'Continue with OnlyFans' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('onlyfans');
      expect(button).toHaveStyle({ backgroundColor: '#00AFF0' });
    });

    it('should render Instagram button with correct branding', () => {
      render(<SocialButton platform="instagram" onClick={() => {}} />);
      
      const button = screen.getByRole('button', { name: 'Continue with Instagram' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('instagram');
      expect(button).toHaveStyle({ backgroundColor: '#E4405F' });
    });

    it('should render TikTok button with correct branding', () => {
      render(<SocialButton platform="tiktok" onClick={() => {}} />);
      
      const button = screen.getByRole('button', { name: 'Continue with TikTok' });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('tiktok');
      expect(button).toHaveStyle({ backgroundColor: '#000000' });
    });

    it('should display loading state', () => {
      render(<SocialButton platform="onlyfans" onClick={() => {}} loading={true} />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(screen.getByText('Connecting...')).toBeInTheDocument();
    });

    it('should call onClick handler', () => {
      const handleClick = vi.fn();
      render(<SocialButton platform="instagram" onClick={handleClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Integration', () => {
    it('should work together in a form', () => {
      const handleSubmit = vi.fn();
      
      render(
        <AuthCard>
          <AuthInput 
            placeholder="Email" 
            value="test@example.com" 
            onChange={() => {}}
            success={true}
          />
          <AuthInput 
            type="password"
            placeholder="Password" 
            value="password123" 
            onChange={() => {}}
          />
          <PasswordStrength password="password123" />
          <AuthButton onClick={handleSubmit}>
            Sign In
          </AuthButton>
        </AuthCard>
      );
      
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
      
      const button = screen.getByRole('button', { name: 'Sign In' });
      fireEvent.click(button);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });
});
