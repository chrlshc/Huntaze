'use client';

/**
 * GuardRailModal Component
 * 
 * Modal that appears when users attempt actions without required prerequisites.
 * Provides direct path to complete missing steps with retry logic.
 * 
 * Requirements: 4.2, 4.3, 19.2, 19.4, 22.1, 22.4, 23.2
 */

import { useState, useEffect, useRef } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GuardRailAction {
  type: 'open_modal' | 'redirect';
  modal?: string;
  url?: string;
  prefill?: Record<string, any>;
}

interface GuardRailModalProps {
  isOpen: boolean;
  missingStep: string;
  message: string;
  action: GuardRailAction;
  onClose: () => void;
  onComplete: () => void;
  correlationId?: string;
}

export default function GuardRailModal({
  isOpen,
  missingStep,
  message,
  action,
  onClose,
  onComplete,
  correlationId,
}: GuardRailModalProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen) {
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

      const handleTab = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTab);
      firstElement?.focus();

      return () => document.removeEventListener('keydown', handleTab);
    }
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleAction = async () => {
    setLoading(true);
    setError(null);

    try {
      if (action.type === 'redirect' && action.url) {
        window.location.href = action.url;
        return;
      }

      if (action.type === 'open_modal' && action.modal) {
        // TODO: Implement modal opening logic based on modal type
        console.log('[GuardRailModal] Opening modal:', action.modal, action.prefill);
        
        // Simulate modal completion
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        onComplete();
      }
    } catch (err) {
      setRetryCount(prev => prev + 1);
      setError('Une erreur est survenue. Veuillez réessayer.');
      console.error('[GuardRailModal] Action failed:', err, { correlationId });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guard-rail-title"
        aria-describedby="guard-rail-description"
      >
        <div
          ref={modalRef}
          className="bg-surface-raised rounded-2xl shadow-xl max-w-md w-full p-6 pointer-events-auto animate-scale-in sm:max-w-lg"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <h2
                id="guard-rail-title"
                className="text-lg font-semibold text-content-primary"
              >
                Configuration requise
              </h2>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="p-1 text-content-secondary hover:text-content-primary hover:bg-surface-muted rounded-lg transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p
              id="guard-rail-description"
              className="text-content-secondary mb-4"
            >
              {message}
            </p>

            {error && (
              <div
                className="bg-danger/10 border border-danger/20 rounded-lg p-3 mb-4"
                role="alert"
              >
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            {correlationId && (
              <p className="text-xs text-content-secondary">
                ID de corrélation: {correlationId.slice(0, 8)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              onClick={onClose}
              variant="outline"
              size="md"
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleAction}
              variant="primary"
              size="md"
              loading={loading}
            >
              {retryCount > 0 ? 'Réessayer' : 'Configurer maintenant'}
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
