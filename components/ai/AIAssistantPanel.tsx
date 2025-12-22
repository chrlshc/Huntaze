'use client';

import { useState, useCallback, useEffect } from 'react';
import { 
  ChevronDown,
  ExternalLink,
  Maximize2,
  X,
  Plus,
  Mic,
  Sparkles
} from 'lucide-react';
import './ai-assistant-panel.css';

// Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface PageContext {
  currentPage: string;
  selectedFan?: { id: string; name: string };
  selectedContent?: { id: string; title: string };
}

export interface AIAssistantPanelProps {
  context?: PageContext;
  className?: string;
}

export function AIAssistantPanel({ 
  context,
  className = ''
}: AIAssistantPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle keyboard shortcut (Ctrl+/)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          context: context
        })
      });

      if (!response.ok) throw new Error('Failed to get AI response');

      const data = await response.json();
      
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: data.data?.response || data.response || 'I apologize, I could not process your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, context]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <>
      {/* Persistent AI Button */}
      <button
        className="ai-fab-button"
        onClick={handleToggle}
        aria-label="Open AI Assistant"
        aria-expanded={isOpen}
        data-testid="ai-assistant-button"
      >
        <Sparkles className="ai-fab-icon" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="ai-backdrop"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Chat Panel */}
      <div 
        className={`ai-chat-panel ${isOpen ? 'ai-chat-panel--open' : ''} ${className}`}
        role="dialog"
        aria-label="AI Assistant"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <header className="ai-chat-header">
          <button className="ai-chat-header__left">
            <span>New conversation</span>
            <ChevronDown size={16} />
          </button>
          <div className="ai-chat-header__right">
            <button className="ai-chat-header__icon" aria-label="Open in new window">
              <ExternalLink size={18} />
            </button>
            <button className="ai-chat-header__icon" aria-label="Expand">
              <Maximize2 size={18} />
            </button>
            <button className="ai-chat-header__icon" onClick={handleClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="ai-chat-main">
          {messages.length === 0 ? (
            <div className="ai-chat-welcome">
              <div className="ai-chat-welcome__avatar">
                <svg width="56" height="56" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="256" cy="256" r="240" fill="#1e1b4b"/>
                  <path fill="#fff" d="M124 432 V378 L170 332 L198 312 Q208 304 220 304 H292 Q304 304 314 312 L342 332 L388 378 V432 H124 Z"/>
                  <path fill="#fff" d="M232 270 H280 Q294 270 294 284 V318 Q294 336 276 338 H236 Q218 336 218 318 V284 Q218 270 232 270 Z"/>
                  <path fill="#fff" d="M256 108 C214 108 184 140 176 176 C170 206 178 236 198 258 L222 278 Q256 302 290 278 L314 258 C334 236 342 206 336 176 C328 140 298 108 256 108 Z"/>
                  <path fill="#1e1b4b" d="M184 172 C194 132 226 112 256 112 C294 112 324 136 332 172 C316 160 302 156 286 156 C268 156 252 170 230 176 C210 182 196 180 184 172 Z"/>
                  <g fill="#1e1b4b">
                    <circle cx="232" cy="198" r="18"/>
                    <circle cx="280" cy="198" r="18"/>
                    <rect x="246" y="194" width="20" height="8" rx="4"/>
                    <rect x="252" y="202" width="8" height="18" rx="4"/>
                    <circle cx="232" cy="198" r="11" fill="#fff"/>
                    <circle cx="280" cy="198" r="11" fill="#fff"/>
                  </g>
                  <g fill="#1e1b4b">
                    <path d="M198 312 L256 362 L228 396 L186 350 Z"/>
                    <path d="M314 312 L256 362 L284 396 L326 350 Z"/>
                  </g>
                  <g fill="#1e1b4b">
                    <path d="M256 330 L242 348 L256 366 L270 348 Z"/>
                    <path d="M256 366 L232 446 L256 472 L280 446 Z"/>
                  </g>
                </svg>
              </div>
              <p className="ai-chat-welcome__greeting">Hey there</p>
              <h2 className="ai-chat-welcome__title">How can I help?</h2>
            </div>
          ) : (
            <div className="ai-chat-messages">
              {messages.map((message) => (
                <div 
                  key={message.id}
                  className={`ai-chat-bubble ai-chat-bubble--${message.role}`}
                >
                  {message.content}
                </div>
              ))}
              {isLoading && (
                <div className="ai-chat-bubble ai-chat-bubble--assistant ai-chat-bubble--loading">
                  <span className="ai-typing-dot"></span>
                  <span className="ai-typing-dot"></span>
                  <span className="ai-typing-dot"></span>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Footer - Input Pilule */}
        <footer className="ai-chat-footer">
          <div className="ai-chat-input-pill">
            <input
              type="text"
              className="ai-chat-input-pill__input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask anything..."
              disabled={isLoading}
            />
            <button 
              className="ai-chat-input-pill__btn"
              aria-label="Add attachment"
            >
              <Plus size={20} />
            </button>
            <button 
              className="ai-chat-input-pill__btn"
              aria-label="Voice input"
            >
              <Mic size={20} />
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}

export default AIAssistantPanel;
