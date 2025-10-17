'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpCircle, Bot, Copy, Loader2, Mic, Plus, RotateCcw, User, ThumbsUp, ThumbsDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  model?: string
  cost?: number
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => Promise<any>
  messages: Message[]
  loading: boolean
  className?: string
}

export function ChatInterface({ onSendMessage, messages, loading, className }: ChatInterfaceProps) {
  const [input, setInput] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [stickyHeaderOffset, setStickyHeaderOffset] = useState(0)

  const didMountRef = useRef(false)
  useEffect(() => {
    if (!didMountRef.current) {
      // On first render, keep scroll at top so first message appears near header
      didMountRef.current = true
      return
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Detect any fixed/sticky header height so first messages are not hidden under it
  useEffect(() => {
    const measure = () => {
      try {
        // Look for common header patterns used in the app
        const header = (document.querySelector('header.sticky, header.fixed, header.sticky-header-blur, header[data-header]') as HTMLElement | null)
          || (document.querySelector('header[role="banner"]') as HTMLElement | null)
        if (header) {
          const styles = window.getComputedStyle(header)
          const isOverlay = styles.position === 'fixed' || styles.position === 'sticky'
          const h = header.getBoundingClientRect().height || 0
          setStickyHeaderOffset(isOverlay ? Math.ceil(h) : 0)
        } else {
          setStickyHeaderOffset(0)
        }
      } catch {
        setStickyHeaderOffset(0)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault()
    const message = input.trim()
    if (!message || loading) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    await onSendMessage(message)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const regenerateResponse = async () => {
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user')
    if (lastUserMessage) {
      await onSendMessage(lastUserMessage.content)
    }
  }

  return (
    <div className={cn('flex h-full flex-col bg-white text-slate-900', className)}>
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
            <div className="w-full max-w-2xl space-y-5">
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">How can I help you today?</h1>
                <p className="text-sm text-slate-500">Ask anything about CIN automations, campaigns, or fan messaging.</p>
              </div>
              {renderInput(true)}
            </div>
          </div>
        ) : (
          <div
            className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10"
            style={stickyHeaderOffset ? { paddingTop: `calc(${stickyHeaderOffset}px + 2.5rem)` } : undefined}
          >
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {message.role === 'assistant' && (
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500">
                    <Bot className="h-5 w-5" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-xl space-y-2 rounded-3xl border px-5 py-4',
                    message.role === 'assistant'
                      ? 'border-slate-200 bg-white text-slate-900'
                      : 'border-indigo-100 bg-indigo-50 text-indigo-900'
                  )}
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {message.role === 'user' ? 'You' : 'Huntaze AI'}
                    </span>
                    <span>• {formatDistanceToNow(message.timestamp, { addSuffix: true })}</span>
                    {message.model && message.role === 'assistant' && <span>• {message.model}</span>}
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">
                    {message.content}
                  </div>
                  {message.role === 'assistant' && !loading && (
                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(message.content)}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100"
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </button>
                      {index === messages.length - 1 && (
                        <button
                          type="button"
                          onClick={regenerateResponse}
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" /> Regenerate
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={async () => {
                          try { await fetch('/api/ai/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: message.id, content: message.content, rating: 'up' }) }) } catch {}
                        }}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100"
                        aria-label="Thumbs up"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try { await fetch('/api/ai/feedback', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: message.id, content: message.content, rating: 'down' }) }) } catch {}
                        }}
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100"
                        aria-label="Thumbs down"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                {message.role === 'user' && (
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role === 'user' && (
              <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> Huntaze AI is thinking…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="border-t border-slate-200 bg-white px-4 py-6">
          <div className="mx-auto w-full max-w-3xl space-y-3">
            {renderInput(false)}
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Loader2 className={cn('h-3.5 w-3.5', loading ? 'animate-spin text-indigo-500' : 'text-slate-400')} />
                <span>Thinking…</span>
              </div>
              <p className="text-slate-500">Huntaze AI · Azure OpenAI + CIN Guardrails</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function renderInput(isHero: boolean) {
    const wrapperClasses = cn(
      'flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 transition focus-within:border-indigo-400 focus-within:bg-white',
      isHero ? 'mx-auto w-full max-w-2xl px-5 py-3.5' : 'px-4 py-2.5'
    )

    const iconButtonClasses = cn(
      'flex items-center justify-center rounded-full text-slate-400 transition hover:text-indigo-500',
      isHero ? 'h-9 w-9' : 'h-8 w-8'
    )

    const textareaClasses = cn(
      'max-h-32 flex-1 resize-none bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none',
      isHero ? 'text-base leading-relaxed' : 'text-sm leading-relaxed'
    )

    const sendButtonClasses = cn(
      'inline-flex items-center justify-center rounded-full bg-indigo-500 text-sm font-semibold text-white transition hover:bg-indigo-600 focus:outline-none disabled:opacity-60',
      isHero ? 'h-10 w-10' : 'h-9 w-9'
    )

    return (
      <form onSubmit={handleSubmit} className={isHero ? undefined : 'space-y-2'}>
        <div className={wrapperClasses}>
          <button
            type="button"
            className={iconButtonClasses}
            onClick={() => setInput((prev) => prev || '')}
            aria-label="Add attachment"
          >
            <Plus className={isHero ? 'h-5 w-5' : 'h-4 w-4'} />
          </button>
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              adjustTextareaHeight()
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question"
            className={textareaClasses}
          />
          <div className="flex items-center gap-2">
            <button type="button" className={iconButtonClasses} aria-label="Voice input">
              <Mic className={isHero ? 'h-5 w-5' : 'h-4 w-4'} />
            </button>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={sendButtonClasses}
              aria-label="Send message"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpCircle className={isHero ? 'h-5 w-5' : 'h-4 w-4'} />}
            </button>
          </div>
        </div>
        {!isHero && (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className={cn('h-3.5 w-3.5', loading ? 'animate-spin text-indigo-500' : 'text-slate-400')} />
            <span>Thinking…</span>
          </div>
        )}
      </form>
    )
  }
}
