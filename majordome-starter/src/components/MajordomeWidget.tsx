"use client";

import React, { useMemo, useState } from "react";

type UiMsg = { role: "user" | "assistant"; content: string };
type PendingTool = { name: string; arguments: Record<string, unknown> };

export default function MajordomeWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMsg[]>([
    { role: "assistant", content: "🎩 Bonsoir Madame. Donnez-moi un ordre." },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState<PendingTool[] | null>(null);
  const [loading, setLoading] = useState(false);

  const history = useMemo(
    () => messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    [messages],
  );

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/majordome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history,
          pending: pending ?? undefined,
        }),
      });

      const data = await res.json();

      if (data?.type === "NEEDS_CONFIRMATION") {
        setPending(data?.pending ?? null);
        setMessages((m) => [...m, { role: "assistant", content: data?.message ?? "Confirmation requise." }]);
      } else {
        // Clear pending on any non-confirmation response
        setPending(null);
        setMessages((m) => [...m, { role: "assistant", content: data?.message ?? "" }]);
      }
    } catch (e: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `🎩 Incident technique: ${e?.message ?? String(e)}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        aria-label="Ouvrir le Majordome"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          right: 18,
          bottom: 18,
          width: 56,
          height: 56,
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.18)",
          background: "rgba(20,20,24,0.92)",
          color: "white",
          cursor: "pointer",
          fontSize: 22,
          zIndex: 9999,
        }}
      >
        🎩
      </button>

      {/* Chat panel */}
      {open && (
        <div
          style={{
            position: "fixed",
            right: 18,
            bottom: 86,
            width: 360,
            maxWidth: "calc(100vw - 36px)",
            height: 520,
            maxHeight: "calc(100vh - 120px)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(20,20,24,0.96)",
            color: "white",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            zIndex: 9999,
          }}
        >
          <div style={{ padding: 14, borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
            <div style={{ fontWeight: 600 }}>Le Majordome</div>
            <div style={{ opacity: 0.8, fontSize: 12 }}>
              {pending ? "Action en attente de confirmation" : loading ? "En cours…" : "Prêt"}
            </div>
          </div>

          <div style={{ flex: 1, padding: 14, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "86%",
                    padding: "10px 12px",
                    borderRadius: 14,
                    background:
                      m.role === "user" ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    lineHeight: 1.3,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            style={{
              padding: 12,
              borderTop: "1px solid rgba(255,255,255,0.10)",
              display: "flex",
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={pending ? 'Tapez "CONFIRME" pour exécuter.' : "Donnez un ordre…"}
              style={{
                flex: 1,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.22)",
                color: "white",
                padding: "10px 12px",
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              Envoyer
            </button>
          </form>
        </div>
      )}
    </>
  );
}
