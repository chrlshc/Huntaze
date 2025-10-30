/**
 * Unit Tests - Authentication Pages (Task 2.1)
 * Tests for login and register page components
 * 
 * Coverage:
 * - Page rendering
 * - Metadata configuration
 * - Layout structure
 * - Component integration
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the form components
vi.mock('@/components/auth/LoginForm', () => ({
  LoginForm: () => <div data-testid="login-form">Login Form</div>,
}));

vi.mock('@/components/auth/RegisterForm', () => ({
  RegisterForm: () => <div data-testid="register-form">Register Form</div>,
}));

describe('Authentication Pages - Task 2.1', () => {
  describe('Login Page', () => {
    it('should render login page with correct title', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      render(<LoginPage />);
      
      expect(screen.getByText(/welcome back/i)).toBeInTheDocument();
    });

    it('should render login page description', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      render(<LoginPage />);
      
      expect(screen.getByText(/sign in to your account to continue/i)).toBeInTheDocument();
    });

    it('should render LoginForm component', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      render(<LoginPage />);
      
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
    });

    it('should have proper layout structure', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      const { container } = render(<LoginPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have responsive padding', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      const { container } = render(<LoginPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('px-4');
    });

    it('should have max-width constraint for form', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      const { container } = render(<LoginPage />);
      
      const formContainer = container.querySelector('.max-w-md');
      expect(formContainer).toBeInTheDocument();
      expect(formContainer).toHaveClass('w-full');
    });

    it('should support dark mode', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      const { container } = render(<LoginPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer?.className).toContain('dark:bg-neutral-900');
    });

    it('should have proper text hierarchy', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      render(<LoginPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/welcome back/i);
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });
  });

  describe('Register Page', () => {
    it('should render register page with correct title', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      render(<RegisterPage />);
      
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    });

    it('should render register page description', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      render(<RegisterPage />);
      
      expect(screen.getByText(/get started with huntaze today/i)).toBeInTheDocument();
    });

    it('should render RegisterForm component', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      render(<RegisterPage />);
      
      expect(screen.getByTestId('register-form')).toBeInTheDocument();
    });

    it('should have proper layout structure', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      const { container } = render(<RegisterPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });

    it('should have responsive padding', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      const { container } = render(<RegisterPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('px-4');
    });

    it('should have max-width constraint for form', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      const { container } = render(<RegisterPage />);
      
      const formContainer = container.querySelector('.max-w-md');
      expect(formContainer).toBeInTheDocument();
      expect(formContainer).toHaveClass('w-full');
    });

    it('should support dark mode', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      const { container } = render(<RegisterPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer?.className).toContain('dark:bg-neutral-900');
    });

    it('should have proper text hierarchy', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      render(<RegisterPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(/create your account/i);
      expect(heading).toHaveClass('text-3xl', 'font-bold');
    });
  });

  describe('Page Metadata', () => {
    it('should export metadata for login page', async () => {
      const { metadata } = await import('@/app/auth/login/page');
      
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Login | Huntaze');
      expect(metadata.description).toBe('Sign in to your Huntaze account');
    });

    it('should export metadata for register page', async () => {
      const { metadata } = await import('@/app/auth/register/page');
      
      expect(metadata).toBeDefined();
      expect(metadata.title).toBe('Register | Huntaze');
      expect(metadata.description).toBe('Create your Huntaze account');
    });
  });

  describe('Responsive Design', () => {
    it('should have mobile-friendly layout on login page', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      const { container } = render(<LoginPage />);
      
      const wrapper = container.querySelector('.w-full.max-w-md');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have mobile-friendly layout on register page', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      const { container } = render(<RegisterPage />);
      
      const wrapper = container.querySelector('.w-full.max-w-md');
      expect(wrapper).toBeInTheDocument();
    });

    it('should center content vertically and horizontally', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      const { container } = render(<LoginPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer).toHaveClass('flex', 'items-center', 'justify-center');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure on login page', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      render(<LoginPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have proper heading structure on register page', async () => {
      const RegisterPage = (await import('@/app/auth/register/page')).default;
      render(<RegisterPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have descriptive text for context', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      render(<LoginPage />);
      
      expect(screen.getByText(/sign in to your account to continue/i)).toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('should have light mode background on login page', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      const { container } = render(<LoginPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer?.className).toContain('bg-neutral-50');
    });

    it('should have dark mode background on login page', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      const { container } = render(<LoginPage />);
      
      const mainContainer = container.querySelector('.min-h-screen');
      expect(mainContainer?.className).toContain('dark:bg-neutral-900');
    });

    it('should have light mode text colors', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      render(<LoginPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.className).toContain('text-neutral-900');
    });

    it('should have dark mode text colors', async () => {
      const LoginPage = (await import('@/app/auth/login/page')).default;
      render(<LoginPage />);
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading.className).toContain('dark:text-neutral-100');
    });
  });
});
