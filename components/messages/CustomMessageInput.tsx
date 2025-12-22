'use client';

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react';
import './custom-message-input.css';

export interface CustomMessageInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSend?: (message: string) => void;
  onAttachClick?: () => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * CustomMessageInput - Pilule unifiée style ChatGPT
 * 
 * Structure: [Trombone] [Texte] [Avion] - tout dans la même capsule
 */
export function CustomMessageInput({
  placeholder = 'Message',
  value: controlledValue,
  onChange,
  onSend,
  onAttachClick,
  disabled = false,
  autoFocus = false,
}: CustomMessageInputProps) {
  const [internalValue, setInternalValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Use controlled value if provided, otherwise use internal state
  const value = controlledValue !== undefined ? controlledValue : internalValue;
  const hasText = value.trim().length > 0;

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    if (onChange) {
      onChange(newValue);
    } else {
      setInternalValue(newValue);
    }

    // Auto-resize textarea up to 3 lines max, then enable internal scroll
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const computedStyles = window.getComputedStyle(textarea);
      const lineHeightPx = parseFloat(computedStyles.lineHeight || '0') || 20;
      const maxHeight = lineHeightPx * 3; // 3 lines max

      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`;
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (hasText && onSend && !disabled) {
      onSend(value.trim());
      
      // Clear input after sending
      if (onChange) {
        onChange('');
      } else {
        setInternalValue('');
      }

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleAttach = () => {
    if (onAttachClick && !disabled) {
      onAttachClick();
    }
  };

  return (
    <div 
      className="custom-message-input"
      style={{
        backgroundColor: '#FFFFFF',
        padding: '16px 24px 4px 24px',
        borderTop: '1px solid #E5E5E5',
      }}
    >
      <div 
        className="custom-message-input__wrapper"
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E5E5',
          borderRadius: '24px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Trombone - À GAUCHE dans la pilule */}
        {onAttachClick && (
          <button
            type="button"
            className="icon-button custom-message-input__attach-btn"
            onClick={handleAttach}
            disabled={disabled}
            aria-label="Attach file"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17.5 9.16667L10 16.6667C8.61929 18.0474 6.38071 18.0474 5 16.6667C3.61929 15.286 3.61929 13.0474 5 11.6667L12.5 4.16667C13.4205 3.24619 14.9128 3.24619 15.8333 4.16667C16.7538 5.08714 16.7538 6.57953 15.8333 7.5L8.33333 15C7.8731 15.4602 7.1269 15.4602 6.66667 15C6.20643 14.5398 6.20643 13.7936 6.66667 13.3333L13.3333 6.66667"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Textarea - AU CENTRE dans la pilule */}
        <textarea
          ref={textareaRef}
          className="custom-message-input__textarea"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus={autoFocus}
          rows={1}
          aria-label="Message input"
        />

        {/* Avion / Send - À DROITE dans la pilule */}
        <button
          type="button"
          className={`icon-button icon-button--primary custom-message-input__send-btn ${hasText ? 'icon-button--active custom-message-input__send-btn--active' : ''}`}
          onClick={handleSend}
          disabled={!hasText || disabled}
          aria-label="Send message"
        >
          <span className="send-btn-text">Send</span>
          <svg
            className="send-btn-icon"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.5 2.5L8.75 11.25"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M17.5 2.5L11.875 17.5L8.75 11.25L2.5 8.125L17.5 2.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
