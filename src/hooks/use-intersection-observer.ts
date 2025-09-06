import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView(options: UseIntersectionObserverOptions = {}) {
  const { threshold = 0, root = null, rootMargin = '0px', triggerOnce = false } = options;
  const ref = useRef<Element | null>(null);
  const [inView, setInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (!ref.current || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isInView = entry.isIntersecting;
          setInView(isInView);
          
          if (isInView && triggerOnce) {
            setHasTriggered(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold, root, rootMargin }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, root, rootMargin, triggerOnce, hasTriggered]);

  return { ref, inView };
}