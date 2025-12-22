"use client";

import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, X, Minimize2, Maximize2, Sparkles, Brain, Zap, Crown } from "lucide-react";
import { MajordomeIcon } from "@/components/icons/MajordomeIcon";

type UiMsg = { role: "user" | "assistant"; content: string; model?: string };
type PendingTool = { name: string; arguments: Record<string, unknown> };

// Global state for the dock (legacy - no longer used with route-driven approach)
let globalDockOpen = false;
let globalDockListeners: ((open: boolean) => void)[] = [];

const updateGlobalDock = (open: boolean) => {
  globalDockOpen = open;
  globalDockListeners.forEach(listener => listener(open));
};

// Header Button Component - Icon only like Shopify Sidekick
export function MajordomeHeaderButton() {
  return (
    <Link
      href="/assistant"
      scroll={false}
      aria-label="Assistant"
      title="Assistant"
      className={[
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full",
        "border border-white/10 bg-white/5 hover:bg-white/10 active:bg-white/15",
        "focus:outline-none focus:ring-2 focus:ring-white/25",
        "transition-colors duration-150",
      ].join(" ")}
    >
      <MajordomeIcon className="h-5 w-5 text-white/90" />
    </Link>
  );
}

// Main Dock Component
export default function MajordomeWidget({ 
  showFab = false, 
  topOffset = 0 
}: { 
  showFab?: boolean;
  topOffset?: number;
}) {
  const [open, setOpen] = useState(globalDockOpen);
  const [minimized, setMinimized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingTool[] | null>(null);
  const [loading, setLoading] = useState(false);

  const history = useMemo(
    () => messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    [messages],
  );

  useEffect(() => {
    globalDockListeners.push(setOpen);
    return () => {
      globalDockListeners = globalDockListeners.filter(l => l !== setOpen);
    };
  }, []);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/majordome", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user-id": "1" },
        body: JSON.stringify({
          message: trimmed,
          history,
          pending: pending ?? undefined,
        }),
      });

      const data = await res.json();

      if (data?.type === "NEEDS_CONFIRMATION") {
        setPending(data?.pending ?? null);
        setMessages((m) => [...m, { role: "assistant", content: data?.message ?? "Confirmation requise.", model: "phi4" }]);
      } else if (data?.type === "ACTION_STARTED") {
        setPending(null);
        setMessages((m) => [...m, { role: "assistant", content: data?.message ?? "Action lancée.", model: "phi4" }]);
      } else {
        setPending(null);
        setMessages((m) => [...m, { role: "assistant", content: data?.message ?? "", model: "phi4" }]);
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `🎩 Incident technique Azure AI: ${e?.message ?? String(e)}`, model: "error" },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function getModelIcon(model: string | undefined) {
    switch (model) {
      case 'deepseek':
        return <Brain className="w-3 h-3 text-blue-500" />;
      case 'phi4':
        return <Zap className="w-3 h-3 text-purple-500" />;
      case 'llama':
        return <Sparkles className="w-3 h-3 text-green-500" />;
      default:
        return <Bot className="w-3 h-3" />;
    }
  }

  function getModelBadge(model: string | undefined) {
    switch (model) {
      case 'deepseek':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">DeepSeek</Badge>;
      case 'phi4':
        return <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Phi-4</Badge>;
      case 'llama':
        return <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Llama</Badge>;
      default:
        return null;
    }
  }

  // Render dock using portal to document.body
  const dock = (
    <div 
      className={[
        "fixed bg-white shadow-2xl border-l border-gray-200 z-[2147483647] transition-all duration-300 ease-in-out",
        expanded ? "inset-0 w-full" : "right-0"
      ].join(" ")}
      style={{ 
        top: expanded ? 0 : topOffset,
        height: expanded ? "100vh" : `calc(100vh - ${topOffset}px)`,
        width: open ? (expanded ? "100%" : "400px") : "0px",
        transform: open ? "translateX(0)" : "translateX(100%)"
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header - Minimal like Shopify */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200 bg-white">
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-gray-700"
          >
            New conversation
            <span className="text-gray-500">▾</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpanded(!expanded)}
              type="button"
              aria-label="Expand"
              title={expanded ? "Collapse" : "Expand"}
              className="h-9 w-9 rounded-md hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center"
            >
              {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => updateGlobalDock(false)}
              type="button"
              aria-label="Close"
              title="Close"
              className="h-9 w-9 rounded-md hover:bg-gray-100 active:bg-gray-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col">
                  <div className="flex-1 grid place-items-center px-8">
                    <div className="text-center">
                      <div className="mb-4 inline-flex items-center justify-center">
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
                      <div className="text-sm text-gray-600 mb-1">Hey there</div>
                      <div className="text-2xl font-semibold text-gray-900">How can I help?</div>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div
                    key={i}
                    className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[85%] ${m.role === "user" ? "flex-col items-end" : ""}`}>
                      <div
                        className={`px-3 py-2 rounded-lg ${
                          m.role === "user"
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-900 border border-gray-200"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                      </div>
                      {m.role === "assistant" && m.model && (
                        <div className="flex items-center gap-1 mt-1">
                          {getModelIcon(m.model)}
                          {getModelBadge(m.model)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 border border-gray-200 px-3 py-2 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap className="w-4 h-4 text-purple-500 animate-pulse" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>


            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="p-4 border-t border-gray-200"
            >
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={pending ? 'Type "CONFIRM" to execute.' : "Type your message..."}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                />
                <Button
                  type="submit"
                  disabled={loading || !input.trim()}
                  size="sm"
                  className="px-4 bg-purple-600 hover:bg-purple-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {pending && (
                <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  Action pending confirmation
                </p>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );

  // Render using portal to document.body only when open
  if (!open) return null;
  
  return createPortal(dock, document.body);
}
