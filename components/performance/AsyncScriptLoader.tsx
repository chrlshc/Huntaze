'use client';

/**
 * Async Script Loader Component
 * 
 * Loads third-party scripts asynchronously to prevent blocking
 * Validates: Requirements 6.3, 6.4
 */

import { useEffect, useState } from 'react';

export interface AsyncScriptProps {
  src: string;
  id?: string;
  strategy?: 'defer' | 'async' | 'lazy';
  onLoad?: () => void;
  onError?: (error: Error) => void;
  critical?: boolean;
}

export function AsyncScript({
  src,
  id,
  strategy = 'async',
  onLoad,
  onError,
  critical = false,
}: AsyncScriptProps) {
  const [loaded, setLoaded] = useState(() => {
    if (typeof document === 'undefined' || !id) return false;
    return Boolean(document.getElementById(id));
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (loaded) {
      onLoad?.();
    }
  }, [loaded, onLoad]);

  useEffect(() => {
    if (loaded) return;

    // Check if script already exists
    const existingScript = id ? document.getElementById(id) : null;
    if (existingScript) {
      const timeoutId = window.setTimeout(() => setLoaded(true), 0);
      return () => clearTimeout(timeoutId);
    }

    // Create script element
    const script = document.createElement('script');
    script.src = src;
    if (id) script.id = id;

    // Set loading strategy
    if (strategy === 'defer') {
      script.defer = true;
    } else if (strategy === 'async') {
      script.async = true;
    }

    // Handle load
    script.onload = () => setLoaded(true);

    // Handle error
    script.onerror = () => {
      const err = new Error(`Failed to load script: ${src}`);
      setError(err);
      onError?.(err);
    };

    // For non-critical scripts, delay loading until after page load
    if (!critical && strategy === 'lazy') {
      if (document.readyState === 'complete') {
        document.body.appendChild(script);
      } else {
        window.addEventListener('load', () => {
          document.body.appendChild(script);
        });
      }
    } else {
      document.body.appendChild(script);
    }

    // Cleanup
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [src, id, strategy, critical, onError, loaded]);

  return null;
}

/**
 * Hook for loading scripts programmatically
 */
export function useAsyncScript(props: AsyncScriptProps) {
  const [loaded, setLoaded] = useState(() => {
    if (typeof document === 'undefined' || !props.id) return false;
    return Boolean(document.getElementById(props.id));
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (loaded) {
      props.onLoad?.();
      return;
    }

    const existingScript = props.id ? document.getElementById(props.id) : null;
    if (existingScript) {
      const timeoutId = window.setTimeout(() => setLoaded(true), 0);
      return () => clearTimeout(timeoutId);
    }

    const script = document.createElement('script');
    script.src = props.src;
    if (props.id) script.id = props.id;

    if (props.strategy === 'defer') {
      script.defer = true;
    } else {
      script.async = true;
    }

    script.onload = () => setLoaded(true);

    script.onerror = () => {
      const err = new Error(`Failed to load script: ${props.src}`);
      setError(err);
      props.onError?.(err);
    };

    if (!props.critical && props.strategy === 'lazy') {
      if (document.readyState === 'complete') {
        document.body.appendChild(script);
      } else {
        window.addEventListener('load', () => {
          document.body.appendChild(script);
        });
      }
    } else {
      document.body.appendChild(script);
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [loaded, props]);

  return { loaded, error };
}
