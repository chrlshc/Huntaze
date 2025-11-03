/**
 * Unit Tests - Rich Text Content Editor (Task 3)
 * 
 * Tests to validate the rich text editor functionality
 * Based on: .kiro/specs/content-creation/tasks.md (Task 3)
 * 
 * Coverage:
 * - Tiptap editor setup and configuration
 * - Formatting extensions (bold, italic, underline, lists, links, emoji)
 * - Custom toolbar component
 * - Character counter with platform-specific limits
 * - Auto-save functionality
 * - Media insertion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Tiptap editor
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(),
  EditorContent: ({ editor }: any) => <div data-testid="editor-content">{editor?.getHTML()}</div>,
}));

vi.mock('@tiptap/starter-kit', () => ({
  default: vi.fn(),
}));

// Mock components - will be implemented
const ContentEditor = ({ 
  initialContent = '',
  onSave,
  onAutoSave,
  platformLimits = { instagram: 2200, twitter: 280, facebook: 63206 },
  enableAutoSave = true,
  autoSaveInterval = 30000,
}: any) => {
  const [content, setContent] = React.useState(initialContent);
  const [isSaving, setIsSaving] = React.useState(false);
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null);
  
  React.useEffect(() => {
    if (enableAutoSave && content !== initialContent) {
      const timer = setTimeout(async () => {
        setIsSaving(true);
        await onAutoSave?.(content);
        setIsSaving(false);
        setLastSaved(new Date());
      }, autoSaveInterval);
      
      return () => clearTimeout(timer);
    }
  }, [content, enableAutoSave, autoSaveInterval]);
  
  return (
    <div data-testid="content-editor">
      <div data-testid="editor-toolbar">
        <button data-testid="bold-button">Bold</button>
        <button data-testid="italic-button">Italic</button>
        <button data-testid="underline-button">Underline</button>
        <button data-testid="list-button">List</button>
        <button data-testid="link-button">Link</button>
        <button data-testid="emoji-button">Emoji</button>
      </div>
      <div data-testid="editor-content" contentEditable onInput={(e) => setContent(e.currentTarget.textContent || '')}>
        {content}
      </div>
      <div data-testid="character-counter">
        {content.length} / {platformLimits.instagram}
      </div>
      {isSaving && <div data-testid="saving-indicator">Saving...</div>}
      {lastSaved && <div data-testid="last-saved">Last saved: {lastSaved.toISOString()}</div>}
    </div>
  );
};

const MediaPicker = ({ onSelect, isOpen, onClose }: any) => {
  if (!isOpen) return null;
  
  return (
    <div data-testid="media-picker">
      <h3>Media Library</h3>
      <div data-testid="media-grid">
        <img 
          data-testid="media-item-1" 
          src="/test-image-1.jpg" 
          alt="Test 1"
          onClick={() => onSelect({ id: 1, url: '/test-image-1.jpg', type: 'image' })}
        />
        <img 
          data-testid="media-item-2" 
          src="/test-image-2.jpg" 
          alt="Test 2"
          onClick={() => onSelect({ id: 2, url: '/test-image-2.jpg', type: 'image' })}
        />
      </div>
      <button data-testid="close-picker" onClick={onClose}>Close</button>
    </div>
  );
};

const EmojiPicker = ({ onSelect, isOpen, onClose }: any) => {
  if (!isOpen) return null;
  
  const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🔥'];
  
  return (
    <div data-testid="emoji-picker">
      <div data-testid="emoji-grid">
        {emojis.map((emoji, index) => (
          <button 
            key={index}
            data-testid={`emoji-${index}`}
            onClick={() => onSelect(emoji)}
          >
            {emoji}
          </button>
        ))}
      </div>
      <button data-testid="close-emoji-picker" onClick={onClose}>Close</button>
    </div>
  );
};

import React from 'react';

describe('Requirement 1: Rich Text Content Editor', () => {
  describe('Task 3.1 - Tiptap Editor Setup', () => {
    describe('AC 1.1 - Formatting Options', () => {
      it('should render editor with formatting toolbar', () => {
        render(<ContentEditor />);
        
        expect(screen.getByTestId('editor-toolbar')).toBeInTheDocument();
        expect(screen.getByTestId('bold-button')).toBeInTheDocument();
        expect(screen.getByTestId('italic-button')).toBeInTheDocument();
        expect(screen.getByTestId('underline-button')).toBeInTheDocument();
      });

      it('should support bold formatting', async () => {
        const user = userEvent.setup();
        render(<ContentEditor />);
        
        const boldButton = screen.getByTestId('bold-button');
        await user.click(boldButton);
        
        expect(boldButton).toHaveAttribute('aria-pressed', 'true');
      });

      it('should support italic formatting', async () => {
        const user = userEvent.setup();
        render(<ContentEditor />);
        
        const italicButton = screen.getByTestId('italic-button');
        await user.click(italicButton);
        
        expect(italicButton).toHaveAttribute('aria-pressed', 'true');
      });

      it('should support underline formatting', async () => {
        const user = userEvent.setup();
        render(<ContentEditor />);
        
        const underlineButton = screen.getByTestId('underline-button');
        await user.click(underlineButton);
        
        expect(underlineButton).toHaveAttribute('aria-pressed', 'true');
      });

      it('should support list formatting', async () => {
        const user = userEvent.setup();
        render(<ContentEditor />);
        
        const listButton = screen.getByTestId('list-button');
        await user.click(listButton);
        
        expect(listButton).toHaveAttribute('aria-pressed', 'true');
      });

      it('should support link insertion', async () => {
        const user = userEvent.setup();
        render(<ContentEditor />);
        
        const linkButton = screen.getByTestId('link-button');
        expect(linkButton).toBeInTheDocument();
      });
    });

    describe('AC 1.2 - Character Counter', () => {
      it('should display character count', () => {
        render(<ContentEditor initialContent="Hello World" />);
        
        const counter = screen.getByTestId('character-counter');
        expect(counter).toHaveTextContent('11 / 2200');
      });

      it('should update character count as user types', async () => {
        const user = userEvent.setup();
        render(<ContentEditor />);
        
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Test content');
        
        const counter = screen.getByTestId('character-counter');
        expect(counter).toHaveTextContent('12 / 2200');
      });

      it('should show warning when exceeding platform limit', () => {
        const longContent = 'a'.repeat(2201);
        render(<ContentEditor initialContent={longContent} platformLimits={{ instagram: 2200 }} />);
        
        const counter = screen.getByTestId('character-counter');
        expect(counter).toHaveClass('text-red-500');
      });

      it('should support different platform limits', () => {
        render(<ContentEditor platformLimits={{ twitter: 280 }} />);
        
        const counter = screen.getByTestId('character-counter');
        expect(counter).toHaveTextContent('0 / 280');
      });

      it('should count emojis correctly', async () => {
        const user = userEvent.setup();
        render(<ContentEditor />);
        
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Hello 😀');
        
        const counter = screen.getByTestId('character-counter');
        expect(counter).toHaveTextContent('7 / 2200');
      });
    });

    describe('AC 1.3 - Emoji Support', () => {
      it('should render emoji picker button', () => {
        render(<ContentEditor />);
        
        expect(screen.getByTestId('emoji-button')).toBeInTheDocument();
      });

      it('should open emoji picker on button click', async () => {
        const user = userEvent.setup();
        const { container } = render(
          <>
            <ContentEditor />
            <EmojiPicker isOpen={true} onSelect={() => {}} onClose={() => {}} />
          </>
        );
        
        expect(screen.getByTestId('emoji-picker')).toBeInTheDocument();
      });

      it('should insert emoji into content', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        
        render(<EmojiPicker isOpen={true} onSelect={onSelect} onClose={() => {}} />);
        
        const emoji = screen.getByTestId('emoji-0');
        await user.click(emoji);
        
        expect(onSelect).toHaveBeenCalledWith('😀');
      });

      it('should display emoji grid', () => {
        render(<EmojiPicker isOpen={true} onSelect={() => {}} onClose={() => {}} />);
        
        expect(screen.getByTestId('emoji-grid')).toBeInTheDocument();
        expect(screen.getAllByRole('button')).toHaveLength(7); // 6 emojis + close button
      });

      it('should close emoji picker', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        
        render(<EmojiPicker isOpen={true} onSelect={() => {}} onClose={onClose} />);
        
        const closeButton = screen.getByTestId('close-emoji-picker');
        await user.click(closeButton);
        
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('Task 3.2 - Auto-Save Functionality', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('AC 1.4 - Auto-Save', () => {
      it('should auto-save after 30 seconds of inactivity', async () => {
        const onAutoSave = vi.fn();
        const user = userEvent.setup({ delay: null });
        
        render(<ContentEditor onAutoSave={onAutoSave} autoSaveInterval={30000} />);
        
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Test content');
        
        vi.advanceTimersByTime(30000);
        
        await waitFor(() => {
          expect(onAutoSave).toHaveBeenCalledWith('Test content');
        });
      });

      it('should display saving indicator during save', async () => {
        const onAutoSave = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
        const user = userEvent.setup({ delay: null });
        
        render(<ContentEditor onAutoSave={onAutoSave} autoSaveInterval={30000} />);
        
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Test');
        
        vi.advanceTimersByTime(30000);
        
        await waitFor(() => {
          expect(screen.getByTestId('saving-indicator')).toBeInTheDocument();
        });
      });

      it('should display last saved timestamp', async () => {
        const onAutoSave = vi.fn();
        const user = userEvent.setup({ delay: null });
        
        render(<ContentEditor onAutoSave={onAutoSave} autoSaveInterval={30000} />);
        
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Test');
        
        vi.advanceTimersByTime(30000);
        
        await waitFor(() => {
          expect(screen.getByTestId('last-saved')).toBeInTheDocument();
        });
      });

      it('should reset auto-save timer on new input', async () => {
        const onAutoSave = vi.fn();
        const user = userEvent.setup({ delay: null });
        
        render(<ContentEditor onAutoSave={onAutoSave} autoSaveInterval={30000} />);
        
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Test');
        
        vi.advanceTimersByTime(15000);
        
        await user.type(editor, ' more');
        
        vi.advanceTimersByTime(15000);
        
        expect(onAutoSave).not.toHaveBeenCalled();
        
        vi.advanceTimersByTime(15000);
        
        await waitFor(() => {
          expect(onAutoSave).toHaveBeenCalled();
        });
      });

      it('should handle auto-save errors gracefully', async () => {
        const onAutoSave = vi.fn().mockRejectedValue(new Error('Save failed'));
        const user = userEvent.setup({ delay: null });
        
        render(<ContentEditor onAutoSave={onAutoSave} autoSaveInterval={30000} />);
        
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Test');
        
        vi.advanceTimersByTime(30000);
        
        await waitFor(() => {
          expect(screen.getByTestId('save-error')).toBeInTheDocument();
        });
      });

      it('should not auto-save if content unchanged', async () => {
        const onAutoSave = vi.fn();
        
        render(<ContentEditor initialContent="Initial" onAutoSave={onAutoSave} autoSaveInterval={30000} />);
        
        vi.advanceTimersByTime(30000);
        
        expect(onAutoSave).not.toHaveBeenCalled();
      });

      it('should allow disabling auto-save', async () => {
        const onAutoSave = vi.fn();
        const user = userEvent.setup({ delay: null });
        
        render(<ContentEditor onAutoSave={onAutoSave} enableAutoSave={false} autoSaveInterval={30000} />);
        
        const editor = screen.getByTestId('editor-content');
        await user.type(editor, 'Test');
        
        vi.advanceTimersByTime(30000);
        
        expect(onAutoSave).not.toHaveBeenCalled();
      });
    });
  });

  describe('Task 3.3 - Media Insertion', () => {
    describe('AC 2.4 - Media Picker Integration', () => {
      it('should render media picker modal', () => {
        render(<MediaPicker isOpen={true} onSelect={() => {}} onClose={() => {}} />);
        
        expect(screen.getByTestId('media-picker')).toBeInTheDocument();
      });

      it('should display media library items', () => {
        render(<MediaPicker isOpen={true} onSelect={() => {}} onClose={() => {}} />);
        
        expect(screen.getByTestId('media-grid')).toBeInTheDocument();
        expect(screen.getByTestId('media-item-1')).toBeInTheDocument();
        expect(screen.getByTestId('media-item-2')).toBeInTheDocument();
      });

      it('should call onSelect when media item clicked', async () => {
        const user = userEvent.setup();
        const onSelect = vi.fn();
        
        render(<MediaPicker isOpen={true} onSelect={onSelect} onClose={() => {}} />);
        
        const mediaItem = screen.getByTestId('media-item-1');
        await user.click(mediaItem);
        
        expect(onSelect).toHaveBeenCalledWith({
          id: 1,
          url: '/test-image-1.jpg',
          type: 'image'
        });
      });

      it('should close media picker', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        
        render(<MediaPicker isOpen={true} onSelect={() => {}} onClose={onClose} />);
        
        const closeButton = screen.getByTestId('close-picker');
        await user.click(closeButton);
        
        expect(onClose).toHaveBeenCalled();
      });

      it('should not render when closed', () => {
        render(<MediaPicker isOpen={false} onSelect={() => {}} onClose={() => {}} />);
        
        expect(screen.queryByTestId('media-picker')).not.toBeInTheDocument();
      });

      it('should support drag and drop for media insertion', () => {
        render(<ContentEditor />);
        
        const editor = screen.getByTestId('editor-content');
        expect(editor).toHaveAttribute('data-droppable', 'true');
      });

      it('should display inline media previews', () => {
        const contentWithMedia = '<p>Text</p><img src="/test.jpg" />';
        render(<ContentEditor initialContent={contentWithMedia} />);
        
        const editor = screen.getByTestId('editor-content');
        expect(editor).toContainHTML('<img src="/test.jpg"');
      });

      it('should support multiple media attachments', () => {
        const contentWithMultipleMedia = '<img src="/test1.jpg" /><img src="/test2.jpg" />';
        render(<ContentEditor initialContent={contentWithMultipleMedia} />);
        
        const editor = screen.getByTestId('editor-content');
        const images = editor.querySelectorAll('img');
        expect(images).toHaveLength(2);
      });
    });
  });

  describe('Editor Integration', () => {
    it('should initialize with empty content', () => {
      render(<ContentEditor />);
      
      const editor = screen.getByTestId('editor-content');
      expect(editor).toHaveTextContent('');
    });

    it('should initialize with provided content', () => {
      render(<ContentEditor initialContent="Initial content" />);
      
      const editor = screen.getByTestId('editor-content');
      expect(editor).toHaveTextContent('Initial content');
    });

    it('should handle manual save', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      
      render(<ContentEditor onSave={onSave} />);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Test content');
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith('Test content');
    });

    it('should preserve formatting on save', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      
      render(<ContentEditor onSave={onSave} />);
      
      const boldButton = screen.getByTestId('bold-button');
      await user.click(boldButton);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Bold text');
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      expect(onSave).toHaveBeenCalledWith(expect.stringContaining('<strong>Bold text</strong>'));
    });

    it('should handle keyboard shortcuts', async () => {
      const user = userEvent.setup();
      render(<ContentEditor />);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Test');
      
      // Ctrl+B for bold
      await user.keyboard('{Control>}b{/Control}');
      
      expect(screen.getByTestId('bold-button')).toHaveAttribute('aria-pressed', 'true');
    });

    it('should support undo/redo', async () => {
      const user = userEvent.setup();
      render(<ContentEditor />);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Test');
      
      // Ctrl+Z for undo
      await user.keyboard('{Control>}z{/Control}');
      
      expect(editor).toHaveTextContent('');
      
      // Ctrl+Y for redo
      await user.keyboard('{Control>}y{/Control}');
      
      expect(editor).toHaveTextContent('Test');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels on toolbar buttons', () => {
      render(<ContentEditor />);
      
      expect(screen.getByTestId('bold-button')).toHaveAttribute('aria-label', 'Bold');
      expect(screen.getByTestId('italic-button')).toHaveAttribute('aria-label', 'Italic');
    });

    it('should support keyboard navigation in toolbar', async () => {
      const user = userEvent.setup();
      render(<ContentEditor />);
      
      const boldButton = screen.getByTestId('bold-button');
      boldButton.focus();
      
      await user.keyboard('{Tab}');
      
      expect(screen.getByTestId('italic-button')).toHaveFocus();
    });

    it('should announce save status to screen readers', async () => {
      const onAutoSave = vi.fn();
      render(<ContentEditor onAutoSave={onAutoSave} />);
      
      vi.advanceTimersByTime(30000);
      
      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toHaveTextContent('Content saved');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors during save', async () => {
      const onAutoSave = vi.fn().mockRejectedValue(new Error('Network error'));
      const user = userEvent.setup({ delay: null });
      
      render(<ContentEditor onAutoSave={onAutoSave} autoSaveInterval={30000} />);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Test');
      
      vi.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(screen.getByTestId('save-error')).toHaveTextContent('Failed to save. Retrying...');
      });
    });

    it('should retry failed saves', async () => {
      const onAutoSave = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      const user = userEvent.setup({ delay: null });
      
      render(<ContentEditor onAutoSave={onAutoSave} autoSaveInterval={30000} />);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Test');
      
      vi.advanceTimersByTime(30000);
      
      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalledTimes(1);
      });
      
      vi.advanceTimersByTime(5000); // Retry after 5 seconds
      
      await waitFor(() => {
        expect(onAutoSave).toHaveBeenCalledTimes(2);
        expect(screen.getByTestId('last-saved')).toBeInTheDocument();
      });
    });

    it('should handle invalid content gracefully', async () => {
      const user = userEvent.setup();
      const onSave = vi.fn();
      
      render(<ContentEditor onSave={onSave} />);
      
      const editor = screen.getByTestId('editor-content');
      // Try to insert invalid HTML
      await user.type(editor, '<script>alert("xss")</script>');
      
      const saveButton = screen.getByTestId('save-button');
      await user.click(saveButton);
      
      // Should sanitize content
      expect(onSave).toHaveBeenCalledWith(expect.not.stringContaining('<script>'));
    });
  });

  describe('Performance', () => {
    it('should debounce character counter updates', async () => {
      const user = userEvent.setup({ delay: null });
      const updateCounter = vi.fn();
      
      render(<ContentEditor onCounterUpdate={updateCounter} />);
      
      const editor = screen.getByTestId('editor-content');
      
      await user.type(editor, 'Test');
      
      // Should not update on every keystroke
      expect(updateCounter).toHaveBeenCalledTimes(1);
    });

    it('should handle large content efficiently', async () => {
      const largeContent = 'a'.repeat(10000);
      const startTime = performance.now();
      
      render(<ContentEditor initialContent={largeContent} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render in less than 100ms
      expect(renderTime).toBeLessThan(100);
    });
  });
});
