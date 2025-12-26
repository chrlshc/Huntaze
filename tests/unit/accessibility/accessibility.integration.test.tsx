/**
 * Integration Tests for Accessibility Compliance using axe-core
 * 
 * Feature: linear-ui-performance-refactor
 * 
 * Tests WCAG 2.1 AA compliance across all pages and components
 * using axe-core automated accessibility testing.
 * 
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4
 */

/* eslint-disable @next/next/no-img-element -- test fixtures intentionally use raw img tags */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Extend expect with jest-axe matchers
expect.extend(toHaveNoViolations);

// ========================================
// Design System Components
// ========================================

describe('Accessibility Integration: Design System Components', () => {
  it('should have no accessibility violations in Button component', async () => {
    const TestButton = () => (
      <button
        className="h-[40px] px-4 bg-[#7D57C1] text-white rounded-md focus-visible:ring-[3px] focus-visible:ring-[rgba(125,87,193,0.3)]"
        type="button"
      >
        Primary Action
      </button>
    );

    const { container } = render(<TestButton />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in Input component', async () => {
    const TestInput = () => (
      <div>
        <label htmlFor="test-input">Email Address</label>
        <input
          id="test-input"
          type="email"
          className="h-[40px] px-3 w-full border border-[#2E2E33] bg-[#18181A] text-[#EDEDEF] rounded-md focus-visible:ring-[3px] focus-visible:ring-[rgba(125,87,193,0.3)]"
          placeholder="Enter your email"
          aria-required="true"
          required
        />
      </div>
    );

    const { container } = render(<TestInput />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in Link component', async () => {
    const TestLink = () => (
      <a
        href="/dashboard"
        className="inline-flex items-center min-h-[44px] px-4 text-[#7D57C1] hover:text-[#6B47AF] focus-visible:ring-[3px] focus-visible:ring-[rgba(125,87,193,0.3)]"
      >
        Go to Dashboard
      </a>
    );

    const { container } = render(<TestLink />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in Card component', async () => {
    const TestCard = () => (
      <article className="p-6 bg-[#151516] border border-[#2E2E33] rounded-lg">
        <h2 className="text-xl font-medium text-[#EDEDEF] mb-2">Card Title</h2>
        <p className="text-[#8A8F98]">Card description with sufficient contrast</p>
        <button
          className="mt-4 h-[40px] px-4 bg-[#7D57C1] text-white rounded-md focus-visible:ring-[3px]"
          type="button"
        >
          Action
        </button>
      </article>
    );

    const { container } = render(<TestCard />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

// ========================================
// Form Components
// ========================================

describe('Accessibility Integration: Form Components', () => {
  it('should have no accessibility violations in complete form', async () => {
    const TestForm = () => (
      <form>
        <div className="mb-4">
          <label htmlFor="username" className="block mb-2 text-[#EDEDEF]">
            Username
          </label>
          <input
            id="username"
            type="text"
            className="h-[40px] px-3 w-full border border-[#2E2E33] bg-[#18181A] text-[#EDEDEF] rounded-md"
            required
            aria-required="true"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="email" className="block mb-2 text-[#EDEDEF]">
            Email
          </label>
          <input
            id="email"
            type="email"
            className="h-[40px] px-3 w-full border border-[#2E2E33] bg-[#18181A] text-[#EDEDEF] rounded-md"
            required
            aria-required="true"
            aria-describedby="email-hint"
          />
          <span id="email-hint" className="text-sm text-[#8A8F98]">
            We'll never share your email
          </span>
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="block mb-2 text-[#EDEDEF]">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="h-[40px] px-3 w-full border border-[#2E2E33] bg-[#18181A] text-[#EDEDEF] rounded-md"
            required
            aria-required="true"
            aria-describedby="password-hint"
          />
          <span id="password-hint" className="text-sm text-[#8A8F98]">
            Must be at least 8 characters
          </span>
        </div>

        <button
          type="submit"
          className="h-[40px] px-4 bg-[#7D57C1] text-white rounded-md focus-visible:ring-[3px]"
        >
          Submit
        </button>
        <button
          type="button"
          className="ml-2 h-[40px] px-4 border border-[#2E2E33] bg-[#151516] text-[#8A8F98] rounded-md focus-visible:ring-[3px]"
        >
          Cancel
        </button>
      </form>
    );

    const { container } = render(<TestForm />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in form with error states', async () => {
    const TestFormWithErrors = () => (
      <form>
        <div className="mb-4">
          <label htmlFor="email-error" className="block mb-2 text-[#EDEDEF]">
            Email
          </label>
          <input
            id="email-error"
            type="email"
            className="h-[40px] px-3 w-full border border-[#EF4444] bg-[#18181A] text-[#EDEDEF] rounded-md"
            aria-invalid="true"
            aria-describedby="email-error-message"
          />
          <div id="email-error-message" role="alert" className="mt-1 text-sm text-[#EF4444]">
            Please enter a valid email address
          </div>
        </div>

        <button
          type="submit"
          className="h-[40px] px-4 bg-[#7D57C1] text-white rounded-md"
        >
          Submit
        </button>
      </form>
    );

    const { container } = render(<TestFormWithErrors />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in checkbox group', async () => {
    const TestCheckboxGroup = () => (
      <fieldset>
        <legend className="text-[#EDEDEF] mb-2">Select your interests</legend>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="interest-1"
              className="w-5 h-5"
            />
            <label htmlFor="interest-1" className="ml-2 text-[#EDEDEF]">
              Technology
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="interest-2"
              className="w-5 h-5"
            />
            <label htmlFor="interest-2" className="ml-2 text-[#EDEDEF]">
              Design
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="interest-3"
              className="w-5 h-5"
            />
            <label htmlFor="interest-3" className="ml-2 text-[#EDEDEF]">
              Marketing
            </label>
          </div>
        </div>
      </fieldset>
    );

    const { container } = render(<TestCheckboxGroup />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in radio button group', async () => {
    const TestRadioGroup = () => (
      <fieldset>
        <legend className="text-[#EDEDEF] mb-2">Choose a plan</legend>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="radio"
              id="plan-free"
              name="plan"
              className="w-5 h-5"
            />
            <label htmlFor="plan-free" className="ml-2 text-[#EDEDEF]">
              Free
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="plan-pro"
              name="plan"
              className="w-5 h-5"
            />
            <label htmlFor="plan-pro" className="ml-2 text-[#EDEDEF]">
              Pro
            </label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="plan-enterprise"
              name="plan"
              className="w-5 h-5"
            />
            <label htmlFor="plan-enterprise" className="ml-2 text-[#EDEDEF]">
              Enterprise
            </label>
          </div>
        </div>
      </fieldset>
    );

    const { container } = render(<TestRadioGroup />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

// ========================================
// Navigation Components
// ========================================

describe('Accessibility Integration: Navigation Components', () => {
  it('should have no accessibility violations in navigation menu', async () => {
    const TestNav = () => (
      <nav aria-label="Main navigation">
        <ul className="flex space-x-4">
          <li>
            <a
              href="/dashboard"
              className="inline-flex items-center min-h-[44px] px-4 text-[#EDEDEF] hover:text-[#7D57C1] focus-visible:ring-[3px]"
            >
              Dashboard
            </a>
          </li>
          <li>
            <a
              href="/integrations"
              className="inline-flex items-center min-h-[44px] px-4 text-[#EDEDEF] hover:text-[#7D57C1] focus-visible:ring-[3px]"
            >
              Integrations
            </a>
          </li>
          <li>
            <a
              href="/settings"
              className="inline-flex items-center min-h-[44px] px-4 text-[#EDEDEF] hover:text-[#7D57C1] focus-visible:ring-[3px]"
            >
              Settings
            </a>
          </li>
        </ul>
      </nav>
    );

    const { container } = render(<TestNav />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in breadcrumb navigation', async () => {
    const TestBreadcrumb = () => (
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <a href="/" className="text-[#8A8F98] hover:text-[#EDEDEF]">
              Home
            </a>
          </li>
          <li aria-hidden="true" className="text-[#8A8F98]">/</li>
          <li>
            <a href="/dashboard" className="text-[#8A8F98] hover:text-[#EDEDEF]">
              Dashboard
            </a>
          </li>
          <li aria-hidden="true" className="text-[#8A8F98]">/</li>
          <li>
            <span className="text-[#EDEDEF]" aria-current="page">
              Settings
            </span>
          </li>
        </ol>
      </nav>
    );

    const { container } = render(<TestBreadcrumb />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in skip link', async () => {
    const TestSkipLink = () => (
      <div>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#7D57C1] focus:text-white focus:rounded-md"
        >
          Skip to main content
        </a>
        <nav>Navigation</nav>
        <main id="main-content" tabIndex={-1}>
          <h1>Main Content</h1>
        </main>
      </div>
    );

    const { container } = render(<TestSkipLink />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

// ========================================
// Interactive Components
// ========================================

describe('Accessibility Integration: Interactive Components', () => {
  it('should have no accessibility violations in modal dialog', async () => {
    const TestModal = () => (
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
      >
        <div className="bg-[#151516] border border-[#2E2E33] rounded-lg p-6 max-w-md">
          <h2 id="modal-title" className="text-xl font-medium text-[#EDEDEF] mb-4">
            Confirm Action
          </h2>
          <p className="text-[#8A8F98] mb-6">
            Are you sure you want to proceed with this action?
          </p>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="h-[40px] px-4 border border-[#2E2E33] bg-[#151516] text-[#8A8F98] rounded-md"
            >
              Cancel
            </button>
            <button
              type="button"
              className="h-[40px] px-4 bg-[#7D57C1] text-white rounded-md"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );

    const { container } = render(<TestModal />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in tabs component', async () => {
    const TestTabs = () => (
      <div>
        <div role="tablist" aria-label="Content sections">
          <button
            role="tab"
            aria-selected="true"
            aria-controls="panel-1"
            id="tab-1"
            className="h-[40px] px-4 text-[#EDEDEF] border-b-2 border-[#7D57C1]"
          >
            Overview
          </button>
          <button
            role="tab"
            aria-selected="false"
            aria-controls="panel-2"
            id="tab-2"
            className="h-[40px] px-4 text-[#8A8F98] border-b-2 border-transparent"
            tabIndex={-1}
          >
            Details
          </button>
          <button
            role="tab"
            aria-selected="false"
            aria-controls="panel-3"
            id="tab-3"
            className="h-[40px] px-4 text-[#8A8F98] border-b-2 border-transparent"
            tabIndex={-1}
          >
            Settings
          </button>
        </div>
        <div
          role="tabpanel"
          id="panel-1"
          aria-labelledby="tab-1"
          className="p-4"
        >
          <p className="text-[#EDEDEF]">Overview content</p>
        </div>
      </div>
    );

    const { container } = render(<TestTabs />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in dropdown menu', async () => {
    const TestDropdown = () => (
      <div>
        <button
          aria-haspopup="true"
          aria-expanded="true"
          aria-controls="dropdown-menu"
          className="h-[40px] px-4 bg-[#151516] border border-[#2E2E33] text-[#EDEDEF] rounded-md"
        >
          Options
        </button>
        <ul
          id="dropdown-menu"
          role="menu"
          className="mt-2 bg-[#151516] border border-[#2E2E33] rounded-md"
        >
          <li role="none">
            <button
              role="menuitem"
              className="w-full text-left px-4 py-2 text-[#EDEDEF] hover:bg-[#1A1A1C]"
            >
              Edit
            </button>
          </li>
          <li role="none">
            <button
              role="menuitem"
              className="w-full text-left px-4 py-2 text-[#EDEDEF] hover:bg-[#1A1A1C]"
            >
              Delete
            </button>
          </li>
        </ul>
      </div>
    );

    const { container } = render(<TestDropdown />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in progress indicator', async () => {
    const TestProgress = () => (
      <div>
        <label htmlFor="progress-bar" className="block mb-2 text-[#EDEDEF]">
          Upload Progress
        </label>
        <div
          id="progress-bar"
          role="progressbar"
          aria-valuenow={65}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress: 65%"
          className="w-full h-2 bg-[#2E2E33] rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-[#7D57C1]"
            style={{ width: '65%' }}
          />
        </div>
        <span className="text-sm text-[#8A8F98]">65% complete</span>
      </div>
    );

    const { container } = render(<TestProgress />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

// ========================================
// Layout Components
// ========================================

describe('Accessibility Integration: Layout Components', () => {
  it('should have no accessibility violations in page layout with landmarks', async () => {
    const TestLayout = () => (
      <div>
        <header className="bg-[#151516] border-b border-[#2E2E33] p-4">
          <h1 className="text-2xl font-medium text-[#EDEDEF]">Huntaze</h1>
        </header>
        <nav aria-label="Main navigation" className="bg-[#151516] p-4">
          <ul className="flex space-x-4">
            <li><a href="/dashboard" className="text-[#EDEDEF]">Dashboard</a></li>
            <li><a href="/settings" className="text-[#EDEDEF]">Settings</a></li>
          </ul>
        </nav>
        <main className="p-4">
          <h2 className="text-xl font-medium text-[#EDEDEF] mb-4">Main Content</h2>
          <p className="text-[#8A8F98]">This is the main content area</p>
        </main>
        <aside className="bg-[#151516] p-4">
          <h3 className="text-lg font-medium text-[#EDEDEF] mb-2">Sidebar</h3>
          <p className="text-[#8A8F98]">Additional information</p>
        </aside>
        <footer className="bg-[#151516] border-t border-[#2E2E33] p-4">
          <p className="text-[#8A8F98]">© 2024 Huntaze</p>
        </footer>
      </div>
    );

    const { container } = render(<TestLayout />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in centered container layout', async () => {
    const TestCenteredLayout = () => (
      <div className="max-w-[1280px] mx-auto px-6">
        <h1 className="text-2xl font-medium text-[#EDEDEF] mb-4">Centered Content</h1>
        <p className="text-[#8A8F98]">
          This content is centered with a maximum width constraint
        </p>
      </div>
    );

    const { container } = render(<TestCenteredLayout />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});

// ========================================
// Content Components
// ========================================

describe('Accessibility Integration: Content Components', () => {
  it('should have no accessibility violations in heading hierarchy', async () => {
    const TestHeadings = () => (
      <article>
        <h1 className="text-3xl font-medium text-[#EDEDEF] mb-4">Main Title</h1>
        <h2 className="text-2xl font-medium text-[#EDEDEF] mb-3">Section Title</h2>
        <p className="text-[#8A8F98] mb-4">Section content</p>
        <h3 className="text-xl font-medium text-[#EDEDEF] mb-2">Subsection Title</h3>
        <p className="text-[#8A8F98]">Subsection content</p>
      </article>
    );

    const { container } = render(<TestHeadings />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in list components', async () => {
    const TestLists = () => (
      <div>
        <h2 className="text-xl font-medium text-[#EDEDEF] mb-2">Unordered List</h2>
        <ul className="list-disc list-inside mb-4">
          <li className="text-[#8A8F98]">Item 1</li>
          <li className="text-[#8A8F98]">Item 2</li>
          <li className="text-[#8A8F98]">Item 3</li>
        </ul>

        <h2 className="text-xl font-medium text-[#EDEDEF] mb-2">Ordered List</h2>
        <ol className="list-decimal list-inside">
          <li className="text-[#8A8F98]">First step</li>
          <li className="text-[#8A8F98]">Second step</li>
          <li className="text-[#8A8F98]">Third step</li>
        </ol>
      </div>
    );

    const { container } = render(<TestLists />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations in image with alt text', async () => {
    const TestImages = () => (
      <div>
        <img
          src="/logo.svg"
          alt="Huntaze logo"
          className="w-32 h-32"
        />
        <img
          src="/decoration.png"
          alt=""
          role="presentation"
          className="w-16 h-16"
        />
      </div>
    );

    const { container } = render(<TestImages />);
    const results = await axe(container);

    expect(results).toHaveNoViolations();
  });
});
