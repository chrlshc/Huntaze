'use client';

import React, { useMemo, useState, useEffect, ReactNode } from 'react';
import { HydrationSafeWrapper } from './HydrationSafeWrapper';
import { useIsClient } from '@/hooks/useIsClient';

interface SafeDocumentAccessProps {
  children: (documentAPI: {
    title: string;
    body: HTMLElement | null;
    head: HTMLElement | null;
    createElement: (tagName: string) => HTMLElement | null;
    getElementById: (id: string) => HTMLElement | null;
    querySelector: (selector: string) => Element | null;
    querySelectorAll: (selector: string) => NodeList | null;
    addEventListener: (event: string, handler: EventListener) => void;
    removeEventListener: (event: string, handler: EventListener) => void;
    isAvailable: boolean;
  }) => ReactNode;
  fallback?: ReactNode;
  className?: string;
}

/**
 * SafeDocumentAccess - Composant pour l'accès sécurisé à l'objet document
 * 
 * Ce composant résout les problèmes d'hydratation liés à document en:
 * 1. Fournissant des valeurs null côté serveur
 * 2. Initialisant les vraies valeurs après l'hydratation
 * 3. Gérant les manipulations DOM de manière sécurisée
 * 4. Offrant une API cohérente serveur/client
 */
export function SafeDocumentAccess({ children, fallback, className }: SafeDocumentAccessProps) {
  const isClient = useIsClient();
  const documentAPI = useMemo(() => {
    const isAvailable = isClient && typeof document !== 'undefined';
    return {
      title: isAvailable ? document.title : '',
      body: isAvailable ? document.body : null,
      head: isAvailable ? document.head : null,
      createElement: (tagName: string) => {
        if (typeof document !== 'undefined') {
          return document.createElement(tagName);
        }
        return null;
      },
      getElementById: (id: string) => {
        if (typeof document !== 'undefined') {
          return document.getElementById(id);
        }
        return null;
      },
      querySelector: (selector: string) => {
        if (typeof document !== 'undefined') {
          return document.querySelector(selector);
        }
        return null;
      },
      querySelectorAll: (selector: string) => {
        if (typeof document !== 'undefined') {
          return document.querySelectorAll(selector);
        }
        return null;
      },
      addEventListener: (event: string, handler: EventListener) => {
        if (typeof document !== 'undefined') {
          document.addEventListener(event, handler);
        }
      },
      removeEventListener: (event: string, handler: EventListener) => {
        if (typeof document !== 'undefined') {
          document.removeEventListener(event, handler);
        }
      },
      isAvailable
    };
  }, [isClient]);
  

  return (
    <HydrationSafeWrapper fallback={fallback} className={className}>
      {children(documentAPI)}
    </HydrationSafeWrapper>
  );
}

/**
 * Hook pour l'accès sécurisé au titre du document
 */
export function useDocumentTitle(initialTitle?: string) {
  const [title, setTitle] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.title;
    }
    return initialTitle || '';
  });

  const updateTitle = (newTitle: string) => {
    setTitle(newTitle);
    if (typeof document !== 'undefined') {
      document.title = newTitle;
    }
  };

  return [title, updateTitle] as const;
}

/**
 * Hook pour l'accès sécurisé aux éléments DOM
 */
export function useElement(selector: string) {
  return useMemo(() => {
    if (typeof document !== 'undefined') {
      return document.querySelector(selector);
    }
    return null;
  }, [selector]);
}

/**
 * Composant pour injecter du CSS de manière hydration-safe
 */
interface SafeStyleInjectorProps {
  css: string;
  id?: string;
  children?: ReactNode;
}

export function SafeStyleInjector({ css, id = 'dynamic-styles', children }: SafeStyleInjectorProps) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      // Vérifier si le style existe déjà
      let styleElement = document.getElementById(id) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = id;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = css;
      
      return () => {
        // Nettoyer au démontage
        const existingStyle = document.getElementById(id);
        if (existingStyle) {
          existingStyle.remove();
        }
      };
    }
  }, [css, id]);

  return <>{children}</>;
}

/**
 * Composant pour gérer les classes du body de manière hydration-safe
 */
interface SafeBodyClassProps {
  className: string;
  children?: ReactNode;
}

export function SafeBodyClass({ className, children }: SafeBodyClassProps) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const classes = className.split(' ').filter(Boolean);
      
      // Ajouter les classes
      classes.forEach(cls => {
        document.body.classList.add(cls);
      });
      
      return () => {
        // Nettoyer au démontage
        classes.forEach(cls => {
          document.body.classList.remove(cls);
        });
      };
    }
  }, [className]);

  return <>{children}</>;
}
