"use client";
import React, { useMemo, useState } from "react";
import { ofmApi } from "@/src/lib/api";

type RfmSegment = "WHALE" | "VIP" | "CASUAL" | "CHURN_RISK" | "UNKNOWN";

export interface PersonaConfig {
  name: string;
  style_guide: string;
  tone_keywords: string[];
  templates: { welcome: string; upsell: string; reactivation: string };
}

export interface GuardrailsConfig {
  forbidden_words: string[];
  escalation_triggers: string[];
  frequency_limits: { max_per_hour: number; cooldown_minutes: number };
}

export interface FanData {
  name: string;
  rfmSegment: RfmSegment | string;
  lastActive: string;
  totalSpent: number;
  messageCount: number;
  propensityScore: number;
}

type DraftResponse = {
  action: "DRAFT" | "ESCALATE";
  confidence_score: number;
  draft_message?: string;
  reasoning?: string;
  guardrails_triggered?: string[];
  persona_elements_used?: string[];
  upsell_opportunity?: boolean;
  recommended_ppv_price?: number;
  validated?: boolean;
  timestamp?: string;
  reason?: string;
};

export function AiDraftPanel({
  conversationId,
  fanMessage,
  fanData,
  persona,
  guardrails,
  onAccept,
  onEscalate,
}: {
  conversationId?: string;
  fanMessage: string;
  fanData: FanData;
  persona: PersonaConfig;
  guardrails: GuardrailsConfig;
  onAccept?: (text: string) => void;
  onEscalate?: (reason?: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<DraftResponse | null>(null);
  const [editableText, setEditableText] = useState("");

  const rfmBadge = useMemo(() => {
    const seg = String(fanData.rfmSegment || "UNKNOWN");
    const map: Record<string, string> = {
      WHALE: "bg-purple-600",
      VIP: "bg-amber-600",
      CASUAL: "bg-slate-600",
      CHURN_RISK: "bg-rose-700",
      UNKNOWN: "bg-zinc-600",
    };
    return map[seg] || map.UNKNOWN;
  }, [fanData.rfmSegment]);

  async function generate() {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = (await ofmApi.aiDraft({
        conversationId,
        fanMessage,
        fanData,
        persona,
        guardrails,
      })) as DraftResponse;
      setResponse(res);
      setEditableText(res.draft_message || "");
    } catch (e: any) {
      setError(e?.message || "Failed to generate draft");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded ${rfmBadge} text-white`}>{String(fanData.rfmSegment || "UNKNOWN")}</span>
          <span className="text-xs text-zinc-400">Propensity: {(fanData.propensityScore ?? 0).toFixed(2)}</span>
          <span className="text-xs text-zinc-400">Total: €{(fanData.totalSpent ?? 0).toFixed(0)}</span>
        </div>
        <button
          type="button"
          className="px-3 py-1.5 text-sm rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate draft"}
        </button>
      </div>

      {error && <div className="text-sm text-rose-400">{error}</div>}

      {response && (
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-400">Action:</span>
            <span className={`font-medium ${response.action === "DRAFT" ? "text-emerald-400" : "text-rose-400"}`}>
              {response.action}
            </span>
            <span className="text-zinc-500">Confidence: {(response.confidence_score ?? 0).toFixed(2)}</span>
            {typeof response.recommended_ppv_price === "number" && (
              <span className="text-zinc-500">Suggested PPV: €{response.recommended_ppv_price.toFixed(2)}</span>
            )}
          </div>

          {response.guardrails_triggered?.length ? (
            <div className="text-xs text-amber-400">Guardrails: {response.guardrails_triggered.join(", ")}</div>
          ) : null}

          {response.reason && response.action === "ESCALATE" && (
            <div className="text-sm text-rose-300">Reason: {response.reason}</div>
          )}

          {response.action === "DRAFT" && (
            <div className="space-y-2">
              <textarea
                value={editableText}
                onChange={(e) => setEditableText(e.target.value)}
                rows={4}
                className="w-full rounded border border-zinc-800 bg-zinc-900 p-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded bg-emerald-600 hover:bg-emerald-500"
                  onClick={() => onAccept?.(editableText)}
                >
                  Accept
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded bg-zinc-700 hover:bg-zinc-600"
                  onClick={() => setEditableText((t) => t)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm rounded bg-rose-700 hover:bg-rose-600"
                  onClick={() => onEscalate?.(response.reason)}
                >
                  Escalate
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AiDraftPanel;

