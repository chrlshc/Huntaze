import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { z } from "zod";
import { analyzeTextSafety } from "./clients/contentSafety.js";
import { openAIClient } from "./clients/openai.js";
import { sbSender } from "./clients/serviceBus.js";
import { env } from "./clients/env.js";

const Body = z.object({
  message_id: z.string(),
  fan_id: z.string(),
  text: z.string().min(1),
  lang: z.string().default("en"),
  context: z
    .object({
      channel: z.enum(["inbox", "comment", "tip"]).optional(),
      fan: z
        .object({
          ltv_usd: z.number().optional(),
          segment_rfm: z.string().optional(),
          is_vip: z.boolean().optional(),
        })
        .optional(),
    })
    .optional(),
});

type TriageResult = {
  intent: "Billing" | "Sales" | "Support" | "ChurnRisk" | "VIP" | "Abuse" | "Other";
  priority: "P0" | "P1" | "P2" | "P3";
  route: "auto_reply" | "human_review" | "finance_queue" | "safeguard_review";
  reasons: string[];
};

app.http("triage_classify", {
  methods: ["POST"],
  route: "triage/classify",
  authLevel: "function",
  handler: async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const payload = Body.parse(await req.json());
      const { text, lang } = payload;

      const safety = await analyzeTextSafety(text);
      const categories = (safety as any).categoriesAnalysis ? (safety as any).categoriesAnalysis.map((c: any) => ({
        category: c.category,
        severity: c.severity,
      })) : [];

      const severityOf = (name: string) => categories.find((c: any) => c.category === name)?.severity ?? 0;
      const blocked =
        severityOf("Sexual") >= 6 || severityOf("Hate") >= 6 || severityOf("Violence") >= 6;
      const needsReview =
        !blocked && (severityOf("Sexual") >= 4 || severityOf("SelfHarm") >= 4 || severityOf("Violence") >= 4);

      if (blocked) {
        const blockedResponse = {
          message_id: payload.message_id,
          meta: {
            triage: {
              intent: "Abuse" as const,
              priority: "P0" as const,
              sla_deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
              route: "safeguard_review" as const,
              reasons: ["content_safety_blocked"],
            },
            safeguard: {
              status: "blocked" as const,
              triggers: categories,
            },
          },
        };

        return { status: 200, jsonBody: blockedResponse };
      }

      const client = openAIClient();
      const structuredSchema = {
        name: "triage_schema",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            intent: {
              type: "string",
              enum: ["Billing", "Sales", "Support", "ChurnRisk", "VIP", "Abuse", "Other"],
            },
            priority: {
              type: "string",
              enum: ["P0", "P1", "P2", "P3"],
            },
            route: {
              type: "string",
              enum: ["auto_reply", "human_review", "finance_queue", "safeguard_review"],
            },
            reasons: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["intent", "priority", "route", "reasons"],
        },
        strict: true,
      } as const;

      const completion = await client.chat.completions.create({
        model: env.AZURE_OPENAI_DEPLOYMENT,
        response_format: { type: "json_schema", json_schema: structuredSchema },
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "Tu es un classifieur de triage pour un support OnlyFans. Réponds uniquement en JSON conforme au schéma fourni.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `[Message]\nLangue: ${lang}\nTexte: ${text}\n\n[Contexte]\nFan: LTV=${
                  payload.context?.fan?.ltv_usd ?? "n/a"
                }, RFM=${payload.context?.fan?.segment_rfm ?? "n/a"}, VIP=${
                  payload.context?.fan?.is_vip ?? false
                }\nCanal: ${payload.context?.channel ?? "inbox"}\n\n[Contraintes]\n- intent ∈ {Billing, Sales, Support, ChurnRisk, VIP, Abuse, Other}\n- priority ∈ {P0, P1, P2, P3}\n- route ∈ {auto_reply, human_review, finance_queue, safeguard_review}\n- raisons: liste de mots-clés`
              },
            ],
          },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "{}";
      const triage = JSON.parse(raw) as TriageResult;

      const adjustedRoute = triage.intent === "Billing" ? "finance_queue" : triage.route;
      const adjustedPriority = needsReview && triage.priority !== "P0" ? "P1" : triage.priority;
      const slaHours = adjustedPriority === "P0" ? 2 : adjustedPriority === "P1" ? 6 : adjustedPriority === "P2" ? 24 : 48;

      const response = {
        message_id: payload.message_id,
        meta: {
          triage: {
            intent: triage.intent,
            priority: adjustedPriority,
            sla_deadline: new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString(),
            route: adjustedRoute,
            reasons: [...triage.reasons, ...(needsReview ? ["content_safety_needs_review"] : [])],
          },
          safeguard: {
            status: needsReview ? "needs_review" : "safe",
            triggers: categories,
          },
        },
      };

      try {
        const sender = sbSender(env.SERVICE_BUS_QUEUE_TRIAGE);
        if (sender) {
          await sender.sendMessages({ body: response, contentType: "application/json" });
          await sender.close();
        }
      } catch (_e) {
        // Non-blocking: ignore Service Bus send failures for API success
      }

      return { status: 200, jsonBody: response };
    } catch (error: any) {
      ctx.error("triage_classify_failed", error);
      return { status: 400, jsonBody: { error: error.message ?? "triage failed" } };
    }
  },
});
