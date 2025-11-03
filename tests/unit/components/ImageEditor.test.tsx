/**
 * Unit Tests - Image Editor Component (Task 4.1)
 * 
 * Tests for image editor UI component
 * Based on: .kiro/specs/content-creation/tasks.md (Task 4.1)
 * 
 * Coverage:
 * - Canvas-based editor interface
 * - Toolbar interactions
 * - Crop, resize, rotate, flip tools
 * - Adjustment sliders (brightness, contrast, saturation)
 * - Text overlay tool
 * - Filter presets
 * - User interactions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ImageEditor } from '@/components/content/ImageEditor';

// Mock canvas context
const mockCanvasContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn(),
  putImageData: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 })),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
};

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCanvasContext as any);

describe('Image Editor Component - Unit Tests', () => {
  const mockImage = {
    id: 1,
    url: 'https://example.com/test-image.jpg',
    filename: 'test-image.jpg',
    width: 1000,
    height: 1000,
  };

  const mockOnSave = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Requirement 3.1 - Editor Interface', () => {
    it('should render image editor with canvas', () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const canvas = screen.getByRole('img', { hidden: true });
      expect(canvas).toBeInTheDocument();
    });

    it('should display toolbar with editing tools', () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /crop/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /resize/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rotate/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /flip/i })).toBeInTheDocument();
    });

    it('should load image on mount', async () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(mockCanvasContext.drawImage).toHaveBeenCalled();
      });
    });

    it('should display image dimensions', () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/1000.*1000/)).toBeInTheDocument();
    });
  });

  describe('Requirement 3.1 - Crop Tool', () => {
    it('should activate crop tool when clicked', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cropButton = screen.getByRole('button', { name: /crop/i });
      await user.click(cropButton);

      expect(cropButton).toHaveClass('active');
    });

    it('should display crop handles on canvas', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cropButton = screen.getByRole('button', { name: /crop/i });
      await user.click(cropButton);

      // Crop handles should be drawn on canvas
      expect(mockCanvasContext.fillRect).toHaveBeenCalled();
    });

    it('should allow dragging crop area', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cropButton = screen.getByRole('button', { name: /crop/i });
      await user.click(cropButton);

      const canvas = screen.getByRole('img', { hidden: true });
      
      // Simulate drag
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 500, clientY: 500 });
      fireEvent.mouseUp(canvas);

      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    it('should apply crop when confirmed', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cropButton = screen.getByRole('button', { name: /crop/i });
      await user.click(cropButton);

      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);

      expect(mockCanvasContext.drawImage).toHaveBeenCalled();
    });
  });

  describe('Requirement 3.1 - Resize Tool', () => {
    it('should open resize dialog', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const resizeButton = screen.getByRole('button', { name: /resize/i });
      await user.click(resizeButton);

      expect(screen.getByLabelText(/width/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/height/i)).toBeInTheDocument();
    });

    it('should maintain aspect ratio by default', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const resizeButton = screen.getByRole('button', { name: /resize/i });
      await user.click(resizeButton);

      const widthInput = screen.getByLabelText(/width/i);
      await user.clear(widthInput);
      await user.type(widthInput, '800');

      const heightInput = screen.getByLabelText(/height/i);
      expect(heightInput).toHaveValue(800); // Aspect ratio maintained
    });

    it('should allow custom dimensions when aspect ratio unlocked', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const resizeButton = screen.getByRole('button', { name: /resize/i });
      await user.click(resizeButton);

      const lockButton = screen.getByRole('button', { name: /lock aspect ratio/i });
      await user.click(lockButton);

      const widthInput = screen.getByLabelText(/width/i);
      await user.clear(widthInput);
      await user.type(widthInput, '800');

      const heightInput = screen.getByLabelText(/height/i);
      await user.clear(heightInput);
      await user.type(heightInput, '600');

      expect(widthInput).toHaveValue(800);
      expect(heightInput).toHaveValue(600);
    });
  });

  describe('Requirement 3.1 - Rotate Tool', () => {
    it('should rotate image 90 degrees clockwise', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const rotateButton = screen.getByRole('button', { name: /rotate.*90/i });
      await user.click(rotateButton);

      expect(mockCanvasContext.rotate).toHaveBeenCalledWith(Math.PI / 2);
    });

    it('should rotate image 180 degrees', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const rotateButton = screen.getByRole('button', { name: /rotate.*180/i });
      await user.click(rotateButton);

      expect(mockCanvasContext.rotate).toHaveBeenCalledWith(Math.PI);
    });

    it('should rotate image 270 degrees', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const rotateButton = screen.getByRole('button', { name: /rotate.*270/i });
      await user.click(rotateButton);

      expect(mockCanvasContext.rotate).toHaveBeenCalledWith((3 * Math.PI) / 2);
    });
  });

  describe('Requirement 3.1 - Flip Tool', () => {
    it('should flip image horizontally', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const flipButton = screen.getByRole('button', { name: /flip horizontal/i });
      await user.click(flipButton);

      expect(mockCanvasContext.scale).toHaveBeenCalledWith(-1, 1);
    });

    it('should flip image vertically', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const flipButton = screen.getByRole('button', { name: /flip vertical/i });
      await user.click(flipButton);

      expect(mockCanvasContext.scale).toHaveBeenCalledWith(1, -1);
    });
  });

  describe('Requirement 3.2 - Adjustment Sliders', () => {
    it('should display brightness slider', () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/brightness/i)).toBeInTheDocument();
    });

    it('should adjust brightness value', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const brightnessSlider = screen.getByLabelText(/brightness/i);
      await user.clear(brightnessSlider);
      await user.type(brightnessSlider, '1.2');

      expect(brightnessSlider).toHaveValue(1.2);
    });

    it('should display contrast slider', () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/contrast/i)).toBeInTheDocument();
    });

    it('should adjust contrast value', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const contrastSlider = screen.getByLabelText(/contrast/i);
      await user.clear(contrastSlider);
      await user.type(contrastSlider, '1.5');

      expect(contrastSlider).toHaveValue(1.5);
    });

    it('should display saturation slider', () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByLabelText(/saturation/i)).toBeInTheDocument();
    });

    it('should adjust saturation value', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saturationSlider = screen.getByLabelText(/saturation/i);
      await user.clear(saturationSlider);
      await user.type(saturationSlider, '1.3');

      expect(saturationSlider).toHaveValue(1.3);
    });

    it('should apply adjustments in real-time', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const brightnessSlider = screen.getByLabelText(/brightness/i);
      await user.clear(brightnessSlider);
      await user.type(brightnessSlider, '1.2');

      await waitFor(() => {
        expect(mockCanvasContext.drawImage).toHaveBeenCalled();
      });
    });

    it('should reset adjustments to default', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const brightnessSlider = screen.getByLabelText(/brightness/i);
      await user.clear(brightnessSlider);
      await user.type(brightnessSlider, '1.5');

      const resetButton = screen.getByRole('button', { name: /reset/i });
      await user.click(resetButton);

      expect(brightnessSlider).toHaveValue(1.0);
    });
  });

  describe('Requirement 3.3 - Text Overlay Tool', () => {
    it('should open text overlay dialog', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const textButton = screen.getByRole('button', { name: /add text/i });
      await user.click(textButton);

      expect(screen.getByLabelText(/text/i)).toBeInTheDocument();
    });

    it('should allow entering text', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const textButton = screen.getByRole('button', { name: /add text/i });
      await user.click(textButton);

      const textInput = screen.getByLabelText(/text/i);
      await user.type(textInput, 'Hello World');

      expect(textInput).toHaveValue('Hello World');
    });

    it('should display font selector', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const textButton = screen.getByRole('button', { name: /add text/i });
      await user.click(textButton);

      expect(screen.getByLabelText(/font/i)).toBeInTheDocument();
    });

    it('should display font size picker', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const textButton = screen.getByRole('button', { name: /add text/i });
      await user.click(textButton);

      expect(screen.getByLabelText(/size/i)).toBeInTheDocument();
    });

    it('should display color picker', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const textButton = screen.getByRole('button', { name: /add text/i });
      await user.click(textButton);

      expect(screen.getByLabelText(/color/i)).toBeInTheDocument();
    });

    it('should render text on canvas', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const textButton = screen.getByRole('button', { name: /add text/i });
      await user.click(textButton);

      const textInput = screen.getByLabelText(/text/i);
      await user.type(textInput, 'Test Text');

      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Test Text', expect.any(Number), expect.any(Number));
    });

    it('should allow positioning text by clicking canvas', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const textButton = screen.getByRole('button', { name: /add text/i });
      await user.click(textButton);

      const textInput = screen.getByLabelText(/text/i);
      await user.type(textInput, 'Positioned Text');

      const canvas = screen.getByRole('img', { hidden: true });
      fireEvent.click(canvas, { clientX: 300, clientY: 400 });

      expect(mockCanvasContext.fillText).toHaveBeenCalled();
    });
  });

  describe('Requirement 3.4 - Filter Presets', () => {
    it('should display filter preset buttons', () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /grayscale/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sepia/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /vintage/i })).toBeInTheDocument();
    });

    it('should apply grayscale filter', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const grayscaleButton = screen.getByRole('button', { name: /grayscale/i });
      await user.click(grayscaleButton);

      await waitFor(() => {
        expect(mockCanvasContext.getImageData).toHaveBeenCalled();
      });
    });

    it('should apply sepia filter', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const sepiaButton = screen.getByRole('button', { name: /sepia/i });
      await user.click(sepiaButton);

      await waitFor(() => {
        expect(mockCanvasContext.getImageData).toHaveBeenCalled();
      });
    });

    it('should preview filter before applying', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const vintageButton = screen.getByRole('button', { name: /vintage/i });
      await user.hover(vintageButton);

      await waitFor(() => {
        expect(mockCanvasContext.drawImage).toHaveBeenCalled();
      });
    });

    it('should remove filter when clicked again', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const grayscaleButton = screen.getByRole('button', { name: /grayscale/i });
      await user.click(grayscaleButton);
      await user.click(grayscaleButton);

      expect(grayscaleButton).not.toHaveClass('active');
    });
  });

  describe('Save and Cancel Actions', () => {
    it('should call onSave with edited image data', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        imageData: expect.any(String),
      }));
    });

    it('should call onCancel when cancel button clicked', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show confirmation dialog when canceling with unsaved changes', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      // Make a change
      const brightnessSlider = screen.getByLabelText(/brightness/i);
      await user.clear(brightnessSlider);
      await user.type(brightnessSlider, '1.5');

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(screen.getByText(/unsaved changes/i)).toBeInTheDocument();
    });
  });

  describe('Undo/Redo Functionality', () => {
    it('should enable undo after making changes', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const rotateButton = screen.getByRole('button', { name: /rotate.*90/i });
      await user.click(rotateButton);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      expect(undoButton).not.toBeDisabled();
    });

    it('should undo last change', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const rotateButton = screen.getByRole('button', { name: /rotate.*90/i });
      await user.click(rotateButton);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    it('should enable redo after undo', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const rotateButton = screen.getByRole('button', { name: /rotate.*90/i });
      await user.click(rotateButton);

      const undoButton = screen.getByRole('button', { name: /undo/i });
      await user.click(undoButton);

      const redoButton = screen.getByRole('button', { name: /redo/i });
      expect(redoButton).not.toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('button', { name: /crop/i })).toHaveAttribute('aria-label');
      expect(screen.getByRole('button', { name: /resize/i })).toHaveAttribute('aria-label');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <ImageEditor
          image={mockImage}
          onSave={mockOnSave}
          onCancel={mockOnCancel}
        />
      );

      const cropButton = screen.getByRole('button', { name: /crop/i });
      cropButton.focus();
      
      await user.keyboard('{Enter}');

      expect(cropButton).toHaveClass('active');
    });
  });
});
