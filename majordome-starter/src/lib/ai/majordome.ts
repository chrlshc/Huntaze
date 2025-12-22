// src/lib/ai/majordome.ts
//
// 🎩 The Majordome Orchestrator
// - Understands a natural-language order
// - Decides which tool(s) to use
// - Delegates execution to Housekeepers / services
// - Returns a crisp, human-facing reply
//
// Uses OpenAI/Azure "tools" (function calling).
// References:
// - OpenAI function calling guide (tools, tool_calls, tool_call_id).
// - Azure OpenAI function calling supports parallel tool calls via tool_calls.
//
// NOTE: This is server-side code.

import { azureClient } from "./providers/azure-openai";
import { MAJORDOME_TOOLS, TOOL_REGISTRY, type ToolContext, type ToolResult } from "./tools";

type MajordomeResult =
  | { type: "REPLY"; message: string }
  | { type: "ACTION_STARTED"; message: string; jobs?: Array<{ name: string; jobId: string }> }
  | {
      type: "NEEDS_CONFIRMATION";
      message: string;
      pending: Array<{ name: string; arguments: Record<string, unknown> }>;
    }
  | { type: "ERROR"; message: string; details?: unknown };

type ChatMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content?: string | null; tool_calls?: any[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type AskMajordomeOptions = ToolContext & {
  /**
   * Provide past conversation messages if you store them.
   * Keep it short: last 10-20 turns are typically enough.
   */
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  /**
   * If the UI is confirming a previously proposed action,
   * pass the pending tool calls here.
   */
  pending?: Array<{ name: string; arguments: Record<string, unknown> }>;
};

function systemPrompt(ctx: ToolContext): string {
  // Keep it strict and operational: the Majordome gives orders, not essays.
  return [
    `Tu es "Le Majordome", l'assistant personnel d'une créatrice.`,
    `Tu es poli, efficace, concis, et tu as autorité sur les systèmes techniques (Housekeepers).`,
    `Règles:`,
    `- Réponds en français.`,
    `- Si la demande nécessite une action (scraper, analyser, configurer, rapport), utilise un outil.`,
    `- Si plusieurs actions sont nécessaires, tu peux appeler plusieurs outils.`,
    `- Quand un outil a été exécuté, tu résumes en 1-3 phrases, et tu donnes la prochaine action recommandée.`,
    `- Si l'action est destructive ou modifie des réglages, demande une confirmation explicite: le mot "CONFIRME".`,
    `- Ne révèle pas de secrets, clés, endpoints, ou données privées.`,
    `- Évite le contenu explicite. Reste "classe" et orienté business.`,
    ctx.userId ? `Contexte: userId=${ctx.userId}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function isExplicitConfirmation(text: string): boolean {
  const t = text.trim().toUpperCase();
  // Accept a couple common variants.
  return t === "CONFIRME" || t === "CONFIRMÉ" || t === "CONFIRMEE" || t === "CONFIRMÉE";
}

function safeJsonParse(input: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Invalid JSON" };
  }
}

async function executeTool(name: string, args: any, ctx: ToolContext): Promise<ToolResult> {
  const meta = TOOL_REGISTRY[name];
  if (!meta) {
    return { ok: false, kind: "ERROR", error: `Unknown tool: ${name}` };
  }
  return meta.handler(args, ctx);
}

function extractJobs(results: Array<{ name: string; result: ToolResult }>) {
  const jobs: Array<{ name: string; jobId: string }> = [];
  for (const r of results) {
    if (r.result.ok && r.result.kind === "JOB_ENQUEUED") jobs.push({ name: r.name, jobId: r.result.jobId });
  }
  return jobs.length ? jobs : undefined;
}

/**
 * Main entrypoint.
 */
export async function askMajordome(userRequest: string, opts: AskMajordomeOptions = {}): Promise<MajordomeResult> {
  // 0) If the UI is explicitly confirming pending actions, run them now.
  if (opts.pending?.length && isExplicitConfirmation(userRequest)) {
    const toolExecs = await Promise.all(
      opts.pending.map(async (p) => ({ name: p.name, result: await executeTool(p.name, p.arguments, opts) })),
    );
    const jobs = extractJobs(toolExecs);
    return {
      type: jobs ? "ACTION_STARTED" : "REPLY",
      message: jobs
        ? `🎩 Entendu Madame. J'ai lancé l'exécution. Je vous alerte dès que les rapports sont prêts.`
        : `🎩 Entendu Madame. C'est fait.`,
      jobs,
    };
  }

  // 1) Build the conversation
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt(opts) },
    ...(opts.history?.map((m) => ({ role: m.role, content: m.content } as any)) ?? []),
    { role: "user", content: userRequest },
  ];

  // 2) The Majordome thinks & may choose tools
  const deploymentName = process.env.MAJORDOME_ORCHESTRATOR_DEPLOYMENT ?? process.env.AZURE_OPENAI_DEPLOYMENT!;
  let safetyLoop = 0;

  while (safetyLoop < 3) {
    safetyLoop += 1;

    const completion = await azureClient.chat.completions.create({
      model: deploymentName, // Azure uses deployment name here
      messages: messages as any,
      tools: MAJORDOME_TOOLS as any,
      tool_choice: "auto",
      temperature: 0.2,
    });

    const assistant = completion.choices?.[0]?.message;
    if (!assistant) return { type: "ERROR", message: "Aucune réponse du modèle.", details: completion };

    const toolCalls = (assistant as any).tool_calls as Array<any> | undefined;

    // 3) No tool call => normal reply
    if (!toolCalls?.length) {
      return { type: "REPLY", message: assistant.content ?? "" };
    }

    // 4) The model wants to call tool(s). Add assistant message to history.
    messages.push({ role: "assistant", content: assistant.content ?? null, tool_calls: toolCalls });

    // 5) Check if any tool requires confirmation.
    const pending: Array<{ name: string; arguments: Record<string, unknown> }> = [];
    for (const call of toolCalls) {
      const name: string | undefined = call?.function?.name;
      const rawArgs: string | undefined = call?.function?.arguments;
      if (!name || !rawArgs) continue;

      const meta = TOOL_REGISTRY[name];
      if (meta?.requiresConfirmation) {
        const parsed = safeJsonParse(rawArgs);
        pending.push({ name, arguments: (parsed.ok ? parsed.value : {}) as any });
      }
    }

    if (pending.length) {
      // We *do not* execute. We ask the user to confirm.
      return {
        type: "NEEDS_CONFIRMATION",
        message:
          `🎩 Madame, cette action modifie des réglages ou active une veille. ` +
          `Dites simplement "CONFIRME" pour l'exécuter.`,
        pending,
      };
    }

    // 6) Execute tools (parallel), then feed results back to the model.
    const executed = await Promise.all(
      toolCalls.map(async (call) => {
        const tool_call_id: string = call.id;
        const name: string = call.function.name;
        const argsRaw: string = call.function.arguments ?? "{}";
        const parsed = safeJsonParse(argsRaw);

        const result = parsed.ok
          ? await executeTool(name, parsed.value, opts)
          : ({ ok: false, kind: "ERROR", error: "Invalid tool args JSON", details: parsed.error } as ToolResult);

        // Azure/OpenAI expects tool message with tool_call_id. 
        // Content is a string; we send JSON for machine readability.
        const toolMessage: ChatMessage = {
          role: "tool",
          tool_call_id,
          content: JSON.stringify(result),
        };

        return { name, result, toolMessage };
      }),
    );

    for (const ex of executed) messages.push(ex.toolMessage);

    // 7) Ask the model to write a clean user-facing answer given tool outputs.
    // Loop continues in case the model wants additional tools (max 3).
  }

  return {
    type: "ERROR",
    message: "Boucle de tools trop longue (sécurité). Vérifiez vos tool definitions.",
  };
}
