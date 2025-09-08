'use client';

import { useEffect } from 'react';

export default function RemoveDarkOverlay() {
  useEffect(() => {
    // N’active le nettoyage que si explicitement demandé via data-no-overlay
    // (défini dans <body data-no-overlay="true"> depuis app/layout.tsx)
    if (typeof document !== 'undefined') {
      const shouldDisable = document.body?.dataset?.noOverlay === 'true'
      if (!shouldDisable) return
    }

    // Fonction pour supprimer les overlays
    const removeOverlays = () => {
      // Trouve et supprime tous les éléments overlay
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
          // Si l'élément contient hover:opacity, le supprimer
          const classes = el.className;
          if (classes.includes('hover:opacity') || classes.includes('group-hover:opacity')) {
            el.remove();
          }
        });
      });

      // Supprime les styles inline qui créent des overlays
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

      // Désactive les event listeners de hover causant l'overlay
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

    // Exécute au moment idle pour éviter de bloquer le rendu initial
    const idle = (cb: () => void) => {
      // @ts-ignore
      if (typeof requestIdleCallback === 'function') return requestIdleCallback(cb)
      return setTimeout(cb, 0)
    }

    const idleHandle = idle(() => removeOverlays())

    // Observer pour les nouveaux éléments ajoutés dynamiquement
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
