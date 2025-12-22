"use client";

import { useRef, useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { useAssistantConversations, type Message } from "@/hooks/useAssistantConversations";



type ChatClientProps = {
  onConversationsChange?: () => void;
};

export default function ChatClient({ onConversationsChange }: ChatClientProps) {
  const {
    messages,
    sendMessage,
    currentConversationId,
  } = useAssistantConversations();

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Sync messages from hook
  useEffect(() => {
    setLocalMessages(messages);
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  };

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;

    setBusy(true);
    setInput("");

    try {
      const reply = await sendMessage(t);
      
      if (reply) {
        // Messages are now loaded from server via the hook
        onConversationsChange?.();
      }
    } catch (error) {
      // Determine error message based on error type
      let errorMessage = "Sorry, a technical error occurred. Please try again.";
      
      if (error instanceof Error) {
        // Check if it's an authentication error
        if (error.message.includes("Unauthorized") || error.message.includes("401")) {
          errorMessage = "Please log in to use the assistant.";
        } else if (error.message.includes("Network") || error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection.";
        }
      }
      
      // Show error message
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: errorMessage,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  };

  const hasMessages = localMessages.length > 0;

  // Custom scrollbar styles
  const customStyles = `
    .sexy-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .sexy-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .sexy-scrollbar::-webkit-scrollbar-thumb {
      background: #e5e5e5;
      border-radius: 3px;
    }
    .sexy-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #d4d4d4;
    }
  `;

  return (
    <div className="h-full flex flex-col" style={{ background: '#ffffff' }}>
      <style>{customStyles}</style>
      {/* Messages area */}
      <div ref={listRef} className="flex-1 overflow-auto sexy-scrollbar" style={{ background: '#ffffff' }}>
        {!hasMessages ? (
          /* Welcome screen - Shopify style */
          <div className="h-full flex flex-col items-center justify-center px-8">
            {/* Mascot Icon */}
            <div className="mb-6">
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
            
            <p className="text-gray-500 text-base mb-1">Hey there</p>
            <h2 className="text-gray-900 text-xl font-semibold mb-6">How can I help?</h2>
          </div>
        ) : (
          <div style={{ padding: '20px 24px' }}>
            {localMessages.map((m) => (
              <div 
                key={m.id} 
                style={{
                  display: 'flex',
                  justifyContent: m.role === "user" ? 'flex-end' : 'flex-start',
                  marginBottom: '12px',
                }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    padding: '10px 16px',
                    background: m.role === "user" ? '#1a1a1a' : '#f3f4f6',
                    borderRadius: '18px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    color: m.role === "user" ? '#fff' : '#333',
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                <div style={{ padding: '10px 16px', background: '#f3f4f6', borderRadius: '18px' }}>
                  <span style={{ fontSize: '12px', color: '#666' }}>Typing...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '16px 20px 24px 20px', background: '#ffffff' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: '#ffffff',
              borderRadius: '24px',
              border: '1px solid transparent',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s ease',
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#111827',
              }}
            />
            <button
              type="button"
              aria-label="Add content"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                cursor: 'pointer',
                borderRadius: '50%',
              }}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
