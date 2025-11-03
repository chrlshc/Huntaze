# Design Document - Huntaze Beta Landing & Auth

## Overview

This design document outlines the technical architecture for the Huntaze beta landing page and authentication system. The implementation uses Next.js 14 with App Router, React Server Components, Tailwind CSS, and a component-based architecture for maximum reusability and maintainability.

## Architecture

### High-Level Structure

```
app/
├── page.tsx                          # Landing page (/)
├── auth/
│   ├── login/
│   │   └── page.tsx                  # Login page
│   └── register/
│       └── page.tsx                  # Registration page
│
components/
├── landing/
│   ├── HeroSection.tsx               # Hero with CTA
│   ├── FeaturesGrid.tsx              # Features showcase
│   ├── LandingHeader.tsx             # Header with nav
│   └── LandingFooter.tsx             # Footer
│
├── auth/
│   ├── AuthCard.tsx                  # Container for auth forms
│   ├── AuthInput.tsx                 # Input with validation
│   ├── AuthButton.tsx                # Button with loading states
│   ├── PasswordStrength.tsx          # Password strength indicator
│   ├── LoginForm.tsx                 # Login form logic
│   └── RegisterForm.tsx              # Register form logic
│
lib/
├── auth/
│   ├── validation.ts                 # Form validation utilities
│   └── types.ts                      # Auth-related types
│
styles/
└── globals.css                       # Tailwind + custom styles
```

## Components and Interfaces

### 1. Landing Page Components

#### HeroSection Component
```typescript
interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
}

// Features:
// - Large heading with gradient text
// - Subtitle with description
// - Primary CTA button
// - Background with subtle gradient
```

#### FeaturesGrid Component
```typescript
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

interface FeaturesGridProps {
  features: Feature[];
}

// Features:
// - Responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
// - Icon + title + description per feature
// - Hover effects on cards
```

#### LandingHeader Component
```typescript
interface LandingHeaderProps {
  logoSrc?: string;
  showAuthButtons?: boolean;
}

// Features:
// - Huntaze logo on left
// - Login + Sign Up buttons on right
// - Sticky header on scroll
// - Mobile hamburger menu
```

### 2. Auth Components

#### AuthCard Component
```typescript
interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

// Features:
// - Centered card with shadow
// - Max width 400px
// - Padding and border radius
// - Title and optional subtitle
```

#### AuthInput Component
```typescript
interface AuthInputProps {
  label: string;
  type: 'text' | 'email' | 'password';
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: boolean;
  placeholder?: string;
  required?: boolean;
  showPasswordToggle?: boolean;
}

// Features:
// - Label above input
// - Error message below (red)
// - Success checkmark icon (green)
// - Password visibility toggle
// - Focus ring on interaction
```

#### AuthButton Component
```typescript
interface AuthButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  variant?: 'primary' | 'secondary';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

// Features:
// - Primary (indigo) and secondary (gray) variants
// - Loading spinner inside button
// - Disabled state with opacity
// - Hover and active states
```

#### PasswordStrength Component
```typescript
interface PasswordStrengthProps {
  password: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

// Features:
// - Visual bar indicator (red/yellow/green)
// - Text label (Weak/Medium/Strong)
// - Calculates based on length, chars, numbers
```

#### LoginForm Component
```typescript
interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Features:
// - Email and password inputs
// - Remember me checkbox
// - Forgot password link
// - Submit button with loading
// - Error banner at top
// - Link to register page
```

#### RegisterForm Component
```typescript
interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// Features:
// - Name, email, password inputs
// - Password strength indicator
// - Terms acceptance checkbox
// - Submit button with loading
// - Error messages per field
// - Link to login page
```

## Data Models

### User Registration Data
```typescript
interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
```

### User Login Data
```typescript
interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  };
}
```

### Validation Errors
```typescript
interface ValidationError {
  field: string;
  message: string;
}

interface FormErrors {
  [key: string]: string;
}
```

## Validation Logic

### Email Validation
```typescript
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Password Validation
```typescript
interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  
  // Calculate strength based on:
  // - Length (8+ chars)
  // - Contains uppercase
  // - Contains lowercase
  // - Contains numbers
  // - Contains special chars
  
  return {
    isValid: errors.length === 0,
    errors,
    strength: calculateStrength(password)
  };
}
```

### Form Validation
```typescript
function validateRegisterForm(data: RegisterData): FormErrors {
  const errors: FormErrors = {};
  
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }
  
  if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors[0];
  }
  
  return errors;
}
```

## Styling & Design System

### Color Palette
```css
:root {
  /* Primary */
  --color-primary: #6366f1;        /* Indigo 500 */
  --color-primary-hover: #4f46e5;  /* Indigo 600 */
  
  /* Success */
  --color-success: #10b981;        /* Green 500 */
  --color-success-light: #d1fae5;  /* Green 100 */
  
  /* Error */
  --color-error: #ef4444;          /* Red 500 */
  --color-error-light: #fee2e2;    /* Red 100 */
  
  /* Neutral */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
}
```

### Typography
```css
/* Font Family */
font-family: 'Inter', system-ui, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

### Spacing Scale
```css
/* Tailwind spacing (4px base) */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Component Styles

#### AuthCard
```css
.auth-card {
  max-width: 400px;
  padding: 2rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

#### AuthInput
```css
.auth-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--color-gray-300);
  border-radius: 0.5rem;
  font-size: 1rem;
  transition: all 200ms;
}

.auth-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.auth-input.error {
  border-color: var(--color-error);
}

.auth-input.success {
  border-color: var(--color-success);
}
```

#### AuthButton
```css
.auth-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  transition: all 200ms;
  cursor: pointer;
}

.auth-button.primary {
  background: var(--color-primary);
  color: white;
}

.auth-button.primary:hover {
  background: var(--color-primary-hover);
}

.auth-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

## Responsive Breakpoints

```css
/* Mobile First */
/* Default: < 640px (mobile) */

/* Tablet */
@media (min-width: 640px) {
  /* sm: 640px+ */
}

@media (min-width: 768px) {
  /* md: 768px+ */
}

/* Desktop */
@media (min-width: 1024px) {
  /* lg: 1024px+ */
}

@media (min-width: 1280px) {
  /* xl: 1280px+ */
}
```

## Error Handling

### Client-Side Validation
```typescript
// Real-time validation on input change
function handleInputChange(field: string, value: string) {
  // Clear error when user starts typing
  setErrors(prev => ({ ...prev, [field]: '' }));
  
  // Update value
  setFormData(prev => ({ ...prev, [field]: value }));
  
  // Validate on blur or after delay
  if (shouldValidate) {
    const error = validateField(field, value);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  }
}
```

### Form Submission Error Handling
```typescript
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  
  // Validate all fields
  const validationErrors = validateForm(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    // Focus first error field
    focusFirstError(validationErrors);
    return;
  }
  
  // Submit to API
  setLoading(true);
  try {
    const response = await submitForm(formData);
    if (response.success) {
      onSuccess?.();
    } else {
      setErrors({ general: response.message });
    }
  } catch (error) {
    setErrors({ general: 'Something went wrong. Please try again.' });
  } finally {
    setLoading(false);
  }
}
```

## Testing Strategy

### Component Testing
- Test each auth component in isolation
- Verify validation logic works correctly
- Test loading and error states
- Ensure accessibility (ARIA labels, keyboard nav)

### Integration Testing
- Test complete registration flow
- Test complete login flow
- Test navigation between pages
- Test form submission and error handling

### Visual Testing
- Test responsive layouts on different screen sizes
- Verify design system consistency
- Test hover and focus states
- Verify color contrast for accessibility

## Implementation Notes

### Next.js App Router
- Use Server Components for static content (landing page)
- Use Client Components for interactive forms ('use client')
- Implement proper loading states with Suspense
- Use Next.js Link for client-side navigation

### State Management
- Use React useState for form state
- Use React useReducer for complex form logic
- No global state needed for auth forms
- Store auth token in HTTP-only cookies (handled by API)

### Performance
- Lazy load components not immediately visible
- Optimize images with Next.js Image component
- Minimize bundle size with tree shaking
- Use CSS modules or Tailwind for styling

### Security
- Never store passwords in state longer than needed
- Use HTTPS for all requests
- Implement CSRF protection
- Rate limit form submissions
- Sanitize all user inputs

## API Integration

### Registration Endpoint
```typescript
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response:
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### Login Endpoint
```typescript
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123",
  "rememberMe": true
}

Response:
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_123",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

## Accessibility

### ARIA Labels
```typescript
<input
  type="email"
  aria-label="Email address"
  aria-required="true"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? 'email-error' : undefined}
/>

{errors.email && (
  <span id="email-error" role="alert">
    {errors.email}
  </span>
)}
```

### Keyboard Navigation
- Tab order follows visual flow
- Enter submits forms
- Escape closes modals
- Focus visible on all interactive elements

### Screen Reader Support
- Proper heading hierarchy (h1, h2, h3)
- Alt text for all images
- ARIA labels for icon buttons
- Live regions for dynamic content

## Future Enhancements

1. **Password Reset Flow** - Add forgot password functionality
2. **Email Verification** - Send verification email after registration
3. **Social OAuth** - Add OnlyFans, Instagram, TikTok login
4. **Two-Factor Auth** - Add 2FA for enhanced security
5. **Magic Link** - Passwordless authentication option
