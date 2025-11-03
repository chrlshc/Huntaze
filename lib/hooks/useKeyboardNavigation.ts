import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      for (const shortcut of shortcuts) {
        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatches && ctrlMatches && shiftMatches && altMatches) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [handleKeyDown, enabled]);
}

export function useOnboardingKeyboardShortcuts(
  onNext?: () => void,
  onPrevious?: () => void,
  onSkip?: () => void,
  enabled = true
) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowRight',
      action: () => onNext?.(),
      description: 'Next step',
    },
    {
      key: 'ArrowLeft',
      action: () => onPrevious?.(),
      description: 'Previous step',
    },
    {
      key: 'Escape',
      action: () => onSkip?.(),
      description: 'Skip step',
    },
    {
      key: 'Enter',
      action: () => onNext?.(),
      description: 'Continue',
    },
  ];

  useKeyboardNavigation(shortcuts, enabled);
}
