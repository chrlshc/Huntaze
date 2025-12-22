/**
 * Unit Tests for Empty States Components
 * Tests empty states provide actionable guidance
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  NoConversationsEmpty,
  NoMessagesEmpty,
  NoNotesEmpty,
  NoSearchResultsEmpty,
} from '@/components/messages/EmptyStates';

describe('NoConversationsEmpty', () => {
  it('should render with correct title and description', () => {
    render(<NoConversationsEmpty />);
    
    expect(screen.getByText('Aucune conversation')).toBeInTheDocument();
    expect(screen.getByText(/Vous n'avez pas encore de conversations/)).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(<NoConversationsEmpty />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should render action button when callback provided', () => {
    const onStartConversation = vi.fn();
    render(<NoConversationsEmpty onStartConversation={onStartConversation} />);
    
    const button = screen.getByRole('button', { name: /Démarrer une conversation/i });
    expect(button).toBeInTheDocument();
  });

  it('should call callback when action button clicked', () => {
    const onStartConversation = vi.fn();
    render(<NoConversationsEmpty onStartConversation={onStartConversation} />);
    
    const button = screen.getByRole('button', { name: /Démarrer une conversation/i });
    fireEvent.click(button);
    
    expect(onStartConversation).toHaveBeenCalledTimes(1);
  });

  it('should not render action button when no callback provided', () => {
    render(<NoConversationsEmpty />);
    
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });
});

describe('NoMessagesEmpty', () => {
  it('should render with correct title and description', () => {
    render(<NoMessagesEmpty />);
    
    expect(screen.getByText('Aucun message')).toBeInTheDocument();
    expect(screen.getByText(/Sélectionnez une conversation/)).toBeInTheDocument();
  });

  it('should render icon', () => {
    const { container } = render(<NoMessagesEmpty />);
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should not render action button', () => {
    render(<NoMessagesEmpty />);
    
    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should be centered in container', () => {
    const { container } = render(<NoMessagesEmpty />);
    const wrapper = container.querySelector('.flex.flex-col.items-center.justify-center');
    expect(wrapper).toBeInTheDocument();
  });
});

describe('NoNotesEmpty', () => {
  it('should render with correct title and description', () => {
    render(<NoNotesEmpty />);
    
    expect(screen.getByText('Aucune note')).toBeInTheDocument();
    expect(screen.getByText(/Ajoutez des notes pour garder une trace/)).toBeInTheDocument();
  });

  it('should render action button when callback provided', () => {
    const onAddNote = vi.fn();
    render(<NoNotesEmpty onAddNote={onAddNote} />);
    
    const button = screen.getByRole('button', { name: /Ajouter une note/i });
    expect(button).toBeInTheDocument();
  });

  it('should call callback when action button clicked', () => {
    const onAddNote = vi.fn();
    render(<NoNotesEmpty onAddNote={onAddNote} />);
    
    const button = screen.getByRole('button', { name: /Ajouter une note/i });
    fireEvent.click(button);
    
    expect(onAddNote).toHaveBeenCalledTimes(1);
  });
});

describe('NoSearchResultsEmpty', () => {
  it('should render with search query in description', () => {
    render(<NoSearchResultsEmpty searchQuery="test query" />);
    
    expect(screen.getByText('Aucun résultat')).toBeInTheDocument();
    expect(screen.getByText(/test query/)).toBeInTheDocument();
  });

  it('should render clear search button when callback provided', () => {
    const onClearSearch = vi.fn();
    render(<NoSearchResultsEmpty searchQuery="test" onClearSearch={onClearSearch} />);
    
    const button = screen.getByRole('button', { name: /Effacer la recherche/i });
    expect(button).toBeInTheDocument();
  });

  it('should call callback when clear button clicked', () => {
    const onClearSearch = vi.fn();
    render(<NoSearchResultsEmpty searchQuery="test" onClearSearch={onClearSearch} />);
    
    const button = screen.getByRole('button', { name: /Effacer la recherche/i });
    fireEvent.click(button);
    
    expect(onClearSearch).toHaveBeenCalledTimes(1);
  });

  it('should handle long search queries', () => {
    const longQuery = 'a'.repeat(100);
    render(<NoSearchResultsEmpty searchQuery={longQuery} />);
    
    expect(screen.getByText(/Aucun résultat/)).toBeInTheDocument();
  });
});

describe('Empty States Consistency', () => {
  it('should all empty states have consistent styling', () => {
    const { container: conv } = render(<NoConversationsEmpty />);
    const { container: msg } = render(<NoMessagesEmpty />);
    const { container: notes } = render(<NoNotesEmpty />);

    const checkCentering = (container: HTMLElement) => {
      return container.querySelector('.flex.flex-col.items-center.justify-center') !== null;
    };

    expect(checkCentering(conv)).toBe(true);
    expect(checkCentering(msg)).toBe(true);
    expect(checkCentering(notes)).toBe(true);
  });

  it('should all empty states have icons', () => {
    const { container: conv } = render(<NoConversationsEmpty />);
    const { container: msg } = render(<NoMessagesEmpty />);
    const { container: notes } = render(<NoNotesEmpty />);

    expect(conv.querySelector('svg')).toBeInTheDocument();
    expect(msg.querySelector('svg')).toBeInTheDocument();
    expect(notes.querySelector('svg')).toBeInTheDocument();
  });

  it('should all action buttons have consistent styling', () => {
    const { container: conv } = render(<NoConversationsEmpty onStartConversation={() => {}} />);
    const { container: notes } = render(<NoNotesEmpty onAddNote={() => {}} />);

    const convButton = conv.querySelector('button');
    const notesButton = notes.querySelector('button');

    expect(convButton).toHaveClass('bg-blue-600');
    expect(notesButton).toHaveClass('bg-blue-600');
  });
});
