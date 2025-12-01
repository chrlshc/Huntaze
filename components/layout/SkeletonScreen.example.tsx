/**
 * SkeletonScreen Component Examples
 * 
 * Demonstrates various use cases for the SkeletonScreen component
 */

import React, { useState, useEffect } from 'react';
import { SkeletonScreen } from './SkeletonScreen';
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/export-all";

/**
 * Example 1: Dashboard Loading State
 */
export function DashboardExample() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium mb-4">Dashboard Example</h2>
      {isLoading ? (
        <SkeletonScreen variant="dashboard" />
      ) : (
        <div>
          <h1 className="text-3xl font-medium mb-2">Dashboard</h1>
          <p className="text-[var(--color-text-primary)] mb-6">Welcome back!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[var(--color-bg-surface)] p-6 rounded-md">
              <h3 className="text-lg font-medium mb-2">Total Users</h3>
              <p className="text-3xl font-medium">1,234</p>
            </div>
            <div className="bg-[var(--color-bg-surface)] p-6 rounded-md">
              <h3 className="text-lg font-medium mb-2">Revenue</h3>
              <p className="text-3xl font-medium">$12,345</p>
            </div>
            <div className="bg-[var(--color-bg-surface)] p-6 rounded-md">
              <h3 className="text-lg font-medium mb-2">Active Sessions</h3>
              <p className="text-3xl font-medium">567</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example 2: Form Loading State
 */
export function FormExample() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium mb-4">Form Example</h2>
      {isLoading ? (
        <SkeletonScreen variant="form" />
      ) : (
        <form className="max-w-2xl space-y-6">
          <h1 className="text-2xl font-medium">Contact Form</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Name</label>
              <input 
                type="text" 
                className="w-full h-10 px-3 bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Email</label>
              <input 
                type="email" 
                className="w-full h-10 px-3 bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm mb-2">Message</label>
              <textarea 
                className="w-full h-24 px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-md"
              />
            </div>
            <Button variant="primary" type="submit">
  Submit
</Button>
          </div>
        </form>
      )}
    </div>
  );
}

/**
 * Example 3: Card Grid with Custom Count
 */
export function CardGridExample() {
  const [isLoading, setIsLoading] = useState(true);
  const [count, setCount] = useState(6);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-medium">Card Grid Example</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm">Count:</label>
          <Select 
            value={count} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setCount(Number(e.target.value));
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1000);
            }}
            className="h-8 px-2 bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-md"
          >
            <option value={3}>3</option>
            <option value={6}>6</option>
            <option value={9}>9</option>
            <option value={12}>12</option>
          </Select>
        </div>
      </div>
      {isLoading ? (
        <SkeletonScreen variant="card" count={count} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="bg-[var(--color-bg-surface)] rounded-md overflow-hidden">
              <div className="h-48 bg-[var(--color-bg-hover)]" />
              <div className="p-4 space-y-2">
                <h3 className="text-lg font-medium">Card {i + 1}</h3>
                <p className="text-[var(--color-text-primary)]">
                  This is a sample card with some content.
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: List with Custom Count
 */
export function ListExample() {
  const [isLoading, setIsLoading] = useState(true);
  const [count, setCount] = useState(5);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-medium">List Example</h2>
        <div className="flex items-center gap-2">
          <label className="text-sm">Count:</label>
          <Select 
            value={count} 
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setCount(Number(e.target.value));
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1000);
            }}
            className="h-8 px-2 bg-[var(--color-bg-input)] border border-[var(--color-border-subtle)] rounded-md"
          >
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </Select>
        </div>
      </div>
      {isLoading ? (
        <SkeletonScreen variant="list" count={count} />
      ) : (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <div 
              key={i} 
              className="flex items-center space-x-4 p-4 border border-[var(--color-border-subtle)] rounded-md"
            >
              <div className="h-12 w-12 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-[var(--color-text-inverse)] font-medium">
                {i + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-base font-medium">Item {i + 1}</h3>
                <p className="text-sm text-[var(--color-text-primary)]">
                  This is item number {i + 1} in the list
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 5: Animation Toggle
 */
export function AnimationExample() {
  const [animate, setAnimate] = useState(true);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-medium">Animation Example</h2>
        <label className="flex items-center gap-2">
          <input 
            type="checkbox" 
            checked={animate}
            onChange={(e) => setAnimate(e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm">Enable Animation</span>
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Dashboard</h3>
          <SkeletonScreen variant="dashboard" animate={animate} />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">Form</h3>
          <SkeletonScreen variant="form" animate={animate} />
        </div>
      </div>
    </div>
  );
}

/**
 * Example 6: All Variants Showcase
 */
export function AllVariantsExample() {
  return (
    <div className="p-6 space-y-8">
      <h2 className="text-2xl font-medium">All Variants Showcase</h2>
      
      <div>
        <h3 className="text-xl font-medium mb-4">Dashboard Variant</h3>
        <SkeletonScreen variant="dashboard" />
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">Form Variant</h3>
        <SkeletonScreen variant="form" />
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">Card Variant (3 items)</h3>
        <SkeletonScreen variant="card" count={3} />
      </div>

      <div>
        <h3 className="text-xl font-medium mb-4">List Variant (5 items)</h3>
        <SkeletonScreen variant="list" count={5} />
      </div>
    </div>
  );
}

/**
 * Example 7: With React Suspense
 */
const LazyContent = React.lazy(() => 
  new Promise<{ default: React.ComponentType }>(resolve => {
    setTimeout(() => {
      resolve({
        default: () => (
          <div className="p-6 bg-[var(--color-bg-surface)] rounded-md">
            <h3 className="text-lg font-medium mb-2">Lazy Loaded Content</h3>
            <p className="text-[var(--color-text-primary)]">
              This content was loaded asynchronously with React Suspense.
            </p>
          </div>
        )
      });
    }, 2000);
  })
);

export function SuspenseExample() {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-medium mb-4">Suspense Example</h2>
      <React.Suspense fallback={<SkeletonScreen variant="card" count={1} />}>
        <LazyContent />
      </React.Suspense>
    </div>
  );
}

/**
 * Main Example Component
 */
export default function SkeletonScreenExamples() {
  const [activeExample, setActiveExample] = useState<string>('dashboard');

  const examples = {
    dashboard: <DashboardExample />,
    form: <FormExample />,
    cards: <CardGridExample />,
    list: <ListExample />,
    animation: <AnimationExample />,
    all: <AllVariantsExample />,
    suspense: <SuspenseExample />,
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      <div className="border-b border-[var(--color-border-subtle)] p-4">
        <h1 className="text-3xl font-medium mb-4">SkeletonScreen Examples</h1>
        <div className="flex flex-wrap gap-2">
          {Object.keys(examples).map((key) => (
            <Button 
              key={key}
              variant="primary" 
              onClick={() => setActiveExample(key)}
              className={`px-4 py-2 rounded-md transition-colors ${
                activeExample === key
                  ? 'bg-[var(--color-accent-primary)] text-[var(--color-text-inverse)]'
                  : 'bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Button>
          ))}
        </div>
      </div>
      <div>{examples[activeExample as keyof typeof examples]}</div>
    </div>
  );
}
