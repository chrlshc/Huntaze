/**
 * CenteredContainer Component Examples
 * 
 * Demonstrates various usage patterns for the CenteredContainer component.
 * These examples can be used for development, testing, and documentation.
 */

import React from 'react';
import { CenteredContainer } from './CenteredContainer';
import { Button } from "@/components/ui/button";

/**
 * Example 1: Basic Dashboard Layout
 */
export function DashboardExample() {
  return (
    <CenteredContainer maxWidth="lg" padding={24}>
      <header className="mb-8">
        <h1 className="text-3xl font-medium text-primary mb-2">Dashboard</h1>
        <p className="text-secondary">Welcome back! Here's what's happening.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-surface p-6 rounded-lg border border-subtle">
          <h3 className="text-secondary text-sm mb-2">Total Users</h3>
          <p className="text-3xl font-medium text-primary">1,234</p>
          <p className="text-sm text-secondary mt-2">+12% from last month</p>
        </div>
        
        <div className="bg-surface p-6 rounded-lg border border-subtle">
          <h3 className="text-secondary text-sm mb-2">Revenue</h3>
          <p className="text-3xl font-medium text-primary">$45,678</p>
          <p className="text-sm text-secondary mt-2">+8% from last month</p>
        </div>
        
        <div className="bg-surface p-6 rounded-lg border border-subtle">
          <h3 className="text-secondary text-sm mb-2">Growth</h3>
          <p className="text-3xl font-medium text-primary">+12%</p>
          <p className="text-sm text-secondary mt-2">Above target</p>
        </div>
      </div>
      
      <section>
        <h2 className="text-xl font-medium text-primary mb-4">Recent Activity</h2>
        <div className="bg-surface rounded-lg border border-subtle">
          <div className="p-4 border-b border-subtle">
            <p className="text-primary">New user registered</p>
            <p className="text-sm text-secondary">2 minutes ago</p>
          </div>
          <div className="p-4 border-b border-subtle">
            <p className="text-primary">Payment received</p>
            <p className="text-sm text-secondary">15 minutes ago</p>
          </div>
          <div className="p-4">
            <p className="text-primary">New feature deployed</p>
            <p className="text-sm text-secondary">1 hour ago</p>
          </div>
        </div>
      </section>
    </CenteredContainer>
  );
}

/**
 * Example 2: Form Layout (Narrow)
 */
export function FormExample() {
  return (
    <CenteredContainer maxWidth="sm" padding={32}>
      <h1 className="text-3xl font-medium text-primary mb-2">Account Settings</h1>
      <p className="text-secondary mb-8">Manage your account preferences</p>
      
      <form className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-primary mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            className="w-full h-10 px-3 bg-input border border-subtle rounded-md text-primary"
            placeholder="John Doe"
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="w-full h-10 px-3 bg-input border border-subtle rounded-md text-primary"
            placeholder="john@example.com"
          />
        </div>
        
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-primary mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            rows={4}
            className="w-full px-3 py-2 bg-input border border-subtle rounded-md text-primary"
            placeholder="Tell us about yourself..."
          />
        </div>
        
        <div className="flex gap-4">
          <Button variant="primary" type="submit">
  Save Changes
</Button>
          <Button variant="primary" type="button">
  Cancel
</Button>
        </div>
      </form>
    </CenteredContainer>
  );
}

/**
 * Example 3: Marketing Page Content
 */
export function MarketingExample() {
  return (
    <CenteredContainer maxWidth="lg" className="py-16">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-medium text-primary mb-4">
          Build Better Products
        </h1>
        <p className="text-xl text-secondary max-w-2xl mx-auto">
          The all-in-one platform for modern teams to collaborate, 
          ship faster, and build products users love.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-primary mb-2">Lightning Fast</h3>
          <p className="text-secondary">
            Optimized for speed and performance. Your team will love how fast it is.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-primary mb-2">Secure by Default</h3>
          <p className="text-secondary">
            Enterprise-grade security built in from day one. Your data is safe with us.
          </p>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 bg-accent-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-accent-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-primary mb-2">Team Collaboration</h3>
          <p className="text-secondary">
            Built for teams. Collaborate in real-time and ship faster together.
          </p>
        </div>
      </div>
      
      <div className="text-center">
        <Button variant="primary">
          Get Started Free
        </Button>
      </div>
    </CenteredContainer>
  );
}

/**
 * Example 4: Article/Blog Layout
 */
export function ArticleExample() {
  return (
    <CenteredContainer maxWidth="sm" padding={24} className="py-12">
      <article>
        <header className="mb-8">
          <p className="text-sm text-secondary mb-2">November 23, 2024</p>
          <h1 className="text-4xl font-medium text-primary mb-4">
            Introducing Our New Design System
          </h1>
          <p className="text-lg text-secondary">
            A comprehensive guide to our Linear-inspired design system
            and how it improves the user experience.
          </p>
        </header>
        
        <div className="prose prose-invert max-w-none">
          <p className="text-primary mb-4">
            We're excited to announce the launch of our new design system,
            inspired by Linear's clean and professional aesthetic. This
            system brings consistency, performance, and beauty to every
            corner of our application.
          </p>
          
          <h2 className="text-2xl font-medium text-primary mt-8 mb-4">
            Key Features
          </h2>
          
          <ul className="list-disc list-inside text-primary space-y-2 mb-4">
            <li>Midnight Violet color palette for a modern dark theme</li>
            <li>Inter typography for excellent readability</li>
            <li>4px grid system for consistent spacing</li>
            <li>Responsive layouts that work on all devices</li>
          </ul>
          
          <h2 className="text-2xl font-medium text-primary mt-8 mb-4">
            Performance Improvements
          </h2>
          
          <p className="text-primary mb-4">
            Beyond aesthetics, this redesign brings significant performance
            improvements. We've implemented skeleton screens, lazy loading,
            and optimized our cold start times to ensure a fast, responsive
            experience for all users.
          </p>
        </div>
      </article>
    </CenteredContainer>
  );
}

/**
 * Example 5: Minimal Padding for Full-Width Content
 */
export function MinimalPaddingExample() {
  return (
    <CenteredContainer maxWidth="lg" padding={16}>
      <div className="bg-surface rounded-lg border border-subtle overflow-hidden">
        <div className="p-6 border-b border-subtle">
          <h2 className="text-xl font-medium text-primary">Data Table</h2>
          <p className="text-sm text-secondary">View and manage your data</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-hover">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              <tr>
                <td className="px-6 py-4 text-sm text-primary">John Doe</td>
                <td className="px-6 py-4 text-sm text-secondary">john@example.com</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-500/10 text-green-500">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Button variant="primary">
                    Edit
                  </Button>
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-primary">Jane Smith</td>
                <td className="px-6 py-4 text-sm text-secondary">jane@example.com</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/10 text-yellow-500">
                    Pending
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <Button variant="primary">
                    Edit
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </CenteredContainer>
  );
}

/**
 * Example 6: Custom Styling with Additional Classes
 */
export function CustomStyledExample() {
  return (
    <CenteredContainer 
      maxWidth="lg" 
      padding={24}
      className="bg-surface border-t border-b border-subtle"
    >
      <div className="text-center py-12">
        <h2 className="text-3xl font-medium text-primary mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-secondary mb-8 max-w-2xl mx-auto">
          Join thousands of teams already using our platform to build
          better products faster.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="primary">
            Start Free Trial
          </Button>
          <Button variant="primary">
            Schedule Demo
          </Button>
        </div>
      </div>
    </CenteredContainer>
  );
}

/**
 * All Examples Component
 * Renders all examples in a single page for easy viewing
 */
export function AllExamples() {
  return (
    <div className="space-y-16 py-8">
      <section>
        <h2 className="text-2xl font-medium text-primary mb-4 px-6">
          Example 1: Dashboard Layout
        </h2>
        <DashboardExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-medium text-primary mb-4 px-6">
          Example 2: Form Layout
        </h2>
        <FormExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-medium text-primary mb-4 px-6">
          Example 3: Marketing Page
        </h2>
        <MarketingExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-medium text-primary mb-4 px-6">
          Example 4: Article Layout
        </h2>
        <ArticleExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-medium text-primary mb-4 px-6">
          Example 5: Minimal Padding
        </h2>
        <MinimalPaddingExample />
      </section>
      
      <section>
        <h2 className="text-2xl font-medium text-primary mb-4 px-6">
          Example 6: Custom Styling
        </h2>
        <CustomStyledExample />
      </section>
    </div>
  );
}
