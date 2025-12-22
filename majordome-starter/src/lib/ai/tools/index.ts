import { azureClient } from "../providers/azure-openai";
import { enqueueHousekeeperJob } from "../../housekeepers/queue";

/**
 * Minimal tool definitions compatible with OpenAI/Azure "tools" format.
 * (OpenAI calls this "function calling" / "tool calling".)
 *
 * Each tool returns a JSON string to the model (role: "tool") and the model
 * then writes a user-facing reply.
 */

export type MajordomeTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolContext = {
  userId?: string;
  // Optionally inject services (DB, OF connector, analytics, etc.)
  services?: {
    revenue?: {
      getRevenueReport: (args: { period: "today" | "week" | "month" }) => Promise<unknown>;
    };
    settings?: {
      update: (args: Record<string, unknown>) => Promise<unknown>;
    };
  };
};

export type ToolResult =
  | { ok: true; kind: "JOB_ENQUEUED"; jobId: string; details?: unknown }
  | { ok: true; kind: "DATA"; data: unknown; details?: unknown }
  | { ok: false; kind: "ERROR"; error: string; details?: unknown };

type ToolHandler = (args: any, ctx: ToolContext) => Promise<ToolResult>;
export type ToolMeta = {
  tool: MajordomeTool;
  handler: ToolHandler;
  /**
   * Set to true if the tool is destructive or changes account state.
   * The orchestrator will ask for explicit confirmation unless the user already confirmed.
   */
  requiresConfirmation?: boolean;
};

function jobOk(jobId: string, details?: unknown): ToolResult {
  return { ok: true, kind: "JOB_ENQUEUED", jobId, details };
}

function dataOk(data: unknown, details?: unknown): ToolResult {
  return { ok: true, kind: "DATA", data, details };
}

function err(error: string, details?: unknown): ToolResult {
  return { ok: false, kind: "ERROR", error, details };
}

/**
 * TOOL REGISTRY
 * Add new Housekeepers by appending entries here.
 *
 * Naming convention:
 * - `tool_*` for "Housekeeper actions"
 * - other names for pure data reads / reports
 */
export const TOOL_REGISTRY: Record<string, ToolMeta> = {
  // --- Housekeeper triggers (as you described) ---
  tool_scrape_history: {
    tool: {
      type: "function",
      function: {
        name: "tool_scrape_history",
        description:
          "Déclenche le Housekeeper de scraping: aspire l'historique (messages, ventes, tags) pour ingestion.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Nombre d'éléments à aspirer (défaut 200).", default: 200 },
            source: {
              type: "string",
              enum: ["messages", "sales", "both"],
              description: "Quelle source aspirer.",
              default: "both",
            },
          },
          additionalProperties: false,
        },
      },
    },
    handler: async (args) => {
      const { limit = 200, source = "both" } = args ?? {};
      const { jobId } = await enqueueHousekeeperJob("scrape_history", { limit, source });
      return jobOk(jobId, { limit, source });
    },
  },

  tool_analyze_profile: {
    tool: {
      type: "function",
      function: {
        name: "tool_analyze_profile",
        description:
          "Lance un audit (copy, pricing, timing, engagement) et renvoie un diagnostic actionnable.",
        parameters: {
          type: "object",
          properties: {
            window: { type: "string", enum: ["50_messages", "7_days", "30_days"], default: "50_messages" },
            focus: { type: "string", enum: ["sales", "retention", "conversion", "all"], default: "all" },
          },
          additionalProperties: false,
        },
      },
    },
    handler: async (args) => {
      const { window = "50_messages", focus = "all" } = args ?? {};
      const { jobId } = await enqueueHousekeeperJob("analyze_profile", { window, focus });
      return jobOk(jobId, { window, focus });
    },
  },

  tool_draft_broadcast: {
    tool: {
      type: "function",
      function: {
        name: "tool_draft_broadcast",
        description: "Prépare un message de masse (broadcast) adapté à une cible et un objectif.",
        parameters: {
          type: "object",
          properties: {
            objective: { type: "string", description: "Objectif business (ex: upsell PPV, relance, annonce)." },
            audience: { type: "string", enum: ["all", "subscribers", "expired", "whales"], default: "all" },
            tone: { type: "string", enum: ["classe", "direct", "playful", "soft"], default: "classe" },
            length: { type: "string", enum: ["short", "medium", "long"], default: "medium" },
            language: { type: "string", enum: ["fr", "en"], default: "fr" },
          },
          required: ["objective"],
          additionalProperties: false,
        },
      },
    },
    handler: async (args) => {
      // Option A: enqueue job (A/B tests, analytics, templates)
      // Option B: generate instantly with a lightweight model.
      // Here: instant generation (high perceived magic).
      const {
        objective,
        audience = "all",
        tone = "classe",
        length = "medium",
        language = "fr",
      } = args ?? {};

      if (!objective) return err("Missing required argument: objective");

      const prompt =
        language === "fr"
          ? `Rédige un message broadcast. Objectif: ${objective}. Audience: ${audience}. Ton: ${tone}. Longueur: ${length}. Donne 3 variantes numérotées, sans contenu explicite.`
          : `Write a broadcast message. Goal: ${objective}. Audience: ${audience}. Tone: ${tone}. Length: ${length}. Provide 3 numbered variants. Keep it non-explicit.`;

      const completion = await azureClient.chat.completions.create({
        model: (process.env.MAJORDOME_COPY_DEPLOYMENT ?? process.env.AZURE_OPENAI_DEPLOYMENT)!, // Azure deployment name
        messages: [
          { role: "system", content: "You are a senior direct-response copywriter." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      const text = completion.choices?.[0]?.message?.content ?? "";
      return dataOk({ variants: text });
    },
  },

  tool_configure_settings: {
    tool: {
      type: "function",
      function: {
        name: "tool_configure_settings",
        description: "Change les réglages du compte (auto-reply, notifications, filtres).",
        parameters: {
          type: "object",
          properties: {
            changes: {
              type: "object",
              description:
                "Clés/valeurs à appliquer. Ex: { \"whale_tip_threshold\": 50, \"auto_reply_enabled\": true }",
            },
          },
          required: ["changes"],
          additionalProperties: false,
        },
      },
    },
    requiresConfirmation: true,
    handler: async (args, ctx) => {
      const { changes } = args ?? {};
      if (!changes) return err("Missing required argument: changes");

      const settingsService = ctx.services?.settings;
      if (!settingsService) {
        // Fallback: queue a job so your platform layer can apply changes.
        const { jobId } = await enqueueHousekeeperJob("configure_settings", { changes });
        return jobOk(jobId, { note: "settings service missing; queued instead" });
      }

      const result = await settingsService.update(changes);
      return dataOk(result);
    },
  },

  tool_whale_watch: {
    tool: {
      type: "function",
      function: {
        name: "tool_whale_watch",
        description:
          "Active un mode de veille: notifier uniquement au-dessus d'un seuil (ex: tips > 50$).",
        parameters: {
          type: "object",
          properties: {
            tip_threshold_usd: { type: "number", description: "Seuil de tip (USD).", default: 50 },
            notify_channel: { type: "string", enum: ["push", "sms", "email", "dashboard"], default: "push" },
            enabled: { type: "boolean", default: true },
          },
          additionalProperties: false,
        },
      },
    },
    requiresConfirmation: true,
    handler: async (args) => {
      const { tip_threshold_usd = 50, notify_channel = "push", enabled = true } = args ?? {};
      const { jobId } = await enqueueHousekeeperJob("whale_watch", { tip_threshold_usd, notify_channel, enabled });
      return jobOk(jobId, { tip_threshold_usd, notify_channel, enabled });
    },
  },

  tool_clean_knowledge_base: {
    tool: {
      type: "function",
      function: {
        name: "tool_clean_knowledge_base",
        description:
          "Nettoie / reconstruit la base de connaissance (supprime l'obsolète, garde les best-sellers).",
        parameters: {
          type: "object",
          properties: {
            mode: { type: "string", enum: ["dry_run", "apply"], default: "dry_run" },
            keep_window_days: {
              type: "number",
              description: "Garder les stratégies des X derniers jours (défaut 30).",
              default: 30,
            },
          },
          additionalProperties: false,
        },
      },
    },
    requiresConfirmation: true,
    handler: async (args) => {
      const { mode = "dry_run", keep_window_days = 30 } = args ?? {};
      const { jobId } = await enqueueHousekeeperJob("clean_knowledge_base", { mode, keep_window_days });
      return jobOk(jobId, { mode, keep_window_days });
    },
  },

  // --- Extra tools (your code sample) ---
  ingest_knowledge: {
    tool: {
      type: "function",
      function: {
        name: "ingest_knowledge",
        description: "Lance l'aspiration + ingestion en base de connaissance (embedding / indexing).",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Nombre de messages à analyser (défaut 100).", default: 100 },
            strategy: { type: "string", enum: ["best_sellers", "recent", "mixed"], default: "mixed" },
            dry_run: { type: "boolean", description: "Si true, prépare le plan sans écrire en base.", default: false },
          },
          additionalProperties: false,
        },
      },
    },
    handler: async (args) => {
      const { limit = 100, strategy = "mixed", dry_run = false } = args ?? {};
      const { jobId } = await enqueueHousekeeperJob("ingest_knowledge", { limit, strategy, dry_run });
      return jobOk(jobId, { limit, strategy, dry_run });
    },
  },

  get_revenue_report: {
    tool: {
      type: "function",
      function: {
        name: "get_revenue_report",
        description: "Récupère les revenus générés sur une période donnée.",
        parameters: {
          type: "object",
          properties: { period: { type: "string", enum: ["today", "week", "month"] } },
          required: ["period"],
          additionalProperties: false,
        },
      },
    },
    handler: async (args, ctx) => {
      const { period } = args ?? {};
      if (!period) return err("Missing required argument: period");

      const revenueService = ctx.services?.revenue;
      if (!revenueService) return err("Revenue service not configured", { wanted: period });

      const report = await revenueService.getRevenueReport({ period });
      return dataOk(report);
    },
  },
};

export const MAJORDOME_TOOLS: MajordomeTool[] = Object.values(TOOL_REGISTRY).map((t) => t.tool);
