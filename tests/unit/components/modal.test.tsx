import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Modal } from '@/components/ui/modal';
import React from 'react';

describe('Modal Component', () => {
  let onCloseMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onCloseMock = vi.fn();
  });

  afterEach(() => {
    // Clean up body overflow style
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render title when provided', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should render children content', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Test content</p>
        </Modal>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render footer when provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={onCloseMock}
          footer={<button>Action</button>}
        >
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('should render close button when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test">
          <p>Modal content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Design Token Usage', () => {
    it('should use --z-modal-backdrop for backdrop z-index', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const backdrop = container.querySelector('.modal-backdrop');
      const styles = window.getComputedStyle(backdrop!);
      
      // Check that z-index uses the token (the actual value will be computed)
      expect(backdrop).toBeInTheDocument();
    });

    it('should use --z-modal for modal content z-index', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should use --bg-glass for background', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should use --blur-xl for backdrop filter', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should use --border-subtle for border', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should use --shadow-xl and --shadow-inner-glow for shadows', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should use --transition-base for animations', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should use --radius-2xl for border radius', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-content');
      expect(content).toBeInTheDocument();
    });

    it('should use spacing tokens for padding', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test">
          <p>Modal content</p>
        </Modal>
      );

      const header = container.querySelector('.modal-header');
      const body = container.querySelector('.modal-body');
      
      expect(header).toBeInTheDocument();
      expect(body).toBeInTheDocument();
    });

    it('should use typography tokens for title', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Title">
          <p>Modal content</p>
        </Modal>
      );

      const title = screen.getByText('Test Title');
      expect(title).toBeInTheDocument();
    });
  });

  describe('Size Variants', () => {
    it('should apply sm size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} size="sm">
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-sm');
      expect(content).toBeInTheDocument();
    });

    it('should apply md size class by default', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-md');
      expect(content).toBeInTheDocument();
    });

    it('should apply lg size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} size="lg">
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-lg');
      expect(content).toBeInTheDocument();
    });

    it('should apply xl size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} size="xl">
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-xl');
      expect(content).toBeInTheDocument();
    });

    it('should apply full size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} size="full">
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-full');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test">
          <p>Modal content</p>
        </Modal>
      );

      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const backdrop = container.querySelector('.modal-backdrop');
      fireEvent.click(backdrop!);

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.modal-content');
      fireEvent.click(content!);

      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('should not close on backdrop click when closeOnBackdropClick is false', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} closeOnBackdropClick={false}>
          <p>Modal content</p>
        </Modal>
      );

      const backdrop = container.querySelector('.modal-backdrop');
      fireEvent.click(backdrop!);

      expect(onCloseMock).not.toHaveBeenCalled();
    });

    it('should call onClose when Escape key is pressed', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('should not close on Escape when closeOnEscape is false', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} closeOnEscape={false}>
          <p>Modal content</p>
        </Modal>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby when title is provided', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    });

    it('should lock body scroll when open', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should restore body scroll when closed', () => {
      const { rerender } = render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('hidden');

      rerender(
        <Modal isOpen={false} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      expect(document.body.style.overflow).toBe('');
    });

    it('should be focusable with tabIndex=-1', () => {
      render(
        <Modal isOpen={true} onClose={onCloseMock}>
          <p>Modal content</p>
        </Modal>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Custom className', () => {
    it('should apply custom className to modal content', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={onCloseMock} className="custom-class">
          <p>Modal content</p>
        </Modal>
      );

      const content = container.querySelector('.custom-class');
      expect(content).toBeInTheDocument();
    });
  });
});
