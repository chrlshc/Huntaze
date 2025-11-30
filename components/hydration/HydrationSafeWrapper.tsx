'use client';

import { ReactNode, useEffect, useState } from 'react';

/**
 * HydrationSafeWrapper Component
 * 
 * Prevents hydration mismatches by only rendering children on the client side.
 * Provides a fallback for server-side rendering.
 * 
 * Usage:
 * ```tsx
 * <HydrationSafeWrapper fallback={<div>Loading...</div>}>
 *   <ClientOnlyComponent />
 * </HydrationSafeWrapper>
 * ```
 */

export interface HydrationSafeWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  /**
   * If true, will render children on server but with hydration suppression
   * Use only when you need SEO content but have minor hydration differences
   */
  suppressWarning?: boolean;
  suppressHydrationWarning?: boolean;
  className?: string;
  id?: string;
  onHydrationError?: (error: Error) => void;
}

export function HydrationSafeWrapper({
  children,
  fallback = null,
  suppressWarning = false,
  suppressHydrationWarning = false,
  className,
  id,
  onHydrationError,
}: HydrationSafeWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const wrap = (content: ReactNode, suppress = false) => {
    const shouldSuppress = suppress || suppressWarning || suppressHydrationWarning;
    if (className || id || suppress) {
      return (
        <div
          className={className}
          id={id}
          suppressHydrationWarning={shouldSuppress}
        >
          {content}
        </div>
      );
    }
    return <>{content}</>;
  };

  // Server-side: render fallback
  if (!isClient) {
    return wrap(fallback, true);
  }

  try {
    // Client-side: render children
    return wrap(children);
  } catch (error) {
    onHydrationError?.(error as Error);
    return wrap(fallback, true);
  }
}

/**
 * ClientOnly Component
 * 
 * Simpler version that only renders on client, no fallback
 */
export function ClientOnly({ children }: { children: ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? <>{children}</> : null;
}

/**
 * SafeBrowserAPI Component
 * 
 * Provides safe access to browser APIs with hydration protection
 */
interface SafeBrowserAPIProps {
  children: (api: {
    window: Window;
    document: Document;
    localStorage: Storage;
    sessionStorage: Storage;
  }) => ReactNode;
  fallback?: ReactNode;
}

export function SafeBrowserAPI({ children, fallback = null }: SafeBrowserAPIProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient || typeof window === 'undefined') {
    return <>{fallback}</>;
  }

  return (
    <>
      {children({
        window,
        document,
        localStorage: window.localStorage,
        sessionStorage: window.sessionStorage,
      })}
    </>
  );
}

/**
 * SafeCurrentYear Component
 * 
 * Renders current year with hydration safety
 */
export function SafeCurrentYear({ fallback }: { fallback?: ReactNode } = {}) {
  const [year, setYear] = useState<number | null>(null);
  const fallbackValue = fallback ?? new Date().getFullYear();

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // Server-side: render placeholder
  if (year === null) {
    return <span suppressHydrationWarning>{fallbackValue}</span>;
  }

  // Client-side: render actual year
  return <span>{year}</span>;
}

/**
 * SafeRandomContent Component
 * 
 * Renders random content with hydration safety
 */
interface SafeRandomContentProps {
  options: string[];
  fallback?: string;
}

export function SafeRandomContent({ options, fallback }: SafeRandomContentProps) {
  const [content, setContent] = useState<string | null>(null);

  useEffect(() => {
    setContent(options[Math.floor(Math.random() * options.length)]);
  }, [options]);

  // Server-side: render fallback
  if (content === null) {
    return <span>{fallback || options[0]}</span>;
  }

  // Client-side: render random content
  return <span>{content}</span>;
}

/**
 * SafeConditionalRender Component
 * 
 * Conditionally renders based on client-side conditions
 */
interface SafeConditionalRenderProps {
  condition: () => boolean;
  children: ReactNode;
  fallback?: ReactNode;
}

export function SafeConditionalRender({
  condition,
  children,
  fallback = null,
}: SafeConditionalRenderProps) {
  const [shouldRender, setShouldRender] = useState<boolean | null>(null);

  useEffect(() => {
    setShouldRender(condition());
  }, [condition]);

  // Server-side: render fallback
  if (shouldRender === null) {
    return <>{fallback}</>;
  }

  // Client-side: render based on condition
  return shouldRender ? <>{children}</> : <>{fallback}</>;
}
