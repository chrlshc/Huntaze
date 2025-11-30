'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";

export interface ModalProps {
  /**
   * Controls whether the modal is visible
   */
  isOpen: boolean;
  
  /**
   * Callback when the modal should close
   */
  onClose: () => void;
  
  /**
   * Modal title
   */
  title?: string;
  
  /**
   * Modal content
   */
  children: React.ReactNode;
  
  /**
   * Footer content (typically action buttons)
   */
  footer?: React.ReactNode;
  
  /**
   * Size variant
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  
  /**
   * Whether clicking the backdrop closes the modal
   * @default true
   */
  closeOnBackdropClick?: boolean;
  
  /**
   * Whether pressing Escape closes the modal
   * @default true
   */
  closeOnEscape?: boolean;
  
  /**
   * Additional CSS classes for the modal content
   */
  className?: string;
}

/**
 * Modal Component
 * 
 * A fully accessible modal dialog with glass morphism effects and design tokens.
 * Uses proper z-index layering, backdrop blur, and smooth animations.
 * 
 * @example
 * ```tsx
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   footer={
 *     <>
 *       <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="primary" onClick={handleConfirm}>Confirm</Button>
 *     </>
 *   }
 * >
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 * ```
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle focus trap and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Store the currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Focus the modal
    modalRef.current?.focus();

    return () => {
      // Restore body scroll
      document.body.style.overflow = '';

      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'modal-sm',
    md: 'modal-md',
    lg: 'modal-lg',
    xl: 'modal-xl',
    full: 'modal-full',
  };

  return (
    <div
      className="modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={`modal-content ${sizeClasses[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {title && (
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">
              {title}
            </h2>
            <Button variant="primary" onClick={onClose} type="button" aria-label="Close modal">
  <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 5L5 15M5 5L15 15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
</Button>
          </div>
        )}

        <div className="modal-body">{children}</div>

        {footer && <div className="modal-footer">{footer}</div>}
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(var(--blur-sm));
          z-index: var(--z-modal-backdrop);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
          animation: fadeIn var(--transition-base);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .modal-content {
          background: var(--bg-glass);
          backdrop-filter: blur(var(--blur-xl));
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xl), var(--shadow-inner-glow);
          z-index: var(--z-modal);
          max-height: calc(100vh - var(--space-8));
          display: flex;
          flex-direction: column;
          animation: slideUp var(--transition-base);
          outline: none;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(var(--space-4));
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-sm {
          width: 100%;
          max-width: 400px;
        }

        .modal-md {
          width: 100%;
          max-width: 560px;
        }

        .modal-lg {
          width: 100%;
          max-width: 768px;
        }

        .modal-xl {
          width: 100%;
          max-width: 1024px;
        }

        .modal-full {
          width: 100%;
          max-width: calc(100vw - var(--space-8));
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-6);
          border-bottom: 1px solid var(--border-subtle);
        }

        .modal-title {
          font-size: var(--text-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--text-primary);
          margin: 0;
        }

        .modal-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-base);
        }

        .modal-close:hover {
          background: var(--bg-glass-hover);
          color: var(--text-primary);
        }

        .modal-close:focus-visible {
          outline: var(--focus-ring-width) solid var(--focus-ring-color);
          outline-offset: var(--focus-ring-offset);
        }

        .modal-body {
          padding: var(--space-6);
          overflow-y: auto;
          flex: 1;
          color: var(--text-secondary);
          font-size: var(--text-base);
          line-height: var(--leading-relaxed);
        }

        .modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: var(--space-3);
          padding: var(--space-6);
          border-top: 1px solid var(--border-subtle);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .modal-backdrop {
            padding: var(--space-2);
          }

          .modal-content {
            max-height: calc(100vh - var(--space-4));
          }

          .modal-header,
          .modal-body,
          .modal-footer {
            padding: var(--space-4);
          }

          .modal-title {
            font-size: var(--text-lg);
          }

          .modal-footer {
            flex-direction: column-reverse;
            gap: var(--space-2);
          }

          .modal-footer > * {
            width: 100%;
          }
        }

        /* Accessibility: Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .modal-backdrop,
          .modal-content {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
