/**
 * Unit Tests - TagInput Component
 * 
 * Tests for the TagInput component with auto-completion
 * 
 * Coverage:
 * - Tag addition and removal
 * - Auto-completion functionality
 * - Keyboard interactions
 * - Max tags limit
 * - Input validation
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TagInput from '@/components/content/TagInput';

describe('TagInput Component', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe('Rendering', () => {
    it('should render with empty tags', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      expect(input).toBeInTheDocument();
    });

    it('should render existing tags', () => {
      render(<TagInput value={['tag1', 'tag2']} onChange={mockOnChange} />);
      
      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();
    });

    it('should show tag count', () => {
      render(<TagInput value={['tag1', 'tag2']} onChange={mockOnChange} maxTags={10} />);
      
      expect(screen.getByText(/2\/10 tags/)).toBeInTheDocument();
    });

    it('should show usage instructions', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      expect(screen.getByText(/Press Enter or comma/)).toBeInTheDocument();
    });

    it('should use custom placeholder', () => {
      render(<TagInput value={[]} onChange={mockOnChange} placeholder="Enter keywords..." />);
      
      expect(screen.getByPlaceholderText('Enter keywords...')).toBeInTheDocument();
    });
  });

  describe('Tag Addition', () => {
    it('should add tag on Enter key', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'newtag' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should add tag on comma key', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'newtag' } });
      fireEvent.keyDown(input, { key: ',' });
      
      expect(mockOnChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should trim whitespace from tags', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: '  newtag  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should convert tags to lowercase', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'NewTag' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).toHaveBeenCalledWith(['newtag']);
    });

    it('should not add empty tags', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should not add duplicate tags', () => {
      render(<TagInput value={['existing']} onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'existing' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should clear input after adding tag', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'newtag' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(input.value).toBe('');
    });
  });

  describe('Tag Removal', () => {
    it('should remove tag on button click', () => {
      render(<TagInput value={['tag1', 'tag2']} onChange={mockOnChange} />);
      
      const removeButtons = screen.getAllByText('×');
      fireEvent.click(removeButtons[0]);
      
      expect(mockOnChange).toHaveBeenCalledWith(['tag2']);
    });

    it('should remove last tag on Backspace with empty input', () => {
      render(<TagInput value={['tag1', 'tag2']} onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.keyDown(input, { key: 'Backspace' });
      
      expect(mockOnChange).toHaveBeenCalledWith(['tag1']);
    });

    it('should not remove tag on Backspace with non-empty input', () => {
      render(<TagInput value={['tag1', 'tag2']} onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'text' } });
      fireEvent.keyDown(input, { key: 'Backspace' });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('Max Tags Limit', () => {
    it('should not add tag when max limit reached', () => {
      render(<TagInput value={['tag1', 'tag2']} onChange={mockOnChange} maxTags={2} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'tag3' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).not.toHaveBeenCalled();
    });

    it('should show max tags warning', () => {
      render(<TagInput value={['tag1', 'tag2']} onChange={mockOnChange} maxTags={2} />);
      
      expect(screen.getByText(/Maximum 2 tags reached/)).toBeInTheDocument();
    });

    it('should disable input when max tags reached', () => {
      render(<TagInput value={['tag1', 'tag2']} onChange={mockOnChange} maxTags={2} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toBeDisabled();
    });

    it('should not show warning when below max', () => {
      render(<TagInput value={['tag1']} onChange={mockOnChange} maxTags={2} />);
      
      expect(screen.queryByText(/Maximum.*tags reached/)).not.toBeInTheDocument();
    });
  });

  describe('Auto-completion', () => {
    const suggestions = ['javascript', 'typescript', 'react', 'vue'];

    it('should show suggestions when typing', async () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={suggestions} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'java' } });
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
      });
    });

    it('should filter suggestions based on input', async () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={suggestions} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'type' } });
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(screen.getByText('typescript')).toBeInTheDocument();
        expect(screen.queryByText('javascript')).not.toBeInTheDocument();
      });
    });

    it('should hide suggestions when input is empty', () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={suggestions} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: '' } });
      
      expect(screen.queryByText('javascript')).not.toBeInTheDocument();
    });

    it('should add tag on suggestion click', async () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={suggestions} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'java' } });
      fireEvent.focus(input);
      
      await waitFor(() => {
        const suggestion = screen.getByText('javascript');
        fireEvent.click(suggestion);
      });
      
      expect(mockOnChange).toHaveBeenCalledWith(['javascript']);
    });

    it('should exclude already selected tags from suggestions', async () => {
      render(<TagInput value={['javascript']} onChange={mockOnChange} suggestions={suggestions} />);
      
      const input = screen.getByRole('textbox');
      fireEvent.change(input, { target: { value: 'java' } });
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(screen.queryByText('javascript')).not.toBeInTheDocument();
      });
    });

    it('should use case-insensitive filtering', async () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={suggestions} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'JAVA' } });
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
      });
    });

    it('should hide suggestions on blur', async () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={suggestions} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'java' } });
      fireEvent.focus(input);
      
      await waitFor(() => {
        expect(screen.getByText('javascript')).toBeInTheDocument();
      });
      
      fireEvent.blur(input);
      
      await waitFor(() => {
        expect(screen.queryByText('javascript')).not.toBeInTheDocument();
      }, { timeout: 300 });
    });
  });

  describe('Styling', () => {
    it('should style tags with blue background', () => {
      render(<TagInput value={['tag1']} onChange={mockOnChange} />);
      
      const tag = screen.getByText('tag1').parentElement;
      expect(tag).toHaveClass('bg-blue-100');
      expect(tag).toHaveClass('text-blue-800');
    });

    it('should have focus ring on container', () => {
      const { container } = render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const wrapper = container.querySelector('.focus-within\\:ring-2');
      expect(wrapper).toBeInTheDocument();
    });

    it('should have hover effect on remove button', () => {
      render(<TagInput value={['tag1']} onChange={mockOnChange} />);
      
      const removeButton = screen.getByText('×');
      expect(removeButton).toHaveClass('hover:text-blue-900');
    });

    it('should have hover effect on suggestions', async () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={['test']} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.focus(input);
      
      await waitFor(() => {
        const suggestion = screen.getByText('test');
        expect(suggestion).toHaveClass('hover:bg-gray-100');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper input type', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should have remove buttons with type button', () => {
      render(<TagInput value={['tag1']} onChange={mockOnChange} />);
      
      const removeButton = screen.getByText('×').closest('button');
      expect(removeButton).toHaveAttribute('type', 'button');
    });

    it('should have suggestion buttons with type button', async () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={['test']} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'test' } });
      fireEvent.focus(input);
      
      await waitFor(() => {
        const suggestionButton = screen.getByText('test').closest('button');
        expect(suggestionButton).toHaveAttribute('type', 'button');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty suggestions array', () => {
      render(<TagInput value={[]} onChange={mockOnChange} suggestions={[]} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(screen.queryByRole('button', { name: /test/ })).not.toBeInTheDocument();
    });

    it('should handle undefined suggestions', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'test' } });
      
      expect(screen.queryByRole('button', { name: /test/ })).not.toBeInTheDocument();
    });

    it('should handle special characters in tags', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: 'tag-with-dash' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).toHaveBeenCalledWith(['tag-with-dash']);
    });

    it('should handle very long tag names', () => {
      const longTag = 'a'.repeat(100);
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      fireEvent.change(input, { target: { value: longTag } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).toHaveBeenCalledWith([longTag]);
    });

    it('should handle rapid tag additions', () => {
      render(<TagInput value={[]} onChange={mockOnChange} />);
      
      const input = screen.getByPlaceholderText('Add tags...');
      
      fireEvent.change(input, { target: { value: 'tag1' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      fireEvent.change(input, { target: { value: 'tag2' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      
      expect(mockOnChange).toHaveBeenCalledTimes(2);
    });
  });
});
