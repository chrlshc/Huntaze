'use client';

import { useEffect } from 'react';

export default function RemoveDarkOverlay() {
  useEffect(() => {
    // Only run the cleanup when explicitly requested via data-no-overlay
    // (set with <body data-no-overlay="true"> inside app/layout.tsx)
    if (typeof document !== 'undefined') {
      const shouldDisable = document.body?.dataset?.noOverlay === 'true'
      if (!shouldDisable) return
    }

    // Remove overlays from the DOM
    const removeOverlays = () => {
      // Find and remove overlay elements
      const overlaySelectors = [
        '.overlay',
        '[class*="overlay"]',
        '[class*="filter"]',
        '.dark-filter',
        '.absolute.inset-0[class*="hover:opacity"]',
        '.absolute.inset-0[class*="group-hover:opacity"]',
        '[class*="blur"][class*="hover"]',
        '[class*="bg-gradient"][class*="hover:opacity"]'
      ];
      
      overlaySelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // Remove elements that rely on hover opacity utilities
          const classes = el.className;
          if (classes.includes('hover:opacity') || classes.includes('group-hover:opacity')) {
            el.remove();
          }
        });
      });

      // Strip inline styles that recreate overlays
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const htmlEl = el as HTMLElement;
        const style = htmlEl.getAttribute('style');
        if (style && (style.includes('filter') || style.includes('backdrop-filter'))) {
          htmlEl.style.filter = 'none';
          htmlEl.style.backdropFilter = 'none';
          (htmlEl.style as any).webkitBackdropFilter = 'none';
        }
      });

      // Disable hover classes that recreate overlays
      const elementsWithHover = document.querySelectorAll('[class*="hover"]');
      elementsWithHover.forEach(el => {
        const htmlEl = el as HTMLElement;
        const classes = htmlEl.className.split(' ');
        const newClasses = classes.filter(cls => 
          !cls.includes('hover:opacity') && 
          !cls.includes('hover:bg-black') &&
          !cls.includes('hover:filter') &&
          !cls.includes('hover:blur')
        );
        htmlEl.className = newClasses.join(' ');
      });
    };

    // Run during an idle window to avoid blocking the initial paint
    const idle = (cb: () => void) => {
      // @ts-ignore
      if (typeof requestIdleCallback === 'function') return requestIdleCallback(cb)
      return setTimeout(cb, 0)
    }

    const idleHandle = idle(() => removeOverlays())

    // Watch for dynamically added nodes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as HTMLElement;
            if (element.classList) {
              const hasOverlay = 
                element.classList.contains('overlay') ||
                element.classList.contains('dark-filter') ||
                (typeof element.className === 'string' && (
                  element.className.includes('hover:opacity') ||
                  element.className.includes('hover:bg-black') ||
                  element.className.includes('blur')
                ));
                
              if (hasOverlay) {
                element.remove();
              }
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Cleanup
    return () => {
      observer.disconnect();
      // @ts-ignore
      if (typeof cancelIdleCallback === 'function') {
        // @ts-ignore
        cancelIdleCallback(idleHandle)
      } else {
        clearTimeout(idleHandle as any)
      }
    };
  }, []);

  return null;
}
