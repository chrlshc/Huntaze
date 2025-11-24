/**
 * Safe Area Examples
 * 
 * This file contains example implementations of safe area components
 * for common UI patterns. Use these as reference when building
 * iOS-safe layouts.
 * 
 * DO NOT import this file in production code - it's for reference only.
 */

import type { ReactNode } from 'react';
import {
  SafeAreaTop,
  SafeAreaBottom,
  SafeAreaInset,
  SafeAreaHeader,
  SafeAreaFooter,
} from './SafeArea';

/**
 * Example 1: Fixed Header with Navigation
 * 
 * Common pattern for app headers with navigation items.
 * The SafeAreaHeader component handles safe area padding automatically.
 */
export function ExampleFixedHeader() {
  return (
    <SafeAreaHeader>
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="lg:hidden">Menu</button>
          <h1 className="text-xl font-bold">App Name</h1>
        </div>
        <nav className="flex items-center gap-4">
          <button>Notifications</button>
          <button>Profile</button>
        </nav>
      </div>
    </SafeAreaHeader>
  );
}

/**
 * Example 2: Mobile Tab Bar
 * 
 * Bottom navigation pattern common in mobile apps.
 * Uses SafeAreaBottom to avoid home indicator overlap.
 */
export function ExampleMobileTabBar() {
  return (
    <SafeAreaFooter className="fixed bottom-0 left-0 right-0 z-50">
      <div className="h-16 px-6 flex items-center justify-around">
        <TabBarItem icon="🏠" label="Home" />
        <TabBarItem icon="🔍" label="Search" />
        <TabBarItem icon="➕" label="Create" />
        <TabBarItem icon="❤️" label="Likes" />
        <TabBarItem icon="👤" label="Profile" />
      </div>
    </SafeAreaFooter>
  );
}

function TabBarItem({ icon, label }: { icon: string; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs">{label}</span>
    </button>
  );
}

/**
 * Example 3: Full-Screen Modal
 * 
 * Modal that covers the entire viewport with safe area padding.
 * Uses SafeAreaInset for complete coverage.
 */
export function ExampleFullScreenModal({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <SafeAreaInset className="h-full flex flex-col">
        {/* Modal Header */}
        <header className="flex-shrink-0 h-16 px-6 flex items-center justify-between border-b border-border">
          <h2 className="text-lg font-semibold">Modal Title</h2>
          <button>Close</button>
        </header>

        {/* Modal Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-6 py-8">
          {children}
        </main>

        {/* Modal Footer */}
        <footer className="flex-shrink-0 h-16 px-6 flex items-center justify-end gap-4 border-t border-border">
          <button className="px-4 py-2">Cancel</button>
          <button className="px-4 py-2 bg-primary text-white rounded-lg">
            Confirm
          </button>
        </footer>
      </SafeAreaInset>
    </div>
  );
}

/**
 * Example 4: Viewport-Locked App Layout
 * 
 * Complete app layout with viewport locking and safe areas.
 * This is the pattern used in the (app) route group.
 */
export function ExampleAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-viewport-lock flex flex-col">
      {/* Header with safe area top */}
      <SafeAreaTop className="flex-shrink-0">
        <header className="h-16 px-6 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md">
          <h1 className="text-xl font-bold">App Name</h1>
          <nav className="flex items-center gap-4">
            <button>Notifications</button>
            <button>Profile</button>
          </nav>
        </header>
      </SafeAreaTop>

      {/* Main content - scrollable */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-8">
        {children}
      </main>

      {/* Footer with safe area bottom */}
      <SafeAreaBottom className="flex-shrink-0">
        <footer className="h-16 px-6 flex items-center justify-around border-t border-border bg-surface">
          <button>Tab 1</button>
          <button>Tab 2</button>
          <button>Tab 3</button>
        </footer>
      </SafeAreaBottom>
    </div>
  );
}

/**
 * Example 5: Bottom Sheet with Safe Area
 * 
 * Slide-up sheet that respects the home indicator.
 */
export function ExampleBottomSheet({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <SafeAreaBottom>
        <div className="bg-surface rounded-t-3xl border-t border-border shadow-2xl">
          {/* Handle */}
          <div className="flex justify-center pt-4 pb-2">
            <div className="w-12 h-1 bg-border rounded-full" />
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </SafeAreaBottom>
    </div>
  );
}

/**
 * Example 6: Sticky Header in Scrollable Content
 * 
 * Header that sticks to the top while content scrolls.
 * Uses SafeAreaTop to avoid notch overlap.
 */
export function ExampleStickyHeader({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <SafeAreaTop>
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="h-16 px-6 flex items-center">
            <h1 className="text-xl font-bold">Sticky Header</h1>
          </div>
        </header>
      </SafeAreaTop>

      <main className="px-6 py-8">
        {children}
      </main>
    </div>
  );
}

/**
 * Example 7: Landscape Sidebar with Safe Areas
 * 
 * Sidebar that respects safe areas in landscape orientation.
 */
export function ExampleLandscapeSidebar({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar with left safe area */}
      <aside className="w-64 border-r border-border bg-surface pl-[var(--sal)]">
        <div className="h-full overflow-y-auto px-6 py-8">
          <nav className="space-y-2">
            <a href="#" className="block px-4 py-2 rounded-lg hover:bg-background">
              Nav Item 1
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg hover:bg-background">
              Nav Item 2
            </a>
            <a href="#" className="block px-4 py-2 rounded-lg hover:bg-background">
              Nav Item 3
            </a>
          </nav>
        </div>
      </aside>

      {/* Main content with right safe area */}
      <main className="flex-1 overflow-y-auto pr-[var(--sar)]">
        <div className="px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}

/**
 * Example 8: Custom Safe Area Implementation
 * 
 * Shows how to use CSS variables directly for custom layouts.
 */
export function ExampleCustomSafeArea() {
  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Custom header with combined padding */}
      <header
        className="flex-shrink-0 bg-primary text-white"
        style={{
          paddingTop: 'calc(1rem + var(--sat))',
          paddingLeft: 'calc(1.5rem + var(--sal))',
          paddingRight: 'calc(1.5rem + var(--sar))',
        }}
      >
        <div className="h-16 flex items-center">
          <h1 className="text-xl font-bold">Custom Safe Area</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <p>Content with custom safe area implementation</p>
      </main>

      {/* Custom footer with combined padding */}
      <footer
        className="flex-shrink-0 bg-surface border-t border-border"
        style={{
          paddingBottom: 'calc(1rem + var(--sab))',
          paddingLeft: 'calc(1.5rem + var(--sal))',
          paddingRight: 'calc(1.5rem + var(--sar))',
        }}
      >
        <div className="h-16 flex items-center justify-center">
          <p className="text-sm text-muted">Footer content</p>
        </div>
      </footer>
    </div>
  );
}
